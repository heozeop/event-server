import { CachedEntity } from '@libs/cache';
import { toObjectId } from './to-object-id';

export function toEntity<T>(cachedEntity: CachedEntity<T>): T {
  const { id, _id, ...entity } = cachedEntity;

  return {
    ...entity,
    _id: toObjectId(_id ?? id),
  } as T;
}
