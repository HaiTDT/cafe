"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Protected } from "../../components/Protected";
import { EmptyState, ErrorMessage } from "../../components/ui";
import { api, formatPrice, type Order, type User, type FavoriteProduct, type Address, type Product } from "../../lib/api";
import { useAuth } from "../../components/AuthProvider";
import { ProductCard } from "../../components/ProductCard";
import { VietnamAddressSelector } from "../../components/VietnamAddressSelector";

type Section = "orders" | "profile" | "favorites" | "addresses";

export default function OrdersPage() {
  return (
    <Protected>
      <OrdersContent />
    </Protected>
  );
}

function OrdersContent() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("orders");
  const { user, refreshUser, logout } = useAuth();
  
  const sections = [
    { id: "orders", label: "Đơn hàng của tôi", icon: "shopping_bag" },
    { id: "profile", label: "Quản lý tài khoản", icon: "person" },
    { id: "favorites", label: "Sản phẩm yêu thích", icon: "favorite" },
    { id: "addresses", label: "Sổ địa chỉ", icon: "location_on" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-6 shadow-sm border border-outline-variant/30 md:sticky md:top-24">
            {/* Avatar & Email - Desktop only */}
            <div className="hidden md:flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName || ""} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl">account_circle</span>
                )}
              </div>
              <div>
                <p className="font-bold text-on-surface truncate max-w-[140px]">{user?.fullName || "Khách hàng"}</p>
                <p className="text-xs text-on-surface-variant truncate max-w-[140px]">{user?.email}</p>
              </div>
            </div>

            {/* Menu Tabs - Horizontal on Mobile, Vertical on Desktop */}
            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as Section)}
                  className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                    activeSection === section.id
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-on-surface-variant hover:bg-surface-container-low bg-surface-container-low/50 md:bg-transparent"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </nav>
            
            {/* Logout Button - Desktop only */}
            <div className="hidden md:block mt-8 pt-6 border-t border-outline-variant/30">
              <button 
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-all"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {activeSection === "orders" && <OrdersSection />}
          {activeSection === "profile" && <ProfileSection user={user} onUpdate={refreshUser} />}
          {activeSection === "favorites" && <FavoritesSection />}
          {activeSection === "addresses" && <AddressesSection />}
        </main>
      </div>
    </div>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.getOrders()
      .then(setOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-on-surface-variant">Đang tải đơn hàng...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary">Đơn hàng của tôi</h1>
        <p className="text-sm text-on-surface-variant mt-1">Xem và theo dõi trạng thái các đơn hàng đã đặt.</p>
      </header>

      <ErrorMessage message={error} />

      {orders.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <EmptyState message="Bạn chưa có đơn hàng nào." />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-surface-container-lowest rounded-2xl p-5 md:p-6 shadow-sm border border-outline-variant/30 hover:border-primary/30 transition-colors">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-primary/5 rounded-full text-[10px] font-bold text-primary tracking-wider uppercase">
                    #{order.id.slice(0, 8)}
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-surface-container-low overflow-hidden flex-shrink-0 border border-outline-variant/10">
                  <img 
                    src={order.items[0]?.product?.imageUrl || ""} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-on-surface line-clamp-1">{order.items[0]?.product?.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Số lượng: {order.items[0]?.quantity}</p>
                  {order.items.length > 1 && (
                    <p className="text-xs text-primary font-medium mt-1">+{order.items.length - 1} sản phẩm khác</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary">{formatPrice(order.totalAmount)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-bold hover:bg-surface-container-low transition-colors"
                >
                  Chi tiết
                </button>
                {order.status === 'PENDING' && (
                   <button className="px-4 py-2 rounded-lg bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors">
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}

function ProfileSection({ user, onUpdate }: { user: User | null, onUpdate: () => void }) {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    birthday: user?.birthday?.split('T')[0] || "",
    gender: user?.gender || "other",
    avatar: user?.avatar || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [passData, setPassData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.updateProfile(formData);
      setSuccess("Cập nhật thông tin thành công!");
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.changePassword({ 
        currentPassword: passData.currentPassword, 
        newPassword: passData.newPassword 
      });
      setSuccess("Đổi mật khẩu thành công!");
      setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary">Thông tin tài khoản</h1>
        <p className="text-sm text-on-surface-variant mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản.</p>
      </header>

      {error && <ErrorMessage message={error} />}
      {success && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Info */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            Chỉnh sửa hồ sơ
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Họ và tên</label>
              <input 
                type="text" 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="Nhập họ tên"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Số điện thoại</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="0xxxxxxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Ngày sinh</label>
                <input 
                  type="date" 
                  value={formData.birthday} 
                  onChange={e => setFormData({...formData, birthday: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Giới tính</label>
              <div className="flex gap-6 mt-1 ml-1">
                {['male', 'female', 'other'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="gender" 
                      value={g} 
                      checked={formData.gender === g}
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                      className="w-4 h-4 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-on-surface-variant group-hover:text-primary transition-colors capitalize">
                      {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </section>

        {/* Password Change */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/30">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">lock_reset</span>
            Đổi mật khẩu
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Mật khẩu hiện tại</label>
              <input 
                type="password" 
                value={passData.currentPassword}
                onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Mật khẩu mới</label>
              <input 
                type="password" 
                value={passData.newPassword}
                onChange={e => setPassData({...passData, newPassword: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase ml-1">Xác nhận mật khẩu mới</label>
              <input 
                type="password" 
                value={passData.confirmPassword}
                onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 py-3 bg-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-secondary/20 hover:bg-secondary/90 transition-all disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function FavoritesSection() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    setLoading(true);
    api.getFavorites()
      .then(setFavorites)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleRemove = async (productId: string) => {
    try {
      await api.removeFromFavorites(productId);
      setFavorites(favorites.filter(f => f.productId !== productId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="py-12 text-center text-on-surface-variant">Đang tải danh sách yêu thích...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary">Sản phẩm yêu thích</h1>
        <p className="text-sm text-on-surface-variant mt-1">Những sản phẩm bạn đã lưu để xem sau.</p>
      </header>

      {error && <ErrorMessage message={error} />}

      {favorites.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <EmptyState message="Chưa có sản phẩm nào trong danh sách yêu thích." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative group">
               <ProductCard product={fav.product} />
               <button 
                onClick={() => handleRemove(fav.productId)}
                className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-error shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-error hover:text-white"
                title="Xóa khỏi yêu thích"
               >
                 <span className="material-symbols-outlined text-lg">close</span>
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressesSection() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = () => {
    setLoading(true);
    api.getAddresses()
      .then(setAddresses)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
    try {
      await api.deleteAddress(id);
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      loadAddresses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="py-12 text-center text-on-surface-variant">Đang tải sổ địa chỉ...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <header>
          <h1 className="text-2xl font-bold font-headline text-primary">Sổ địa chỉ</h1>
          <p className="text-sm text-on-surface-variant mt-1">Quản lý các địa chỉ nhận hàng của bạn.</p>
        </header>
        <button 
          onClick={() => { setEditingAddress(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm địa chỉ mới
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {addresses.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 shadow-sm border border-outline-variant/30 flex flex-col items-center">
          <EmptyState message="Bạn chưa có địa chỉ nào trong sổ địa chỉ." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-surface-container-lowest rounded-2xl p-6 shadow-sm border ${addr.isDefault ? 'border-primary' : 'border-outline-variant/30'} relative group transition-all`}>
              {addr.isDefault && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Mặc định
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary/60">person</span>
                  <p className="font-bold text-on-surface">{addr.fullName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary/60">phone</span>
                  <p className="text-sm text-on-surface-variant">{addr.phone}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary/60 mt-0.5">location_on</span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setEditingAddress(addr); setIsModalOpen(true); }}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs font-bold text-error hover:underline"
                  >
                    Xóa
                  </button>
                </div>
                {!addr.isDefault && (
                  <button 
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Đặt mặc định
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Modal */}
      {isModalOpen && (
        <AddressModal 
          address={editingAddress} 
          onClose={() => setIsModalOpen(false)} 
          onSave={() => { setIsModalOpen(false); loadAddresses(); }} 
        />
      )}
    </div>
  );
}

function AddressModal({ address, onClose, onSave }: { address: Address | null, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState({
    fullName: address?.fullName || "",
    phone: address?.phone || "",
    province: address?.province || "",
    district: address?.district || "",
    ward: address?.ward || "",
    detail: address?.detail || "",
    isDefault: address?.isDefault || false
  });
  
  const handleAddressSelect = useCallback(({ province, district, ward }: { province: string, district: string, ward: string }) => {
    setFormData(prev => {
      if (prev.province === province && prev.district === district && prev.ward === ward) return prev;
      return { ...prev, province, district, ward };
    });
  }, []);

  const addressInitialValues = useMemo(() => ({
    province: formData.province,
    district: formData.district,
    ward: formData.ward
  }), [formData.province, formData.district, formData.ward]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (address) {
        await api.updateAddress(address.id, formData);
      } else {
        await api.addAddress(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant/30 animate-in fade-in zoom-in duration-300">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
          <h3 className="font-bold text-lg text-primary">
            {address ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <ErrorMessage message={error} />}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Họ tên người nhận</label>
              <input 
                required
                type="text" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Số điện thoại</label>
              <input 
                required
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm"
                placeholder="0xxxxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-4">
            <VietnamAddressSelector 
              initialValues={addressInitialValues}
              onSelect={handleAddressSelect}
            />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase ml-1">Số nhà, tên đường</label>
              <input 
                required
                type="text" 
                value={formData.detail}
                onChange={e => setFormData({...formData, detail: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-sm"
                placeholder="VD: 123 Đường ABC"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.isDefault}
              onChange={e => setFormData({...formData, isDefault: e.target.checked})}
              className="w-5 h-5 text-primary border-none bg-surface-container-low rounded-md focus:ring-primary/20"
            />
            <span className="text-sm font-medium text-on-surface">Đặt làm địa chỉ mặc định</span>
          </label>

          <div className="flex gap-3 pt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-2 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : (address ? "Cập nhật" : "Lưu địa chỉ")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50">
          <div className="flex items-center gap-3">
             <h3 className="font-bold text-lg text-primary">Chi tiết đơn hàng</h3>
             <div className="px-2 py-0.5 bg-primary/5 rounded text-[10px] font-bold text-primary tracking-wider uppercase">
                #{order.id.slice(0, 8)}
             </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Summary Info */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-surface-container-low rounded-2xl">
                 <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Trạng thái</p>
                 <OrderStatusBadge status={order.status} />
              </div>
              <div className="p-3 bg-surface-container-low rounded-2xl">
                 <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Ngày đặt</p>
                 <p className="text-sm font-bold text-on-surface">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-2xl">
                 <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Thanh toán</p>
                 <p className="text-sm font-bold text-emerald-600">Đã thanh toán</p>
              </div>
              <div className="p-3 bg-surface-container-low rounded-2xl">
                 <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tổng cộng</p>
                 <p className="text-sm font-extrabold text-secondary">{formatPrice(order.totalAmount)}</p>
              </div>
           </div>

           {/* Shipping Info */}
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary text-lg">local_shipping</span>
                 Thông tin giao hàng
              </h4>
              <div className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Người nhận</p>
                    <p className="text-sm font-bold text-on-surface">{order.shippingName}</p>
                    <p className="text-sm text-on-surface-variant mt-1">{order.shippingPhone}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Địa chỉ</p>
                    <p className="text-sm text-on-surface leading-relaxed">{order.shippingAddress}</p>
                 </div>
              </div>
           </div>

           {/* Items List */}
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                 <span className="material-symbols-outlined text-primary text-lg">inventory_2</span>
                 Danh sách sản phẩm ({order.items.length})
              </h4>
              <div className="space-y-3">
                 {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-2xl hover:bg-surface-container-low transition-colors border border-outline-variant/10">
                       <div className="w-16 h-16 rounded-xl bg-surface-container-low overflow-hidden flex-shrink-0">
                          <img src={item.product?.imageUrl || ""} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-on-surface line-clamp-2 leading-snug">{item.product?.name}</p>
                          <div className="flex justify-between items-center mt-2">
                             <p className="text-xs text-on-surface-variant">SL: <span className="font-bold text-on-surface">{item.quantity}</span></p>
                             <p className="font-bold text-sm text-secondary">{formatPrice(item.unitPrice)}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-6 border-t border-outline-variant/20 bg-surface-container-low/30 flex justify-between items-center">
           <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Tổng tiền thanh toán</p>
              <p className="text-2xl font-headline font-extrabold text-secondary">{formatPrice(order.totalAmount)}</p>
           </div>
           <button 
            onClick={onClose}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
           >
              Đóng
           </button>
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string, color: string, bg: string }> = {
    'COMPLETED': { label: 'Hoàn thành', color: 'text-primary', bg: 'bg-primary/10' },
    'DELIVERED': { label: 'Đã giao', color: 'text-primary', bg: 'bg-primary/10' },
    'CANCELLED': { label: 'Đã hủy', color: 'text-error', bg: 'bg-error/10' },
    'PENDING': { label: 'Chờ xử lý', color: 'text-secondary', bg: 'bg-secondary/10' },
    'PROCESSING': { label: 'Đang chuẩn bị', color: 'text-blue-600', bg: 'bg-blue-50' },
    'SHIPPED': { label: 'Đang giao', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  };

  const config = configs[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-100' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${config.bg} ${config.color} uppercase tracking-wider`}>
      {config.label}
    </span>
  );
}
