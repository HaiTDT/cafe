"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "../../components/AuthProvider";
import { ErrorMessage } from "../../components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
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
      
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-12 h-full min-h-[80vh]">
        <div className="w-full max-w-[500px] bg-surface-container-lowest rounded-xl shadow-[0_32px_64px_rgba(0,80,47,0.06)] overflow-hidden transition-all duration-300 organic-shadow">
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="font-headline text-2xl font-extrabold tracking-tight text-primary mb-4">
              HẬU LÊ COFFEE
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight leading-tight">
              Đăng ký tài khoản
            </h1>
            <p className="text-on-surface-variant mt-2 font-body text-sm">
              Trở thành thành viên và nhận ưu đãi độc quyền.
            </p>
          </div>
          
          <div className="px-8 pb-10">
            <ErrorMessage message={error} />
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2 text-left">
                <label className="block text-sm font-semibold text-on-surface-variant">
                  Họ và tên
                </label>
                <input 
                  className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/60 text-on-surface" 
                  placeholder="Nhập họ tên của bạn" 
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-sm font-semibold text-on-surface-variant">
                  Số điện thoại
                </label>
                <input 
                  className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/60 text-on-surface" 
                  placeholder="Nhập số điện thoại" 
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-sm font-semibold text-on-surface-variant">
                  Email
                </label>
                <input 
                  className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/60 text-on-surface" 
                  placeholder="example@email.com" 
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2 text-left">
                <label className="block text-sm font-semibold text-on-surface-variant">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/60 text-on-surface" 
                    placeholder="••••••••" 
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>
              
              <button 
                className="w-full mt-4 cta-gradient text-white py-4 rounded-lg font-bold text-sm tracking-wide shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50" 
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đăng ký"}
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-6 bg-surface-container-low text-center border-t border-surface-container-highest">
            <p className="text-sm text-on-surface-variant font-body">
              Đã có tài khoản? 
              <Link className="ml-1 text-primary font-bold hover:underline" href="/login">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
