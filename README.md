# 이벤트 리워드 플랫폼

NestJS를 사용한 이벤트 및 리워드 관리를 위한 마이크로서비스 기반 애플리케이션입니다.

## 아키텍처

이 플랫폼은 세 가지 주요 서비스로 구성됩니다:

1. **게이트웨이 서비스**: API 게이트웨이 역할을 하며 클라이언트의 HTTP 요청을 처리합니다.
2. **인증 서비스**: 인증 및 사용자 관리를 담당합니다.
3. **이벤트 서비스**: 이벤트 및 리워드를 관리합니다.

### 상세 아키텍처

- **마이크로서비스 통신**: 서비스 간 통신은 TCP/IP 프로토콜을 통해 이루어집니다.
- **데이터베이스**: 각 서비스는 자체 MongoDB 인스턴스를 사용합니다.
- **로깅**: 중앙 집중식 로깅 시스템은 Grafana Loki와 Alloy를 사용합니다.
- **API 게이트웨이**: REST API와 Swagger 문서를 제공합니다.

## 개발 환경 설정

### 필수 조건

- Node.js (v18+)
- pnpm
- Docker 및 Docker Compose

### Makefile을 사용한 초기화 및 관리

프로젝트를 쉽게 초기화하고 관리하기 위해 Makefile을 제공합니다:

```bash
# 키 생성 및 서비스 시작 (초기 설정)
make init

# 모든 서비스 시작
make up

# 로깅 서비스와 함께 시작
make up-with-logs

# 모든 서비스 중지
make down

# 모든 서비스 재시작
make restart

# 로그 확인
make logs

# 로그 실시간 확인
make logs-follow

# 실행 중인 서비스 목록 확인
make ps

# k6 테스트 실행 (테스트 데이터 시드 포함)
make k6

# 모든 테스트 실행 (단위 테스트 및 유스케이스 테스트)
make test
```

### 수동 설치

저장소를 복제하고 종속성을 설치합니다:

```bash
git clone <repository-url>
cd event-server
pnpm install
```

## 테스트 실행

### 단위 테스트 및 통합 테스트

```bash
# 모든 테스트 실행 (테스트 유저 시드 및 유스케이스 테스트 포함)
make test

# 또는 pnpm으로 직접 실행
pnpm test

# 특정 서비스의 테스트 실행
pnpm test:auth
pnpm test:event
pnpm test:gateway

# 테스트 커버리지 확인
pnpm test:cov
```

### 유스케이스 테스트

유스케이스 테스트는 특정 비즈니스 시나리오를 검증합니다:

```bash
# 모든 유스케이스 테스트 실행
pnpm test:usecase

# 또는 스크립트 직접 실행
bash scripts/run-usecase-tests.sh

# 특정 유스케이스 테스트 실행
pnpm test:usecase:event-creation
pnpm test:usecase:reward-distribution
```

### 성능 테스트 (k6)

k6를 사용하여 성능 테스트를 실행합니다:

```bash
# k6 성능 테스트 실행 (테스트 데이터 자동 시드)
make k6

# 또는 스크립트 직접 실행
bash scripts/run-k6-tests.sh
```

## API 문서

Swagger 문서는 다음에서 확인할 수 있습니다:

```
http://localhost:3333/docs
```

Swagger UI는 다음을 제공합니다:
- 대화형 API 문서
- 모든 엔드포인트 테스트 기능
- JWT 토큰을 사용한 인증

## 로깅 시스템

애플리케이션은 중앙 집중식 로그 관리를 위해 Grafana Loki 및 Grafana Alloy와 함께 구조화된 JSON 로깅을 사용합니다. 기능은 다음과 같습니다:

- **JSON 형식**: 모든 로그는 쉬운 구문 분석 및 분석을 위해 JSON 형식입니다.
- **요청 추적**: 각 로그에는 서비스 간 요청을 추적하기 위한 requestId가 포함됩니다.
- **중앙 집중식 로깅**: 모든 로그는 Grafana Alloy에 의해 수집되어 Loki에 저장됩니다.
- **대시보드**: 로그 분석을 위한 사전 구성된 Grafana 대시보드
- **성능 추적**: `@LogPerformance()` 데코레이터를 사용하여 메서드 실행 시간을 추적할 수 있습니다.
- **민감한 데이터 수정**: 비밀번호 및 토큰과 같은 민감한 정보는 자동으로 수정됩니다.
- **로그 레벨**: 환경에 따른 다른 로그 레벨(개발 환경에서는 debug, 프로덕션 환경에서는 info)
- **보기 좋은 형식**: 개발 로그는 가독성을 위해 형식을 지정할 수 있습니다.

### 로그 보기

Grafana는 `http://localhost:3000`에서 기본 자격 증명 `admin/admin`으로 사용할 수 있습니다.

사전 구성된 대시보드에는 다음이 포함됩니다:
- 요청 추적 대시보드: 서비스 간 요청을 추적하기 위해 requestId별로 그룹화된 로그 표시
- 로그 뷰어: 필터링 기능이 있는 일반 로그 뷰어

### Loki 쿼리 예

- 모든 로그: `{container=~".+"}`
- 특정 서비스의 로그: `{container="gateway"}`
- 특정 요청 추적: `{requestId="specific-request-id"}`
- 오류 로그: `{container=~".+"} |= "error"`

### 로깅 API 사용법

```typescript
import { LogPerformance } from "./common/logging";

@Controller()
export class MyController {
  constructor(private readonly logger: LoggerService) {}

  @Get("resource")
  @LogPerformance("category")
  async getResource() {
    // 메서드 실행 시간이 로깅됩니다
    this.logger.log("리소스를 가져오는 중", { resourceId: "123" });
    return this.service.fetchResource();
  }
}
```

## 서비스

### 게이트웨이 서비스

- 마이크로서비스 포트: 3010 (내부 포트 3000에 매핑됨)
- HTTP 포트: 3333 (REST API 및 Swagger용)

### 인증 서비스

- 마이크로서비스 포트: 3001

### 이벤트 서비스

- 마이크로서비스 포트: 3002

## 데이터베이스

각 서비스에는 자체 MongoDB 인스턴스가 있습니다:

- 인증 서비스: mongodb://mongo-user:27017/user-db
- 이벤트 서비스: mongodb://mongo-event:27017/event-db

## 유용한 명령어

- 모든 서비스 시작: `make up` 또는 `./rebuild-and-start.sh`
- 로그 보기: `make logs` 또는 `make logs-follow`
- 모든 서비스 중지: `make down`
- 모든 테스트 실행: `make test`
