# USER 사용자 유스케이스 시나리오

USER 사용자는 일반 사용자로서 이벤트를 조회하고 리워드를 요청할 수 있습니다. 다음 시나리오는 USER 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 계정 관리

### 1.1. 계정 생성

**요청:**

```http
POST /auth/users
Content-Type: application/json

CreateUserDto
```

**응답:**

```http
HTTP/1.1 201 Created
Content-Type: application/json

UserResponseDto
```

### 1.2. 로그인

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

### 1.3. 토큰 갱신

#### 1.3.1. 유효한 리프레시 토큰으로 액세스 토큰 갱신

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

#### 1.3.2. 만료된 리프레시 토큰으로 갱신 시도

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

#### 1.3.3. 유효하지 않은 리프레시 토큰으로 갱신 시도

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

#### 1.3.4. 리프레시 토큰 누락으로 갱신 시도

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

### 1.4. 자신의 계정 정보 조회

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

## 2. 이벤트 조회

### 2.1. 이벤트 목록 조회

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

### 2.3. 이벤트의 리워드 목록 조회

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

## 3. 리워드 요청 관리

### 3.1. 내 리워드 요청 목록 조회

**요청:**

```http
GET /events/requests/mine
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

PaginationResponseDto<RewardRequestResponseDto>
```

### 3.2. 특정 리워드 요청 상세 조회

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

### 3.3. 이벤트 리워드 요청하기

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/requests/645f2d1b8c5cd2f948e9a251
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 201 Created
Content-Type: application/json

RewardRequestResponseDto
```

## 4. 미인증 요청 시나리오

### 4.1. 토큰 없이 이벤트 목록 조회 시도

**요청:**

```http
GET /events
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 4.2. 토큰 없이 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/requests/645f2d1b8c5cd2f948e9a251
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 4.3. 접근 권한이 없는 API 호출 시도

**요청:**

```http
POST /rewards/POINT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (USER 권한 토큰)
Content-Type: application/json

CreateRewardDto
```

**응답:**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

ErrorResponseDto
```

## 5. 엣지 케이스 시나리오

### 5.1. 유효하지 않은 이메일 형식으로 계정 생성 시도

**요청:**

```http
POST /auth/users
Content-Type: application/json

CreateUserDto (with invalid email)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.2. 너무 짧은 비밀번호로 계정 생성 시도

**요청:**

```http
POST /auth/users
Content-Type: application/json

CreateUserDto (with short password)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.3. 잘못된 인증 정보로 로그인 시도

**요청:**

```http
POST /auth/login
Content-Type: application/json

LoginUserDto (with wrong password)
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 5.4. 존재하지 않는 이벤트에 대한 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a999/requests/645f2d1b8c5cd2f948e9a251
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

ErrorResponseDto
```

### 5.5. 비활성화된 이벤트에 대한 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a258/requests/645f2d1b8c5cd2f948e9a251
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.6. 존재하지 않는 리워드에 대한 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/requests/645f2d1b8c5cd2f948e9a999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

ErrorResponseDto
```
