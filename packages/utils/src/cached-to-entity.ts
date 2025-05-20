import { CachedEntity } from '@libs/cache';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { toObjectId } from './to-object-id';

export function cachedToEntity<T>(constructor: ClassConstructor<T>, cachedEntity: CachedEntity<T>): T {
  const { id, _id, ...entity } = cachedEntity;

  return plainToInstance(constructor, {
    ...entity,
    _id: toObjectId(_id ?? id),
  });
}
