"use client";

import { useEffect, useState } from "react";
import { api, type Banner } from "../../../lib/api";
import { ErrorMessage } from "../../../components/ui";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminBanners();
      setBanners(data);
    } catch (err: any) {
      setError(err.message || "Lỗi tải banner");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.imageUrl) {
      setError("Vui lòng nhập Link ảnh (Image URL)");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      if (editingBanner.id) {
        await api.updateBanner(editingBanner.id, {
          title: editingBanner.title,
          imageUrl: editingBanner.imageUrl,
          link: editingBanner.link,
          isActive: editingBanner.isActive,
          order: editingBanner.order
        });
      } else {
        await api.createBanner({
          title: editingBanner.title,
          imageUrl: editingBanner.imageUrl,
          link: editingBanner.link,
          isActive: editingBanner.isActive ?? true,
          order: editingBanner.order ?? 0
        });
      }
      setEditingBanner(null);
      loadBanners();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu banner");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) return;
    try {
      await api.deleteBanner(id);
      loadBanners();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa");
    }
  };

  if (loading && !banners.length) return <div className="p-8">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-900">Quản lý Banner trang chủ</h1>
        <button
          onClick={() => setEditingBanner({ isActive: true, order: 0 })}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Thêm Banner mới
        </button>
      </div>

      <ErrorMessage message={error} />

      {editingBanner && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4 text-stone-800">
          <h2 className="text-lg font-bold">{editingBanner.id ? "Sửa Banner" : "Thêm Banner mới"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề (không bắt buộc)</label>
              <input
                type="text"
                value={editingBanner.title || ""}
                onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL Hình ảnh *</label>
              <input
                type="text"
                required
                value={editingBanner.imageUrl || ""}
                onChange={e => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đường dẫn khi click (không bắt buộc)</label>
              <input
                type="text"
                value={editingBanner.link || ""}
                onChange={e => setEditingBanner({ ...editingBanner, link: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thứ tự hiển thị (Số nhỏ xếp trước)</label>
              <input
                type="number"
                value={editingBanner.order || 0}
                onChange={e => setEditingBanner({ ...editingBanner, order: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-800 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={editingBanner.isActive ?? true}
                onChange={e => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium">Hiển thị (Active)</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setEditingBanner(null)}
              className="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 text-stone-700 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden text-stone-800">
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-sm">Hình ảnh</th>
              <th className="px-6 py-4 font-semibold text-sm">Tiêu đề / Link</th>
              <th className="px-6 py-4 font-semibold text-sm">Thứ tự</th>
              <th className="px-6 py-4 font-semibold text-sm">Trạng thái</th>
              <th className="px-6 py-4 font-semibold text-sm text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {banners.map((banner) => (
              <tr key={banner.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-32 h-16 relative rounded overflow-hidden border border-stone-200 bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.imageUrl} alt="Banner" className="object-cover w-full h-full" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">{banner.title || "-"}</div>
                  <div className="text-xs text-stone-500 truncate max-w-[200px]">{banner.link || "-"}</div>
                </td>
                <td className="px-6 py-4">{banner.order}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                    banner.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"
                  }`}>
                    {banner.isActive ? "Hiển thị" : "Đã ẩn"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingBanner(banner)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                  Chưa có banner nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
