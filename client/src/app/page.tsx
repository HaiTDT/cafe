"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { api, formatPrice, type Blog, type FlashSaleCampaign, type Product, type Banner } from "@/lib/api";
import { CinematicBackground } from "@/components/ui/CinematicBackground";

// --- Fade In Animation Helper ---
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

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
    <main className="relative min-h-screen text-luxury-text bg-luxury-bg font-body overflow-x-hidden selection:bg-luxury-primary/30">
      <CinematicBackground />

      {/* HERO BANNER - Khôi phục từ giao diện cũ nhưng dùng style dark luxury */}
      <section className="mb-12 md:mb-24 relative z-10 pt-24 px-6 max-w-7xl mx-auto">
        {banners.length > 0 ? (
          <div className="relative rounded-2xl overflow-hidden bg-luxury-surface-low min-h-[300px] md:min-h-[500px] flex items-center organic-shadow border border-white/5">
            <div className="absolute inset-0 z-0">
              <img className="w-full h-full object-cover opacity-70 mix-blend-luminosity"
                alt="Banner"
                src={banners[0].imageUrl} />
              <div className="absolute inset-0 bg-gradient-to-r from-luxury-bg/90 via-luxury-bg/60 to-transparent"></div>
            </div>
            <div className="relative z-10 w-full md:w-3/4 lg:w-1/2 p-6 md:p-12 lg:p-20 text-luxury-text">
              <span className="inline-block px-3 py-1 bg-luxury-primary text-luxury-bg text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6 rounded-sm">HẬU LÊ COFFEE</span>
              <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6">
                {banners[0].title || "Trải nghiệm Hương vị"}
              </h1>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-6">
                {banners[0].link && (
                  <Link href={banners[0].link}
                    className="text-center bg-luxury-primary text-luxury-bg px-8 py-3 md:py-4 rounded-md font-bold text-xs md:text-sm shadow-lg hover:scale-105 transition-transform inline-block">
                    KHÁM PHÁ NGAY
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-luxury-surface-low min-h-[300px] md:min-h-[500px] flex items-center organic-shadow border border-white/5">
            <div className="absolute inset-0 z-0">
              <img className="w-full h-full object-cover opacity-70 mix-blend-luminosity"
                alt="cafe background"
                src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1600&auto=format&fit=crop" />
              <div className="absolute inset-0 bg-gradient-to-r from-luxury-bg/90 via-luxury-bg/60 to-transparent"></div>
            </div>
            <div className="relative z-10 w-full md:w-3/4 lg:w-1/2 p-6 md:p-12 lg:p-20 text-luxury-text">
              <span className="inline-block px-3 py-1 bg-luxury-primary text-luxury-bg text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6 rounded-sm">
                BỘ SƯU TẬP MỚI
              </span>
              <h1 className="font-headline text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6">
                Đánh thức vẻ đẹp
                <br /><span className="italic font-light">nguyên bản</span>
              </h1>
              <p className="text-luxury-text-variant text-sm md:text-lg mb-6 md:mb-8 max-w-md leading-relaxed">Khám phá dòng sản phẩm cao cấp giúp phục hồi và trẻ hóa làn da từ sâu bên trong.</p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link href="/products" className="text-center bg-luxury-primary text-luxury-bg px-8 py-3 md:py-4 rounded-md font-bold text-xs md:text-sm shadow-lg hover:scale-105 transition-transform inline-block">KHÁM PHÁ NGAY</Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* HERITAGE STORY SECTION */}
      <section className="py-24 md:py-40 px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <FadeIn className="order-2 lg:order-1 relative">
            <div className="aspect-[4/5] rounded-tl-[100px] rounded-br-[100px] overflow-hidden relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-luxury-primary/20">
              <div className="absolute inset-0 bg-luxury-bg/30 z-10 hover:bg-transparent transition-colors duration-700"></div>
              <img 
                src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=1600&auto=format&fit=crop" 
                alt="Roasting Process" 
                className="w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-[2000ms] opacity-80"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-luxury-primary/10 rounded-full blur-[40px] z-0 pointer-events-none"></div>
          </FadeIn>
          
          <FadeIn delay={0.2} className="order-1 lg:order-2 flex flex-col justify-center">
            <span className="text-luxury-primary font-bold tracking-[0.3em] text-xs uppercase flex items-center gap-4 mb-8">
              <span className="w-12 h-[1px] bg-luxury-primary/70"></span>
              Nghệ thuật nguyên bản
            </span>
            <h2 className="font-headline text-4xl md:text-6xl font-medium text-white mb-8 leading-[1.1]">
              Hành Trình Của <br />
              <span className="italic text-luxury-primary font-light">Sự Tinh Tế</span>
            </h2>
            <p className="text-luxury-text-variant text-base md:text-lg mb-8 leading-relaxed font-light max-w-lg">
              Mỗi giọt cà phê tại Hậu Lê là kết tinh của một quy trình khắt khe từ việc tuyển chọn những hạt cà phê thượng hạng nhất, đến nghệ thuật rang xay độc quyền. Chúng tôi tin rằng, một ly cà phê ngon không chỉ là thức uống, mà là một tác phẩm nghệ thuật đánh thức mọi giác quan.
            </p>
            <div className="flex items-center gap-6 mt-4">
              <Link href="/about" className="group flex items-center gap-3 text-white hover:text-luxury-primary transition-colors text-xs uppercase tracking-[0.2em] font-bold">
                Câu chuyện của chúng tôi
                <span className="w-8 h-[1px] bg-white group-hover:bg-luxury-primary group-hover:w-12 transition-all duration-300"></span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section id="featured-products" className="py-24 md:py-40 px-6 max-w-7xl mx-auto relative z-10">
        <FadeIn className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-xl">
            <span className="text-luxury-primary font-bold tracking-[0.2em] text-xs uppercase flex items-center gap-3">
              <span className="w-8 h-[1px] bg-luxury-primary"></span>
              TINH HOA MENU
            </span>
            <h2 className="font-headline text-3xl md:text-5xl font-medium text-white mt-4">Nghệ thuật pha chế</h2>
          </div>
          <Link href="/products" className="group flex items-center gap-2 text-luxury-text-variant hover:text-luxury-primary transition-colors text-sm uppercase tracking-wider">
            Xem thực đơn 
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">east</span>
          </Link>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[400px] rounded-2xl bg-luxury-surface/40 backdrop-blur-sm border border-luxury-border/10 animate-pulse" />
            ))
          ) : featuredProducts.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-20 text-luxury-text-variant font-light text-sm border border-luxury-border/10 rounded-2xl bg-luxury-surface/20 backdrop-blur-sm">
              Chưa có sản phẩm nổi bật nào.
            </div>
          ) : (
            featuredProducts.map((p, index) => (
              <FadeIn key={p.id} delay={index * 0.1}>
                <Link href={`/products/${p.id}`} className="group block relative rounded-2xl overflow-hidden transition-all duration-700 hover:-translate-y-3">
                  {/* Outer Glow on Hover */}
                  <div className="absolute inset-0 bg-luxury-primary/0 group-hover:bg-luxury-primary/20 blur-xl transition-all duration-700 rounded-2xl z-0"></div>
                  
                  <div className="aspect-[4/5] overflow-hidden bg-luxury-surface/50 backdrop-blur-md relative p-6 flex flex-col items-center justify-center border border-white/5 group-hover:border-luxury-primary/30 transition-colors duration-500 rounded-2xl z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-gradient-to-t from-luxury-bg/90 via-luxury-bg/20 to-transparent z-10"></div>
                    <img 
                      className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-[1.5s] opacity-70 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal ease-out"
                      alt={p.name} 
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop'} 
                    />
                    
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-luxury-bg/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-luxury-text opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-20 hover:bg-luxury-primary hover:text-luxury-bg hover:border-luxury-primary">
                      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="font-headline font-medium text-white text-lg md:text-xl mb-2 group-hover:text-luxury-primary transition-colors leading-snug">{p.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-luxury-primary font-bold text-sm tracking-widest">{formatPrice(p.price)}</div>
                        <div className="w-8 h-[1px] bg-luxury-text-variant/50 group-hover:w-12 group-hover:bg-luxury-primary transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))
          )}
        </div>
      </section>

      {/* FLASH SALE - MIDNIGHT DEALS */}
      {featuredCampaign && (
        <section id="flash-sale" className="py-32 md:py-40 relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-luxury-secondary/30 backdrop-blur-lg border-y border-white/5"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <FadeIn className="flex flex-col lg:flex-row justify-between items-center mb-16 gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-16 h-16 rounded-full bg-luxury-primary/10 flex items-center justify-center border border-luxury-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                  <span className="material-symbols-outlined text-luxury-primary text-3xl animate-pulse">dark_mode</span>
                </div>
                <div>
                  <h2 className="font-headline text-3xl md:text-5xl font-medium text-white mb-2">{featuredCampaign.name || "Midnight Deals"}</h2>
                  <p className="text-luxury-primary tracking-[0.2em] text-xs uppercase">Ưu đãi độc quyền giữa đêm</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-luxury-bg border border-white/10 rounded-xl text-white font-headline text-xl md:text-2xl shadow-xl">{formatNum(timeLeft.hours)}</div>
                  <span className="text-[10px] text-luxury-text-variant uppercase mt-2 tracking-widest">Giờ</span>
                </div>
                <div className="text-white/30 font-bold text-2xl pt-3">:</div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-luxury-bg border border-white/10 rounded-xl text-white font-headline text-xl md:text-2xl shadow-xl">{formatNum(timeLeft.minutes)}</div>
                  <span className="text-[10px] text-luxury-text-variant uppercase mt-2 tracking-widest">Phút</span>
                </div>
                <div className="text-white/30 font-bold text-2xl pt-3">:</div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-luxury-primary/20 border border-luxury-primary/30 rounded-xl text-luxury-primary font-headline text-xl md:text-2xl shadow-[0_0_20px_rgba(212,175,55,0.2)] animate-pulse">{formatNum(timeLeft.seconds)}</div>
                  <span className="text-[10px] text-luxury-primary/70 uppercase mt-2 tracking-widest">Giây</span>
                </div>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[400px] rounded-2xl bg-luxury-bg/50 animate-pulse border border-white/5" />
                ))
              ) : !featuredCampaign.items || featuredCampaign.items.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-20 text-luxury-text-variant font-light text-sm">
                  Chưa có sản phẩm ưu đãi nào.
                </div>
              ) : (
                featuredCampaign.items
                  .sort((a, b) => b.discountPercentage - a.discountPercentage)
                  .slice(0, 3)
                  .map((item, index) => {
                    const p = item.product;
                    const salePrice = Number(p.price) * (1 - item.discountPercentage / 100);

                    return (
                      <FadeIn key={p.id} delay={index * 0.15}>
                        <Link href={`/products/${p.id}`} className="group bg-luxury-bg/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 flex flex-col hover:-translate-y-2 hover:border-luxury-primary/40 transition-all duration-500 hover:shadow-[0_15px_50px_rgba(0,0,0,0.6)]">
                          <div className="aspect-video overflow-hidden relative">
                            <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                              alt={p.name} src={p.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop'} />
                            <div className="absolute inset-0 bg-gradient-to-t from-luxury-bg to-transparent"></div>
                            
                            <div className="absolute top-4 left-4 bg-error text-on-error text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md bg-error/90">
                              <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                              GIẢM {item.discountPercentage}%
                            </div>
                          </div>
                          
                          <div className="p-6 md:p-8 flex flex-col flex-1 relative">
                            <h3 className="font-headline font-medium text-white text-lg md:text-xl mb-4 group-hover:text-luxury-primary transition-colors">{p.name}</h3>
                            <div className="flex items-end justify-between mt-auto">
                              <div>
                                <div className="text-luxury-primary font-headline text-2xl md:text-3xl font-medium">{formatPrice(salePrice)}</div>
                                <div className="text-luxury-text-variant line-through text-xs mt-1">{formatPrice(p.price)}</div>
                              </div>
                              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-luxury-primary group-hover:border-luxury-primary group-hover:text-luxury-bg transition-colors">
                                <span className="material-symbols-outlined text-sm">east</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </FadeIn>
                    );
                  })
              )}
            </div>
            
            <div className="mt-16 text-center">
               <Link href="/flash-sale" className="inline-block border-b border-luxury-primary text-luxury-primary pb-1 text-sm tracking-widest uppercase hover:text-white hover:border-white transition-colors">
                 Khám phá toàn bộ ưu đãi
               </Link>
            </div>
          </div>
        </section>
      )}

      {/* BLOG SECTION */}
      <section id="blogs" className="py-32 md:py-40 px-6 max-w-7xl mx-auto relative z-10">
        <FadeIn className="flex flex-col items-center text-center mb-16">
          <span className="text-luxury-primary font-bold tracking-[0.2em] text-xs uppercase flex items-center gap-3 justify-center mb-4">
            <span className="w-8 h-[1px] bg-luxury-primary"></span>
            TẠP CHÍ CAFE
            <span className="w-8 h-[1px] bg-luxury-primary"></span>
          </span>
          <h2 className="font-headline text-3xl md:text-5xl font-medium text-white">Câu Chuyện & Cảm Hứng</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[450px] rounded-2xl bg-luxury-surface/30 animate-pulse border border-white/5" />
            ))
          ) : blogs.length === 0 ? (
            <div className="col-span-1 md:col-span-3 text-center py-20 text-luxury-text-variant font-light text-sm border border-white/5 rounded-2xl bg-luxury-surface/20">
              Chưa có bài viết nào.
            </div>
          ) : (
            blogs.map((blog, index) => (
              <FadeIn key={blog.id} delay={index * 0.1}>
                <Link href={`/blogs/${blog.id}`} className="group block h-full">
                  <article className="h-full flex flex-col">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative">
                      <div className="absolute inset-0 bg-luxury-bg/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                      <img
                        src={blog.imageUrl || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800"}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-luxury-primary mb-4 uppercase tracking-[0.15em]">
                      <span>Trải nghiệm</span>
                      <span className="w-1 h-1 rounded-full bg-luxury-text-variant"></span>
                      <span className="text-luxury-text-variant">{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h3 className="font-headline text-xl md:text-2xl font-medium text-white mb-3 group-hover:text-luxury-primary transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-luxury-text-variant text-sm leading-relaxed line-clamp-3 font-light mb-6">
                      {blog.excerpt || blog.content.substring(0, 150) + "..."}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest group-hover:text-luxury-primary transition-colors">
                      Đọc tiếp <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span>
                    </div>
                  </article>
                </Link>
              </FadeIn>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
