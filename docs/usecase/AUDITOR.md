# AUDITOR 사용자 유스케이스 시나리오

AUDITOR 사용자는 이벤트 및 리워드 요청을 감사하고 모니터링하는 역할을 수행합니다. 다음 시나리오는 AUDITOR 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 감사자 로그인 및 계정 정보 조회

### 1.1. 감사자 로그인

**요청:**

```http
POST /auth/login
Content-Type: application/json

LoginUserDto
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800

LoginResponseDto
```

### 1.2. 토큰 갱신

#### 1.2.1. 유효한 리프레시 토큰으로 액세스 토큰 갱신

**요청:**

```http
POST /auth/refresh
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800

TokenResponseDto
```

#### 1.2.2. 만료된 리프레시 토큰으로 갱신 시도

**요청:**

```http
POST /auth/refresh
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=0

ErrorResponseDto
```

#### 1.2.3. 유효하지 않은 리프레시 토큰으로 갱신 시도

**요청:**

```http
POST /auth/refresh
Cookie: refreshToken=invalid.token.here
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=0

ErrorResponseDto
```

#### 1.2.4. 리프레시 토큰 누락으로 갱신 시도

**요청:**

```http
POST /auth/refresh
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 1.3. 자신의 계정 정보 조회

**요청:**

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

UserResponseDto
```

## 2. 이벤트 모니터링

### 2.1. 모든 이벤트 조회

**요청:**

```http
GET /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

CursorPaginationResponseDto<EventResponseDto>
```

### 2.2. 특정 이벤트 상세 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a250
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

EventResponseDto
```

### 2.3. 이벤트의 리워드 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a250/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

RewardResponseDto[]
```

## 3. 리워드 요청 모니터링

### 3.1. 모든 리워드 요청 조회

**요청:**

```http
GET /events/requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

PaginationResponseDto<RewardRequestResponseDto>
```

### 3.2. 상태별 리워드 요청 조회

**요청:**

```http
GET /events/requests?status=PENDING
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

PaginationResponseDto<RewardRequestResponseDto>
```

### 3.3. 특정 이벤트의 리워드 요청 조회

**요청:**

```http
GET /events/requests?eventId=645f2d1b8c5cd2f948e9a250
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

PaginationResponseDto<RewardRequestResponseDto>
```

### 3.4. 특정 리워드 요청 상세 조회

**요청:**

```http
GET /events/requests/645f2d1b8c5cd2f948e9a260
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

RewardRequestResponseDto
```

## 4. 미인증 요청 시나리오

### 4.1. 토큰 없이 리워드 요청 목록 조회 시도

**요청:**

```http
GET /events/requests
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 4.2. 권한이 없는 사용자로 리워드 요청 감사 시도

**요청:**

```http
GET /events/requests?status=PENDING
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (OPERATOR 권한 토큰)
```

**응답:**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

ErrorResponseDto
```

## 5. 엣지 케이스 시나리오

### 5.1. 존재하지 않는 이벤트에 대한 상세 조회 시도

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

ErrorResponseDto
```

### 5.2. 존재하지 않는 이벤트의 리워드 목록 조회 시도

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a999/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

ErrorResponseDto
```

### 5.3. 유효하지 않은 상태값으로 리워드 요청 조회 시도

**요청:**

```http
GET /events/requests?status=INVALID_STATUS
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.4. 존재하지 않는 사용자의 리워드 요청 조회 시도

**요청:**

```http
GET /events/requests?userId=645f2d1b8c5cd2f948e9a999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

PaginationResponseDto<RewardRequestResponseDto> (empty results)
```

### 5.5. 잘못된 형식의 Object ID 사용 시도

**요청:**

```http
GET /events/requests?eventId=invalid-object-id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.6. 너무 긴 날짜 범위로 리워드 요청 조회 시도

**요청:**

```http
GET /events/requests?startDate=2020-01-01T00:00:00.000Z&endDate=2025-12-31T23:59:59.999Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.7. 권한 수정 시도 (AUDITOR에게는 허용되지 않음)

**요청:**

```http
PUT /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (AUDITOR 권한 토큰)
Content-Type: application/json

UpdateUserRolesDto
```

**응답:**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

ErrorResponseDto
```
