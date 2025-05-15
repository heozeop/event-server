import { Role } from '@libs/enums';
import { ObjectId } from '@mikro-orm/mongodb';

/**
 * Interface for User entity
 */
export interface UserEntity {
  /**
   * Unique identifier of the user
   */
  id: ObjectId;

  /**
   * Email address of the user (unique)
   */
  email: string;

  /**
   * Hashed password of the user
   */
  passwordHash: string;

  /**
   * User roles for authorization
   */
  roles: Role[];

  /**
   * Date when the user was created
   */
  createdAt: Date;

  /**
   * Date when the user was last updated
   */
  updatedAt: Date;
} 
