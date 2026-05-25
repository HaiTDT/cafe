import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const SALT_ROUNDS = 10;
const getJwtSecret = (): string => process.env.JWT_SECRET || "default_jwt_secret";

export const posAuthController = {
  async setup(req: Request, res: Response) {
    try {
      const { username, password, fullName } = req.body;

      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin: username (email), password, fullName" });
      }

      // Kiểm tra xem đã có tài khoản ADMIN nào chưa
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" }
      });
      if (adminCount > 0) {
        return res.status(403).json({ message: "Hệ thống đã được thiết lập. Không thể đăng ký thêm admin trực tiếp." });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const newAdmin = await prisma.user.create({
        data: {
          email: username.trim().toLowerCase(),
          passwordHash,
          fullName: fullName.trim(),
          role: "ADMIN"
        }
      });

      return res.status(201).json({
        message: "Thiết lập hệ thống thành công. Đã tạo tài khoản admin đầu tiên.",
        user: {
          id: newAdmin.id,
          username: newAdmin.email,
          fullName: newAdmin.fullName || newAdmin.email,
          role: newAdmin.role
        }
      });
    } catch (error) {
      console.error("Setup error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi thiết lập" });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Email đăng nhập và mật khẩu là bắt buộc" });
      }

      const user = await prisma.user.findUnique({
        where: { email: username.trim().toLowerCase() }
      });

      if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng hoặc tài khoản không có quyền truy cập POS" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không đúng" });
      }

      const token = jwt.sign(
        {
          sub: user.id,
          username: user.email,
          role: user.role,
          fullName: user.fullName || user.email,
          type: "pos_admin"
        },
        getJwtSecret(),
        {
          expiresIn: "7d"
        }
      );

      return res.json({
        message: "Đăng nhập thành công",
        token,
        user: {
          id: user.id,
          username: user.email,
          fullName: user.fullName || user.email,
          role: user.role,
          branchId: user.branchId
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập" });
    }
  },

  async me(req: Request, res: Response) {
    try {
      if (!req.posUser) {
        return res.status(401).json({ message: "Chưa đăng nhập" });
      }
      return res.json({ user: req.posUser });
    } catch (error) {
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin nhân viên" });
    }
  },

  // Admin có thể tạo tài khoản nhân viên mới
  async createStaff(req: Request, res: Response) {
    try {
      const { username, password, fullName, role, branchId } = req.body;

      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ: username (email), password, fullName" });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: username.trim().toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email đăng nhập đã tồn tại trong hệ thống" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const newUser = await prisma.user.create({
        data: {
          email: username.trim().toLowerCase(),
          passwordHash,
          fullName: fullName.trim(),
          role: role === "STAFF" ? "STAFF" : "ADMIN",
          branchId: branchId || null
        }
      });

      return res.status(201).json({
        message: "Tạo tài khoản nhân viên thành công",
        user: {
          id: newUser.id,
          username: newUser.email,
          fullName: newUser.fullName || newUser.email,
          role: newUser.role,
          branchId: newUser.branchId
        }
      });
    } catch (error) {
      console.error("Create staff error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi tạo tài khoản" });
    }
  },

  async listStaffs(req: Request, res: Response) {
    try {
      const staffs = await prisma.user.findMany({
        where: {
          role: {
            in: ["ADMIN", "STAFF"]
          }
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      // Map email thành username để tương thích với FE cũ
      const mappedStaffs = staffs.map(staff => ({
        id: staff.id,
        username: staff.email,
        fullName: staff.fullName || staff.email,
        role: staff.role,
        createdAt: staff.createdAt,
        branchId: staff.branchId,
        branchName: staff.branch?.name || null
      }));

      return res.json(mappedStaffs);
    } catch (error) {
      console.error("List staffs error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách nhân viên" });
    }
  },

  async updateStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fullName, role, branchId, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản nhân viên" });
      }

      const updateData: any = {};

      if (fullName !== undefined) {
        updateData.fullName = fullName.trim();
      }

      if (role !== undefined) {
        if (role !== "ADMIN" && role !== "STAFF") {
          return res.status(400).json({ message: "Vai trò không hợp lệ" });
        }
        updateData.role = role;
      }

      if (branchId !== undefined) {
        updateData.branchId = branchId || null;
      }

      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });

      return res.json({
        message: "Cập nhật nhân viên thành công",
        user: {
          id: updatedUser.id,
          username: updatedUser.email,
          fullName: updatedUser.fullName || updatedUser.email,
          role: updatedUser.role,
          branchId: updatedUser.branchId
        }
      });
    } catch (error) {
      console.error("Update staff error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thông tin nhân viên" });
    }
  },

  async deleteStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy tài khoản" });
      }

      // Chuyển vai trò về CUSTOMER và gỡ liên kết chi nhánh thay vì xóa hẳn (để tránh lỗi ràng buộc khóa ngoại)
      await prisma.user.update({
        where: { id },
        data: {
          role: "CUSTOMER",
          branchId: null
        }
      });

      return res.json({ message: "Đã gỡ bỏ quyền nhân viên thành công" });
    } catch (error) {
      console.error("Delete staff error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi gỡ bỏ nhân viên" });
    }
  }
};
