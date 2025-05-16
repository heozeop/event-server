// Use our own isObject function to avoid potential deprecation issues
function isObjectType(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface SensitiveDataOptions {
  maskValue?: string;
  sensitiveKeys?: string[];
  sensitivePatterns?: RegExp[];
  objectPaths?: string[];
}

export class SensitiveDataFilter {
  private readonly maskValue: string;
  private readonly sensitiveKeys: string[];
  private readonly sensitivePatterns: RegExp[];
  private readonly objectPaths: string[];
  
  constructor(options: SensitiveDataOptions = {}) {
    this.maskValue = options.maskValue || '[REDACTED]';
    this.sensitiveKeys = options.sensitiveKeys || [
      'password', 'token', 'secret', 'credential', 'apikey', 'api_key', 
      'key', 'auth', 'authorization', 'jwt', 'access_token', 'refresh_token',
      'accessToken', 'refreshToken'
    ];
    
    this.sensitivePatterns = options.sensitivePatterns || [
      // Email pattern
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      
      // Phone number pattern (basic)
      /(\+\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      
      // Credit card pattern
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      
      // Social security number (US format)
      /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g
    ];
    
    this.objectPaths = options.objectPaths || [
      'req.body.password',
      'req.body.accessToken',
      'req.body.refreshToken',
      'req.headers.authorization',
      'req.headers.cookie',
      'user.password',
      'payload.token',
      'payload.accessToken',
      'payload.refreshToken',
      'payload.password',
      'data.credentials',
      'data.token',
      'data.accessToken',
      'data.refreshToken',
      'data.password',
      'data.credentials',
      'data.token',
    ];
  }
  
  /**
   * Mask sensitive data in the given object or string
   * @param data The data to mask sensitive information from
   * @returns The masked data
   */
  public mask(data: any): any {
    if (typeof data === 'string') {
      return this.maskString(data);
    }
    
    if (isObjectType(data)) {
      return this.maskObject(data);
    }
    
    return data;
  }
  
  /**
   * Mask sensitive information in a string based on defined patterns
   * @param str The string to process
   * @returns Masked string
   */
  private maskString(str: string): string {
    let result = str;
    
    for (const pattern of this.sensitivePatterns) {
      result = result.replace(pattern, this.maskValue);
    }
    
    return result;
  }
  
  /**
   * Recursively mask sensitive information in an object
   * @param obj The object to process
   * @param path Current path in the object (for path-based masking)
   * @returns Masked object
   */
  private maskObject(obj: Record<string, any>, path: string = ''): Record<string, any> {
    const result = { ...obj };
    
    for (const key in result) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if the current key is sensitive
      if (this.sensitiveKeys.some(k => k.toLowerCase() === key.toLowerCase())) {
        result[key] = this.maskValue;
        continue;
      }
      
      // Check if the current path matches a sensitive path
      if (this.objectPaths.some(p => p === currentPath)) {
        result[key] = this.maskValue;
        continue;
      }
      
      // Recursively process nested objects
      if (result[key] !== null && typeof result[key] === 'object') {
        result[key] = this.maskObject(result[key], currentPath);
        continue;
      }
      
      // Mask sensitive patterns in strings
      if (typeof result[key] === 'string') {
        result[key] = this.maskString(result[key]);
      }
    }
    
    return result;
  }
} 
