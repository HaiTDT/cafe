"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { posApi, posTokenStore } from "../../../lib/pos-api";
import type { PosUser } from "../../../lib/pos-api";

export default function PosAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<PosUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

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

    if (!token) {
      router.push("/pos/login");
      return;
    }

    const verifyAdmin = async () => {
      try {
        const res = await posApi.getMe();
        if (res.user.role !== "ADMIN") {
          setUnauthorized(true);
        } else {
          setCurrentUser(res.user);
          // Sync with localStorage
          window.localStorage.setItem("pos_user", JSON.stringify(res.user));
        }
      } catch (err) {
        console.error("Verify POS admin error:", err);
        posTokenStore.clear();
        window.localStorage.removeItem("pos_user");
        router.push("/pos/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();

    const handleUnauthorized = () => {
      router.push("/pos/login");
    };
    window.addEventListener("pos-unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("pos-unauthorized", handleUnauthorized);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#fdfbf7] text-stone-800">
        <div className="flex flex-col items-center gap-3">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#3e2723] border-t-transparent"></span>
          <p className="text-sm font-semibold tracking-wide text-stone-500">Đang xác thực quyền Admin...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#fdfbf7] text-stone-800 p-6 text-center select-none">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50/30 p-8 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-650 border border-red-200 mb-4">
            <span className="material-symbols-outlined text-3xl">gpp_bad</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Không có quyền truy cập</h1>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            Khu vực này chỉ dành riêng cho tài khoản **Quản trị viên (Admin)**. Tài khoản hiện tại của bạn không đủ quyền hạn.
          </p>
          <button
            onClick={() => router.push("/pos")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3e2723] to-[#5d4037] px-6 py-2.5 text-xs font-bold text-white shadow-lg transition hover:from-[#5d4037] hover:to-[#3e2723] active:scale-95"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại POS Bán Hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-800">
      {children}
    </div>
  );
}
