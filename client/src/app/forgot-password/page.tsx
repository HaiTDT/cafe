"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "../../lib/api";
import { ErrorMessage } from "../../components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState(""); // Only for simulation

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.forgotPassword(email);
      setSuccess("Mã khôi phục đã được tạo! Trong thực tế, mã này sẽ được gửi tới email của bạn.");
      if (response.token) {
        setToken(response.token);
      }
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
              Quên mật khẩu?
            </h1>
            <p className="text-on-surface-variant mt-2 font-body text-sm">
              Nhập email của bạn để nhận mã khôi phục mật khẩu.
            </p>
          </div>
          
          <div className="px-8 pb-10">
            <ErrorMessage message={error} />
            
            {success ? (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                  {success}
                </div>
                
                {token && (
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">Mã khôi phục (Chế độ mô phỏng):</p>
                    <code className="text-xs break-all text-primary font-mono">{token}</code>
                  </div>
                )}
                
                <Link 
                  href={`/reset-password?token=${token}`}
                  className="w-full block text-center bg-primary text-white py-4 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-all"
                >
                  Tiến hành đặt lại mật khẩu
                </Link>
                
                <Link className="block text-center text-sm font-bold text-primary hover:underline" href="/login">
                  Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={submit}>
                <div className="space-y-2 text-left">
                  <label className="block text-sm font-semibold text-on-surface-variant">
                    Email đăng ký
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/60 text-on-surface" 
                    placeholder="example@email.com" 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <button 
                  className="w-full cta-gradient text-white py-4 rounded-lg font-bold text-sm tracking-wide shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                  {!loading && <span className="material-symbols-outlined text-lg">send</span>}
                </button>
                
                <div className="text-center">
                   <Link className="text-sm font-bold text-primary hover:underline" href="/login">
                      Quay lại đăng nhập
                   </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
