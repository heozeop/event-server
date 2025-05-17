import { RequestIdUtil } from '../../../src/context/utils/request-id.util';

describe('RequestIdUtil', () => {
  it('should generate a UUID v4 request ID', () => {
    const requestId = RequestIdUtil.generateRequestId();
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should extract request ID from HTTP headers', () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    const headers = {
      'x-request-id': requestId
    };
    
    const extractedId = RequestIdUtil.extractFromHttpHeaders(headers);
    expect(extractedId).toBe(requestId);
  });

  it('should handle array of header values', () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    const headers = {
      'x-request-id': [requestId, 'another-id']
    };
    
    const extractedId = RequestIdUtil.extractFromHttpHeaders(headers);
    expect(extractedId).toBe(requestId);
  });

  it('should be case insensitive for header names', () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    // This uses a different case than the constant in the class
    const headers = {
      'X-REQUEST-ID': requestId
    };
    
    const extractedId = RequestIdUtil.extractFromHttpHeaders(headers);
    expect(extractedId).toBe(requestId);
  });

  it('should inject request ID into HTTP headers', () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    const headers = {
      'content-type': 'application/json'
    };
    
    const updatedHeaders = RequestIdUtil.injectToHttpHeaders(headers, requestId);
    expect(updatedHeaders['X-Request-Id']).toBe(requestId);
    expect(updatedHeaders['content-type']).toBe('application/json');
  });

  it('should prepare metadata for messaging systems', () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    const metadata = RequestIdUtil.prepareMetadataForMessaging(requestId);
    
    expect(metadata['X-Request-Id']).toBe(requestId);
  });

  it('should extract request ID from messaging metadata', () => {
    const requestId = '123e4567-e89b-12d3-a456-426614174000';
    const metadata = {
      'X-Request-Id': requestId,
      'some-other-key': 'some-value'
    };
    
    const extractedId = RequestIdUtil.extractFromMessagingMetadata(metadata);
    expect(extractedId).toBe(requestId);
  });
}); 
