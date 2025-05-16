import { randomUUID } from 'crypto';

/**
 * Utility for managing request IDs across services
 */
export class RequestIdUtil {
  private static readonly REQUEST_ID_HEADER = 'X-Request-Id';
  
  /**
   * Generates a new UUID v4 request ID
   */
  static generateRequestId(): string {
    return randomUUID();
  }
  
  /**
   * Extracts request ID from HTTP request headers
   * @param headers HTTP request headers
   */
  static extractFromHttpHeaders(headers: Record<string, string | string[]>): string | undefined {
    // Try different case variations of the header name
    const headerNames = [
      this.REQUEST_ID_HEADER,
      this.REQUEST_ID_HEADER.toLowerCase(),
      this.REQUEST_ID_HEADER.toUpperCase()
    ];
    
    let headerValue: string | string[] | undefined;
    
    for (const name of headerNames) {
      if (headers[name]) {
        headerValue = headers[name];
        break;
      }
    }
    
    if (Array.isArray(headerValue)) {
      return headerValue[0];
    }
    
    return headerValue;
  }
  
  /**
   * Injects request ID into HTTP headers for outgoing requests
   * @param headers HTTP headers object to modify
   * @param requestId Request ID to inject
   */
  static injectToHttpHeaders(
    headers: Record<string, string | string[]>, 
    requestId: string
  ): Record<string, string | string[]> {
    return {
      ...headers,
      [this.REQUEST_ID_HEADER]: requestId,
    };
  }
  
  /**
   * Prepares metadata for gRPC/message queue propagation
   * @param requestId Request ID to propagate
   */
  static prepareMetadataForMessaging(requestId: string): Record<string, string> {
    return {
      [this.REQUEST_ID_HEADER]: requestId,
    };
  }
  
  /**
   * Extracts request ID from messaging metadata
   * @param metadata Metadata from messaging system
   */
  static extractFromMessagingMetadata(metadata: Record<string, any>): string | undefined {
    // Try different case variations of the header name
    const headerNames = [
      this.REQUEST_ID_HEADER,
      this.REQUEST_ID_HEADER.toLowerCase(),
      this.REQUEST_ID_HEADER.toUpperCase()
    ];
    
    for (const name of headerNames) {
      if (metadata[name] !== undefined) {
        return metadata[name];
      }
    }
    
    return undefined;
  }
} 
