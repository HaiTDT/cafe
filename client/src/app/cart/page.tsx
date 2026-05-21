"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartItem } from "../../components/CartItem";
import { Protected } from "../../components/Protected";
import { EmptyState, ErrorMessage } from "../../components/ui";
import { api, formatPrice, type Cart } from "../../lib/api";
import { useCart } from "../../components/CartProvider";

function CartContent() {
  const { cart, loading, setCart, refreshCart } = useCart();
  const [error, setError] = useState("");

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setCart(await api.updateCartItem(itemId, { quantity }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot update cart");
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      setCart(await api.deleteCartItem(itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot remove item");
    }
  };

  return (
    <>
      <section className="w-full bg-primary-fixed/30 py-6 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tight">Giỏ hàng của bạn</h1>
          <p className="mt-2 text-on-surface-variant font-body">Sản phẩm sạch, nguyên chất, đậm vị.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <ErrorMessage message={error} />

        {loading ? (
          <p className="text-sm text-on-surface-variant">Đang tải giỏ hàng...</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="py-20 text-center">
            <EmptyState message="Giỏ hàng của bạn đang trống." />
            <Link href="/products" className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-3 space-y-8">
              <div className="hidden md:grid grid-cols-12 pb-4 text-on-surface-variant text-sm font-semibold uppercase tracking-wider border-b border-outline-variant/30">
                <div className="col-span-6">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Tổng cộng</div>
              </div>
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <CartItem
                    item={item}
                    key={item.id}
                    onDelete={deleteItem}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-surface-container-lowest rounded-xl p-4 md:p-8 border border-outline-variant/30 sticky top-28 shadow-sm organic-shadow">
                <h2 className="text-xl font-headline font-bold text-on-surface mb-8">Tóm tắt đơn hàng</h2>

                <div className="space-y-4 pt-6 border-t border-surface-variant">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Số lượng</span>
                    <span className="font-medium text-on-surface">{cart.totalQuantity} sản phẩm</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-surface-variant">
                    <span className="text-lg font-bold">Tổng cộng</span>
                    <div className="text-right">
                      <span className="block text-2xl font-headline font-extrabold text-secondary tracking-tight">
                        {formatPrice(cart.totalAmount)}
                      </span>
                      <span className="text-[10px] text-on-surface-variant italic">(Đã bao gồm VAT)</span>
                    </div>
                  </div>
                </div>

                <Link href="/checkout" className="block text-center w-full mt-10 bg-gradient-to-br from-secondary to-secondary-container text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-secondary/20 transition-all active:scale-[0.98]">
                  Tiến hành Thanh toán
                </Link>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                  <p className="text-[11px] text-on-surface-variant text-center leading-tight">Thanh toán an toàn & bảo mật</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default function CartPage() {
  return (
    <Protected>
      <CartContent />
    </Protected>
  );
}
