import { NestLoggerAdapter } from './nest-logger.adapter';
import { PinoLoggerService } from './pino-logger.service';

describe('NestLoggerAdapter', () => {
  let nestLogger: NestLoggerAdapter;
  let pinoLogger: PinoLoggerService;

  beforeEach(() => {
    pinoLogger = new PinoLoggerService({
      serviceName: 'test-service',
      prettyPrint: false,
      logLevel: 'info'
    });
    
    nestLogger = new NestLoggerAdapter(pinoLogger);
  });

  it('should be defined', () => {
    expect(nestLogger).toBeDefined();
  });

  it('should correctly delegate log method calls to Pino logger', () => {
    const logSpy = jest.spyOn(pinoLogger, 'log');
    
    nestLogger.log('test message');
    
    expect(logSpy).toHaveBeenCalledWith('test message', {});
  });

  it('should include context in logs when provided', () => {
    const logSpy = jest.spyOn(pinoLogger, 'log');
    
    nestLogger.log('test message', 'TestContext');
    
    expect(logSpy).toHaveBeenCalledWith('test message', { context: 'TestContext' });
  });

  it('should include context in logs when set via setContext', () => {
    const logSpy = jest.spyOn(pinoLogger, 'log');
    
    nestLogger.setContext('TestContext');
    nestLogger.log('test message');
    
    expect(logSpy).toHaveBeenCalledWith('test message', { context: 'TestContext' });
  });

  it('should correctly delegate error method calls to Pino logger', () => {
    const errorSpy = jest.spyOn(pinoLogger, 'error');
    
    nestLogger.error('test error', 'test trace');
    
    expect(errorSpy).toHaveBeenCalledWith('test error', 'test trace', {});
  });

  it('should correctly handle error objects', () => {
    const errorSpy = jest.spyOn(pinoLogger, 'error');
    const error = new Error('test error');
    
    nestLogger.error(error);
    
    expect(errorSpy).toHaveBeenCalledWith('test error', error.stack, {});
  });

  it('should correctly delegate warn method calls to Pino logger', () => {
    const warnSpy = jest.spyOn(pinoLogger, 'warn');
    
    nestLogger.warn('test warning');
    
    expect(warnSpy).toHaveBeenCalledWith('test warning', {});
  });

  it('should correctly delegate debug method calls to Pino logger', () => {
    const debugSpy = jest.spyOn(pinoLogger, 'debug');
    
    nestLogger.debug('test debug');
    
    expect(debugSpy).toHaveBeenCalledWith('test debug', {});
  });

  it('should correctly delegate verbose method calls to Pino logger', () => {
    const verboseSpy = jest.spyOn(pinoLogger, 'verbose');
    
    nestLogger.verbose('test verbose');
    
    expect(verboseSpy).toHaveBeenCalledWith('test verbose', {});
  });
}); 
