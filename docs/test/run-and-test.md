# 테스트 실행 및 검증

## 테스트 실행 전 준비사항

### 1. 테스트 데이터 준비

테스트 실행 전에 다음과 같은 테스트 데이터가 필요합니다:

**사용자 데이터**:
- 관리자 권한 사용자 5개
- 일반 사용자 100개
- 운영자 권한 사용자 10개
- 감사자 권한 사용자 5개

**이벤트 데이터**:
- 다양한 상태의 이벤트 50개 (활성, 종료, 예정됨)
- 서로 다른 위치와 날짜를 가진 이벤트들

**보상 데이터**:
- 각 타입별 보상 데이터 (포인트, 뱃지, 쿠폰)
- 이벤트에 연결된 보상과 연결되지 않은 보상 모두 포함

이 테스트 데이터는 `test/data` 디렉토리에 JSON 파일 형태로 저장되어야 합니다.

### 2. 인프라 설정

테스트 실행 전에 다음 인프라를 준비해야 합니다:

```bash
# Docker Compose 환경 구성
docker-compose -f docker-compose.yml -f docker-compose.k6.yml up -d
```

### 3. 테스트 스크립트 빌드

TypeScript 스크립트를 JavaScript로 컴파일합니다:

```bash
# TypeScript 컴파일
npm run test:build
```

## 테스트 실행 명령어

### 1. 단일 테스트 실행

특정 유스케이스에 대한 테스트를 실행하는 명령어입니다:

```bash
# 로그인 테스트 실행
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run k6 run /dist/login.bundle.js

# 사용자 등록 테스트 실행
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run k6 run /dist/register.bundle.js

# 이벤트 생성 테스트 실행
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run k6 run /dist/create-event.bundle.js

# 보상 요청 테스트 실행
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run k6 run /dist/request-reward.bundle.js
```

각 테스트 스크립트는 다음 환경 변수를 통해 설정을 조정할 수 있습니다:

```bash
# 부하 테스트 매개변수 설정
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run \
  -e TEST_USERS=50 \
  -e TEST_DURATION=30s \
  -e RAMP_UP=5s \
  -e TARGET_RPS=20 \
  k6 run /dist/login.bundle.js
```

### 2. 시나리오 기반 테스트 실행

여러 엔드포인트를 하나의 시나리오로 테스트합니다:

```bash
# 전체 사용자 워크플로우 테스트
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run k6 run /dist/user-workflow.bundle.js

# 관리자 워크플로우 테스트
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run k6 run /dist/admin-workflow.bundle.js

# 운영자 워크플로우 테스트
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run k6 run /dist/operator-workflow.bundle.js
```

### 3. 대규모 부하 테스트

시스템 한계를 테스트하는 대규모 부하 테스트입니다:

```bash
# 대규모 사용자 등록 부하 테스트
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run \
  -e TEST_USERS=500 \
  -e TEST_DURATION=5m \
  -e RAMP_UP=30s \
  -e TARGET_RPS=50 \
  k6 run /dist/user-registration-load.bundle.js

# 복합 작업 시뮬레이션
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run \
  -e TEST_USERS=100 \
  -e TEST_DURATION=10m \
  -e RAMP_UP=60s \
  k6 run /dist/composite-workflow.bundle.js

# 장기 실행 내구성 테스트
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run \
  -e TEST_USERS=50 \
  -e TEST_DURATION=12h \
  -e RAMP_UP=5m \
  k6 run /dist/endurance-test.bundle.js
```

### 4. 병렬 실행

여러 테스트를 병렬로 실행하는 스크립트:

```bash
#!/bin/bash
# scripts/run-parallel-tests.sh

# 첫 번째 테스트 백그라운드에서 실행
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run -d \
  --name k6-login \
  -e TEST_USERS=30 \
  -e TEST_DURATION=5m \
  k6 run /dist/login.bundle.js

# 두 번째 테스트 백그라운드에서 실행
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run -d \
  --name k6-events \
  -e TEST_USERS=20 \
  -e TEST_DURATION=5m \
  k6 run /dist/events.bundle.js

# 결과 모니터링
echo "테스트가 백그라운드에서 실행 중입니다. Grafana에서 결과를 확인하세요."
```

### 5. 자동화된 테스트 실행

Jenkins 또는 GitHub Actions를 통한 자동화된 테스트 실행 예시:

```bash
#!/bin/bash
# scripts/run-automated-tests.sh

# 의존성 설치
pnpm install

# 테스트 스크립트 빌드
pnpm run test:build

# 인프라 설정
docker-compose -f docker-compose.yml -f docker-compose.k6.yml up -d prometheus grafana

# 테스트 데이터 초기화
pnpm run test:setup-data

# 테스트 실행
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run \
  k6 run /dist/smoke-test.bundle.js

# 결과 수집
mkdir -p test-results
docker cp k6:/tmp/k6-report.json ./test-results/

# 인프라 정리
docker-compose -f docker-compose.yml -f docker-compose.k6.yml down
```

## 테스트 결과 출력 형식

k6는 다양한 형식으로 결과를 출력할 수 있습니다:

### 1. JSON 출력

```bash
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run \
  -e K6_OUT=json=report.json \
  k6 run /dist/login.bundle.js
```

### 2. CSV 출력

```bash
docker-compose -f docker-compose.yml -f docker-compose.k6.yml run \
  -e K6_OUT=csv=report.csv \
  k6 run /dist/login.bundle.js
```

### 3. HTML 리포트

HTML 리포트를 생성하려면 추가 스크립트가 필요합니다:

```bash
# 테스트 실행 후 HTML 리포트 생성
pnpm run test:generate-report
```

## 테스트 설정 관리

### 1. 테스트 구성 파일

**파일 경로**: `test/config/test-config.json`

```json
{
  "environments": {
    "dev": {
      "baseUrl": "http://gateway:3000",
      "thresholds": {
        "http_req_duration": ["p(95)<500"]
      }
    },
    "staging": {
      "baseUrl": "http://staging-gateway:3000",
      "thresholds": {
        "http_req_duration": ["p(95)<300"]
      }
    }
  },
  "defaultOptions": {
    "noConnectionReuse": false,
    "userAgent": "k6-load-test"
  },
  "scenarios": {
    "login": {
      "executor": "ramping-arrival-rate",
      "startRate": 1,
      "timeUnit": "1s",
      "preAllocatedVUs": 50,
      "maxVUs": 100,
      "stages": [
        { "duration": "30s", "target": 10 },
        { "duration": "1m", "target": 20 },
        { "duration": "30s", "target": 0 }
      ]
    },
    "user-workflow": {
      "executor": "shared-iterations",
      "vus": 50,
      "iterations": 1000,
      "maxDuration": "10m"
    }
  }
}
```

### 2. 환경 변수를 통한 설정

```bash
# 테스트 구성 환경 변수
export K6_ENVIRONMENT=dev
export K6_BASE_URL=http://gateway:3000
export K6_VUS=50
export K6_DURATION=5m
```

## 테스트 결과 저장 및 관리

테스트 결과는 다음과 같이 관리됩니다:

1. **Prometheus에 저장**: 실시간 메트릭 데이터
2. **Grafana에 시각화**: 사용자 정의 대시보드
3. **JSON/CSV 파일**: 상세 결과 분석
4. **HTML 리포트**: 종합 테스트 보고서 
