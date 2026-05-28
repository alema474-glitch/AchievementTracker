
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  uid?: string;
  username: string;
  firstName: string;
  lastName: string
  email: string;
  role: UserRole;
}
