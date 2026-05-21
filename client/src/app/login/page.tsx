"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../components/AuthProvider";
import { ErrorMessage } from "../../components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { login, registerWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear Google session cache mỗi khi vào trang login
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
      
      // Clear Google cookies to force re-login
      const cookies = [
        "__Secure-1PSID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
        "__Secure-3PSID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
        "HSID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
        "SID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
        "NID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
      ];
      cookies.forEach(cookie => {
        document.cookie = cookie;
      });
    }
  }, []);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);

    try {
      const token = credentialResponse.credential;
      await registerWithGoogle(token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập với Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
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
              Đăng nhập vào tài khoản
            </h1>
            <p className="text-on-surface-variant mt-2 font-body text-sm">
              Chào mừng bạn quay trở lại với không gian làm đẹp hữu cơ.
            </p>
          </div>
          
          <div className="px-8 pb-10">
            <ErrorMessage message={error} />
            <form className="space-y-6" onSubmit={submit}>
              <div className="space-y-2 text-left">
                <label className="block text-sm font-semibold text-on-surface-variant">
                  Email
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
              
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-on-surface-variant">
                    Mật khẩu
                  </label>
                  <Link className="text-xs font-medium text-secondary hover:opacity-80 transition-opacity" href="/forgot-password">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3 bg-surface-variant border-none rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-200 placeholder:text-outline/60 text-on-surface" 
                    placeholder="••••••••" 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <button 
                className="w-full cta-gradient text-white py-4 rounded-lg font-bold text-sm tracking-wide shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50" 
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>
            </form>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-container-highest"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="bg-surface-container-lowest px-4 text-outline">Hoặc</span>
              </div>
            </div>
            
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Đăng nhập với Google thất bại")}
                text="signin_with"
                size="large"
                width="100%"
                locale="vi_VN"
                ux_mode="popup"
              />
            </div>
          </div>
          
          <div className="px-8 py-6 bg-surface-container-low text-center border-t border-surface-container-highest">
            <p className="text-sm text-on-surface-variant font-body">
              Chưa có tài khoản? 
              <Link className="ml-1 text-primary font-bold hover:underline" href="/register">Đăng ký ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
