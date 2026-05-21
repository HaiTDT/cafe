"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Blog } from "@/lib/api";

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.getBlogs({ isActive: true, page, limit: 9 })
      .then((res) => {
        setBlogs(res.data);
        setTotalPages(res.meta.totalPages);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="min-h-screen bg-surface-container-lowest pb-24">
      {/* Hero Section */}
      <section className="relative h-[25vh] md:h-[40vh] min-h-[220px] md:min-h-[300px] w-full overflow-hidden mb-8 md:mb-16">
        <img 
          src="https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1600" 
          alt="Beauty Blog"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 bg-secondary text-on-secondary text-[10px] md:text-xs font-bold tracking-widest uppercase mb-2 md:mb-4 rounded-sm">
                KẾT NỐI & CHIA SẺ
              </span>
              <h1 className="font-headline text-2xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-3 md:mb-6">
                Góc Làm Đẹp <br /><span className="italic font-light text-secondary-fixed">Hậu Lê Coffee Beauty</span>
              </h1>
              <p className="hidden sm:block text-white/80 text-sm md:text-lg max-w-md leading-relaxed">
                Nơi cập nhật những xu hướng làm đẹp mới nhất, bí quyết chăm sóc da từ chuyên gia và đánh giá sản phẩm khách quan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 md:mb-12 gap-6 md:gap-8">
          <div>
            <nav className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary">Tất cả bài viết</span>
            </nav>
            <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-primary">
              Khám Phá Bản Tin
            </h2>
          </div>
          
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Tìm kiếm bài viết..."
              className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 pl-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          </div>
        </div>

        {/* Blog Grid */}
        {loading && blogs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-surface-container rounded-2xl mb-6"></div>
                <div className="h-4 bg-surface-container rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-surface-container rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-surface-container rounded w-full mb-2"></div>
                <div className="h-4 bg-surface-container rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-dashed border-surface-container-high">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">article</span>
            <h3 className="text-xl font-bold text-primary mb-2">Chưa có bài viết nào</h3>
            <p className="text-slate-500">Chúng tôi đang cập nhật thêm nội dung mới. Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {blogs.map((blog) => (
              <Link key={blog.id} href={`/blogs/${blog.id}`} className="group">
                <article className="flex flex-col h-full">
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-6 bg-surface-container-low organic-shadow relative">
                    <img 
                      src={blog.imageUrl || "https://images.unsplash.com/photo-1615397323214-729227520e5c?auto=format&fit=crop&q=80&w=800"} 
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider rounded shadow-sm">
                        Làm đẹp
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                    <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span>Xu hướng</span>
                  </div>
                  <h3 className="font-headline text-xl font-extrabold text-primary mb-3 group-hover:text-secondary transition-colors line-clamp-2 leading-tight">
                    {blog.title}
                  </h3>
                  <p className="text-slate-600 line-clamp-3 text-sm leading-relaxed mb-6">
                    {blog.excerpt || blog.content.substring(0, 150).replace(/<[^>]*>?/gm, '') + "..."}
                  </p>
                  <div className="mt-auto pt-4 flex items-center text-primary font-bold text-xs gap-2 group-hover:translate-x-2 transition-transform uppercase tracking-widest">
                    Đọc tiếp <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-20 flex justify-center items-center gap-3">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-12 h-12 rounded-full border border-surface-container flex items-center justify-center text-primary disabled:opacity-30 hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-12 h-12 rounded-full font-bold text-sm transition-all ${page === i + 1 ? 'bg-primary text-white shadow-lg' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-12 h-12 rounded-full border border-surface-container flex items-center justify-center text-primary disabled:opacity-30 hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
