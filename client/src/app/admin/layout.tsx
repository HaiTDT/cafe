"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Protected } from "../../components/Protected";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path !== '/admin' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <Protected adminOnly>
      <div className="bg-background font-body text-on-surface antialiased flex min-h-screen">
        <aside className="h-screen w-64 fixed left-0 top-0 bg-[#106A42] shadow-[32px_0_32px_rgba(0,80,47,0.06)] flex flex-col py-6 z-50 font-headline tracking-wide leading-relaxed text-sm">
          <div className="px-6 mb-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">eco</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">Hậu Lê Coffee</h1>
              <p className="text-white/60 text-[10px] uppercase tracking-widest mt-1">Hệ thống quản trị</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 overflow-y-auto no-scrollbar">
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span>Tổng quan</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/banners') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/banners"
            >
              <span className="material-symbols-outlined">view_carousel</span>
              <span>Quản lý Banner</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/products') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/products"
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span>Quản lý Sản phẩm</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/categories') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/categories"
            >
              <span className="material-symbols-outlined">category</span>
              <span>Quản lý Danh mục</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/blogs') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/blogs"
            >
              <span className="material-symbols-outlined">article</span>
              <span>Quản lý Blog</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/orders') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/orders"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
              <span>Quản lý Đơn hàng</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/flash-sales') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/flash-sales"
            >
              <span className="material-symbols-outlined">bolt</span>
              <span>Quản lý Flash Sale</span>
            </Link>

            {/* Phân tích & Báo cáo */}
            <div className="mx-4 mt-5 mb-2">
              <p className="text-white/30 text-[9px] uppercase tracking-[0.2em] font-bold">Phân tích & Báo cáo</p>
            </div>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/revenue') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/revenue"
            >
              <span className="material-symbols-outlined">monitoring</span>
              <span>Doanh thu & Tăng trưởng</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/customers') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/customers"
            >
              <span className="material-symbols-outlined">groups</span>
              <span>Phân khúc Khách hàng</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/marketing') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/marketing"
            >
              <span className="material-symbols-outlined">campaign</span>
              <span>Hiệu quả Marketing</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/inventory') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/inventory"
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span>Quản lý Tồn kho</span>
            </Link>
            <Link 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 ${isActive('/admin/bi-architecture') ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`} 
              href="/admin/bi-architecture"
            >
              <span className="material-symbols-outlined">hub</span>
              <span>Môi trường BI</span>
            </Link>

            <div className="mx-2 my-3 h-px bg-white/10" />
            <Link
              className="flex items-center gap-3 px-4 py-3 rounded-lg mx-2 my-1 transition-all duration-200 text-white/70 hover:text-white hover:bg-white/5"
              href="/"
            >
              <span className="material-symbols-outlined">storefront</span>
              <span>Về trang chủ</span>
            </Link>
          </nav>
          <div className="mt-auto px-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 bg-primary-container flex items-center justify-center text-white font-bold text-xs">
                 A
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-semibold truncate">Quản trị viên</p>
                <p className="text-white/40 text-[10px] truncate">admin@botanical.vn</p>
              </div>
            </div>
          </div>
        </aside>
        
        <div className="ml-64 flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 w-full z-40 bg-white/85 backdrop-blur-md flex items-center justify-between px-8 h-16 shadow-sm font-body font-medium text-sm leading-6">
            <div className="flex items-center flex-1 max-w-xl">
              <div className="relative w-full group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                <input className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Tìm kiếm đơn hàng, khách hàng..." type="text"/>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary-container rounded-full ring-2 ring-white"></span>
              </button>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-on-surface">Admin</p>
                  <p className="text-[10px] text-slate-500">Người điều hành</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white font-bold ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                   A
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </Protected>
  );
}
