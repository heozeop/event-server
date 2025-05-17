import { PinoLoggerService } from '../../src/services';

// Create a mock for pino
jest.mock('pino', () => {
  const mockLoggerInstance = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  };
  
  const mockPino = jest.fn().mockReturnValue(mockLoggerInstance);
  
  return { 
    pino: mockPino,
    stdTimeFunctions: {
      isoTime: jest.fn()
    }
  };
});

describe('PinoLoggerService with sensitive data filtering', () => {
  let logger: PinoLoggerService;
  let mockPinoLogger: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    logger = new PinoLoggerService({
      serviceName: 'test-service',
      sensitiveDataOptions: {
        enabled: true
      }
    });
    
    // Access the mocked pino logger
    mockPinoLogger = (logger as any).logger;
  });

  it('should mask sensitive data in log context', () => {
    const sensitiveContext = {
      userId: '12345',
      password: 'secret123',
      email: 'user@example.com',
      data: {
        token: 'eyJhbGciOiJIUzI1NiJ9'
      }
    };

    logger.log('This is a test log', sensitiveContext);

    expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
    
    // Check that the first argument to info (the context) has masked values
    const contextArg = mockPinoLogger.info.mock.calls[0][0];
    expect(contextArg.userId).toBe('12345');
    expect(contextArg.password).toBe('[REDACTED]');
    expect(contextArg.email).toBe('[REDACTED]');
    expect(contextArg.data.token).toBe('[REDACTED]');
  });

  it('should mask sensitive data in log message', () => {
    const sensitiveMessage = 'Email: user@example.com, CC: 4111-1111-1111-1111';
    
    logger.log(sensitiveMessage);

    expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
    
    // Check that the second argument to info (the message) has masked values
    const messageArg = mockPinoLogger.info.mock.calls[0][1];
    expect(messageArg).not.toContain('user@example.com');
    expect(messageArg).not.toContain('4111-1111-1111-1111');
    expect(messageArg).toContain('[REDACTED]');
  });

  it('should mask sensitive data in error stack trace', () => {
    const errorTrace = 'Error: Failed to process user@example.com\n' +
      'at Object.<anonymous> (/path/to/file.js:10:20)\n' +
      'with password: secret123';

    logger.error('Error processing user data', errorTrace);

    expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
    
    // Check that the stack trace in the context is masked
    const contextArg = mockPinoLogger.error.mock.calls[0][0];
    expect(contextArg.stack).not.toContain('user@example.com');
    expect(contextArg.stack).toContain('[REDACTED]');
  });

  it('should respect custom configuration options', () => {
    const customLogger = new PinoLoggerService({
      serviceName: 'test-service',
      sensitiveDataOptions: {
        enabled: true,
        maskValue: '***HIDDEN***',
        sensitiveKeys: ['customSecret']
      }
    });
    
    // Access the mocked pino logger
    const customMockLogger = (customLogger as any).logger;

    customLogger.log('Testing custom config', {
      normalField: 'visible',
      customSecret: 'hidden-value'
    });

    expect(customMockLogger.info).toHaveBeenCalledTimes(1);
    
    const contextArg = customMockLogger.info.mock.calls[0][0];
    expect(contextArg.normalField).toBe('visible');
    expect(contextArg.customSecret).toBe('***HIDDEN***');
  });

  it('should not filter data when filtering is disabled', () => {
    const noFilterLogger = new PinoLoggerService({
      serviceName: 'test-service',
      sensitiveDataOptions: {
        enabled: false
      }
    });
    
    // Access the mocked pino logger
    const noFilterMockLogger = (noFilterLogger as any).logger;

    noFilterLogger.log('Email: user@example.com', {
      password: 'secret123'
    });

    expect(noFilterMockLogger.info).toHaveBeenCalledTimes(1);
    
    const messageArg = noFilterMockLogger.info.mock.calls[0][1];
    const contextArg = noFilterMockLogger.info.mock.calls[0][0];
    
    expect(messageArg).toContain('user@example.com');
    expect(contextArg.password).toBe('secret123');
  });
}); 
