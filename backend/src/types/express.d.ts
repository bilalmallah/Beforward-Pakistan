import { UserRole } from '../features/User/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        teamId: string | null;
      };
    }
  }
}

export {};
