"use client";

import Link from "next/link";
import { useState } from "react";
import { api, type Product } from "../lib/api";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const [message, setMessage] = useState("");
  const { refreshCart } = useCart();
  const flashSaleItem = product.flashSaleItems && product.flashSaleItems.length > 0 ? product.flashSaleItems[0] : null;

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.addCartItem({ productId: product.id, quantity: 1 });
      setMessage("Đã thêm vào giỏ hàng");
      refreshCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thêm vào giỏ hàng");
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.addCartItem({ productId: product.id, quantity: 1 });
      refreshCart();
      window.location.href = "/cart";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể mua ngay");
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-700 hover:-translate-y-3">
      {/* Outer Glow on Hover */}
      <div className="absolute inset-0 bg-luxury-primary/0 group-hover:bg-luxury-primary/20 blur-xl transition-all duration-700 rounded-2xl z-0"></div>
      
      <div className="h-full bg-luxury-surface/50 backdrop-blur-md relative flex flex-col items-center justify-center border border-white/5 group-hover:border-luxury-primary/30 transition-colors duration-500 rounded-2xl z-10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden pb-4">
        <div className="aspect-square w-full relative overflow-hidden bg-luxury-bg">
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-bg/90 via-transparent to-transparent z-10 pointer-events-none"></div>
          <img
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] opacity-70 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal ease-out"
            src={product.imageUrl || 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=800&auto=format&fit=crop'}
          />
          {product.stock <= 5 && product.stock > 0 && (
            <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-error text-white px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[9px] md:text-xs font-bold z-20">
              Sắp hết
            </div>
          )}
          
          <button
            className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-luxury-bg/80 backdrop-blur text-luxury-text rounded-full border border-white/10 flex items-center justify-center hover:bg-luxury-primary hover:text-luxury-bg hover:border-luxury-primary transition-all z-20"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await api.addToFavorites(product.id);
                setMessage("Đã lưu vào yêu thích");
              } catch {
                setMessage("Không thể lưu yêu thích");
              }
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-lg md:text-xl">favorite</span>
          </button>

          {/* Actions - Visible on hover */}
          <div className="absolute inset-x-4 bottom-4 flex gap-2 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-20">
            <button
              className="flex-1 bg-luxury-primary text-luxury-bg py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs hover:bg-luxury-primary/80 transition-all disabled:opacity-50"
              disabled={!product.isActive || product.stock <= 0}
              onClick={handleBuyNow}
              type="button"
            >
              Mua
            </button>
            <button
              className="w-8 h-8 md:w-10 md:h-10 bg-luxury-surface text-luxury-primary border border-luxury-primary/50 rounded-lg flex items-center justify-center hover:bg-luxury-primary hover:text-luxury-bg transition-all disabled:opacity-50"
              disabled={!product.isActive || product.stock <= 0}
              onClick={addToCart}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] md:text-lg">add_shopping_cart</span>
            </button>
          </div>
        </div>
        
        <div className="pt-3 px-4 flex flex-col gap-1 w-full flex-1 z-20">
          <div className="flex text-luxury-primary mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                className="material-symbols-outlined text-[10px] md:text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
                key={star}
              >
                star
              </span>
            ))}
          </div>
          <h3 className="text-white font-headline font-medium text-sm md:text-lg leading-tight line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] group-hover:text-luxury-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 mt-auto pt-2">
            {flashSaleItem ? (
              <>
                <span className="text-luxury-primary font-bold text-base md:text-lg tracking-wider">
                  {Math.round(Number(product.price) * (1 - flashSaleItem.discountPercentage / 100)).toLocaleString()}<span className="text-[10px] md:text-sm ml-0.5">đ</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-luxury-text-variant text-[10px] md:text-xs line-through">
                    {Number(product.price).toLocaleString()}đ
                  </span>
                  <span className="bg-error/20 text-error text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-error/50">
                    -{flashSaleItem.discountPercentage}%
                  </span>
                </div>
              </>
            ) : (
              <span className="text-luxury-primary font-bold text-base md:text-lg tracking-wider">
                {Number(product.price).toLocaleString()}<span className="text-[10px] md:text-sm ml-1">đ</span>
              </span>
            )}
          </div>
          {message && <p className="text-[10px] text-luxury-primary font-medium line-clamp-1 mt-1">{message}</p>}
        </div>
      </div>
    </Link>
  );
}
