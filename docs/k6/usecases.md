# 테스트 유스케이스

## 대규모 시나리오

### 1. 초당 사용자 등록 부하 테스트

**요구사항**:
- 초당 50명의 새 사용자가 동시에 등록 시도
- 응답 시간 300ms 이하 유지
- 실패율 1% 이하

**요청**:
```
POST /auth/users
Content-Type: application/json

{
  "email": "user{n}@example.com", 
  "password": "Password123!"
}
```

**응답**:
```
201 Created
{
  "id": "유저ID",
  "email": "user{n}@example.com",
  "roles": ["USER"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### 2. 복합 작업 시뮬레이션

**요구사항**:
- 100명의 사용자가 동시에:
  - 로그인
  - 이벤트 목록 조회
  - 이벤트 선택
  - 보상 요청
- 전체 흐름 완료 시간 3초 이하

**요청/응답**:
- 시퀀스 1-4 각각의 API 호출 포함

### 3. 전체 시스템 부하 테스트

**요구사항**:
- 12시간 동안 꾸준한 부하 유지
- 모든 엔드포인트에 대한 임의 요청
- CPU 사용률 70% 이하 유지
- 메모리 누수 없음

**요청/응답**:
- 모든 API 엔드포인트 대상

## 중간 규모 시나리오

### 1. 인증 서비스 부하 테스트

**요구사항**:
- 30분간 초당 20회 로그인 요청
- 응답 시간 200ms 이하 유지

**요청**:
```
POST /auth/login
Content-Type: application/json

{
  "email": "user{n}@example.com",
  "password": "Password123!"
}
```

**응답**:
```
200 OK
{
  "accessToken": "JWT_TOKEN",
  "user": {
    "id": "유저ID",
    "email": "user{n}@example.com",
    "roles": ["USER"],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 2. 이벤트 서비스 부하 테스트

**요구사항**:
- 30분간 초당 30회 이벤트 생성 요청
- 응답 시간 250ms 이하 유지

**요청**:
```
POST /events
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
  "name": "이벤트 {n}",
  "condition": {
    "minPurchase": 1000,
    "maxRewards": 1
  },
  "period": {
    "start": "2023-10-01T00:00:00Z",
    "end": "2023-10-31T23:59:59Z"
  },
  "status": "ACTIVE"
}
```

**응답**:
```
201 Created
{
  "id": "이벤트ID",
  "name": "이벤트 {n}",
  "condition": {
    "minPurchase": 1000,
    "maxRewards": 1
  },
  "period": {
    "start": "2023-10-01T00:00:00Z",
    "end": "2023-10-31T23:59:59Z"
  },
  "status": "ACTIVE"
}
```

### 3. 보상 요청 부하 테스트

**요구사항**:
- 30분간 초당 50회 보상 요청
- 응답 시간 150ms 이하 유지

**요청**:
```
POST /events/{eventId}/request
Authorization: Bearer JWT_TOKEN
```

**응답**:
```
201 Created
{
  "id": "요청ID",
  "eventId": "이벤트ID",
  "userId": "유저ID",
  "status": "PENDING",
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

## 세부 시나리오

### 1. 사용자 로그인 성능 테스트

**요구사항**:
- 정상 로그인 시나리오 초당 10회
- 잘못된 비밀번호 시나리오 초당 5회
- 존재하지 않는 사용자 시나리오 초당 2회
- 응답 시간 100ms 이하

**요청 (정상)**:
```
POST /auth/login
Content-Type: application/json

{
  "email": "existing@example.com",
  "password": "CorrectPassword123!"
}
```

**응답 (정상)**:
```
200 OK
{
  "accessToken": "JWT_TOKEN",
  "user": {
    "id": "유저ID",
    "email": "existing@example.com",
    "roles": ["USER"],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

**요청 (잘못된 비밀번호)**:
```
POST /auth/login
Content-Type: application/json

{
  "email": "existing@example.com",
  "password": "WrongPassword123!"
}
```

**응답 (잘못된 비밀번호)**:
```
401 Unauthorized
{
  "message": "Invalid credentials",
  "statusCode": 401
}
```

### 2. 이벤트 목록 조회 성능 테스트

**요구사항**:
- 필터 없는 조회 초당 20회
- 날짜 필터 조회 초당 10회
- 위치 필터 조회 초당 5회
- 응답 시간 150ms 이하

**요청 (필터 없음)**:
```
GET /events
Authorization: Bearer JWT_TOKEN
```

**응답 (필터 없음)**:
```
200 OK
[
  {
    "id": "이벤트ID1",
    "name": "이벤트 1",
    "condition": {
      "minPurchase": 1000,
      "maxRewards": 1
    },
    "period": {
      "start": "2023-10-01T00:00:00Z",
      "end": "2023-10-31T23:59:59Z"
    },
    "status": "ACTIVE"
  },
  {
    "id": "이벤트ID2",
    "name": "이벤트 2",
    "condition": {
      "minPurchase": 2000,
      "maxRewards": 2
    },
    "period": {
      "start": "2023-11-01T00:00:00Z",
      "end": "2023-11-30T23:59:59Z"
    },
    "status": "ACTIVE"
  }
]
```

**요청 (날짜 필터)**:
```
GET /events?startDate=2023-10-01&endDate=2023-10-31
Authorization: Bearer JWT_TOKEN
```

**응답 (날짜 필터)**:
```
200 OK
[
  {
    "id": "이벤트ID1",
    "name": "이벤트 1",
    "condition": {
      "minPurchase": 1000,
      "maxRewards": 1
    },
    "period": {
      "start": "2023-10-01T00:00:00Z",
      "end": "2023-10-31T23:59:59Z"
    },
    "status": "ACTIVE"
  }
]
```

### 3. 보상 생성 성능 테스트

**요구사항**:
- 포인트 보상 생성 초당 5회
- 뱃지 보상 생성 초당 3회
- 쿠폰 보상 생성 초당 3회
- 응답 시간 200ms 이하

**요청 (포인트)**:
```
POST /rewards/POINT
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
  "name": "포인트 보상 {n}",
  "points": 100
}
```

**응답 (포인트)**:
```
201 Created
{
  "id": "보상ID",
  "type": "POINT",
  "points": 100
}
```

**요청 (뱃지)**:
```
POST /rewards/BADGE
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
  "name": "뱃지 보상 {n}",
  "badgeId": "badge123"
}
```

**응답 (뱃지)**:
```
201 Created
{
  "id": "보상ID",
  "type": "BADGE",
  "badgeId": "badge123"
}
```

**요청 (쿠폰)**:
```
POST /rewards/COUPON
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
  "name": "쿠폰 보상 {n}",
  "couponCode": "SUMMER2023",
  "expiry": "2023-12-31T23:59:59Z"
}
```

**응답 (쿠폰)**:
```
201 Created
{
  "id": "보상ID",
  "type": "COUPON",
  "couponCode": "SUMMER2023",
  "expiry": "2023-12-31T23:59:59Z"
}
```

### 4. 사용자 정보 조회 성능 테스트

**요구사항**:
- ID 기반 조회 초당 15회
- 이메일 기반 조회 초당 10회
- 응답 시간 100ms 이하

**요청 (ID 조회)**:
```
GET /auth/users/{userId}
Authorization: Bearer JWT_TOKEN
```

**응답 (ID 조회)**:
```
200 OK
{
  "id": "유저ID",
  "email": "user@example.com",
  "roles": ["USER"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

**요청 (이메일 조회)**:
```
GET /auth/users/email
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
  "email": "user@example.com"
}
```

**응답 (이메일 조회)**:
```
200 OK
{
  "id": "유저ID",
  "email": "user@example.com",
  "roles": ["USER"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### 5. 권한 변경 성능 테스트

**요구사항**:
- 단일 권한 추가 초당 3회
- 복수 권한 변경 초당 2회
- 응답 시간 150ms 이하

**요청 (단일 권한 추가)**:
```
PUT /auth/users/{userId}/roles
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
  "roles": ["USER", "OPERATOR"]
}
```

**응답 (단일 권한 추가)**:
```
200 OK
{
  "id": "유저ID",
  "email": "user@example.com",
  "roles": ["USER", "OPERATOR"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### 6. 이벤트-보상 연결 성능 테스트

**요구사항**:
- 새 이벤트에 보상 추가 초당 5회
- 기존 이벤트에 보상 추가 초당 8회
- 응답 시간 150ms 이하

**요청**:
```
POST /events/{eventId}/rewards
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

{
  "rewardId": "보상ID"
}
```

**응답**:
```
200 OK
```

### 7. 보상 요청 조회 성능 테스트

**요구사항**:
- 필터 없는 조회 초당 10회
- 사용자 필터 조회 초당 5회
- 이벤트 필터 조회 초당 5회
- 응답 시간 120ms 이하

**요청 (필터 없음)**:
```
GET /events/requests
Authorization: Bearer JWT_TOKEN
```

**응답 (필터 없음)**:
```
200 OK
[
  {
    "id": "요청ID1",
    "eventId": "이벤트ID1",
    "userId": "유저ID1",
    "status": "PENDING",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
]
```

**요청 (사용자 필터)**:
```
GET /events/requests?userId={userId}
Authorization: Bearer JWT_TOKEN
```

**응답 (사용자 필터)**:
```
200 OK
[
  {
    "id": "요청ID1",
    "eventId": "이벤트ID1",
    "userId": "유저ID1",
    "status": "PENDING",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
]
```

### 8. 현재 사용자 정보 조회 성능 테스트

**요구사항**:
- 초당 30회 조회
- 응답 시간 80ms 이하

**요청**:
```
GET /auth/me
Authorization: Bearer JWT_TOKEN
```

**응답**:
```
200 OK
{
  "id": "유저ID",
  "email": "user@example.com",
  "roles": ["USER"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### 9. 이벤트 보상 목록 조회 성능 테스트

**요구사항**:
- 초당 20회 조회
- 응답 시간 120ms 이하

**요청**:
```
GET /events/{eventId}/rewards
Authorization: Bearer JWT_TOKEN
```

**응답**:
```
200 OK
[
  {
    "id": "보상ID1",
    "type": "POINT",
    "points": 100
  },
  {
    "id": "보상ID2",
    "type": "BADGE",
    "badgeId": "badge123"
  }
]
```

### 10. 보상 목록 조회 성능 테스트

**요구사항**:
- 필터 없는 조회 초당 15회
- 타입 필터 조회 초당 10회
- 응답 시간 100ms 이하

**요청 (필터 없음)**:
```
GET /rewards
Authorization: Bearer JWT_TOKEN
```

**응답 (필터 없음)**:
```
200 OK
[
  {
    "id": "보상ID1",
    "type": "POINT",
    "points": 100
  },
  {
    "id": "보상ID2",
    "type": "BADGE",
    "badgeId": "badge123"
  },
  {
    "id": "보상ID3",
    "type": "COUPON",
    "couponCode": "SUMMER2023",
    "expiry": "2023-12-31T23:59:59Z"
  }
]
```

**요청 (타입 필터)**:
```
GET /rewards?type=POINT
Authorization: Bearer JWT_TOKEN
```

**응답 (타입 필터)**:
```
200 OK
[
  {
    "id": "보상ID1",
    "type": "POINT",
    "points": 100
  }
]
``` 
