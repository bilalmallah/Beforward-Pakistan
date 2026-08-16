export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALESPERSON: 'SALESPERSON',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALESPERSON: 'Salesperson',
};

// Which roles may manage users/teams — mirrors backend RBAC (User.router.ts /
// Team.router.ts). This only controls what the UI *shows*; the backend is
// the real enforcement point.
export const CAN_MANAGE_USERS: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
export const CAN_MANAGE_TEAMS: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
