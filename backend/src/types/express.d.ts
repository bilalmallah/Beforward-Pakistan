import { UserRole } from '../features/User/User.model.js';

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
