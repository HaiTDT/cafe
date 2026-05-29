"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { useCart } from "../CartProvider";
import { api, type Category } from "../../lib/api";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posUser, setPosUser] = useState<any>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("pos_user");
      if (saved) {
        try {
          setPosUser(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  const isPosAuthorized = user?.role === "ADMIN" || user?.role === "STAFF" || posUser?.role === "ADMIN" || posUser?.role === "STAFF";

  const activeCategoryId = searchParams.get("categoryId");
  const isHome = pathname === "/" && !activeCategoryId;

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    if (pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    router.push(`/#${sectionId}`);
  };

  return (
    <>
    <header className="fixed top-0 w-full z-50 bg-luxury-bg/90 backdrop-blur-md shadow-sm border-b border-luxury-border/30">
      <div className="flex flex-col w-full max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-4 md:gap-8 mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 lg:hidden text-luxury-primary hover:bg-luxury-surface rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight text-luxury-primary font-headline">
              HẬU LÊ COFFEE
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-xl relative">
            <input
              className="w-full bg-luxury-surface border border-luxury-border/50 rounded-sm px-4 py-2 text-sm text-luxury-text focus:ring-1 focus:ring-luxury-primary focus:bg-luxury-surface-low transition-all"
              placeholder="Tìm kiếm đồ uống, bánh ngọt..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="material-symbols-outlined absolute right-3 top-2 text-luxury-primary hover:scale-110 transition-transform">search</button>
          </form>

          <div className="flex items-center gap-2 md:gap-6">
            <span className="hidden xl:block text-luxury-primary font-medium text-sm">Hotline: 0988 384 767</span>
            <div className="flex items-center gap-1 md:gap-4">
              {user && (
                <button
                  onClick={() => router.push("/orders")}
                  className="p-2 text-luxury-text hover:text-luxury-primary transition-all rounded-full relative"
                  title="Lịch sử đơn hàng"
                >
                  <span className="material-symbols-outlined text-[20px] md:text-[24px]">receipt_long</span>
                </button>
              )}
              <button
                onClick={() => router.push("/cart")}
                className="p-2 text-luxury-text hover:text-luxury-primary transition-all rounded-full relative"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[24px]">shopping_cart</span>
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-luxury-primary text-luxury-bg text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
              {isPosAuthorized && (
                <Link
                  className="hidden sm:flex items-center gap-1 text-[10px] md:text-xs font-bold text-luxury-bg bg-luxury-primary px-2 md:px-3 py-1.5 rounded-full hover:bg-luxury-primary/90 transition-colors"
                  href="/pos"
                >
                  <span className="material-symbols-outlined text-[14px] md:text-[16px]">storefront</span>
                  <span className="hidden md:inline">Vào POS</span>
                </Link>
              )}
              {user?.role === "ADMIN" && (
                <Link
                  className="hidden sm:flex items-center gap-1 text-[10px] md:text-xs font-bold text-luxury-bg bg-luxury-primary px-2 md:px-3 py-1.5 rounded-full hover:bg-luxury-primary/90 transition-colors"
                  href="/admin"
                >
                  <span className="material-symbols-outlined text-[14px] md:text-[16px]">admin_panel_settings</span>
                  <span className="hidden md:inline">Quản trị Admin</span>
                </Link>
              )}
              {user ? (
                <button
                  className="p-2 text-luxury-text hover:text-luxury-primary transition-all rounded-full"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] md:text-[24px]">logout</span>
                </button>
              ) : (
                <button
                  className="p-2 text-luxury-text hover:text-luxury-primary transition-all rounded-full"
                  onClick={() => router.push("/login")}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px] md:text-[24px]">person</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Mobile */}
        <form onSubmit={handleSearch} className="md:hidden relative mb-2">
          <input
            className="w-full bg-luxury-surface border border-luxury-border/50 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-luxury-primary text-luxury-text"
            placeholder="Tìm kiếm..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="material-symbols-outlined absolute right-3 top-2 text-luxury-primary text-[20px] hover:scale-110 transition-transform">search</button>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center justify-center gap-8">
          <Link
            className={`py-1 text-sm font-headline transition-colors ${isHome ? "text-luxury-primary border-b-2 border-luxury-primary font-semibold" : "text-luxury-text hover:text-luxury-primary"}`}
            href="/"
          >
            Trang chủ
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              className={`py-1 text-sm font-headline transition-colors ${activeCategoryId === category.id ? "text-luxury-primary border-b-2 border-luxury-primary font-semibold" : "text-luxury-text hover:text-luxury-primary"}`}
              href={`/products?categoryId=${category.id}`}
            >
              {category.name}
            </Link>
          ))}
          <Link
            className={`py-1 text-sm font-headline flex items-center gap-1 font-bold transition-colors ${pathname === "/flash-sale" ? "text-luxury-primary border-b-2 border-luxury-primary" : "text-luxury-text-variant hover:text-luxury-primary"}`}
            href="/flash-sale"
          >
            Khuyến mãi <span className="material-symbols-outlined text-[16px]">bolt</span>
          </Link>
        </nav>
      </div>
    </header>

    {/* Mobile Menu Overlay — rendered OUTSIDE <header> to escape stacking context and cover full viewport */}
    <div className={`lg:hidden fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>

      {/* Menu Content — full viewport height, scrollable */}
      <div className={`absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-white dark:bg-stone-900 shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Menu Header (Login Section) */}
        <div className="bg-[#326e51] p-6 flex items-center gap-4 text-white flex-shrink-0">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName || ""} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl">person</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            {user ? (
              <>
                <p className="text-base font-bold truncate">{user.fullName || "Khách hàng"}</p>
                <p className="text-[11px] text-white/70 truncate">{user.email}</p>
                <button 
                  onClick={() => {
                    logout();
                    router.push("/login");
                    setIsMenuOpen(false);
                  }}
                  className="text-left text-[11px] font-bold text-orange-300 hover:text-orange-200 mt-1 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">logout</span> Đăng xuất
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold">Đăng nhập / Đăng ký</Link>
            )}
          </div>
        </div>

        {/* Scrollable Menu Body — takes all remaining height */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col py-2">
            {/* Group 0: Khám phá nhanh */}
            <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Khám phá nhanh
            </div>
            <MobileMenuItem
              icon="home"
              label="Trang chủ"
              href="/"
              active={isHome}
              onClick={(e: any) => {
                e.preventDefault();
                setIsMenuOpen(false);
                if (pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  router.push("/");
                }
              }}
            />
            <MobileMenuItem
              icon="star"
              label="Sản phẩm nổi bật"
              href="#featured-products"
              onClick={(e: any) => {
                e.preventDefault();
                handleScrollToSection("featured-products");
              }}
            />
            <MobileMenuItem
              icon="bolt"
              label="Khuyến mãi Flash Sale"
              href="#flash-sale"
              onClick={(e: any) => {
                e.preventDefault();
                handleScrollToSection("flash-sale");
              }}
              customLabelColor="text-orange-600 font-bold dark:text-orange-400"
            />
            <MobileMenuItem
              icon="article"
              label="Góc nhìn & Tin tức"
              href="#blogs"
              onClick={(e: any) => {
                e.preventDefault();
                handleScrollToSection("blogs");
              }}
            />

            <hr className="my-2 border-stone-100 dark:border-stone-800" />

            {/* Group 1: Thực đơn cửa hàng */}
            <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Thực đơn cửa hàng
            </div>
            <MobileMenuItem
              icon="home"
              label="Trang chủ"
              href="/"
              active={isHome}
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Dynamic categories */}
            {categories.map((category) => {
              let icon = "restaurant";
              const name = category.name.toLowerCase();
              if (name.includes("cà phê") || name.includes("coffee")) {
                icon = "local_cafe";
              } else if (name.includes("trà") || name.includes("tea")) {
                icon = "emoji_food_beverage";
              } else if (name.includes("bánh") || name.includes("cake") || name.includes("bakery")) {
                icon = "bakery_dining";
              }
              return (
                <MobileMenuItem
                  key={category.id}
                  icon={icon}
                  label={category.name}
                  href={`/products?categoryId=${category.id}`}
                  active={activeCategoryId === category.id}
                  onClick={() => setIsMenuOpen(false)}
                />
              );
            })}

            <MobileMenuItem
              icon="bolt"
              label="Khuyến mãi Flash Sale"
              href="/flash-sale"
              active={pathname === "/flash-sale"}
              onClick={() => setIsMenuOpen(false)}
              customLabelColor="text-orange-600 font-bold dark:text-orange-400"
            />

            <hr className="my-2 border-stone-100 dark:border-stone-800" />

            {/* Group 2: Tiện ích & Vận hành */}
            <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Tiện ích & Vận hành
            </div>
            <MobileMenuItem
              icon="shopping_cart"
              label="Giỏ hàng"
              href="/cart"
              badge={totalItems}
              active={pathname === "/cart"}
              onClick={() => setIsMenuOpen(false)}
            />
            {user && (
              <MobileMenuItem
                icon="receipt_long"
                label="Lịch sử đơn hàng"
                href="/orders"
                active={pathname === "/orders"}
                onClick={() => setIsMenuOpen(false)}
              />
            )}
            <MobileMenuItem
              icon="article"
              label="Tin tức & Câu chuyện"
              href="/blogs"
              active={pathname === "/blogs"}
              onClick={() => setIsMenuOpen(false)}
            />

            {(isPosAuthorized || user?.role === "ADMIN") && (
              <>
                <hr className="my-2 border-stone-100 dark:border-stone-800" />
                <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Bảng điều khiển nội bộ
                </div>
                {isPosAuthorized && (
                  <MobileMenuItem
                    icon="storefront"
                    label="Vào POS Bán Hàng"
                    href="/pos"
                    onClick={() => setIsMenuOpen(false)}
                    customLabelColor="text-amber-700 font-bold dark:text-amber-500"
                  />
                )}
                {user?.role === "ADMIN" && (
                  <MobileMenuItem
                    icon="admin_panel_settings"
                    label="Quản trị Admin"
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    customLabelColor="text-emerald-700 font-bold dark:text-emerald-400"
                  />
                )}
              </>
            )}
          </div>

          {/* Menu Footer */}
          <div className="border-t border-stone-100 dark:border-stone-800 mt-2 py-4">
            <MobileMenuItem
              icon="download"
              label="Tải App Haulecoffee.vn"
              href="#"
              onClick={() => setIsMenuOpen(false)}
            />
            <MobileMenuItem
              icon="call"
              label="Hotline: 1800 6324"
              href="tel:18006324"
              onClick={() => setIsMenuOpen(false)}
              customLabelColor="text-emerald-700 font-bold"
            />
          </div>

          <div className="bg-stone-50 dark:bg-stone-950 p-6 text-[11px] text-stone-500">
            <p className="text-emerald-800 font-bold mb-1">Xem tất cả cửa hàng</p>
            <p>Bản quyền © 2016 Haulecoffee.vn</p>
            <p>Công Ty cổ phần HẬU LÊ COFFEE VIETNAM</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function MobileMenuItem({ icon, label, href, onClick, active, badge, customLabelColor }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${active ? 'bg-emerald-50 text-emerald-800' : 'text-stone-700 dark:text-stone-300'}`}
    >
      <span className="material-symbols-outlined text-[22px] opacity-70">{icon}</span>
      <span className={`flex-1 text-sm ${customLabelColor || 'font-medium'}`}>{label}</span>
      {badge > 0 && (
        <span className="bg-orange-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}


