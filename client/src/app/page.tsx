"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatPrice, type Blog, type FlashSaleCampaign, type Product, type Banner } from "@/lib/api";

export default function Home() {
  const [featuredCampaign, setFeaturedCampaign] = useState<FlashSaleCampaign | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    Promise.all([
      api.getFeaturedFlashSale(),
      api.getBlogs({ isActive: true, limit: 3 }),
      api.getProducts({ isFlashSale: true, limit: 8 }),
      api.getBanners()
    ])
      .then(([flashRes, blogsRes, featuredRes, bannersRes]) => {
        setFeaturedCampaign(flashRes);
        setBlogs(blogsRes.data);
        setFeaturedProducts(featuredRes.data);
        setBanners(bannersRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!featuredCampaign) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(featuredCampaign.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [featuredCampaign]);

  const formatNum = (n: number) => n.toString().padStart(2, "0");

  return (
    <>
      {/* PHẦN 1: HERO BANNER */}
      <section className="mb-12 md:mb-24">
        {banners.length > 0 ? (
          <div className="relative rounded-xl overflow-hidden bg-surface-container-low min-h-[300px] md:min-h-[500px] flex items-center">
            <div className="absolute inset-0 z-0">
              <img className="w-full h-full object-cover opacity-90"
                alt="Banner"
                src={banners[0].imageUrl} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black/70"></div>
            </div>
            <div className="relative z-10 w-full md:w-3/4 lg:w-1/2 p-6 md:p-12 lg:p-20 text-white">
              <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6 rounded-sm">HẬU LÊ COFFEE</span>
              <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6">
                {banners[0].title || "Trải nghiệm Hương vị"}
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6">
                {banners[0].link && (
                  <Link href={banners[0].link}
                    className="text-center cta-gradient text-white px-8 py-3 md:py-4 rounded-md font-bold text-xs md:text-sm shadow-lg hover:scale-105 transition-transform inline-block">
                    KHÁM PHÁ NGAY
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-surface-container-low min-h-[300px] md:min-h-[500px] flex items-center">
            <div className="absolute inset-0 z-0">
              <img className="w-full h-full object-cover opacity-90"
                alt="cafe background"
                src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1600&auto=format&fit=crop" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black/70"></div>
            </div>
            <div className="relative z-10 w-full md:w-3/4 lg:w-1/2 p-6 md:p-12 lg:p-20 text-white">
              <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6 rounded-sm">
                BỘ SƯU TẬP MỚI
              </span>
              <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6">
                Đánh thức vẻ đẹp
                <br /><span className="italic font-light">nguyên bản</span>
              </h1>
              <p className="text-stone-300 text-sm md:text-lg mb-6 md:mb-8 max-w-md leading-relaxed">Khám phá dòng sản phẩm cao cấp giúp phục hồi và trẻ hóa làn da từ sâu bên trong.</p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link href="/products" className="text-center cta-gradient text-white px-8 py-3 md:py-4 rounded-md font-bold text-xs md:text-sm shadow-lg hover:scale-105 transition-transform inline-block">KHÁM PHÁ NGAY</Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* PHẦN SẢN PHẨM NỔI BẬT */}
      <section id="featured-products" className="mb-12 md:mb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
          <div>
            <span className="text-secondary font-bold tracking-widest text-[10px] md:text-xs uppercase">BÁN CHẠY NHẤT</span>
            <h2 className="font-headline text-2xl md:text-4xl font-extrabold text-primary mt-2">Sản phẩm nổi bật</h2>
          </div>
          <Link href="/products?isFlashSale=true" className="text-primary text-sm font-bold flex items-center gap-2 hover:translate-x-2 transition-transform">
            Xem tất cả <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[300px] md:h-[400px] rounded-xl bg-surface-container-lowest/50 animate-pulse border border-outline-variant/30" />
            ))
          ) : featuredProducts.length === 0 ? (
            <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-12 text-on-surface-variant font-medium text-sm border border-dashed rounded-xl">
              Chưa có sản phẩm nổi bật nào.
            </div>
          ) : (
            featuredProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group bg-surface-container-lowest rounded-xl overflow-hidden organic-shadow flex flex-col hover:-translate-y-2 transition-transform duration-300 cursor-pointer border border-outline-variant/30">
                <div className="block aspect-square overflow-hidden bg-surface-container-low relative">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={p.name} src={p.imageUrl || 'https://via.placeholder.com/400'} />
                </div>
                <div className="p-3 md:p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-primary text-sm md:text-base mb-2 group-hover:underline line-clamp-2 leading-snug">{p.name}</h3>
                  <div className="flex flex-col md:flex-row md:items-center justify-between mt-auto gap-2 pt-2">
                    <div className="text-secondary font-bold text-base md:text-lg">{formatPrice(p.price)}</div>
                    <button className="hidden sm:flex bg-primary text-white w-8 h-8 rounded-full hover:bg-primary-container hover:text-primary transition-colors items-center justify-center shadow-md self-end md:self-auto">
                      <span className="material-symbols-outlined text-[16px] md:text-sm">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* PHẦN 2: FLASH SALE */}
      {featuredCampaign && (
        <section id="flash-sale" className="mb-12 md:mb-24">
          <div className="bg-secondary-fixed rounded-xl p-4 md:p-8 lg:p-12 relative overflow-hidden organic-shadow border border-secondary-fixed/50">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-8 md:mb-10 gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-3xl md:text-4xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                  <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-on-secondary-fixed uppercase tracking-tight">{featuredCampaign.name}</h2>
                </div>
                <div className="flex gap-2">
                  <div className="bg-on-secondary-fixed text-white px-2 py-1.5 md:px-3 md:py-2 rounded font-mono font-bold shadow-lg text-sm md:text-base">{formatNum(timeLeft.hours)}</div>
                  <div className="text-on-secondary-fixed font-bold py-1.5 md:py-2">:</div>
                  <div className="bg-on-secondary-fixed text-white px-2 py-1.5 md:px-3 md:py-2 rounded font-mono font-bold shadow-lg text-sm md:text-base">{formatNum(timeLeft.minutes)}</div>
                  <div className="text-on-secondary-fixed font-bold py-1.5 md:py-2">:</div>
                  <div className="bg-on-secondary-fixed text-white px-2 py-1.5 md:px-3 md:py-2 rounded font-mono font-bold shadow-lg animate-pulse text-sm md:text-base">{formatNum(timeLeft.seconds)}</div>
                </div>
              </div>
              <Link className="text-on-secondary-fixed-variant text-sm font-bold border-b-2 border-on-secondary-fixed-variant pb-1 hover:opacity-70 transition-opacity"
                href="/flash-sale">Xem tất cả deal hời</Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-8">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[300px] md:h-[400px] rounded-xl bg-surface-container-lowest/50 animate-pulse" />
                ))
              ) : !featuredCampaign.items || featuredCampaign.items.length === 0 ? (
                <div className="col-span-2 md:col-span-3 text-center py-12 text-on-secondary-fixed-variant font-medium text-sm">
                  Chưa có sản phẩm Flash Sale nào.
                </div>
              ) : (
                featuredCampaign.items
                  .sort((a, b) => b.discountPercentage - a.discountPercentage)
                  .slice(0, 6)
                  .map((item) => {
                    const p = item.product;
                    const salePrice = Number(p.price) * (1 - item.discountPercentage / 100);

                    return (
                      <Link key={p.id} href={`/products/${p.id}`} className="group bg-surface-container-lowest rounded-xl overflow-hidden organic-shadow flex flex-col hover:-translate-y-2 transition-transform duration-300 cursor-pointer">
                        <div className="block aspect-square overflow-hidden bg-surface-container-low relative">
                          <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            alt={p.name} src={p.imageUrl || 'https://via.placeholder.com/400'} />
                          <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-secondary text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded shadow-lg flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] md:text-[14px]">local_fire_department</span>
                            -{item.discountPercentage}%
                          </div>
                        </div>
                        <div className="p-3 md:p-6 flex flex-col flex-1">
                          <h3 className="font-bold text-primary text-sm md:text-lg mb-2 md:mb-4 group-hover:underline line-clamp-2 leading-snug">{p.name}</h3>
                          <div className="flex flex-col md:flex-row md:items-center justify-between mt-auto gap-2">
                            <div>
                              <div className="text-secondary font-bold text-base md:text-2xl">{formatPrice(salePrice)}</div>
                              <div className="text-slate-400 line-through text-[10px] md:text-xs">{formatPrice(p.price)}</div>
                            </div>
                            <button className="hidden sm:flex bg-primary text-white w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-primary-container hover:text-primary transition-colors items-center justify-center shadow-md self-end md:self-auto">
                              <span className="material-symbols-outlined text-[16px] md:text-sm">add_shopping_cart</span>
                            </button>
                          </div>
                        </div>
                      </Link>
                    );
                  })
              )}
            </div>
          </div>
        </section>
      )}

      {/* PHẦN 3: BLOG / TIN TỨC LÀM ĐẸP */}
      <section id="blogs" className="mb-12 md:mb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4">
          <div>
            <span className="text-secondary font-bold tracking-widest text-[10px] md:text-xs uppercase">BẢN TIN CAFE SÁNG</span>
            <h2 className="font-headline text-2xl md:text-4xl font-extrabold text-primary mt-2">Góc nhìn & Tin tức</h2>
          </div>
          <Link href="/blogs" className="text-primary text-sm font-bold flex items-center gap-2 hover:translate-x-2 transition-transform">
            Xem tất cả bài viết <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[300px] md:h-[350px] rounded-xl bg-surface-container-low animate-pulse" />
            ))
          ) : blogs.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 text-center py-12 text-slate-500 bg-surface-container-lowest rounded-xl border border-surface-container border-dashed text-sm">
              Chưa có bài viết nào.
            </div>
          ) : (
            blogs.map((blog) => (
              <Link key={blog.id} href={`/blogs/${blog.id}`} className="group cursor-pointer">
                <article>
                  <div className="aspect-[16/10] rounded-xl overflow-hidden mb-4 md:mb-6 bg-surface-container-low organic-shadow">
                    <img
                      src={blog.imageUrl || "https://images.unsplash.com/photo-1615397323214-729227520e5c?auto=format&fit=crop&q=80&w=800"}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] md:text-xs font-bold text-slate-400 mb-2 md:mb-3 uppercase tracking-wider">
                    <span className="text-secondary">Làm đẹp</span>
                    <span>•</span>
                    <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <h3 className="font-headline text-lg md:text-xl font-bold text-primary mb-2 md:mb-3 group-hover:text-secondary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-slate-600 line-clamp-2 md:line-clamp-3 text-xs md:text-sm leading-relaxed">
                    {blog.excerpt || blog.content.substring(0, 150) + "..."}
                  </p>
                </article>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}
