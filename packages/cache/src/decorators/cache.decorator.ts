import { CacheService } from '../cache.service';

export interface CacheOptions {
  keyPrefix?: string;
  ttl?: number;
  keyGenerator?: (target: any, methodName: string, args: any[]) => string;
}

/**
 * Decorator to cache the result of a method
 * @param options - Cache options
 */
export function Cached(options?: CacheOptions) {
  const defaultOptions: CacheOptions = {
    keyPrefix: '',
    ttl: 3600,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return function (
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (this: any, ...args: any[]) {
      const cacheService = this.cacheService as CacheService;
      
      if (!cacheService) {
        console.warn('CacheService not found in the class instance. Make sure it is injected as "cacheService".');
        return originalMethod.apply(this, args);
      }
      
      let cacheKey: string;
      if (config.keyGenerator) {
        cacheKey = config.keyGenerator(target, methodName, args);
      } else {
        // Default key generation based on method name and serialized arguments
        cacheKey = `${config.keyPrefix}${methodName}:${JSON.stringify(args)}`;
      }
      
      const cachedValue = await cacheService.get(cacheKey);
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      const result = await originalMethod.apply(this, args);
      await cacheService.set(cacheKey, result, config.ttl);
      
      return result;
    };
    
    return descriptor;
  };
} 
