# OPERATOR 사용자 유스케이스 시나리오

OPERATOR 사용자는 이벤트와 리워드를 생성하고 관리하는 운영자 역할을 수행합니다. 다음 시나리오는 OPERATOR 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 운영자 로그인 및 계정 정보 조회

### 1.1. 운영자 로그인

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

## 2. 이벤트 관리

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
GET /events?status=ACTIVE
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

CursorPaginationResponseDto<EventResponseDto>
```

### 2.3. 특정 이벤트 상세 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a254
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
PATCH /events/645f2d1b8c5cd2f948e9a254
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

## 3. 리워드 관리

### 3.1. 리워드 생성

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

### 3.2. 쿠폰 리워드 생성

**요청:**

```http
POST /rewards/COUPON
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

### 3.3. 리워드 목록 조회

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

### 3.4. 특정 리워드 조회

**요청:**

```http
GET /rewards/645f2d1b8c5cd2f948e9a255
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

RewardResponseDto
```

### 3.5. 이벤트에 리워드 추가

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

AddRewardToEventDto
```

**응답:**

```http
HTTP/1.1 204 No Content
```

### 3.6. 이벤트의 리워드 목록 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

RewardResponseDto[]
```

### 3.7. 이벤트의 리워드 업데이트

**요청:**

```http
PATCH /events/645f2d1b8c5cd2f948e9a254/rewards/645f2d1b8c5cd2f948e9a255
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

### 3.8. 이벤트에서 리워드 제거

**요청:**

```http
DELETE /events/645f2d1b8c5cd2f948e9a254/rewards/645f2d1b8c5cd2f948e9a255
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```http
HTTP/1.1 204 No Content
```

## 4. 리워드 요청 관리

### 4.1. 리워드 요청 목록 조회

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

### 4.2. 상태별 리워드 요청 조회

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

### 4.3. 특정 리워드 요청 조회

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

### 4.4. 리워드 요청 상태 업데이트

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

## 5. 미인증 요청 시나리오

### 5.1. 토큰 없이 이벤트 생성 시도

**요청:**

```http
POST /events
Content-Type: application/json

CreateEventDto
```

**응답:**

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

ErrorResponseDto
```

### 5.2. 권한이 없는 사용자로 리워드 생성 시도

**요청:**

```http
POST /rewards/COUPON
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

### 5.3. 모든 리워드 조회

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

## 6. 엣지 케이스 시나리오

### 6.1. 잘못된 날짜 형식으로 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateEventDto (with invalid date format)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 6.2. 종료일이 시작일보다 앞서는 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateEventDto (with end date before start date)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 6.3. 필수 필드가 누락된 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateEventDto (with missing required fields)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 6.4. 존재하지 않는 리워드 타입으로 생성 시도

**요청:**

```http
POST /rewards/UNKNOWN_TYPE
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateRewardDto
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 6.5. 음수 포인트로 포인트 리워드 생성 시도

**요청:**

```http
POST /rewards/POINT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateRewardDto (with negative points)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 6.6. 이미 만료된 날짜로 쿠폰 리워드 생성 시도

**요청:**

```http
POST /rewards/COUPON
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

CreateRewardDto (with expired date)
```

**응답:**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

ErrorResponseDto
```

### 6.7. 존재하지 않는 리워드를 이벤트에 추가 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

AddRewardToEventDto (with non-existent reward ID)
```

**응답:**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

ErrorResponseDto
```

### 6.8. 이미 추가된 리워드를 이벤트에 중복 추가 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

AddRewardToEventDto (with already added reward ID)
```

**응답:**

```http
HTTP/1.1 409 Conflict
Content-Type: application/json

ErrorResponseDto
```
