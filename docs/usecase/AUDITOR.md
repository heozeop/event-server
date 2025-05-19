# AUDITOR 사용자 유스케이스 시나리오

AUDITOR 사용자는 이벤트 및 리워드 요청을 감사하고 모니터링하는 역할을 수행합니다. 다음 시나리오는 AUDITOR 사용자가 수행할 수 있는 주요 작업들을 설명합니다.

## 1. 감사자 로그인 및 계정 정보 조회

### 1.1. 감사자 로그인

**요청:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "auditor@example.com",
  "password": "auditor1234"
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
    "id": "645f2d1b8c5cd2f948e9a256",
    "email": "auditor@example.com",
    "roles": ["AUDITOR"]
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
  "id": "645f2d1b8c5cd2f948e9a256",
  "email": "auditor@example.com",
  "roles": ["AUDITOR"]
}
```

## 2. 이벤트 모니터링

### 2.1. 모든 이벤트 조회

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

## 3. 리워드 요청 감사

### 3.1. 모든 리워드 요청 조회

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
  },
  {
    "id": "645f2d1b8c5cd2f948e9a258",
    "userId": "645f2d1b8c5cd2f948e9a260",
    "eventId": "645f2d1b8c5cd2f948e9a254",
    "status": "APPROVED",
    "createdAt": "2023-07-15T09:45:00.000Z"
  }
]
```

### 3.2. 상태별 리워드 요청 조회

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

### 3.3. 특정 이벤트의 리워드 요청 조회

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

### 3.4. 특정 사용자의 리워드 요청 조회

**요청:**
```http
GET /events/requests?userId=645f2d1b8c5cd2f948e9a249
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

### 4.1. 토큰 없이 리워드 요청 목록 조회 시도

**요청:**
```http
GET /events/requests
```

**응답:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 4.2. 권한이 없는 사용자로 리워드 요청 감사 시도

**요청:**
```http
GET /events/requests?status=PENDING
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (OPERATOR 권한 토큰)
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

### 5.1. 존재하지 않는 이벤트에 대한 상세 조회 시도

**요청:**
```http
GET /events/645f2d1b8c5cd2f948e9a999
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

### 5.2. 존재하지 않는 이벤트의 리워드 목록 조회 시도

**요청:**
```http
GET /events/645f2d1b8c5cd2f948e9a999/rewards
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

### 5.3. 유효하지 않은 상태값으로 리워드 요청 조회 시도

**요청:**
```http
GET /events/requests?status=INVALID_STATUS
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**
```json
{
  "statusCode": 400,
  "message": "Invalid status value: INVALID_STATUS. Allowed values are PENDING, APPROVED, REJECTED",
  "error": "Bad Request"
}
```

### 5.4. 존재하지 않는 사용자의 리워드 요청 조회 시도

**요청:**
```http
GET /events/requests?userId=645f2d1b8c5cd2f948e9a999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**
```json
{
  "data": []
}
```

### 5.5. 잘못된 형식의 Object ID 사용 시도

**요청:**
```http
GET /events/requests?eventId=invalid-object-id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**
```json
{
  "statusCode": 400,
  "message": "Invalid ObjectId format: invalid-object-id",
  "error": "Bad Request"
}
```

### 5.6. 너무 긴 날짜 범위로 리워드 요청 조회 시도

**요청:**
```http
GET /events/requests?startDate=2020-01-01T00:00:00.000Z&endDate=2025-12-31T23:59:59.999Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답:**
```json
{
  "statusCode": 400,
  "message": "Date range cannot exceed 1 year",
  "error": "Bad Request"
}
```

### 5.7. 권한 수정 시도 (AUDITOR에게는 허용되지 않음)

**요청:**
```http
PUT /auth/users/645f2d1b8c5cd2f948e9a249/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (AUDITOR 권한 토큰)
Content-Type: application/json

{
  "roles": ["USER", "OPERATOR"]
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
