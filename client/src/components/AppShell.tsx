"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./store/Footer";
import { Header } from "./store/Header";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCatalogPage = pathname === "/products";
  const isHome = pathname === "/";
  const isPosPage = pathname?.startsWith("/pos");
  const isAdminPage = pathname?.startsWith("/admin") || isPosPage;

  if (isAdminPage) {
    return <div className="min-h-screen bg-background font-body text-on-surface antialiased">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-luxury-bg font-body text-luxury-text selection:bg-luxury-primary/30">
      <Suspense fallback={<div className="h-[88px] bg-luxury-surface shadow-sm" />}>
        <Header />
      </Suspense>
      <main
        className={
          isHome
            ? "flex-1 pb-20 md:pb-0"
            : isCatalogPage
            ? "flex-1 pt-32 pb-20 md:pb-0"
            : "mx-auto w-full max-w-7xl flex-1 px-4 py-8 pt-32 pb-20 md:pb-8 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

