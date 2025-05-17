import { PinoLoggerService } from "../../src";

describe('PinoLoggerService', () => {
  let loggerService: PinoLoggerService;

  beforeEach(() => {
    loggerService = new PinoLoggerService({
      serviceName: 'test-service',
      prettyPrint: false,
      logLevel: 'info'
    });
  });

  it('should be defined', () => {
    expect(loggerService).toBeDefined();
  });

  it('should log messages with the correct level', () => {
    const infoSpy = jest.spyOn(loggerService['logger'], 'info');
    const errorSpy = jest.spyOn(loggerService['logger'], 'error');
    const warnSpy = jest.spyOn(loggerService['logger'], 'warn');
    const debugSpy = jest.spyOn(loggerService['logger'], 'debug');
    const traceSpy = jest.spyOn(loggerService['logger'], 'trace');

    loggerService.log('info message');
    loggerService.error('error message');
    loggerService.warn('warn message');
    loggerService.debug('debug message');
    loggerService.verbose('trace message');

    expect(infoSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();
    expect(traceSpy).toHaveBeenCalled();
  });

  it('should include context in logs', () => {
    const infoSpy = jest.spyOn(loggerService['logger'], 'info');
    
    const testContext = { 
      traceId: '123', 
      userId: '456' 
    };
    
    loggerService.log('test message', testContext);
    
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceId: 'test-service',
        traceId: '123',
        userId: '456'
      }),
      'test message'
    );
  });

  it('should set base context and include it in all logs', () => {
    const baseContext = { 
      traceId: 'trace-123', 
      spanId: 'span-456' 
    };
    
    loggerService.setContext(baseContext);
    
    const infoSpy = jest.spyOn(loggerService['logger'], 'info');
    
    loggerService.log('test message');
    
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceId: 'test-service',
        traceId: 'trace-123',
        spanId: 'span-456'
      }),
      'test message'
    );
  });

  it('should combine base context with provided context', () => {
    const baseContext = { 
      traceId: 'trace-123', 
      spanId: 'span-456' 
    };
    
    loggerService.setContext(baseContext);
    
    const infoSpy = jest.spyOn(loggerService['logger'], 'info');
    
    loggerService.log('test message', { userId: 'user-789' });
    
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceId: 'test-service',
        traceId: 'trace-123',
        spanId: 'span-456',
        userId: 'user-789'
      }),
      'test message'
    );
  });
}); 
