import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: Role;
    }

    interface PosUser {
      id: string;
      username: string;
      role: Role;
      fullName: string;
      branchId?: string | null;
    }

    interface Request {
      user?: User;
      posUser?: PosUser;
      posBranchId?: string;
    }
  }
}

export {};
