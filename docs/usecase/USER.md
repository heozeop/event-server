# USER 사용자 유스케이스 시나리오

USER 사용자는 일반 사용자로서 이벤트를 조회하고 리워드를 요청할 수 있습니다. 다음 시나리오는 USER 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 계정 관리

### 1.1. 계정 생성

**요청:**

```http
POST /auth/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user1234"
}
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a249",
  "email": "user@example.com",
  "roles": ["USER"]
}
```

### 1.2. 로그인

**요청:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "user1234"
}
```

**응답:**

```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "645f2d1b8c5cd2f948e9a249",
    "email": "user@example.com",
    "roles": ["USER"]
  }
}
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

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
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

{
  "statusCode": 401,
  "message": "Refresh token has expired",
  "error": "Unauthorized"
}
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

{
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized"
}
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

{
  "statusCode": 400,
  "message": "Refresh token is required",
  "error": "Bad Request"
}
```

### 1.4. 자신의 계정 정보 조회

**요청:**

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a249",
  "email": "user@example.com",
  "roles": ["USER"]
}
```

## 2. 이벤트 조회

### 2.1. 이벤트 목록 조회

**요청:**

```http
GET /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a250",
    "name": "신규 사용자 가입 이벤트",
    "condition": {
      "newUser": true
    },
    "period": {
      "start": "2023-05-01T00:00:00.000Z",
      "end": "2023-05-31T23:59:59.999Z"
    },
    "status": "ACTIVE"
  },
  {
    "id": "645f2d1b8c5cd2f948e9a254",
    "name": "여름 방학 특별 이벤트",
    "condition": {
      "minUserAge": 13,
      "maxUserAge": 19
    },
    "period": {
      "start": "2023-07-01T00:00:00.000Z",
      "end": "2023-08-31T23:59:59.999Z"
    },
    "status": "ACTIVE"
  }
]
```

### 2.2. 특정 이벤트 상세 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a250
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a250",
  "name": "신규 사용자 가입 이벤트",
  "condition": {
    "newUser": true
  },
  "period": {
    "start": "2023-05-01T00:00:00.000Z",
    "end": "2023-05-31T23:59:59.999Z"
  },
  "status": "ACTIVE"
}
```

### 2.3. 이벤트의 리워드 목록 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a250/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a251",
    "type": "POINT",
    "points": 1000
  }
]
```

## 3. 리워드 요청

### 3.1. 이벤트에 대한 리워드 요청

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a257",
  "userId": "645f2d1b8c5cd2f948e9a249",
  "eventId": "645f2d1b8c5cd2f948e9a250",
  "status": "PENDING",
  "createdAt": "2023-05-13T14:30:00.000Z"
}
```

### 3.2. 자신의 리워드 요청 목록 조회

**요청:**

```http
GET /events/requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a257",
    "userId": "645f2d1b8c5cd2f948e9a249",
    "eventId": "645f2d1b8c5cd2f948e9a250",
    "status": "PENDING",
    "createdAt": "2023-05-13T14:30:00.000Z"
  }
]
```

### 3.3. 상태별 리워드 요청 조회

**요청:**

```http
GET /events/requests?status=PENDING
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a257",
    "userId": "645f2d1b8c5cd2f948e9a249",
    "eventId": "645f2d1b8c5cd2f948e9a250",
    "status": "PENDING",
    "createdAt": "2023-05-13T14:30:00.000Z"
  }
]
```

### 3.4. 특정 이벤트의 리워드 요청 조회

**요청:**

```http
GET /events/requests?eventId=645f2d1b8c5cd2f948e9a250
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a257",
    "userId": "645f2d1b8c5cd2f948e9a249",
    "eventId": "645f2d1b8c5cd2f948e9a250",
    "status": "PENDING",
    "createdAt": "2023-05-13T14:30:00.000Z"
  }
]
```

## 4. 미인증 요청 시나리오

### 4.1. 토큰 없이 이벤트 목록 조회 시도

**요청:**

```http
GET /events
```

**응답:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 4.2. 토큰 없이 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/request
```

**응답:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 4.3. 접근 권한이 없는 API 호출 시도

**요청:**

```http
POST /rewards/POINT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (USER 권한 토큰)
Content-Type: application/json

{
  "points": 1000
}
```

**응답:**

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

## 5. 엣지 케이스 시나리오

### 5.1. 유효하지 않은 이메일 형식으로 계정 생성 시도

**요청:**

```http
POST /auth/users
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "user1234"
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request"
}
```

### 5.2. 너무 짧은 비밀번호로 계정 생성 시도

**요청:**

```http
POST /auth/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "123"
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Password must be at least 8 characters long",
  "error": "Bad Request"
}
```

### 5.3. 잘못된 인증 정보로 로그인 시도

**요청:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "wrongpassword"
}
```

**응답:**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 5.4. 존재하지 않는 이벤트에 대한 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a999/request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "statusCode": 404,
  "message": "Event with ID 645f2d1b8c5cd2f948e9a999 not found",
  "error": "Not Found"
}
```

### 5.5. 비활성화된 이벤트에 대한 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a280/request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Event is not active",
  "error": "Bad Request"
}
```

### 5.6. 이미 종료된 이벤트에 대한 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a281/request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Event period has ended",
  "error": "Bad Request"
}
```

### 5.7. 이미 리워드를 요청한 이벤트에 대한 중복 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "statusCode": 409,
  "message": "Reward already requested for this event",
  "error": "Conflict"
}
```

### 5.8. 이벤트 참여 조건을 충족하지 못한 리워드 요청 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a254/request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "statusCode": 403,
  "message": "User does not meet the event conditions",
  "error": "Forbidden"
}
```
