import { TokenStatus } from '@libs/enums';
import {
  Entity,
  PrimaryKey,
  Property,
  SerializedPrimaryKey,
} from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity()
export class UserToken {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  userId!: ObjectId;

  @Property()
  refreshToken!: string;

  @Property()
  status!: TokenStatus;

  @Property({ nullable: true, default: null })
  revokedAt?: Date;

  @Property()
  expiresAt!: Date;

  @Property()
  createdAt: Date = new Date();
}
