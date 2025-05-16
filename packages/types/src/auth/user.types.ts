import { Role } from '@libs/enums';
import { CustomBaseEntity } from '../base.types';

/**
 * Interface for User entity
 */
export interface UserEntity extends CustomBaseEntity {
  email: string;
  passwordHash: string;
  roles: Role[];
} 

/**
 * Interface for CurrentUser
 */
export interface CurrentUserData {
  id: string;
  roles: Role[];
}
