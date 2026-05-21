"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useCallback, useMemo } from "react";
import { Protected } from "../../components/Protected";
import { ErrorMessage } from "../../components/ui";
import { api, formatPrice, type Cart, type Address } from "../../lib/api";
import { useCart } from "../../components/CartProvider";
import { VietnamAddressSelector } from "../../components/VietnamAddressSelector";

function CheckoutContent() {
  const { cart, setCart, refreshCart } = useCart();
  const [form, setForm] = useState({
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    province: "",
    district: "",
    ward: "",
    detail: ""
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshCart();
    fetchAddresses();
  }, [refreshCart]);

  const fetchAddresses = async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data);
      // Auto-fill default address if form is empty
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr && !form.shippingName && !form.shippingPhone && !form.shippingAddress) {
        setForm({
          shippingName: defaultAddr.fullName,
          shippingPhone: defaultAddr.phone,
          shippingAddress: `${defaultAddr.detail}, ${defaultAddr.ward}, ${defaultAddr.district}, ${defaultAddr.province}`,
          province: defaultAddr.province,
          district: defaultAddr.district,
          ward: defaultAddr.ward,
          detail: defaultAddr.detail
        });
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    }
  };

  const handleSelectAddress = (addr: Address) => {
    setForm({
      shippingName: addr.fullName,
      shippingPhone: addr.phone,
      shippingAddress: `${addr.detail}, ${addr.ward}, ${addr.district}, ${addr.province}`,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      detail: addr.detail
    });
    setShowAddressBook(false);
  };

  const handleAddressSelect = useCallback(({ province, district, ward }: { province: string, district: string, ward: string }) => {
    setForm(prev => {
      if (prev.province === province && prev.district === district && prev.ward === ward) return prev;
      const newForm = { ...prev, province, district, ward };
      const addrString = [newForm.detail, ward, district, province].filter(Boolean).join(", ");
      return { ...newForm, shippingAddress: addrString };
    });
  }, []);

  const addressInitialValues = useMemo(() => ({
    province: form.province,
    district: form.district,
    ward: form.ward
  }), [form.province, form.district, form.ward]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.checkout(form);
      setSuccess("Thanh toán thành công. Đơn hàng của bạn đã được đặt.");
      setCart(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="w-full bg-primary-fixed/30 py-6 md:py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tight">Thanh toán</h1>
          <p className="mt-2 text-on-surface-variant font-body">Hoàn tất thông tin để đặt hàng</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <ErrorMessage message={error} />
        {success && (
          <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 organic-shadow">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              {success}
            </h2>
            <Link className="font-bold underline text-primary hover:text-primary-fixed transition-colors" href="/orders">
              Xem lịch sử đơn hàng
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <div className="bg-surface-container-lowest rounded-xl p-4 md:p-8 organic-shadow border border-outline-variant/30">
              <form className="space-y-8" onSubmit={submit}>
                <div>
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">contact_mail</span>
                    Thông tin liên hệ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-2">Họ và tên</label>
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary px-4 py-3 text-on-surface transition-colors"
                        onChange={(event) => setForm({ ...form, shippingName: event.target.value })}
                        required
                        placeholder="Nhập họ tên của bạn"
                        value={form.shippingName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-2">Số điện thoại</label>
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary px-4 py-3 text-on-surface transition-colors"
                        onChange={(event) => setForm({ ...form, shippingPhone: event.target.value })}
                        required
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        value={form.shippingPhone}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-surface-variant">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      Địa chỉ giao hàng
                    </h3>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAddressBook(true)}
                        className="text-sm font-bold text-primary hover:text-secondary flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">book</span>
                        Sổ địa chỉ
                      </button>
                    )}
                  </div>
                  
                  {/* Address Book Modal */}
                  {showAddressBook && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg organic-shadow overflow-hidden">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                          <h3 className="text-xl font-headline font-bold">Chọn địa chỉ giao hàng</h3>
                          <button onClick={() => setShowAddressBook(false)} className="text-on-surface-variant hover:text-on-surface">
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                          {addresses.map(addr => (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectAddress(addr)}
                              className="p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                            >
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-on-surface">{addr.fullName}</h4>
                                {addr.isDefault && (
                                  <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded font-bold uppercase">Mặc định</span>
                                )}
                              </div>
                              <p className="text-sm text-on-surface-variant mt-1">{addr.phone}</p>
                              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                                {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                              </p>
                              <div className="mt-3 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Chọn địa chỉ này <span className="material-symbols-outlined text-xs ml-1">arrow_forward</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <VietnamAddressSelector 
                      initialValues={addressInitialValues}
                      onSelect={handleAddressSelect}
                    />
                    
                    <div>
                      <label className="block text-sm font-semibold text-on-surface-variant mb-2">Địa chỉ chi tiết (Số nhà, đường...)</label>
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-primary px-4 py-3 text-on-surface transition-colors"
                        onChange={(event) => {
                          const detail = event.target.value;
                          const addrString = [detail, form.ward, form.district, form.province].filter(Boolean).join(", ");
                          setForm({ ...form, detail, shippingAddress: addrString });
                        }}
                        required
                        placeholder="Nhập số nhà, tên đường..."
                        value={form.detail}
                      />
                    </div>

                    {/* Hidden input for concatenated address to ensure form validity if needed, though we use the state */}
                    <input type="hidden" name="shippingAddress" value={form.shippingAddress} required />
                  </div>
                </div>

                <button
                  className="w-full mt-6 bg-gradient-to-br from-secondary to-secondary-container text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-secondary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading || !cart || cart.items.length === 0}
                  type="submit"
                >
                  {loading ? "Đang xử lý..." : "Xác nhận Thanh toán"}
                  {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-4">
            <aside className="bg-surface-container-lowest rounded-xl p-4 md:p-8 border border-outline-variant/30 sticky top-28 organic-shadow">
              <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Tóm tắt đơn hàng</h2>
              
              {!cart || cart.items.length === 0 ? (
                <p className="text-sm text-on-surface-variant p-4 bg-surface-container-low rounded-lg text-center">
                   Giỏ hàng trống.
                </p>
              ) : (
                <>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {cart.items.map((item) => (
                      <div className="flex gap-4 items-start" key={item.id}>
                        <div className="w-16 h-16 rounded-md bg-surface-container-low overflow-hidden flex-shrink-0">
                           <img src={item.product.imageUrl || 'https://via.placeholder.com/150'} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-sm text-on-surface line-clamp-2 leading-snug">{item.product.name}</h4>
                           <div className="flex justify-between items-end mt-2">
                              <span className="text-xs text-on-surface-variant font-medium">SL: {item.quantity}</span>
                              <span className="font-bold text-sm text-secondary">{formatPrice(item.lineTotal ?? 0)}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-surface-variant space-y-4">
                     <div className="flex justify-between text-sm text-on-surface-variant">
                        <span>Tạm tính ({cart.totalQuantity} sản phẩm)</span>
                        <span className="font-medium text-on-surface">{formatPrice(cart.totalAmount)}</span>
                     </div>
                     <div className="flex justify-between text-sm text-on-surface-variant">
                        <span>Phí vận chuyển</span>
                        <span className="font-medium text-on-surface">Miễn phí</span>
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
                </>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Protected>
      <CheckoutContent />
    </Protected>
  );
}
