import { UserRole } from '../../user/entities/user.entity';

export class AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export class JwtPayload {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}
