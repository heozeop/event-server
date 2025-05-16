import { SensitiveDataFilter } from '../../src/filters';

describe('SensitiveDataFilter', () => {
  let filter: SensitiveDataFilter;

  beforeEach(() => {
    filter = new SensitiveDataFilter();
  });

  describe('mask', () => {
    it('should mask sensitive keys in objects', () => {
      const inputObject = {
        username: 'testuser',
        password: 'secret123',
        data: { token: 'eyJhbGciOiJIUzI1NiJ9.e30.ZRrHA1JJJW8opsbCGfG_HACGpVUMN_a9IV7pAx_Zmeo' }
      };

      const result = filter.mask(inputObject);

      expect(result.username).toBe('testuser');
      expect(result.password).toBe('[REDACTED]');
      expect(result.data.token).toBe('[REDACTED]');
    });

    it('should mask sensitive patterns in strings', () => {
      const inputString = 'User email is user@example.com and credit card is 4111-1111-1111-1111';
      const result = filter.mask(inputString);

      expect(result).not.toContain('user@example.com');
      expect(result).not.toContain('4111-1111-1111-1111');
      expect(result).toContain('[REDACTED]');
    });

    it('should mask sensitive data in nested objects', () => {
      const inputObject = {
        user: {
          profile: {
            email: 'test@example.com',
            phone: '+1-555-123-4567',
            address: '123 Main St'
          },
          credentials: {
            password: 'secret123',
            apiKey: 'abcd1234'
          }
        },
        message: 'Email me at another@example.com'
      };

      const result = filter.mask(inputObject);

      expect(result.user.profile.email).toBe('[REDACTED]');
      expect(result.user.profile.phone).toBe('[REDACTED]');
      expect(result.user.profile.address).toBe('123 Main St');
      expect(result.user.credentials.password).toBe('[REDACTED]');
      expect(result.user.credentials.apiKey).toBe('[REDACTED]');
      expect(result.message).not.toContain('another@example.com');
    });

    it('should mask based on object paths', () => {
      const inputObject = {
        req: {
          body: {
            username: 'testuser',
            password: 'secret123',
            normalData: 'this is fine'
          },
          headers: {
            authorization: 'Bearer token123',
            'content-type': 'application/json'
          }
        }
      };

      const result = filter.mask(inputObject);

      expect(result.req.body.username).toBe('testuser');
      expect(result.req.body.password).toBe('[REDACTED]');
      expect(result.req.body.normalData).toBe('this is fine');
      expect(result.req.headers.authorization).toBe('[REDACTED]');
      expect(result.req.headers['content-type']).toBe('application/json');
    });

    it('should use custom mask value when provided', () => {
      const customFilter = new SensitiveDataFilter({ maskValue: '***' });
      const inputObject = { password: 'secret123' };

      const result = customFilter.mask(inputObject);

      expect(result.password).toBe('***');
    });

    it('should use custom sensitive keys when provided', () => {
      const customFilter = new SensitiveDataFilter({ 
        sensitiveKeys: ['secret_field', 'hidden']
      });
      
      const inputObject = { 
        password: 'password123', // Should not be masked with custom keys
        secret_field: 'secret123',
        hidden: 'hidden456'
      };

      const result = customFilter.mask(inputObject);

      expect(result.password).toBe('password123'); // Not masked
      expect(result.secret_field).toBe('[REDACTED]');
      expect(result.hidden).toBe('[REDACTED]');
    });

    it('should return non-object/non-string values as-is', () => {
      expect(filter.mask(123)).toBe(123);
      expect(filter.mask(true)).toBe(true);
      expect(filter.mask(null)).toBe(null);
      expect(filter.mask(undefined)).toBe(undefined);
    });
  });
}); 
