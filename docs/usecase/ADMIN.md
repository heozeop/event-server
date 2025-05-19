# ADMIN 사용자 유스케이스 시나리오

ADMIN 사용자는 시스템 관리자로서 전체 시스템에 대한 관리 권한을 가지고 있습니다. 다음 시나리오는 ADMIN 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 관리자 로그인 및 사용자 관리

### 1.1. 관리자 로그인

**요청:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin1234"
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
    "id": "645f2d1b8c5cd2f948e9a248",
    "email": "admin@example.com",
    "roles": ["ADMIN"]
  }
}
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

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
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

{
  "statusCode": 401,
  "message": "Refresh token has expired",
  "error": "Unauthorized"
}
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

{
  "statusCode": 401,
  "message": "Invalid refresh token",
  "error": "Unauthorized"
}
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

{
  "statusCode": 400,
  "message": "Refresh token is required",
  "error": "Bad Request"
}
```

### 1.3. 사용자 이메일로 조회

**요청:**

```http
GET /auth/users/email?email=user@example.com
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

### 1.4. 사용자 ID로 조회

**요청:**

```http
GET /auth/users/645f2d1b8c5cd2f948e9a249
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

### 1.5. 사용자 역할 업데이트

**요청:**

```http
PATCH /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roles": ["USER", "OPERATOR"]
}
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a249",
  "email": "user@example.com",
  "roles": ["USER", "OPERATOR"]
}
```

## 2. 이벤트 및 리워드 관리

### 2.1. 이벤트 생성

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
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

### 2.2. 포인트 리워드 생성

**요청:**

```http
POST /rewards/POINT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "points": 1000
}
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a251",
  "type": "POINT",
  "points": 1000
}
```

### 2.3. 이벤트에 리워드 추가

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a250/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "rewardId": "645f2d1b8c5cd2f948e9a251"
}
```

**응답:**

```
204 No Content
```

### 2.4. 이벤트 리워드 요청 조회

**요청:**

```http
GET /events/requests?status=PENDING
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a252",
    "userId": "645f2d1b8c5cd2f948e9a249",
    "eventId": "645f2d1b8c5cd2f948e9a250",
    "status": "PENDING",
    "createdAt": "2023-05-13T14:30:00.000Z"
  }
]
```

### 2.5. 이벤트 목록 조회

**요청:**

```http
GET /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "items": [
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
  ],
  "total": 2,
  "hasMore": false
}
```

## 3. 미인증 요청 시나리오

### 3.1. 토큰 없이 사용자 목록 조회 시도

**요청:**

```http
GET /auth/users/email?email=user@example.com
```

**응답:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 3.2. 관리자가 아닌 사용자로 역할 업데이트 시도

**요청:**

```http
PUT /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (USER 권한 토큰)
Content-Type: application/json

{
  "roles": ["USER", "ADMIN"]
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

## 4. 엣지 케이스 시나리오

### 4.1. 존재하지 않는 사용자 ID로 조회 시도

**요청:**

```http
GET /auth/users/645f2d1b8c5cd2f948e9a999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "statusCode": 404,
  "message": "User with ID 645f2d1b8c5cd2f948e9a999 not found",
  "error": "Not Found"
}
```

### 4.2. 중복된 이메일로 사용자 생성 시도

**요청:**

```http
POST /auth/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "newpassword123"
}
```

**응답:**

```json
{
  "statusCode": 409,
  "message": "User with email admin@example.com already exists",
  "error": "Conflict"
}
```

### 4.3. 유효하지 않은 역할로 사용자 역할 업데이트 시도

**요청:**

```http
PUT /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roles": ["USER", "INVALID_ROLE"]
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Invalid role: INVALID_ROLE",
  "error": "Bad Request"
}
```

### 4.4. 과거 날짜로 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "과거 이벤트",
  "condition": {
    "newUser": true
  },
  "period": {
    "start": "2020-01-01T00:00:00.000Z",
    "end": "2020-01-31T23:59:59.999Z"
  },
  "status": "ACTIVE"
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Event start date cannot be in the past",
  "error": "Bad Request"
}
```

### 4.5. 존재하지 않는 이벤트에 리워드 추가 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a999/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "rewardId": "645f2d1b8c5cd2f948e9a251"
}
```

**응답:**

```json
{
  "statusCode": 404,
  "message": "Event with ID 645f2d1b8c5cd2f948e9a999 not found",
  "error": "Not Found"
}
```

### 4.6. 잘못된 형식의 토큰으로 인증 시도

**요청:**

```http
GET /auth/me
Authorization: Bearer invalid.token.format
```

**응답:**

```json
{
  "statusCode": 401,
  "message": "Invalid token format",
  "error": "Unauthorized"
}
```

### 4.7. 만료된 토큰으로 인증 시도

**요청:**

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**응답:**

```json
{
  "statusCode": 401,
  "message": "Token expired",
  "error": "Unauthorized"
}
```

### 4.8. 모든 리워드 조회

**요청:**

```http
GET /rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "rewards": [
    {
      "id": "645f2d1b8c5cd2f948e9a251",
      "type": "POINT",
      "details": {
        "amount": 1000,
        "expiryDate": "2023-12-31T23:59:59.999Z"
      }
    },
    {
      "id": "645f2d1b8c5cd2f948e9a252",
      "type": "COUPON",
      "details": {
        "code": "SUMMER2023",
        "discountPercent": 10,
        "expiryDate": "2023-08-31T23:59:59.999Z"
      }
    }
  ],
  "total": 2
}
```

### 4.9. 모든 리워드 요청 조회

**요청:**

```http
GET /events/requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "requests": [
    {
      "id": "645f2d1b8c5cd2f948e9a257",
      "userId": "645f2d1b8c5cd2f948e9a249",
      "eventId": "645f2d1b8c5cd2f948e9a250",
      "status": "PENDING",
      "createdAt": "2023-05-13T14:30:00.000Z",
      "updatedAt": "2023-05-13T14:30:00.000Z"
    },
    {
      "id": "645f2d1b8c5cd2f948e9a258",
      "userId": "645f2d1b8c5cd2f948e9a249",
      "eventId": "645f2d1b8c5cd2f948e9a254",
      "status": "APPROVED",
      "createdAt": "2023-05-13T15:00:00.000Z",
      "updatedAt": "2023-05-13T15:10:00.000Z"
    }
  ],
  "total": 2
}
```

### 4.10. 리워드 요청 상태 업데이트

**요청:**

```http
PATCH /events/requests/645f2d1b8c5cd2f948e9a257
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "APPROVED"
}
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a257",
  "userId": "645f2d1b8c5cd2f948e9a249",
  "eventId": "645f2d1b8c5cd2f948e9a250",
  "status": "APPROVED",
  "createdAt": "2023-05-13T14:30:00.000Z",
  "updatedAt": "2023-05-13T16:15:00.000Z"
}
```
