"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "../../components/ProductCard";
import { ErrorMessage } from "../../components/ui";
import { api, type Category, type Product } from "../../lib/api";
import styles from "../../components/store/StoreLayout.module.css";

type Filters = {
  search: string;
  categoryId: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  page: number;
  isFlashSale?: boolean;
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-on-surface-variant">Đang tải sản phẩm...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const initialCategoryId = searchParams.get("categoryId") ?? "";
  const initialFlashSale = searchParams.get("flashSale") === "true";

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState<Filters>({
    search: initialSearch,
    categoryId: initialCategoryId,
    brand: "",
    minPrice: "",
    maxPrice: "",
    sort: "",
    page: 1,
    isFlashSale: initialFlashSale || undefined
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const queryParams = useMemo(
    () => ({
      ...filters,
      limit: 9
    } as Record<string, string | number | boolean | undefined>),
    [filters]
  );

  useEffect(() => {
    api.getCategories().then(setAllCategories).catch(() => setAllCategories([]));
  }, []);

  // Reset filters khi categoryId hoặc search thay đổi
  useEffect(() => {
    setFilters((current) => ({
      ...current,
      search: initialSearch,
      categoryId: initialCategoryId,
      isFlashSale: initialFlashSale || undefined,
      page: 1
    }));
  }, [initialSearch, initialCategoryId, initialFlashSale]);



  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await api.getProducts(queryParams);

        if (!active) {
          return;
        }

        setProducts(result.data);
        setMeta({
          page: result.meta.page,
          totalPages: result.meta.totalPages || 1,
          total: result.meta.total
        });
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Cannot load products");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [queryParams]);

  const updateFilters = (next: Partial<Filters>) => {
    setFilters((current) => ({
      ...current,
      ...next,
      page: next.page ?? 1
    }));
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-12 relative z-10">
        <div className="relative flex flex-col items-center overflow-hidden rounded-xl bg-luxury-surface/50 border border-white/5 backdrop-blur-md p-6 text-center md:p-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <h1 className="font-headline mb-4 text-4xl font-medium tracking-tight text-luxury-primary md:text-5xl">
            {filters.isFlashSale
              ? "🔥 Khuyến Mãi Flash Sale"
              : filters.categoryId
              ? allCategories.find(c => c.id === filters.categoryId)?.name || "Danh mục"
              : "Tất cả sản phẩm"}
          </h1>
          <p className="max-w-2xl leading-relaxed text-luxury-text-variant font-light">
            {filters.isFlashSale
              ? "Ưu đãi có hạn – Nhanh tay kẻo lỡ!"
              : filters.categoryId
              ? `Khám phá bộ sưu tập ${allCategories.find(c => c.id === filters.categoryId)?.name || "của chúng tôi"}`
              : "Khám phá các sản phẩm cà phê, đồ uống và bánh ngọt cao cấp"}
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 pb-24 relative z-10">
        <section className="flex-1">
          <div className="mb-8 grid gap-3 rounded-xl bg-luxury-surface/50 border border-white/5 backdrop-blur-md p-4 shadow-[0_5px_15px_rgba(0,0,0,0.3)] sm:grid-cols-[1fr_180px_140px]">
            <input
              className="rounded-lg border border-luxury-border bg-luxury-surface px-4 py-3 text-sm focus:ring-1 focus:ring-luxury-primary focus:outline-none text-luxury-text"
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Tìm cà phê, trà sữa, bánh ngọt..."
              value={filters.search}
            />
            <select
              className="rounded-lg border border-luxury-border bg-luxury-surface px-4 py-3 text-sm focus:ring-1 focus:ring-luxury-primary focus:outline-none text-luxury-text"
              onChange={(event) => updateFilters({ sort: event.target.value })}
              value={filters.sort}
            >
              <option value="">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
            <button
              className="rounded-lg border border-luxury-border px-4 py-3 text-sm font-semibold text-luxury-text-variant hover:text-luxury-primary hover:border-luxury-primary transition-colors"
              onClick={() => setFilters({
                search: "",
                categoryId: "",
                brand: "",
                minPrice: "",
                maxPrice: "",
                sort: "",
                page: 1,
                isFlashSale: undefined
              })}
              type="button"
            >
              Xóa lọc
            </button>
          </div>

          <ErrorMessage message={error} />

          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-luxury-text-variant">
              {loading ? "Đang tải sản phẩm..." : `${meta.total} sản phẩm`}
            </p>
            <p className="text-sm text-luxury-text-variant">
              Trang {meta.page} / {meta.totalPages}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div className="h-[250px] sm:h-[350px] animate-pulse rounded-xl bg-luxury-surface/50 border border-white/5" key={item} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-luxury-border bg-luxury-surface/30 p-12 text-center text-luxury-text-variant backdrop-blur-md">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-20 flex items-center justify-center gap-2">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-luxury-primary transition-all hover:bg-luxury-surface border border-transparent hover:border-luxury-border disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent"
              disabled={meta.page <= 1}
              onClick={() => updateFilters({ page: meta.page - 1 })}
              type="button"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-luxury-primary font-bold text-luxury-bg shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              {meta.page}
            </button>
            {meta.page + 1 <= meta.totalPages && (
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg text-luxury-text-variant hover:text-luxury-primary hover:bg-luxury-surface border border-transparent hover:border-luxury-border transition-all"
                onClick={() => updateFilters({ page: meta.page + 1 })}
                type="button"
              >
                {meta.page + 1}
              </button>
            )}
            {meta.page + 2 <= meta.totalPages && (
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg text-luxury-text-variant hover:text-luxury-primary hover:bg-luxury-surface border border-transparent hover:border-luxury-border transition-all"
                onClick={() => updateFilters({ page: meta.page + 2 })}
                type="button"
              >
                {meta.page + 2}
              </button>
            )}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-luxury-primary transition-all hover:bg-luxury-surface border border-transparent hover:border-luxury-border disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent"
              disabled={meta.page >= meta.totalPages}
              onClick={() => updateFilters({ page: meta.page + 1 })}
              type="button"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

