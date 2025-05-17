# 테스트 준비

## 폴더 구조

k6 부하 테스트를 위한 폴더 구조는 다음과 같습니다:

```
event-server/
├── test/
│   ├── scripts/         # k6 테스트 스크립트 파일
│   │   ├── auth/        # 인증 관련 테스트
│   │   │   ├── login.ts
│   │   │   └── register.ts
│   │   ├── event/       # 이벤트 관련 테스트
│   │   │   ├── create-event.ts
│   │   │   └── request-reward.ts
│   │   └── common/      # 공통 헬퍼 및 유틸리티
│   │       ├── helpers.ts
│   │       └── types.ts
│   ├── data/            # 테스트 데이터 파일
│   │   ├── users.json   # 생성된 사용자 테스트 데이터
│   │   └── events.json  # 생성된 이벤트 테스트 데이터
│   ├── fixtures.ts      # 테스트 데이터 생성 스크립트
│   ├── config/          # 테스트 구성 파일
│   │   └── k6.config.json
│   ├── esbuild.config.js # esbuild 구성 파일
│   └── tsconfig.json    # TypeScript 구성 파일
├── infrastructure/
│   └── grafana/
│       ├── dashboards/
│       │   └── k6-dashboard.json  # k6용 그라파나 대시보드
│       └── datasources/
│           └── prometheus.yaml    # Prometheus 데이터 소스 구성
└── scripts/
    └── run-load-test.sh           # 부하 테스트 실행 스크립트
```

## TypeScript k6 스크립트 설정

k6를 TypeScript로 사용하기 위해서는 다음과 같은 설정이 필요합니다:

### 필수 패키지

```bash
pnpm add -D esbuild glob typescript @types/k6 k6-html-reporter ts-node
```

### tsconfig.json

test 디렉토리에 다음과 같은 tsconfig.json 파일을 생성합니다:

```json
{
  "compilerOptions": {
    "target": "es2015",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "../dist",
    "rootDir": "./",
    "baseUrl": "./",
    "paths": {
      "@/*": ["./scripts/*"]
    }
  },
  "include": ["./**/*"],
  "exclude": ["node_modules"]
}
```

### esbuild.config.js

webpack 대신 esbuild를 사용하여 빠른 빌드를 진행합니다:

```javascript
const { build } = require('esbuild');
const path = require('path');
const glob = require('glob');

// Find all test files
const entryPoints = glob.sync('./test/scripts/**/*.ts');

// Build configuration
async function runBuild() {
  await build({
    entryPoints,
    outdir: 'dist',
    bundle: true,
    platform: 'browser',
    target: 'es2015',
    format: 'cjs',
    external: ['k6', 'k6/*'],
    outExtension: { '.js': '.bundle.js' },
    sourcemap: true,
    define: {
      global: 'window',
    },
  });
  console.log('⚡ Build complete');
}

runBuild().catch(err => {
  console.error(err);
  process.exit(1);
});
```

## 프로젝트 DTO 활용하기

테스트 코드에서 프로젝트의 DTO를 활용하여 일관된 데이터 구조를 유지합니다:

```typescript
// scripts/auth/login.ts 예시
import { check, sleep } from 'k6';
import { Options } from 'k6/options';
import { LoginDto } from '../../../packages/dtos/src/auth/request';
import { apiRequest, getRandomUser } from '../common/helpers';

export const options: Options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  const user = getRandomUser();
  
  // LoginDto를 사용하여 요청 페이로드 구성
  const loginPayload: LoginDto = {
    email: user.email,
    password: user.password,
  };
  
  const loginResponse = apiRequest('POST', '/auth/login', loginPayload);
  
  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    'response time is acceptable': (r) => r.timings.duration < 300,
  });
  
  sleep(1);
}
```

## 테스트 데이터 생성

테스트 데이터는 fixture 생성 스크립트를 통해 자동 생성됩니다:

```typescript
// fixtures.ts 예시
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CreateUserDto } from '../packages/dtos/src/auth/request';
import { CreateEventDto, EventPeriodDto } from '../packages/dtos/src/event/request';
import { EventStatus } from '../packages/enums/src';

// Generate fixtures and write to files
export function generateFixtures() {
  // Create directories if they don't exist
  ensureDirectories();
  
  // Generate fixtures
  const users = generateUsers(50);
  const events = generateEvents(20, users);
  
  // Write to files
  writeFileSync(
    join(__dirname, 'data', 'users.json'), 
    JSON.stringify(users, null, 2)
  );
  
  writeFileSync(
    join(__dirname, 'data', 'events.json'), 
    JSON.stringify(events, null, 2)
  );
  
  console.log('Fixtures generated successfully!');
  console.log(`- ${users.length} users created`);
  console.log(`- ${events.length} events created`);
}
```

## Prometheus 설정

현재 서비스 모듈(auth, gateway, event)에는 Prometheus 모듈이 포함되어 있지 않습니다. 부하 테스트를 위한 모니터링을 설정하려면 다음과 같은 단계를 따라야 합니다:

### 1. Prometheus 통합 모듈 추가
서비스 모니터링을 위해 다음 패키지를 설치합니다:

```bash
pnpm add @nestjs/terminus @prometheus/client prom-client
```

### 2. 각 서비스에 Prometheus 미들웨어 추가
각 서비스의 main.ts 파일에서 Prometheus 미들웨어를 추가하거나, 전용 모듈을 생성합니다. 
예를 들어, 각 서비스에 다음과 같은 코드를 추가해야 합니다:

```typescript
// metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics() {
    return await register.metrics();
  }
}
```

그리고 각 서비스의 AppModule에 이 컨트롤러를 등록해야 합니다.

### 3. Docker Compose 설정
docker-compose.yml에 다음 서비스를 추가합니다:

```yaml
prometheus:
  image: prom/prometheus:latest
  container_name: prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./infrastructure/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus-data:/prometheus
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
    - '--web.console.libraries=/etc/prometheus/console_libraries'
    - '--web.console.templates=/etc/prometheus/consoles'
    - '--web.enable-lifecycle'
  networks:
    - event-network
volumes:
  prometheus-data: {}
```

### 4. Prometheus 설정 파일 생성
infrastructure/prometheus/prometheus.yml 파일을 생성합니다. 
아래 구성은 각 서비스가 Prometheus 메트릭 엔드포인트를 노출한다고 가정합니다:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['prometheus:9090']
  
  # 주의: 각 서비스는 /metrics 엔드포인트를 구현해야 합니다
  - job_name: 'auth-service'
    metrics_path: /metrics
    static_configs:
      - targets: ['auth:3001']  # docker-compose에 정의된 내부 포트에 맞춰야 함
  
  - job_name: 'event-service'
    metrics_path: /metrics
    static_configs:
      - targets: ['event:3002']  # docker-compose에 정의된 내부 포트에 맞춰야 함
      
  - job_name: 'gateway'
    metrics_path: /metrics
    static_configs:
      - targets: ['gateway:3000']  # docker-compose에 정의된 내부 포트
  
  - job_name: 'k6'
    static_configs:
      - targets: ['k6:6565']
```

**참고**: 위 설정은 docker-compose.yml의 서비스 포트 구성과 일치해야 합니다. 현재 구성에서 gateway는 내부 포트 3000, auth와 event 서비스는 각각 환경 변수를 통해 정의된 포트(3001, 3002)를 사용합니다. 실제 환경에 맞게 조정하세요.

## k6 Docker 설정

docker-compose에 k6 서비스를 추가합니다:

```yaml
k6:
  image: grafana/k6:latest
  container_name: k6
  ports:
    - "6565:6565"
  volumes:
    - ./test:/test
    - ./dist:/dist
  environment:
    - K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write
    - K6_OUT=output-prometheus-remote
  networks:
    - event-network
  depends_on:
    - prometheus
    - gateway
```

## package.json 스크립트

package.json에 다음 스크립트를 추가합니다:

```json
{
  "scripts": {
    "build:k6": "node test/esbuild.config.js",
    "test:k6": "docker-compose run k6 run /dist/scripts/auth/login.bundle.js",
    "generate:fixtures": "ts-node test/fixtures.ts"
  }
}
```

## 실행 방법

1. 테스트 데이터 생성
```bash
pnpm generate:fixtures
```

2. 테스트 스크립트 빌드
```bash
pnpm build:k6
```

3. 테스트 실행
```bash
pnpm test:k6
``` 
