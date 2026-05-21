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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* IMAGE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden aspect-square flex items-center justify-center p-4 md:p-8 organic-shadow border border-stone-100">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} className="w-full h-full object-contain" alt={product.name} />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No image</div>
            )}
          </div>
        </div>

        {/* INFO */}
        <div className="lg:col-span-5 space-y-4 md:space-y-8">
          <div>
            <span className="text-primary font-semibold uppercase text-xs md:text-sm">
              {product.brand ?? product.category?.name ?? "Sản phẩm"}
            </span>

            <h1 className="text-xl md:text-4xl font-headline font-bold text-on-surface mt-1">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex text-yellow-500">
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
             <span className="text-xs md:text-sm font-medium text-on-surface-variant">
                {reviewMeta.averageRating} / 5 ({reviewMeta.totalReviews} đánh giá)
             </span>
          </div>

          <p className="hidden md:block text-sm md:text-lg leading-relaxed text-on-surface-variant">
            {product.description ?? "Chưa có mô tả cho sản phẩm này."}
          </p>

          <ErrorMessage message={error} />
          {message && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}
        </div>

        {/* BUY */}
        <div className="lg:col-span-3">
          <div className="bg-surface-container-lowest rounded-xl p-6 space-y-6 organic-shadow border border-stone-100">
            <span className="text-sm text-on-surface-variant font-medium">Giá sản phẩm</span>
            {product.flashSaleItems?.[0] ? (() => {
              const item = product.flashSaleItems[0];
              const now = new Date();
              const end = new Date(item.campaign.endTime);
              const isEnded = now > end;

              if (isEnded) return (
                <div className="text-2xl md:text-3xl font-headline font-bold text-primary">
                  {formatPrice(product.price)}
                </div>
              );

              return (
                <div className="space-y-3 p-4 rounded-xl border bg-orange-50 border-orange-100">
                  <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-orange-600">
                    <span className="material-symbols-outlined text-[16px] animate-pulse">bolt</span>
                    Flash Sale
                  </div>
                  <div className="flex items-end gap-2 md:gap-3">
                    <div className="text-2xl md:text-4xl font-headline font-bold text-orange-600">
                      {formatPrice(Number(product.price) * (1 - item.discountPercentage / 100))}
                    </div>
                    <div className="flex flex-col mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-bold mb-1 w-fit text-white bg-orange-500">
                        -{item.discountPercentage}%
                      </span>
                      <span className="text-xs md:text-sm text-slate-400 line-through font-medium">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="text-2xl md:text-3xl font-headline font-bold text-primary">
                {formatPrice(product.price)}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-on-surface-variant">Số lượng</label>
              <input
                className="rounded-lg border border-outline-variant bg-white px-3 py-2 w-16 md:w-20 focus:ring-primary text-center font-bold text-on-surface text-sm"
                min="1"
                max={product.stock}
                onChange={(event) => setQuantity(Number(event.target.value))}
                type="number"
                value={quantity}
              />
              <span className="text-[10px] md:text-xs text-on-surface-variant">Còn {product.stock} sp</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 md:py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 text-sm md:text-base"
                disabled={!product.isActive || product.stock <= 0}
                onClick={handleBuyNow}
                type="button"
              >
                Mua ngay
              </button>

              <button
                className="w-full py-3 md:py-4 bg-stone-100 text-stone-900 font-bold rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50 text-sm md:text-base"
                disabled={!product.isActive || product.stock <= 0}
                onClick={addToCart}
                type="button"
              >
                Thêm vào giỏ hàng
              </button>
            </div>

            <div className="text-[10px] md:text-sm text-on-surface-variant pt-4 border-t border-stone-100">
              <div className="flex items-start gap-3 mb-2">
                 <span className="material-symbols-outlined text-primary text-[18px] md:text-[24px]">local_shipping</span>
                 <div>
                    <p className="font-semibold text-on-surface">Giao hàng dự kiến</p>
                    <p>Trong 2-3 ngày làm việc</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Mobile Description Block */}
          <div className="md:hidden mt-6 bg-surface-container-lowest rounded-xl p-6 organic-shadow border border-stone-100 space-y-3">
            <h3 className="font-bold text-primary text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">description</span>
              Mô tả sản phẩm
            </h3>
            <p className="text-xs leading-relaxed text-on-surface-variant">
              {product.description ?? "Chưa có mô tả cho sản phẩm này."}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16 md:mt-32 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="order-2 lg:order-1">
          <h2 className="mb-6 md:mb-8 text-2xl md:text-3xl font-headline font-bold text-primary text-center md:text-left">Đánh giá khách hàng</h2>
          {reviews.length === 0 ? (
            <div className="bg-stone-50 p-8 rounded-xl text-center text-stone-500 text-sm border border-stone-100 border-dashed">
               Chưa có đánh giá nào cho sản phẩm này.
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {reviews.map((review) => (
                <article className="rounded-xl bg-white p-4 md:p-6 shadow-sm border border-stone-100" key={review.id}>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold font-headline uppercase text-xs md:text-base">
                          {review.userName?.[0] || 'U'}
                       </div>
                       <div>
                          <p className="font-bold text-stone-900 text-sm md:text-base">{review.userName}</p>
                          <div className="flex text-yellow-500 text-[10px] md:text-xs">
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
                  <p className="text-stone-600 leading-relaxed text-xs md:text-sm">{review.comment ?? "Không có bình luận."}</p>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="order-1 lg:order-2">
           <form className="space-y-6 rounded-xl bg-white p-6 md:p-8 shadow-sm lg:sticky lg:top-24 border border-stone-100" onSubmit={submitReview}>
             <h2 className="font-headline font-bold text-lg md:text-xl text-primary">Viết đánh giá của bạn</h2>
             
             {!user ? (
               <p className="text-xs text-secondary p-3 bg-secondary-fixed rounded-md">Vui lòng đăng nhập để đánh giá.</p>
             ) : !canReview ? (
               <p className="text-xs text-orange-700 p-3 bg-orange-50 border border-orange-200 rounded-md">
                 {reviewReason || "Bạn chưa thể đánh giá sản phẩm này."}
               </p>
             ) : (
               <>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-xs md:text-sm font-semibold mb-2 text-stone-700">Đánh giá sao</label>
                       <select
                         className="w-full rounded-lg border border-stone-200 bg-white px-3 md:px-4 py-2 md:py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
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
                       <label className="block text-xs md:text-sm font-semibold mb-2 text-stone-700">Nội dung đánh giá</label>
                       <textarea
                         className="w-full rounded-lg border border-stone-200 bg-white px-3 md:px-4 py-2 md:py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                         onChange={(event) => setComment(event.target.value)}
                         rows={4}
                         placeholder="Chia sẻ trải nghiệm của bạn..."
                         value={comment}
                       />
                    </div>
                 </div>

                 <button
                   className="w-full cta-gradient px-4 py-3 md:py-4 font-bold text-white rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
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
