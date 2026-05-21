"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { posApi, posTokenStore } from "../../../lib/pos-api";
import { ApiError } from "../../../lib/api";

export default function PosLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Dành cho setup
  const [isSetupMode, setIsSetupMode] = useState(false); // Chuyển sang setup nếu chưa có admin nào
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Kiểm tra xem đã đăng nhập chưa
  useEffect(() => {
    let token = posTokenStore.get();
    if (!token) {
      const storefrontToken = window.localStorage.getItem("auth_token") || window.localStorage.getItem("token");
      if (storefrontToken) {
        try {
          const payload = JSON.parse(window.atob(storefrontToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          const isExpired = payload && payload.exp && payload.exp < Math.floor(Date.now() / 1000);
          if (payload && !isExpired && (payload.role === "ADMIN" || payload.role === "STAFF")) {
            posTokenStore.set(storefrontToken);
            token = storefrontToken;
          }
        } catch (e) {
          console.error("SSO Token Sync Error:", e);
        }
      }
    }

    if (token) {
      router.push("/pos");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSetupMode) {
        // Chế độ setup admin đầu tiên
        const res = await posApi.setup({
          username,
          password,
          fullName
        });
        setMessage(res.message);
        setIsSetupMode(false);
        setPassword("");
      } else {
        // Đăng nhập thông thường
        const res = await posApi.login({ username, password });
        posTokenStore.set(res.token);
        
        // Lưu thông tin user vào localStorage để tiện hiển thị nhanh ở client
        window.localStorage.setItem("pos_user", JSON.stringify(res.user));
        
        router.push("/pos");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Nếu lỗi 403 ở API setup hoặc login báo chưa có tài khoản, hoặc ta có thể bắt lỗi cụ thể
        setError(err.message);
        
        // Nếu hệ thống báo lỗi setup hoặc chưa thiết lập tài khoản
        if (err.message.includes("chưa được thiết lập") || err.message.includes("chưa có tài khoản")) {
          setIsSetupMode(true);
        }
      } else {
        setError("Có lỗi kết nối đến máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSetupStatus = async () => {
    // Thử gọi setup với dữ liệu rỗng để check xem đã được thiết lập chưa
    // Nếu trả về lỗi "đã được thiết lập" (403), tức là đã có admin rồi.
    // Nếu trả về lỗi "thiếu thông tin" (400), tức là chưa có admin nào, ta chuyển sang chế độ setup.
    try {
      await posApi.setup({ username: "", password: "", fullName: "" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setIsSetupMode(true);
      }
    }
  };

  useEffect(() => {
    checkSetupStatus();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdfbf7] via-[#faf6ee] to-[#f5ebd6] px-4 font-body selection:bg-[#3e2723] selection:text-white">
      {/* Background Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-[#3e2723]/5 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#5d4037]/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white/80 backdrop-blur-xl p-8 shadow-xl transition-all duration-300 hover:border-stone-300">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Logo Cafe */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3e2723] to-[#5d4037] shadow-lg shadow-stone-850/10">
            <span className="material-symbols-outlined text-4xl text-white">local_cafe</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#3e2723]">
            {isSetupMode ? "Thiết Lập POS Cafe" : "Hậu Lê Coffee - POS"}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {isSetupMode
              ? "Tạo tài khoản Quản trị viên (Admin) đầu tiên để bắt đầu vận hành."
              : "Hệ thống quản lý đặt món tại bàn & thanh toán nội bộ."}
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-250 bg-red-50 p-3 text-sm text-red-700">
            <span className="material-symbols-outlined shrink-0 text-xl">error</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-emerald-250 bg-emerald-50 p-3 text-sm text-emerald-700">
            <span className="material-symbols-outlined shrink-0 text-xl">check_circle</span>
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSetupMode && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Họ và Tên Admin
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <span className="material-symbols-outlined text-xl">badge</span>
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition-all focus:border-[#3e2723] focus:bg-white focus:ring-1 focus:ring-[#3e2723]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Email đăng nhập
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                <span className="material-symbols-outlined text-xl">mail</span>
              </span>
              <input
                type="email"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition-all focus:border-[#3e2723] focus:bg-white focus:ring-1 focus:ring-[#3e2723]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Mật khẩu
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                <span className="material-symbols-outlined text-xl">lock</span>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition-all focus:border-[#3e2723] focus:bg-white focus:ring-1 focus:ring-[#3e2723]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#3e2723] to-[#5d4037] py-3 font-semibold text-white shadow-md shadow-stone-800/10 transition-all hover:from-[#5d4037] hover:to-[#3e2723] hover:shadow-lg hover:shadow-stone-800/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">login</span>
                <span>{isSetupMode ? "Thiết Lập Ngay" : "Đăng Nhập POS"}</span>
              </>
            )}
          </button>
        </form>

        {isSetupMode && (
          <button
            onClick={() => setIsSetupMode(false)}
            className="mt-4 w-full text-center text-xs text-[#3e2723] transition hover:underline"
          >
            Quay lại màn hình đăng nhập
          </button>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4 text-xs">
          <Link href="/" className="flex items-center gap-1 text-stone-500 hover:text-[#3e2723] hover:underline">
            <span className="material-symbols-outlined text-[16px]">home</span>
            Về Trang Chủ Website
          </Link>
          <Link href="/login" className="flex items-center gap-1 text-stone-500 hover:text-[#3e2723] hover:underline">
            <span className="material-symbols-outlined text-[16px]">login</span>
            Quay lại Đăng nhập Website
          </Link>
        </div>
      </div>
    </div>
  );
}
