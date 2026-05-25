import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";

const SALT_ROUNDS = 10;

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  branchId: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

export type AuthUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

type AuthResponse = {
  user: AuthUser;
  token: string;
};

type RegisterInput = {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterWithGoogleInput = {
  googleToken: string;
};

const getGoogleOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AuthError("GOOGLE_CLIENT_ID is not configured", 500);
  }
  return new OAuth2Client(clientId);
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getJwtSecret = (): Secret => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AuthError("JWT_SECRET is not configured", 500);
  }

  return secret;
};

const getJwtExpiresIn = (): SignOptions["expiresIn"] =>
  (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

const createToken = (user: AuthUser, secret = getJwtSecret()): string => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    secret,
    {
      expiresIn: getJwtExpiresIn()
    }
  );
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const email = normalizeEmail(input.email);
    const jwtSecret = getJwtSecret();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new AuthError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone
      },
      select: userSelect
    });

    return {
      user,
      token: createToken(user, jwtSecret)
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const email = normalizeEmail(input.email);

    const userWithPassword = await prisma.user.findUnique({
      where: { email }
    });

    if (!userWithPassword) {
      throw new AuthError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      userWithPassword.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthError("Invalid email or password", 401);
    }

    const { passwordHash: _passwordHash, ...user } = userWithPassword;

    return {
      user,
      token: createToken(user)
    };
  },

  async registerWithGoogle(input: RegisterWithGoogleInput): Promise<AuthResponse> {
    const client = getGoogleOAuthClient();
    
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: input.googleToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new AuthError("Invalid Google token", 401);
    }

    if (!payload || !payload.email) {
      throw new AuthError("Invalid Google token payload", 401);
    }

    const email = normalizeEmail(payload.email);
    const googleId = payload.sub;

    // Check if user exists by email or googleId
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId }
        ]
      }
    });

    let user;

    if (existingUser) {
      // Update existing user with googleId if not already set
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: existingUser.googleId || googleId
        },
        select: userSelect
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          fullName: payload.name,
          passwordHash: "" // Empty password for Google users
        },
        select: userSelect
      });
    }

    return {
      user,
      token: createToken(user)
    };
  },

  async forgotPassword(email: string): Promise<string> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      throw new AuthError("Không tìm thấy người dùng với email này", 404);
    }

    // Generate a reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { sub: user.id, email: user.email, type: "reset" },
      getJwtSecret(),
      { expiresIn: "1h" }
    );

    // In a real app, send this via email. For now, we simulate.
    console.log(`[RESET PASSWORD] Token for ${email}: ${resetToken}`);
    
    return resetToken;
  },

  async resetPassword(token: string, newPass: string): Promise<void> {
    try {
      const payload = jwt.verify(token, getJwtSecret()) as any;
      if (payload.type !== "reset") throw new Error();

      const passwordHash = await bcrypt.hash(newPass, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash }
      });
    } catch (error) {
      throw new AuthError("Mã khôi phục không hợp lệ hoặc đã hết hạn", 401);
    }
  }
};
