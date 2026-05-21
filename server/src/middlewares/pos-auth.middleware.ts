import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { Role } from "@prisma/client";

type PosJwtPayload = JwtPayload & {
  sub: string;
  username: string;
  role: Role;
  fullName: string;
  type: string;
};

const getJwtSecret = (): string => process.env.JWT_SECRET || "default_jwt_secret";

const getBearerToken = (authorization?: string): string | null => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const authenticatePosJwt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = getBearerToken(req.headers.authorization);
  const jwtSecret = getJwtSecret();

  if (!token) {
    return res.status(401).json({ message: "Vui lòng đăng nhập để thực hiện chức năng này" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    const username = decoded.username || decoded.email;

    if (!decoded.sub || !username || !decoded.role) {
      return res.status(401).json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn" });
    }

    // Kiểm tra user thực sự tồn tại trong DB
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!adminUser || (adminUser.role !== "ADMIN" && adminUser.role !== "STAFF")) {
      return res.status(401).json({ message: "Tài khoản không có quyền truy cập POS hoặc không còn tồn tại" });
    }

    req.posUser = {
      id: adminUser.id,
      username: adminUser.email,
      role: adminUser.role,
      fullName: adminUser.fullName || adminUser.email
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Mã xác thực không hợp lệ hoặc đã hết hạn" });
  }
};

export const requirePosAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.posUser || req.posUser.role !== "ADMIN") {
    return res.status(403).json({ message: "Bạn không có quyền quản trị để thực hiện chức năng này" });
  }
  return next();
};
