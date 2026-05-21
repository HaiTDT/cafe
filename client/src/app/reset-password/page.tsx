"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { api } from "../../lib/api";
import { ErrorMessage } from "../../components/ui";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.resetPassword({ token, newPassword });
      setSuccess("Mật khẩu của bạn đã được đặt lại thành công!");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-0">
        <img alt="Hậu Lê Coffee Background" className="w-full h-full object-cover opacity-10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLiBgG8H4R4nEW0-xaFI6ZHQd4zBXyGlaStshdD2rxrJ8xPHNq58jBHQIcAFTF2k4B89rjW9&Nef0eV-9dVKBjK5xmNDFrWXdtD0FfWuR5-lhJKNpOGcBI0qYR_MA6VIy&QqN_6o0aL58BS3dqmsLKLjmmPdEDgB0ssgmJ0&lbzDPgAZnQHhn_jAf6mawQ&_7AE_dWGTm5kmxx4nVQa4DzumyYV9ZCEWzhbVlhPm8wNyRmtEL7cBAWT9nTYG-MPN-uO&PgfhG1o&Ga" />
        <div className="absolute inset-0 bg-surface-container-low/60 backdrop-blur-sm"></div>
      </div>
      
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-12 h-full min-h-[60vh]">
        <div className="w-full max-w-[460px] bg-surface-container-lowest rounded-xl shadow-[0_32px_64px_rgba(0,80,47,0.06)] overflow-hidden transition-all duration-300 organic-shadow">
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="font-headline text-2xl font-extrabold tracking-tight text-primary mb-4">
              HẬU LÊ COFFEE
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight leading-tight">
              Đặt lại mật khẩu
            </h1>
            <p className="text-on-surface-variant mt-2 font-body text-sm">
              Tạo mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>
          
          <div className="px-8 pb-10">
            <ErrorMessage message={error} />
            
            {success ? (
              <div className="space-y-6 text-center">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                  {success}
                </div>
                <p className="text-sm text-on-surface-variant">Đang chuyển hướng về trang đăng nhập...</p>
                <Link className="block font-bold text-primary hover:underline" href="/login">
                  Quay lại đăng nhập ngay
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={submit}>
                <div className="space-y-2 text-left">
                  <label className="block text-sm font-semibold text-on-surface-variant">
                    Mã khôi phục
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/60 text-on-surface text-xs font-mono" 
                    placeholder="Nhập mã khôi phục" 
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="block text-sm font-semibold text-on-surface-variant">
                    Mật khẩu mới
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 text-on-surface" 
                    placeholder="••••••••" 
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="block text-sm font-semibold text-on-surface-variant">
                    Xác nhận mật khẩu mới
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 text-on-surface" 
                    placeholder="••••••••" 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                <button 
                  className="w-full cta-gradient text-white py-4 rounded-lg font-bold text-sm tracking-wide shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  {!loading && <span className="material-symbols-outlined text-lg">check_circle</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
