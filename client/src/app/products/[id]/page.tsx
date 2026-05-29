"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { ErrorMessage } from "../../../components/ui";
import { api, formatPrice, type Product, type Review } from "../../../lib/api";
import { useCart } from "../../../components/CartProvider";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewMeta, setReviewMeta] = useState({ averageRating: 0, totalReviews: 0 });
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState("");

  const load = async () => {
    try {
      const promises: any[] = [
        api.getProduct(productId),
        api.getProductReviews(productId)
      ];
      
      if (user) {
        promises.push(api.checkReviewEligibility(productId).catch(() => ({ canReview: false })));
      }

      const results = await Promise.all(promises);
      const productData = results[0];
      const reviewData = results[1];
      
      setProduct(productData);
      setReviews(reviewData.data);
      setReviewMeta(reviewData.meta);

      if (user && results[2]) {
        setCanReview(results[2].canReview);
        if (results[2].reason) {
          setReviewReason(results[2].reason);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load product");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const addToCart = async () => {
    setMessage("");
    setError("");

    try {
      await api.addCartItem({ productId, quantity });
      setMessage("Đã thêm vào giỏ hàng");
      refreshCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm vào giỏ hàng");
    }
  };

  const handleBuyNow = async () => {
    try {
      await api.addCartItem({ productId, quantity });
      refreshCart();
      window.location.href = "/cart";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thực hiện mua ngay");
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await api.createProductReview(productId, { rating, comment });
      setComment("");
      setRating(5);
      setMessage("Đánh giá đã được gửi");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi đánh giá");
    }
  };

  const formatNum = (n: number) => n.toString().padStart(2, "0");

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <ErrorMessage message={error} />
        {!error && <p className="text-sm text-slate-600">Đang tải sản phẩm...</p>}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
        {/* IMAGE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-luxury-surface/50 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-4 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 backdrop-blur-md relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-luxury-bg/90 via-luxury-bg/20 to-transparent z-10 pointer-events-none"></div>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} className="w-full h-full object-contain mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 transition-all duration-700 z-0" alt={product.name} />
            ) : (
              <div className="flex h-full items-center justify-center text-luxury-text-variant z-0">No image</div>
            )}
          </div>
        </div>

        {/* INFO */}
        <div className="lg:col-span-5 space-y-4 md:space-y-8">
          <div>
            <span className="text-luxury-primary font-semibold uppercase text-xs md:text-sm tracking-widest">
              {product.brand ?? product.category?.name ?? "Sản phẩm"}
            </span>

            <h1 className="text-xl md:text-4xl font-headline font-bold text-white mt-2">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex text-luxury-primary">
               {[1, 2, 3, 4, 5].map((star) => (
                 <span
                   className="material-symbols-outlined text-[14px] md:text-sm"
                   style={{ fontVariationSettings: "'FILL' 1" }}
                   key={star}
                 >
                   star
                 </span>
               ))}
             </div>
             <span className="text-xs md:text-sm font-medium text-luxury-text-variant">
                {reviewMeta.averageRating} / 5 ({reviewMeta.totalReviews} đánh giá)
             </span>
          </div>

          <p className="hidden md:block text-sm md:text-lg leading-relaxed text-luxury-text-variant font-light">
            {product.description ?? "Chưa có mô tả cho sản phẩm này."}
          </p>

          <ErrorMessage message={error} />
          {message && (
            <div className="rounded-md border border-luxury-primary/30 bg-luxury-primary/10 px-3 py-2 text-sm text-luxury-primary">
              {message}
            </div>
          )}
        </div>

        {/* BUY */}
        <div className="lg:col-span-3">
          <div className="bg-luxury-surface/50 rounded-xl p-6 space-y-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 backdrop-blur-md">
            <span className="text-sm text-luxury-text-variant font-medium">Giá sản phẩm</span>
            {product.flashSaleItems?.[0] ? (() => {
              const item = product.flashSaleItems[0];
              const now = new Date();
              const end = new Date(item.campaign.endTime);
              const isEnded = now > end;

              if (isEnded) return (
                <div className="text-2xl md:text-3xl font-headline font-bold text-luxury-primary tracking-wider">
                  {formatPrice(product.price)}
                </div>
              );

              return (
                <div className="space-y-3 p-4 rounded-xl border bg-luxury-primary/5 border-luxury-primary/20">
                  <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-luxury-primary">
                    <span className="material-symbols-outlined text-[16px] animate-pulse">bolt</span>
                    Flash Sale
                  </div>
                  <div className="flex items-end gap-2 md:gap-3">
                    <div className="text-2xl md:text-4xl font-headline font-bold text-luxury-primary tracking-wider">
                      {formatPrice(Number(product.price) * (1 - item.discountPercentage / 100))}
                    </div>
                    <div className="flex flex-col mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-bold mb-1 w-fit text-luxury-bg bg-luxury-primary">
                        -{item.discountPercentage}%
                      </span>
                      <span className="text-xs md:text-sm text-luxury-text-variant line-through font-medium">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="text-2xl md:text-3xl font-headline font-bold text-luxury-primary tracking-wider">
                {formatPrice(product.price)}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-luxury-text-variant">Số lượng</label>
              <input
                className="rounded-lg border border-luxury-border bg-luxury-surface px-3 py-2 w-16 md:w-20 focus:ring-1 focus:ring-luxury-primary focus:outline-none text-center font-bold text-white text-sm"
                min="1"
                max={product.stock}
                onChange={(event) => setQuantity(Number(event.target.value))}
                type="number"
                value={quantity}
              />
              <span className="text-[10px] md:text-xs text-luxury-text-variant">Còn {product.stock} sp</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 md:py-4 bg-luxury-primary text-luxury-bg font-bold rounded-lg hover:bg-luxury-primary/80 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50 text-sm md:text-base uppercase tracking-wider"
                disabled={!product.isActive || product.stock <= 0}
                onClick={handleBuyNow}
                type="button"
              >
                Mua ngay
              </button>

              <button
                className="w-full py-3 md:py-4 bg-transparent text-luxury-primary font-bold rounded-lg hover:bg-luxury-primary hover:text-luxury-bg transition-colors disabled:opacity-50 text-sm md:text-base border border-luxury-primary/50 uppercase tracking-wider"
                disabled={!product.isActive || product.stock <= 0}
                onClick={addToCart}
                type="button"
              >
                Thêm vào giỏ hàng
              </button>
            </div>

            <div className="text-[10px] md:text-sm text-luxury-text-variant pt-4 border-t border-luxury-border">
              <div className="flex items-start gap-3 mb-2">
                 <span className="material-symbols-outlined text-luxury-primary text-[18px] md:text-[24px]">local_shipping</span>
                 <div>
                    <p className="font-semibold text-white">Giao hàng dự kiến</p>
                    <p>Trong 2-3 ngày làm việc</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Mobile Description Block */}
          <div className="md:hidden mt-6 bg-luxury-surface/50 rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 backdrop-blur-md space-y-3">
            <h3 className="font-bold text-luxury-primary text-sm flex items-center gap-2 tracking-wider uppercase">
              <span className="material-symbols-outlined text-base">description</span>
              Mô tả sản phẩm
            </h3>
            <p className="text-xs leading-relaxed text-luxury-text-variant font-light">
              {product.description ?? "Chưa có mô tả cho sản phẩm này."}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16 md:mt-32 grid gap-12 lg:grid-cols-[1fr_400px] relative z-10">
        <div className="order-2 lg:order-1">
          <h2 className="mb-6 md:mb-8 text-2xl md:text-3xl font-headline font-bold text-luxury-primary text-center md:text-left">Đánh giá khách hàng</h2>
          {reviews.length === 0 ? (
            <div className="bg-luxury-surface/30 p-8 rounded-xl text-center text-luxury-text-variant text-sm border border-luxury-border border-dashed backdrop-blur-md">
               Chưa có đánh giá nào cho sản phẩm này.
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {reviews.map((review) => (
                <article className="rounded-xl bg-luxury-surface/50 p-4 md:p-6 shadow-[0_5px_15px_rgba(0,0,0,0.3)] border border-white/5 backdrop-blur-md" key={review.id}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-luxury-primary/10 text-luxury-primary flex items-center justify-center font-bold font-headline uppercase text-xs md:text-base border border-luxury-primary/30">
                          {review.userName?.[0] || 'U'}
                       </div>
                       <div>
                          <p className="font-bold text-white text-sm md:text-base">{review.userName}</p>
                          <div className="flex text-luxury-primary text-[10px] md:text-xs">
                             {Array.from({ length: 5 }).map((_, i) => (
                               <span
                                 className="material-symbols-outlined"
                                 style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}
                                 key={i}
                               >
                                 star
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                  <p className="text-luxury-text-variant leading-relaxed text-xs md:text-sm font-light">{review.comment ?? "Không có bình luận."}</p>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="order-1 lg:order-2">
           <form className="space-y-6 rounded-xl bg-luxury-surface/50 p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] lg:sticky lg:top-24 border border-white/5 backdrop-blur-md" onSubmit={submitReview}>
             <h2 className="font-headline font-bold text-lg md:text-xl text-luxury-primary">Viết đánh giá của bạn</h2>
             
             {!user ? (
               <p className="text-xs text-luxury-text-variant p-3 bg-luxury-surface border border-luxury-border rounded-md">Vui lòng đăng nhập để đánh giá.</p>
             ) : !canReview ? (
               <p className="text-xs text-luxury-primary p-3 bg-luxury-primary/10 border border-luxury-primary/20 rounded-md">
                 {reviewReason || "Bạn chưa thể đánh giá sản phẩm này."}
               </p>
             ) : (
               <>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs md:text-sm font-semibold mb-2 text-luxury-text-variant">Đánh giá sao</label>
                       <select
                         className="w-full rounded-lg border border-luxury-border bg-luxury-surface px-3 md:px-4 py-2 md:py-3 text-sm focus:ring-1 focus:ring-luxury-primary outline-none text-white"
                         onChange={(event) => setRating(Number(event.target.value))}
                         value={rating}
                       >
                         {[5, 4, 3, 2, 1].map((value) => (
                           <option key={value} value={value}>
                             {value} Sao
                           </option>
                         ))}
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs md:text-sm font-semibold mb-2 text-luxury-text-variant">Nội dung đánh giá</label>
                       <textarea
                         className="w-full rounded-lg border border-luxury-border bg-luxury-surface px-3 md:px-4 py-2 md:py-3 text-sm focus:ring-1 focus:ring-luxury-primary outline-none text-white"
                         onChange={(event) => setComment(event.target.value)}
                         rows={4}
                         placeholder="Chia sẻ trải nghiệm của bạn..."
                         value={comment}
                       />
                    </div>
                 </div>

                 <button
                   className="w-full bg-luxury-primary px-4 py-3 md:py-4 font-bold text-luxury-bg rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:bg-luxury-primary/80 transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
                   type="submit"
                 >
                   Gửi đánh giá
                 </button>
               </>
             )}
           </form>
        </div>
      </section>
    </div>
  );
}
