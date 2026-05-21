"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, type Cart } from "../lib/api";
import { useAuth } from "./AuthProvider";

type CartContextType = {
  cart: Cart | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  setCart: (cart: Cart | null) => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (error: any) {
      if (error?.status !== 401) {
        console.error("Failed to fetch cart:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, setCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
