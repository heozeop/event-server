import { ObjectId } from '@mikro-orm/mongodb';
import { BadRequestException } from '@nestjs/common';

export function toObjectId(id?: string): ObjectId {
  if (!id) {
    throw new BadRequestException('Invalid user ID format');
  }

  try {
    return new ObjectId(id);
  } catch (error) {
    throw new BadRequestException('Invalid user ID format');
  }
}
