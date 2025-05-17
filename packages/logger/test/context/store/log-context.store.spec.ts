import { Test } from '@nestjs/testing';
import { ClsModule, ClsService } from 'nestjs-cls';
import { LogContextStore } from '../../../src/context/store/log-context.store';

describe('LogContextStore', () => {
  let contextStore: LogContextStore;
  let clsService: ClsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
            generateId: true,
          },
        }),
      ],
      providers: [LogContextStore],
    }).compile();

    clsService = moduleRef.get<ClsService>(ClsService);
    contextStore = moduleRef.get<LogContextStore>(LogContextStore);
  });

  it('should be defined', () => {
    expect(contextStore).toBeDefined();
  });

  it('should return empty object when no context is set', () => {
    clsService.run(() => {
      const context = contextStore.getContext();
      expect(context).toEqual({});
    });
  });

  it('should set and get requestId', () => {
    const testRequestId = 'test-request-id';
    
    clsService.run(() => {
      contextStore.setRequestId(testRequestId);
      expect(contextStore.getRequestId()).toBe(testRequestId);
    });
  });

  it('should set and get userId', () => {
    const testUserId = 'test-user-id';
    
    clsService.run(() => {
      contextStore.setUserId(testUserId);
      expect(contextStore.getUserId()).toBe(testUserId);
    });
  });

  it('should update context', () => {
    clsService.run(() => {
      contextStore.updateContext({ requestId: 'initial-request-id' });
      expect(contextStore.getRequestId()).toBe('initial-request-id');
      
      contextStore.updateContext({ requestId: 'updated-request-id' });
      expect(contextStore.getRequestId()).toBe('updated-request-id');
    });
  });

  it('should maintain context across async operations', async () => {
    await clsService.run(async () => {
      contextStore.updateContext({ requestId: 'async-request-id' });
      const requestId = contextStore.getRequestId();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(contextStore.getRequestId()).toBe(requestId);
    });
  });

  it('should run with provided context', () => {
    contextStore.run({ requestId: 'test-run-context' }, () => {
      expect(contextStore.getRequestId()).toBe('test-run-context');
    });
  });
}); 
