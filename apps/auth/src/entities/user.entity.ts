import { Role } from '@libs/enums';
import { UserEntity } from '@libs/types';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

@Entity()
export class User implements UserEntity {
  @PrimaryKey()
  _id!: ObjectId;

  @Property({ unique: true })
  email!: string;

  @Property()
  passwordHash!: string;

  @Property()
  roles: Role[] = [Role.USER];

  @Property()
  createdAt: Date = new Date();

  @Property()
  updatedAt: Date = new Date();

  get id(): string {
    return this._id.toString();
  }
}
