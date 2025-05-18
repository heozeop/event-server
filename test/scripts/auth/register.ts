import { check } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';
import { v4 as uuidv4 } from 'uuid';

import { UserResponseDto } from '@libs/dtos';
import { baseUrl, defaultHeaders } from '../common/helpers';

export const options: Options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    'http_req_duration{name:register}': ['p(95)<800'],
  },
};

export default function() {
  const uuid = uuidv4();
  const email = `user_${uuid}@example.com`;
  
  const payload = JSON.stringify({
    email,
    password: 'Password123!',
    name: `Test User ${uuid}`,
  });
  
  const res = http.post(`${baseUrl}/auth/register`, payload, {
    headers: defaultHeaders,
    tags: { name: 'register' },
  });
  
  check(res, {
    'register status is 201': (r) => r.status === 201,
    'has user id': (r) => (r.json() as UserResponseDto).id !== undefined,
  });
} 
