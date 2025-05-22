# ADMIN 사용자 유스케이스 시나리오

ADMIN 사용자는 시스템 관리자로서 전체 시스템에 대한 관리 권한을 가지고 있습니다. 다음 시나리오는 ADMIN 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 관리자 로그인 및 사용자 관리

### 1.1. 관리자 로그인

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

### 1.3. 사용자 이메일로 조회

**요청:**

```http
GET /auth/users/email?email=user@example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

UserResponseDto
```

### 1.4. 사용자 ID로 조회

**요청:**

```http
GET /auth/users/645f2d1b8c5cd2f948e9a249
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

UserResponseDto
```

### 1.5. 사용자 역할 업데이트

**요청:**

```http
PATCH /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

UpdateUserRolesDto
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

UserResponseDto
```

## 2. 이벤트 및 리워드 관리

### 2.1. 이벤트 생성

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateEventDto
```

**응답:**

```http
HTTP/1.1 201 Created
Content-Type: application/json

EventResponseDto
```

### 2.2. 이벤트 목록 조회

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

### 2.3. 특정 이벤트 조회

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

### 2.4. 이벤트 업데이트

**요청:**

```http
PATCH /events/645f2d1b8c5cd2f948e9a250
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

UpdateEventDto
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

EventResponseDto
```

### 2.5. 이벤트 삭제

**요청:**

```http
DELETE /events/645f2d1b8c5cd2f948e9a250
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 204 No Content
```

### 2.6. 리워드 생성

**요청:**

```http
POST /rewards/POINT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateRewardDto
```

**응답:**

```http
HTTP/1.1 201 Created
Content-Type: application/json

RewardResponseDto
```

### 2.7. 리워드 목록 조회

**요청:**

```http
GET /rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

PaginationResponseDto<RewardResponseDto>
```

### 2.8. 특정 리워드 조회

**요청:**

```http
GET /rewards/645f2d1b8c5cd2f948e9a251
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

RewardResponseDto
```

### 2.9. 이벤트에 리워드 추가

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

AddRewardToEventDto
```

**응답:**

```http
HTTP/1.1 204 No Content
```

### 2.10. 이벤트의 리워드 목록 조회

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

### 2.11. 이벤트의 리워드 업데이트

**요청:**

```http
PATCH /events/645f2d1b8c5cd2f948e9a250/rewards/645f2d1b8c5cd2f948e9a251
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

UpdateEventRewardDto
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

EventRewardResponseDto
```

### 2.12. 이벤트에서 리워드 제거

**요청:**

```http
DELETE /events/645f2d1b8c5cd2f948e9a250/rewards/645f2d1b8c5cd2f948e9a251
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 204 No Content
```

## 3. 리워드 요청 관리

### 3.1. 리워드 요청 목록 조회

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

### 3.2. 특정 리워드 요청 조회

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

### 3.3. 리워드 요청 상태 업데이트

**요청:**

```http
PATCH /events/requests/645f2d1b8c5cd2f948e9a260
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

UpdateRewardRequestStatusDto
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

RewardRequestResponseDto
```

## 4. 미인증 요청 시나리오

### 4.1. 토큰 없이 사용자 목록 조회 시도

**요청:**

```http
GET /auth/users/email?email=user@example.com
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 4.2. 관리자가 아닌 사용자로 역할 업데이트 시도

**요청:**

```http
PUT /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (USER 권한 토큰)
Content-Type: application/json

UpdateUserRolesDto
```

**응답:**

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

ErrorResponseDto
```

## 5. 엣지 케이스 시나리오

### 5.1. 존재하지 않는 사용자 ID로 조회 시도

**요청:**

```http
GET /auth/users/645f2d1b8c5cd2f948e9a999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

ErrorResponseDto
```

### 5.2. 중복된 이메일로 사용자 생성 시도

**요청:**

```http
POST /auth/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateUserDto
```

**응답:**

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

ErrorResponseDto
```

### 5.3. 유효하지 않은 역할로 사용자 역할 업데이트 시도

**요청:**

```http
PUT /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

UpdateUserRolesDto (with invalid role)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.4. 과거 날짜로 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateEventDto (with past dates)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 5.5. 존재하지 않는 이벤트에 리워드 추가 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a999/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

AddRewardToEventDto
```

**응답:**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

ErrorResponseDto
```

### 5.6. 잘못된 형식의 토큰으로 인증 시도

**요청:**

```http
GET /auth/me
Authorization: Bearer invalid.token.format
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 5.7. 만료된 토큰으로 인증 시도

**요청:**

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 5.8. 모든 리워드 조회

**요청:**

```http
GET /rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

PaginationResponseDto<RewardResponseDto>
```

### 5.9. 모든 리워드 요청 조회

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

### 5.10. 리워드 요청 상태 업데이트

**요청:**

```http
PATCH /events/requests/645f2d1b8c5cd2f948e9a257
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

UpdateRewardRequestStatusDto
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

RewardRequestResponseDto
```
