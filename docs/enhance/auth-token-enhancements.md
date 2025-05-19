# 인증 시스템 개선 방안

## 목차
1. [디바이스별 토큰 관리](#디바이스별-토큰-관리)
2. [디바이스 타입별 토큰 만료 시간 설정](#디바이스-타입별-토큰-만료-시간-설정)
3. [토큰 폐기(revoke) 기능 강화](#토큰-폐기-기능-강화)
4. [계정 복구 기능](#계정-복구-기능)
5. [비밀번호 정책 강화](#비밀번호-정책-강화)
6. [로그인 상태 관리 (다중 기기)](#로그인-상태-관리-다중-기기)
7. [로그인 히스토리 제공](#로그인-히스토리-제공)

## 디바이스별 토큰 관리

### 현재 상황
현재 시스템은 사용자 ID당 하나의 토큰만 Redis에 저장하고 있습니다. 이로 인해 새로운 로그인 시 기존 토큰이 무효화되어 다중 디바이스 로그인이 불가능합니다.

### 개선 방안
각 사용자별로 여러 디바이스에서의 로그인을 지원하기 위해 디바이스별 토큰 관리 시스템을 구현합니다.

#### 데이터 모델 변경
```typescript
// 토큰 저장 데이터 구조
interface UserTokenData {
  userId: string;
  deviceId: string;
  deviceType: DeviceType; // 'MOBILE' | 'WEB' | 'TABLET' | 'DESKTOP_APP'
  deviceInfo: {
    name: string;
    os: string;
    browser?: string;
    appVersion?: string;
  };
  ipAddress: string;
  lastUsed: Date;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}
```

#### Redis 키 구조 변경
```
// 기존
user:{userId}:token -> tokenData

// 개선
user:{userId}:devices -> Set of deviceIds
user:{userId}:device:{deviceId} -> UserTokenData
```

#### 구현 방법
1. 로그인 시 디바이스 정보 수집
2. 디바이스 ID 생성 (UUID 또는 디바이스 고유 식별자)
3. Redis에 사용자별 디바이스 목록 및 디바이스별 토큰 저장
4. 인증 시 사용자 ID와 디바이스 ID로 토큰 검증

```typescript
// 로그인 시 디바이스 정보 수집 예시
async login(loginDto: LoginDto, clientInfo: ClientInfoDto) {
  // 사용자 인증 로직...
  
  // 디바이스 ID 생성 또는 기존 ID 사용
  const deviceId = clientInfo.deviceId || uuidv4();
  
  // 토큰 생성
  const token = await this.generateToken(user, deviceId);
  
  // Redis에 토큰 저장
  await this.storeDeviceToken(user.id, deviceId, token, clientInfo);
  
  return { 
    accessToken: token,
    deviceId, // 클라이언트에게 전달하여 이후 요청에 포함하도록 함
  };
}
```

## 디바이스 타입별 토큰 만료 시간 설정

### 현재 상황
모든 토큰은 동일한 만료 시간(환경 변수 `JWT_EXPIRES_IN_SECONDS`)을 사용합니다.

### 개선 방안
디바이스 유형에 따라 다른 만료 시간을 적용합니다:

| 디바이스 유형 | 만료 시간 | 설명 |
|-------------|---------|------|
| MOBILE | 30일 | 모바일 앱은 장기간 로그인 유지 |
| WEB | 1일 | 웹 브라우저는 보안상 짧은 만료 시간 적용 |
| TABLET | 7일 | 태블릿은 중간 수준의 만료 시간 |
| DESKTOP_APP | 14일 | 데스크톱 앱은 비교적 안전한 환경 |

#### 구현 방법
1. 환경 설정에 디바이스별 만료 시간 추가
2. 토큰 생성 시 디바이스 유형에 따라 만료 시간 설정
3. Redis에 토큰 저장 시 계산된 만료 시간 적용

```typescript
// 환경 설정 예시
const TOKEN_EXPIRY_CONFIG = {
  MOBILE: 60 * 60 * 24 * 30, // 30일
  WEB: 60 * 60 * 24, // 1일
  TABLET: 60 * 60 * 24 * 7, // 7일
  DESKTOP_APP: 60 * 60 * 24 * 14, // 14일
  DEFAULT: 60 * 60 * 3, // 3시간
};

// 토큰 생성 시 만료 시간 적용
async generateToken(user: User, deviceId: string, deviceType: DeviceType) {
  const expiresIn = TOKEN_EXPIRY_CONFIG[deviceType] || TOKEN_EXPIRY_CONFIG.DEFAULT;
  
  const payload = {
    sub: user.id,
    deviceId,
    roles: user.roles,
  };
  
  return this.jwtService.sign(payload, { expiresIn });
}
```

## 토큰 폐기(revoke) 기능 강화

### 현재 상황
특정 토큰을 선택적으로 폐기하는 기능이 제한적입니다.

### 개선 방안
다음 시나리오에 대한 토큰 폐기 기능을 추가합니다:

1. **특정 디바이스 로그아웃**: 사용자가 특정 디바이스에서 로그아웃 시 해당 디바이스의 토큰만 폐기
2. **원격 로그아웃**: 사용자가 다른 디바이스에서 특정 디바이스의 세션 종료 가능
3. **관리자 강제 로그아웃**: 관리자가 특정 사용자의 모든 또는 특정 세션 강제 종료
4. **보안 이벤트 발생 시 자동 폐기**: 비밀번호 변경, 의심스러운 로그인 시도 등 보안 이벤트 발생 시

#### 구현 방법
1. 토큰 폐기 API 엔드포인트 추가
2. Redis에서 해당 토큰 데이터 비활성화 또는 삭제
3. 보안 이벤트 리스너 구현

```typescript
// 특정 디바이스 로그아웃
async logoutDevice(userId: string, deviceId: string) {
  const key = `user:${userId}:device:${deviceId}`;
  await this.redis.del(key);
  
  // 디바이스 목록에서도 제거
  await this.redis.srem(`user:${userId}:devices`, deviceId);
  
  return true;
}

// 모든 디바이스 로그아웃 (비밀번호 변경 등의 경우)
async logoutAllDevices(userId: string, exceptDeviceId?: string) {
  const deviceIds = await this.redis.smembers(`user:${userId}:devices`);
  
  for (const deviceId of deviceIds) {
    // 현재 디바이스 제외 옵션
    if (exceptDeviceId && deviceId === exceptDeviceId) continue;
    
    await this.redis.del(`user:${userId}:device:${deviceId}`);
  }
  
  // 현재 디바이스만 남기고 모든 디바이스 ID 제거
  if (exceptDeviceId) {
    await this.redis.del(`user:${userId}:devices`);
    await this.redis.sadd(`user:${userId}:devices`, exceptDeviceId);
  } else {
    await this.redis.del(`user:${userId}:devices`);
  }
  
  return true;
}
```

## 계정 복구 기능

### 현재 상황
계정 복구 메커니즘이 제한적이거나 없습니다.

### 개선 방안
다음 계정 복구 방법을 구현합니다:

1. **이메일 기반 비밀번호 재설정**:
   - 임시 토큰 생성 및 이메일 발송
   - 제한 시간 내 비밀번호 변경 링크
   - 토큰 사용 후 자동 무효화

2. **2차 인증 방법을 통한 복구**:
   - 등록된 전화번호로 SMS 인증
   - 백업 코드 시스템
   - 신뢰할 수 있는 연락처를 통한 복구

3. **점진적 계정 잠금 해제**:
   - 여러 번의 로그인 실패 후 자동 잠금
   - 시간 경과 후 자동 잠금 해제
   - 추가 인증을 통한 수동 잠금 해제

#### 구현 방법
```typescript
// 비밀번호 재설정 토큰 생성
async generatePasswordResetToken(email: string): Promise<string> {
  const user = await this.userService.findByEmail(email);
  if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

  // 임시 토큰 생성 (24시간 유효)
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  // Redis에 저장
  await this.redis.set(
    `reset:${token}`, 
    JSON.stringify({ userId: user.id, expires: expires.toISOString() }),
    'EX',
    60 * 60 * 24
  );

  // 이메일 발송 로직 (실제 구현 필요)
  await this.emailService.sendPasswordReset(user.email, token);

  return token;
}

// 비밀번호 재설정
async resetPassword(token: string, newPassword: string): Promise<boolean> {
  // 토큰 검증
  const resetData = await this.redis.get(`reset:${token}`);
  if (!resetData) throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');

  const { userId, expires } = JSON.parse(resetData);
  if (new Date(expires) < new Date()) {
    await this.redis.del(`reset:${token}`);
    throw new UnauthorizedException('토큰이 만료되었습니다');
  }

  // 비밀번호 변경
  await this.userService.updatePassword(userId, newPassword);

  // 토큰 삭제 및 모든 디바이스 로그아웃
  await this.redis.del(`reset:${token}`);
  await this.logoutAllDevices(userId);

  return true;
}
```

## 비밀번호 정책 강화

### 현재 상황
기본적인 비밀번호 검증만 구현되어 있습니다.

### 개선 방안
다음과 같은 강화된 비밀번호 정책을 구현합니다:

1. **복잡성 요구사항**:
   - 최소 8자 이상
   - 대문자, 소문자, 숫자, 특수문자 포함
   - 연속된 문자 제한 (예: '123456', 'abcdef')
   - 키보드 패턴 제한 (예: 'qwerty', 'asdfgh')

2. **비밀번호 이력 관리**:
   - 최근 5개의 비밀번호 재사용 금지
   - 최소 비밀번호 사용 기간 (30일)

3. **비밀번호 노출 검사**:
   - HaveIBeenPwned API 연동
   - 알려진 취약 비밀번호 목록 검사

#### 구현 방법
```typescript
// 비밀번호 유효성 검사 클래스
class PasswordValidator {
  static validateStrength(password: string): ValidationResult {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('비밀번호에는 최소 하나의 대문자가 포함되어야 합니다');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('비밀번호에는 최소 하나의 소문자가 포함되어야 합니다');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('비밀번호에는 최소 하나의 숫자가 포함되어야 합니다');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('비밀번호에는 최소 하나의 특수문자가 포함되어야 합니다');
    }
    
    // 연속된 문자 체크 (예: '123456', 'abcdef')
    if (/(.)\1{2,}/.test(password)) {
      errors.push('비밀번호에 연속된 동일 문자를 3개 이상 사용할 수 없습니다');
    }
    
    // 키보드 패턴 체크
    const keyboardPatterns = ['qwerty', 'asdfgh', '123456', 'zxcvbn'];
    for (const pattern of keyboardPatterns) {
      if (password.toLowerCase().includes(pattern)) {
        errors.push('비밀번호에 흔한 키보드 패턴을 사용할 수 없습니다');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      score: this.calculateScore(password),
    };
  }
  
  // 비밀번호 강도 점수 계산 (0-100)
  private static calculateScore(password: string): number {
    let score = 0;
    
    // 길이 점수 (최대 40점)
    score += Math.min(40, password.length * 4);
    
    // 문자 다양성 점수 (최대 40점)
    const charTypes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    const typeCount = charTypes.filter(type => type.test(password)).length;
    score += typeCount * 10;
    
    // 복잡성 점수 (최대 20점)
    if (/[A-Z].*[A-Z]/.test(password)) score += 5;
    if (/[a-z].*[a-z]/.test(password)) score += 5;
    if (/[0-9].*[0-9]/.test(password)) score += 5;
    if (/[^A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) score += 5;
    
    return score;
  }
  
  // 비밀번호 이력 검사
  static async checkPasswordHistory(
    userId: string, 
    newPassword: string,
    passwordHistoryService: PasswordHistoryService
  ): Promise<boolean> {
    const recentPasswords = await passwordHistoryService.getRecentPasswords(userId, 5);
    
    for (const oldPassword of recentPasswords) {
      if (await bcrypt.compare(newPassword, oldPassword.hash)) {
        return false;
      }
    }
    
    return true;
  }
}
```

## 로그인 상태 관리 (다중 기기)

### 현재 상황
사용자는 자신의 로그인 상태를 확인하거나 관리할 수 없습니다.

### 개선 방안
사용자에게 다음과 같은 로그인 상태 관리 기능을 제공합니다:

1. **활성 세션 목록 조회**:
   - 현재 로그인된 모든 디바이스 표시
   - 마지막 접속 시간 및 위치 정보 제공
   - 디바이스 유형 및 브라우저/앱 정보 표시

2. **세션 관리 기능**:
   - 특정 세션 종료 (원격 로그아웃)
   - 현재 세션을 제외한 모든 세션 종료
   - 의심스러운 세션에 대한 알림

3. **디바이스별 권한 설정**:
   - 신뢰할 수 있는 디바이스 지정
   - 디바이스별 접근 권한 제한

#### 구현 방법
```typescript
// 활성 세션 목록 조회
async getActiveSessions(userId: string): Promise<DeviceSession[]> {
  const deviceIds = await this.redis.smembers(`user:${userId}:devices`);
  const sessions: DeviceSession[] = [];
  
  for (const deviceId of deviceIds) {
    const sessionData = await this.redis.get(`user:${userId}:device:${deviceId}`);
    if (sessionData) {
      sessions.push(JSON.parse(sessionData));
    }
  }
  
  return sessions;
}

// 특정 세션 종료
async terminateSession(userId: string, deviceId: string): Promise<boolean> {
  return this.logoutDevice(userId, deviceId);
}

// 현재 세션을 제외한 모든 세션 종료
async terminateOtherSessions(userId: string, currentDeviceId: string): Promise<boolean> {
  return this.logoutAllDevices(userId, currentDeviceId);
}

// 디바이스 신뢰도 설정
async setDeviceTrustLevel(
  userId: string, 
  deviceId: string, 
  trustLevel: 'trusted' | 'normal' | 'restricted'
): Promise<boolean> {
  const key = `user:${userId}:device:${deviceId}`;
  const sessionData = await this.redis.get(key);
  
  if (!sessionData) return false;
  
  const session = JSON.parse(sessionData);
  session.trustLevel = trustLevel;
  
  await this.redis.set(key, JSON.stringify(session));
  return true;
}
```

## 로그인 히스토리 제공

### 현재 상황
사용자 로그인 기록이 저장되지 않거나 제한적으로만 저장됩니다.

### 개선 방안
사용자의 모든 로그인 활동을 기록하고 조회할 수 있는 기능을 구현합니다:

1. **로그인 기록 수집**:
   - 성공 및 실패한 로그인 시도
   - 로그아웃 이벤트
   - IP 주소 및 위치 정보
   - 디바이스 및 브라우저 정보
   - 시도 시간 및 결과

2. **로그인 히스토리 분석**:
   - 이상 행동 탐지 (비정상적인 위치, 시간대)
   - 로그인 패턴 분석
   - 브루트포스 공격 탐지

3. **사용자 인터페이스**:
   - 최근 로그인 활동 표시
   - 의심스러운 활동 알림
   - 필터링 및 검색 기능

#### 구현 방법
```typescript
// 로그인 기록 저장 (MongoDB 엔티티)
@Entity('login_history')
export class LoginHistory {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  userId!: string;

  @Property()
  eventType!: 'login_success' | 'login_failure' | 'logout' | 'token_refresh';

  @Property()
  ipAddress!: string;

  @Property({ nullable: true })
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };

  @Property()
  deviceInfo!: {
    deviceId?: string;
    deviceType: string;
    browser?: string;
    os?: string;
    userAgent: string;
  };

  @Property()
  timestamp: Date = new Date();

  @Property({ nullable: true })
  failureReason?: string;
}

// 로그인 시 히스토리 기록
async recordLoginAttempt(
  userId: string, 
  isSuccess: boolean, 
  clientInfo: ClientInfoDto,
  failureReason?: string
): Promise<void> {
  const geoInfo = await this.geoLocationService.getLocationFromIp(clientInfo.ipAddress);
  
  const loginHistory = new LoginHistory();
  loginHistory.userId = userId;
  loginHistory.eventType = isSuccess ? 'login_success' : 'login_failure';
  loginHistory.ipAddress = clientInfo.ipAddress;
  loginHistory.location = geoInfo;
  loginHistory.deviceInfo = {
    deviceId: clientInfo.deviceId,
    deviceType: clientInfo.deviceType,
    browser: clientInfo.browser,
    os: clientInfo.os,
    userAgent: clientInfo.userAgent,
  };
  
  if (!isSuccess && failureReason) {
    loginHistory.failureReason = failureReason;
  }
  
  await this.loginHistoryRepository.persist(loginHistory);
  
  // 비정상 로그인 시도 감지 및 알림
  if (isSuccess) {
    await this.detectSuspiciousLogin(userId, loginHistory);
  }
}

// 로그인 히스토리 조회
async getLoginHistory(
  userId: string, 
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    eventTypes?: string[];
  }
): Promise<{ total: number; items: LoginHistory[] }> {
  const { limit = 20, offset = 0, startDate, endDate, eventTypes } = options;
  
  const where: any = { userId };
  
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.$gte = startDate;
    if (endDate) where.timestamp.$lte = endDate;
  }
  
  if (eventTypes && eventTypes.length > 0) {
    where.eventType = { $in: eventTypes };
  }
  
  const [items, total] = await this.loginHistoryRepository.findAndCount(
    where,
    {
      limit,
      offset,
      orderBy: { timestamp: 'DESC' }
    }
  );
  
  return { total, items };
}
```

---

이 개선안은 인증 시스템의 보안과 사용자 경험을 크게 향상시킬 것으로 예상됩니다. 구현 시 우선순위를 정하여 단계적으로 적용하는 것이 효율적일 것입니다. 
