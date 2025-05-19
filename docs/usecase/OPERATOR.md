# OPERATOR 사용자 유스케이스 시나리오

OPERATOR 사용자는 이벤트와 리워드를 생성하고 관리하는 운영자 역할을 수행합니다. 다음 시나리오는 OPERATOR 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 운영자 로그인 및 계정 정보 조회

### 1.1. 운영자 로그인

**요청:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "operator@example.com",
  "password": "operator1234"
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
    "id": "645f2d1b8c5cd2f948e9a253",
    "email": "operator@example.com",
    "roles": ["OPERATOR"]
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

### 1.3. 자신의 계정 정보 조회

**요청:**

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a253",
  "email": "operator@example.com",
  "roles": ["OPERATOR"]
}
```

## 2. 이벤트 관리

### 2.1. 이벤트 생성

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
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
```

**응답:**

```json
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
```

### 2.2. 이벤트 목록 조회

**요청:**

```http
GET /events?status=ACTIVE
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

### 2.3. 특정 이벤트 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a254
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
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
```

## 3. 리워드 관리

### 3.1. 쿠폰 리워드 생성

**요청:**

```http
POST /rewards/COUPON
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "couponCode": "SUMMER2023",
  "expiry": "2023-09-30T23:59:59.999Z"
}
```

**응답:**

```json
{
  "id": "645f2d1b8c5cd2f948e9a255",
  "type": "COUPON",
  "couponCode": "SUMMER2023",
  "expiry": "2023-09-30T23:59:59.999Z"
}
```

### 3.2. 리워드 목록 조회

**요청:**

```http
GET /rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a251",
    "type": "POINT",
    "points": 1000
  },
  {
    "id": "645f2d1b8c5cd2f948e9a255",
    "type": "COUPON",
    "couponCode": "SUMMER2023",
    "expiry": "2023-09-30T23:59:59.999Z"
  }
]
```

### 3.3. 이벤트에 리워드 추가

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "rewardId": "645f2d1b8c5cd2f948e9a255"
}
```

**응답:**

```
204 No Content
```

### 3.4. 이벤트의 리워드 목록 조회

**요청:**

```http
GET /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**

```json
[
  {
    "id": "645f2d1b8c5cd2f948e9a255",
    "type": "COUPON",
    "couponCode": "SUMMER2023",
    "expiry": "2023-09-30T23:59:59.999Z"
  }
]
```

## 4. 미인증 요청 시나리오

### 4.1. 토큰 없이 이벤트 생성 시도

**요청:**

```http
POST /events
Content-Type: application/json

{
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
```

**응답:**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 4.2. 권한이 없는 사용자로 리워드 생성 시도

**요청:**

```http
POST /rewards/COUPON
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (USER 권한 토큰)
Content-Type: application/json

{
  "couponCode": "SUMMER2023",
  "expiry": "2023-09-30T23:59:59.999Z"
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

### 5.1. 잘못된 날짜 형식으로 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "잘못된 날짜 이벤트",
  "condition": {
    "newUser": true
  },
  "period": {
    "start": "2023-13-01T00:00:00.000Z",
    "end": "2023-05-31T23:59:59.999Z"
  },
  "status": "ACTIVE"
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Invalid date format for period.start",
  "error": "Bad Request"
}
```

### 5.2. 종료일이 시작일보다 앞서는 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "날짜 역전 이벤트",
  "condition": {
    "newUser": true
  },
  "period": {
    "start": "2023-05-31T00:00:00.000Z",
    "end": "2023-05-01T23:59:59.999Z"
  },
  "status": "ACTIVE"
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Event end date must be after start date",
  "error": "Bad Request"
}
```

### 5.3. 필수 필드가 누락된 이벤트 생성 시도

**요청:**

```http
POST /events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "필드 누락 이벤트",
  "condition": {
    "newUser": true
  }
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "period is required, status is required",
  "error": "Bad Request"
}
```

### 5.4. 존재하지 않는 리워드 타입으로 생성 시도

**요청:**

```http
POST /rewards/UNKNOWN_TYPE
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "points": 1000
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Invalid reward type: UNKNOWN_TYPE",
  "error": "Bad Request"
}
```

### 5.5. 음수 포인트로 포인트 리워드 생성 시도

**요청:**

```http
POST /rewards/POINT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "points": -1000
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "points must be a positive number",
  "error": "Bad Request"
}
```

### 5.6. 이미 만료된 날짜로 쿠폰 리워드 생성 시도

**요청:**

```http
POST /rewards/COUPON
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "couponCode": "EXPIRED2020",
  "expiry": "2020-12-31T23:59:59.999Z"
}
```

**응답:**

```json
{
  "statusCode": 400,
  "message": "Coupon expiry date cannot be in the past",
  "error": "Bad Request"
}
```

### 5.7. 존재하지 않는 리워드를 이벤트에 추가 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "rewardId": "645f2d1b8c5cd2f948e9a999"
}
```

**응답:**

```json
{
  "statusCode": 404,
  "message": "Reward with ID 645f2d1b8c5cd2f948e9a999 not found",
  "error": "Not Found"
}
```

### 5.8. 이미 추가된 리워드를 이벤트에 중복 추가 시도

**요청:**

```http
POST /events/645f2d1b8c5cd2f948e9a254/rewards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "rewardId": "645f2d1b8c5cd2f948e9a255"
}
```

**응답:**

```json
{
  "statusCode": 409,
  "message": "Reward is already associated with this event",
  "error": "Conflict"
}
```
