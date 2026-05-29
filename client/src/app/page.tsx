"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { api, formatPrice, type Blog, type FlashSaleCampaign, type Product, type Banner } from "@/lib/api";
import { CinematicBackground } from "@/components/ui/CinematicBackground";
import { CoffeeSteam } from "@/components/ui/CoffeeSteam";

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

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

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
    <main className="relative min-h-screen text-on-background font-body overflow-x-hidden selection:bg-primary/30">
      <CinematicBackground />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        <motion.div 
          style={{ opacity: heroOpacity, y: heroY }}
          className="text-center z-10 flex flex-col items-center max-w-4xl"
        >
          {/* Coffee Cup Graphic with Steam */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative w-40 h-40 mb-8"
          >
            <CoffeeSteam className="absolute -top-16 left-1/2 -translate-x-1/2" />
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-surface-variant via-[#2C1E16] to-[#4A3B12] shadow-[0_0_50px_rgba(212,175,55,0.2)] border border-primary/20 flex items-center justify-center p-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-glass rounded-full"></div>
              <span className="material-symbols-outlined text-6xl text-primary animate-float">local_cafe</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 border border-primary/30 bg-primary/5 text-primary text-xs font-bold tracking-[0.3em] uppercase mb-6 rounded-full backdrop-blur-md">
              夜のカフェ • YORU NO CAFE
            </span>
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-medium leading-tight mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50 tracking-tight">
              Hương Vị Của <br />
              <span className="italic text-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">Sương Đêm</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              Khám phá không gian tĩnh lặng mang đậm phong cách Nhật Bản đương đại. Nơi thời gian ngừng trôi, chỉ còn lại bạn và tách cafe hoàn hảo.
            </p>
            
            <Link href="/products" className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden rounded-full bg-primary text-on-primary font-bold text-sm tracking-widest hover:scale-105 transition-transform duration-300">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              <span className="relative flex items-center gap-2">
                TRẢI NGHIỆM NGAY
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.2em] text-primary/70 uppercase">Cuộn xuống</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary/70 to-transparent"></div>
        </motion.div>
      </section>

      {/* FEATURED PRODUCTS SECTION */}
      <section id="featured-products" className="py-24 md:py-32 px-6 max-w-7xl mx-auto relative z-10">
        <FadeIn className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-xl">
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary"></span>
              TINH HOA MENU
            </span>
            <h2 className="font-headline text-3xl md:text-5xl font-medium text-white mt-4">Nghệ thuật pha chế</h2>
          </div>
          <Link href="/products" className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm uppercase tracking-wider">
            Xem thực đơn 
            <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">east</span>
          </Link>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[400px] rounded-2xl bg-surface/40 backdrop-blur-sm border border-outline-variant/10 animate-pulse" />
            ))
          ) : featuredProducts.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 text-center py-20 text-on-surface-variant font-light text-sm border border-outline-variant/10 rounded-2xl bg-surface/20 backdrop-blur-sm">
              Chưa có sản phẩm nổi bật nào.
            </div>
          ) : (
            featuredProducts.map((p, index) => (
              <FadeIn key={p.id} delay={index * 0.1}>
                <Link href={`/products/${p.id}`} className="group block bg-surface/30 backdrop-blur-md rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                  <div className="aspect-[4/5] overflow-hidden bg-surface-container relative p-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
                    <img 
                      className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal"
                      alt={p.name} 
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop'} 
                    />
                    <div className="absolute bottom-4 left-4 z-20">
                      <h3 className="font-headline font-medium text-white text-lg md:text-xl mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                      <div className="text-primary font-bold text-sm tracking-wider">{formatPrice(p.price)}</div>
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
        <section id="flash-sale" className="py-24 md:py-32 relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-secondary-container/30 backdrop-blur-lg border-y border-white/5"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <FadeIn className="flex flex-col lg:flex-row justify-between items-center mb-16 gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                  <span className="material-symbols-outlined text-primary text-3xl animate-pulse">dark_mode</span>
                </div>
                <div>
                  <h2 className="font-headline text-3xl md:text-5xl font-medium text-white mb-2">{featuredCampaign.name || "Midnight Deals"}</h2>
                  <p className="text-primary tracking-[0.2em] text-xs uppercase">Ưu đãi độc quyền giữa đêm</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-background border border-white/10 rounded-xl text-white font-headline text-xl md:text-2xl shadow-xl">{formatNum(timeLeft.hours)}</div>
                  <span className="text-[10px] text-on-surface-variant uppercase mt-2 tracking-widest">Giờ</span>
                </div>
                <div className="text-white/30 font-bold text-2xl pt-3">:</div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-background border border-white/10 rounded-xl text-white font-headline text-xl md:text-2xl shadow-xl">{formatNum(timeLeft.minutes)}</div>
                  <span className="text-[10px] text-on-surface-variant uppercase mt-2 tracking-widest">Phút</span>
                </div>
                <div className="text-white/30 font-bold text-2xl pt-3">:</div>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-primary/20 border border-primary/30 rounded-xl text-primary font-headline text-xl md:text-2xl shadow-[0_0_20px_rgba(212,175,55,0.2)] animate-pulse">{formatNum(timeLeft.seconds)}</div>
                  <span className="text-[10px] text-primary/70 uppercase mt-2 tracking-widest">Giây</span>
                </div>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[400px] rounded-2xl bg-background/50 animate-pulse border border-white/5" />
                ))
              ) : !featuredCampaign.items || featuredCampaign.items.length === 0 ? (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-20 text-on-surface-variant font-light text-sm">
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
                        <Link href={`/products/${p.id}`} className="group bg-background/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 flex flex-col hover:-translate-y-2 hover:border-primary/40 transition-all duration-500 hover:shadow-[0_15px_50px_rgba(0,0,0,0.6)]">
                          <div className="aspect-video overflow-hidden relative">
                            <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                              alt={p.name} src={p.imageUrl || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop'} />
                            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                            
                            <div className="absolute top-4 left-4 bg-error text-on-error text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md bg-error/90">
                              <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                              GIẢM {item.discountPercentage}%
                            </div>
                          </div>
                          
                          <div className="p-6 md:p-8 flex flex-col flex-1 relative">
                            <h3 className="font-headline font-medium text-white text-lg md:text-xl mb-4 group-hover:text-primary transition-colors">{p.name}</h3>
                            <div className="flex items-end justify-between mt-auto">
                              <div>
                                <div className="text-primary font-headline text-2xl md:text-3xl font-medium">{formatPrice(salePrice)}</div>
                                <div className="text-on-surface-variant line-through text-xs mt-1">{formatPrice(p.price)}</div>
                              </div>
                              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-on-primary transition-colors">
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
               <Link href="/flash-sale" className="inline-block border-b border-primary text-primary pb-1 text-sm tracking-widest uppercase hover:text-white hover:border-white transition-colors">
                 Khám phá toàn bộ ưu đãi
               </Link>
            </div>
          </div>
        </section>
      )}

      {/* BLOG SECTION */}
      <section id="blogs" className="py-24 md:py-32 px-6 max-w-7xl mx-auto relative z-10">
        <FadeIn className="flex flex-col items-center text-center mb-16">
          <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase flex items-center gap-3 justify-center mb-4">
            <span className="w-8 h-[1px] bg-primary"></span>
            TẠP CHÍ CAFE
            <span className="w-8 h-[1px] bg-primary"></span>
          </span>
          <h2 className="font-headline text-3xl md:text-5xl font-medium text-white">Câu Chuyện & Cảm Hứng</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-[450px] rounded-2xl bg-surface/30 animate-pulse border border-white/5" />
            ))
          ) : blogs.length === 0 ? (
            <div className="col-span-1 md:col-span-3 text-center py-20 text-on-surface-variant font-light text-sm border border-white/5 rounded-2xl bg-surface/20">
              Chưa có bài viết nào.
            </div>
          ) : (
            blogs.map((blog, index) => (
              <FadeIn key={blog.id} delay={index * 0.1}>
                <Link href={`/blogs/${blog.id}`} className="group block h-full">
                  <article className="h-full flex flex-col">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative">
                      <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                      <img
                        src={blog.imageUrl || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800"}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-primary mb-4 uppercase tracking-[0.15em]">
                      <span>Trải nghiệm</span>
                      <span className="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                      <span className="text-on-surface-variant">{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h3 className="font-headline text-xl md:text-2xl font-medium text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3 font-light mb-6">
                      {blog.excerpt || blog.content.substring(0, 150) + "..."}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest group-hover:text-primary transition-colors">
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
