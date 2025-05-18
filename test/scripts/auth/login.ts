import { check } from 'k6';
import http from 'k6/http';
import { Options } from 'k6/options';

import { LoginResponseDto } from '@libs/dtos';
import { baseUrl, defaultHeaders, getRandomUser } from '../common/helpers';

export const options: Options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    'http_req_duration{name:login}': ['p(95)<300'],
  },
};

export default function() {
  const user = getRandomUser();
  
  const payload = JSON.stringify({
    email: user.email,
    password: user.passwordHash,
  });
  
  const res = http.post(`${baseUrl}/auth/login`, payload, {
    headers: defaultHeaders,
    tags: { name: 'login' },
  });
  
  check(res, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => (r.json() as unknown as LoginResponseDto).accessToken !== undefined,
  });
} 
