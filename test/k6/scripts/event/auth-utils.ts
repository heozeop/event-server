import { LoginResponseDto } from '@libs/dtos';
import http from 'k6/http';
import { API_BASE_URL, TEST_PASSWORD } from 'prepare/constants';

/**
 * Authenticates a user with the given credentials and returns the JWT token
 * 
 * @param email User email
 * @param password User password
 * @returns JWT token string
 */
export function authenticate(email: string, password: string = TEST_PASSWORD): string {
  const payload = ({
    email,
    password
  });
  
  const response = http.post(
    `${API_BASE_URL}/auth/login`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (response.status !== 200) {
    throw new Error(`Authentication failed: ${response.status} - ${response.body}`);
  }
  
  const responseBody = response.json() as unknown as LoginResponseDto;
  
  // Handle different possible response structures
  if (responseBody.accessToken) {
    return responseBody.accessToken;
  }   

  throw new Error(`No token in response: ${response.body}`);
} 
