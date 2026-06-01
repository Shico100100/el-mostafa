// Re-export User entity and UserRole for backward compatibility
export { UserEntity as User } from './infrastructure/persistence/relational/entities/user.entity';

// UserRole enum - matching the legacy structure
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  STOREKEEPER = 'STOREKEEPER',
  WORKER = 'WORKER',
}
