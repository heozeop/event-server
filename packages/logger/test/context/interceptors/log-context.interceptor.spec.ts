import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClsModule, ClsService } from 'nestjs-cls';
import { of } from 'rxjs';
import { LogContextInterceptor } from './log-context.interceptor';
import { RequestIdUtil } from './request-id.util';
import { RequestMetadataUtil } from './request-metadata.util';

jest.mock('./request-id.util');
jest.mock('./request-metadata.util');

describe('LogContextInterceptor', () => {
  let interceptor: LogContextInterceptor;
  let clsService: ClsService;

  // Use proper typing for Jest mocks
  const mockGetType = jest.fn();
  const mockSwitchToHttp = jest.fn();
  const mockSwitchToRpc = jest.fn();
  
  const mockExecutionContext = {
    getType: mockGetType,
    switchToHttp: mockSwitchToHttp,
    switchToRpc: mockSwitchToRpc
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(() => of('test result'))
  } as unknown as CallHandler;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true
          }
        })
      ],
      providers: [LogContextInterceptor]
    }).compile();

    clsService = moduleRef.get<ClsService>(ClsService);
    interceptor = moduleRef.get<LogContextInterceptor>(LogContextInterceptor);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should set log context for HTTP requests', () => {
    // Mock HTTP context
    const mockRequest = { user: { id: 'user-123' } };
    mockGetType.mockReturnValue('http');
    mockSwitchToHttp.mockReturnValue({
      getRequest: () => mockRequest
    });

    // Mock metadata extraction
    const httpMetadata = { requestId: 'req-123', path: '/test', method: 'GET' };
    const userMetadata = { userId: 'user-123' };
    jest.spyOn(RequestMetadataUtil, 'extractFromHttpRequest').mockReturnValue(httpMetadata);
    jest.spyOn(RequestMetadataUtil, 'extractUserContext').mockReturnValue(userMetadata);

    // Run the interceptor
    clsService.run(() => {
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      
      // Check if context was properly set
      expect(clsService.get('logContext')).toEqual({
        ...httpMetadata,
        ...userMetadata
      });
    });

    expect(mockCallHandler.handle).toHaveBeenCalled();
  });

  it('should set log context for RPC requests', () => {
    // Mock RPC context
    const mockRpcContext = {};
    mockGetType.mockReturnValue('rpc');
    mockSwitchToRpc.mockReturnValue({
      getContext: () => mockRpcContext
    });

    // Mock metadata extraction
    const rpcMetadata = { requestId: 'rpc-123' };
    jest.spyOn(RequestMetadataUtil, 'extractFromRpcContext').mockReturnValue(rpcMetadata);

    // Run the interceptor
    clsService.run(() => {
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      
      // Check if context was properly set
      expect(clsService.get('logContext')).toEqual(rpcMetadata);
    });

    expect(mockCallHandler.handle).toHaveBeenCalled();
  });

  it('should set log context for WebSocket/GraphQL', () => {
    // Mock WS context
    mockGetType.mockReturnValue('ws');
    
    // Mock request ID generation
    const mockRequestId = 'ws-123';
    jest.spyOn(RequestIdUtil, 'generateRequestId').mockReturnValue(mockRequestId);

    // Run the interceptor
    clsService.run(() => {
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      
      // Check if context was properly set
      expect(clsService.get('logContext')).toEqual({
        requestId: mockRequestId
      });
    });

    expect(mockCallHandler.handle).toHaveBeenCalled();
  });
}); 
