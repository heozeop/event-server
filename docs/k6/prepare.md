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
const { build } = require("esbuild");
const path = require("path");
const glob = require("glob");

// Find all test files
const entryPoints = glob.sync("./test/scripts/**/*.ts");

// Build configuration
async function runBuild() {
  await build({
    entryPoints,
    outdir: "dist",
    bundle: true,
    platform: "browser",
    target: "es2015",
    format: "cjs",
    external: ["k6", "k6/*"],
    outExtension: { ".js": ".bundle.js" },
    sourcemap: true,
    define: {
      global: "window",
    },
  });
  console.log("⚡ Build complete");
}

runBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## 프로젝트 DTO 활용하기

테스트 코드에서 프로젝트의 DTO를 활용하여 일관된 데이터 구조를 유지합니다:

```typescript
// scripts/auth/login.ts 예시
import { check, sleep } from "k6";
import { Options } from "k6/options";
import { LoginDto } from "../../../packages/dtos/src/auth/request";
import { apiRequest, getRandomUser } from "../common/helpers";

export const options: Options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const user = getRandomUser();

  // LoginDto를 사용하여 요청 페이로드 구성
  const loginPayload: LoginDto = {
    email: user.email,
    password: user.password,
  };

  const loginResponse = apiRequest("POST", "/auth/login", loginPayload);

  check(loginResponse, {
    "login status is 200": (r) => r.status === 200,
    "has access token": (r) => JSON.parse(r.body).accessToken !== undefined,
    "response time is acceptable": (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

## 테스트 데이터 생성

테스트 데이터는 fixture 생성 스크립트를 통해 자동 생성됩니다:

```typescript
// fixtures.ts 예시
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { CreateUserDto } from "../packages/dtos/src/auth/request";
import {
  CreateEventDto,
  EventPeriodDto,
} from "../packages/dtos/src/event/request";
import { EventStatus } from "../packages/enums/src";

// Generate fixtures and write to files
export function generateFixtures() {
  // Create directories if they don't exist
  ensureDirectories();

  // Generate fixtures
  const users = generateUsers(50);
  const events = generateEvents(20, users);

  // Write to files
  writeFileSync(
    join(__dirname, "data", "users.json"),
    JSON.stringify(users, null, 2),
  );

  writeFileSync(
    join(__dirname, "data", "events.json"),
    JSON.stringify(events, null, 2),
  );

  console.log("Fixtures generated successfully!");
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

### 2. 공유 메트릭스 모듈 생성

각 서비스에서 재사용할 수 있는 공유 메트릭스 모듈을 생성합니다. 이 모듈은 `pacakages` 디렉토리에 생성하여 모든 마이크로서비스에서 공유할 수 있도록 합니다.

그런 다음 메트릭스 모듈을 구현합니다:

```typescript
// packages/metrics/src/metrics.module.ts
import { DynamicModule, Module } from "@nestjs/common";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import { MetricsInterceptor } from "./metrics.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";

export interface MetricsModuleOptions {
  serviceName: string;
  serviceVersion?: string;
  enabled?: boolean;
}

@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    return {
      module: MetricsModule,
      controllers: [MetricsController],
      providers: [
        {
          provide: "METRICS_OPTIONS",
          useValue: {
            enabled: true,
            ...options,
          },
        },
        MetricsService,
        {
          provide: APP_INTERCEPTOR,
          useClass: MetricsInterceptor,
        },
      ],
      exports: [MetricsService],
    };
  }
}
```

```typescript
// packages/metrics/src/metrics.service.ts
import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";
import { MetricsModuleOptions } from "./metrics.module";

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;
  private readonly prefix: string;

  // 기본 메트릭스
  public httpRequestsTotal: Counter;
  public httpRequestDuration: Histogram;
  public httpRequestSize: Histogram;
  public httpResponseSize: Histogram;
  public httpServerErrors: Counter;
  public httpClientErrors: Counter;
  public serviceInfo: Gauge;

  constructor(
    @Inject("METRICS_OPTIONS") private options: MetricsModuleOptions,
  ) {
    this.prefix = options.serviceName;
    this.registry = new Registry();

    // 기본 Node.js 메트릭스 등록
    collectDefaultMetrics({
      register: this.registry,
      prefix: `${this.prefix}_`,
    });

    // HTTP 요청 카운터
    this.httpRequestsTotal = new Counter({
      name: `${this.prefix}_http_requests_total`,
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry],
    });

    // HTTP 요청 처리 시간
    this.httpRequestDuration = new Histogram({
      name: `${this.prefix}_http_request_duration_seconds`,
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // HTTP 요청 크기
    this.httpRequestSize = new Histogram({
      name: `${this.prefix}_http_request_size_bytes`,
      help: "HTTP request size in bytes",
      labelNames: ["method", "route"],
      buckets: [100, 1000, 5000, 10000, 50000, 100000],
      registers: [this.registry],
    });

    // HTTP 응답 크기
    this.httpResponseSize = new Histogram({
      name: `${this.prefix}_http_response_size_bytes`,
      help: "HTTP response size in bytes",
      labelNames: ["method", "route"],
      buckets: [100, 1000, 5000, 10000, 50000, 100000],
      registers: [this.registry],
    });

    // HTTP 서버 에러 (5xx)
    this.httpServerErrors = new Counter({
      name: `${this.prefix}_http_server_errors_total`,
      help: "Total number of HTTP server errors",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry],
    });

    // HTTP 클라이언트 에러 (4xx)
    this.httpClientErrors = new Counter({
      name: `${this.prefix}_http_client_errors_total`,
      help: "Total number of HTTP client errors",
      labelNames: ["method", "route", "status_code"],
      registers: [this.registry],
    });

    // 서비스 정보
    this.serviceInfo = new Gauge({
      name: `${this.prefix}_info`,
      help: "Service information",
      labelNames: ["version"],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    // 서비스 정보 메트릭 설정
    this.serviceInfo.labels(this.options.serviceVersion || "unknown").set(1);
  }

  // 메트릭스 수집
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  // 컨텐츠 타입 가져오기
  getContentType(): string {
    return this.registry.contentType;
  }
}
```

```typescript
// libs/metrics/src/metrics.controller.ts
import { Controller, Get, Header } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header("Content-Type", "text/plain")
  async getMetrics() {
    return await this.metricsService.getMetrics();
  }
}
```

```typescript
// libs/metrics/src/metrics.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { MetricsService } from "./metrics.service";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    // 요청 크기 기록 (대략적 계산)
    const contentLength = request.headers["content-length"]
      ? parseInt(request.headers["content-length"], 10)
      : 0;

    if (contentLength > 0) {
      this.metricsService.httpRequestSize.observe(
        { method, route: this.normalizeRoute(url) },
        contentLength,
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode.toString();
          const route = this.normalizeRoute(url);
          const duration = (Date.now() - startTime) / 1000; // seconds

          // 기본 요청 메트릭 기록
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
          this.metricsService.httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            duration,
          );

          // 응답 크기 계산 (대략적)
          const responseSize = JSON.stringify(data)?.length || 0;
          if (responseSize > 0) {
            this.metricsService.httpResponseSize.observe(
              { method, route },
              responseSize,
            );
          }

          // 에러 메트릭 카운트
          if (statusCode.startsWith("5")) {
            this.metricsService.httpServerErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          } else if (statusCode.startsWith("4")) {
            this.metricsService.httpClientErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          }
        },
        error: (error) => {
          const statusCode = error.status || "500";
          const route = this.normalizeRoute(url);
          const duration = (Date.now() - startTime) / 1000; // seconds

          // 에러 케이스 기록
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
          });
          this.metricsService.httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            duration,
          );

          if (statusCode.startsWith("5")) {
            this.metricsService.httpServerErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          } else if (statusCode.startsWith("4")) {
            this.metricsService.httpClientErrors.inc({
              method,
              route,
              status_code: statusCode,
            });
          }
        },
      }),
    );
  }

  // 라우트 정규화 (동적 파라미터를 위해)
  private normalizeRoute(url: string): string {
    return url
      .split("/")
      .map((part) => {
        // UUID 또는 숫자 ID 패턴 감지 (간단한 휴리스틱)
        if (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            part,
          ) ||
          /^\d+$/.test(part)
        ) {
          return ":id";
        }
        return part;
      })
      .join("/");
  }
}
```

```typescript
// libs/metrics/src/index.ts
export * from "./metrics.module";
export * from "./metrics.service";
export * from "./metrics.controller";
export * from "./metrics.interceptor";
```

### 3. 각 서비스 AppModule에 메트릭스 모듈 통합

각 마이크로서비스의 AppModule에 메트릭스 모듈을 추가합니다:

```typescript
// apps/auth/src/app.module.ts, apps/event/src/app.module.ts, apps/gateway/src/app.module.ts
import { MetricsModule } from "@libs/metrics";

@Module({
  imports: [
    // ... 기존 imports ...
    MetricsModule.forRoot({
      serviceName: "auth-service", // 각 서비스별로 적절한 이름 사용
      serviceVersion: "1.0.0", // 배포 버전
    }),
  ],
  // ... 기존 코드 ...
})
export class AppModule {}
```

### 4. Docker Compose 설정 업데이트

Prometheus와 서비스 메트릭스를 수집하기 위한 Docker Compose 구성을 추가합니다:

```yaml
# docker-compose.yml 에 추가
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - event-network
    depends_on:
      - gateway
      - auth
      - event

volumes:
  # ... 기존 볼륨 ...
  prometheus-data:
```

### 5. Prometheus 설정 파일 생성

```yaml
# config/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "gateway"
    scrape_interval: 5s
    metrics_path: /metrics
    static_configs:
      - targets: ["gateway:3000"]
        labels:
          service: "gateway"

  - job_name: "auth"
    scrape_interval: 5s
    metrics_path: /metrics
    static_configs:
      - targets: ["auth:3001"]
        labels:
          service: "auth"

  - job_name: "event"
    scrape_interval: 5s
    metrics_path: /metrics
    static_configs:
      - targets: ["event:3002"]
        labels:
          service: "event"
```

### 6. Grafana 대시보드 추가

Prometheus 데이터 소스를 Grafana에 추가하고, 마이크로서비스 모니터링을 위한 대시보드를 구성합니다:

```yaml
# config/grafana/datasources.yaml에 추가
- name: Prometheus
  type: prometheus
  access: proxy
  url: http://prometheus:9090
  isDefault: true
```

마이크로서비스 모니터링을 위한 기본 대시보드는 `config/grafana/dashboards` 디렉토리에 JSON 파일로 추가할 수 있습니다.

이 접근 방식의 주요 이점:

- 모든 서비스에서 일관된 메트릭스 수집
- 중앙집중식 모니터링 대시보드
- 공통 코드 재사용으로 유지보수 용이성 증가
- 자동 메트릭스 수집 (인터셉터 사용)

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
