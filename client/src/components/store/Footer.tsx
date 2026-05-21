import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-stone-950 w-full pt-12 md:pt-16 pb-8 border-none mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto px-6 md:px-8 mb-12 md:mb-16">
        <div className="col-span-1 text-center md:text-left">
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-50 mb-4 md:mb-6">HẬU LÊ COFFEE</div>
          <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed mb-6 max-w-sm mx-auto md:mx-0">
            Khởi đầu ngày mới tràn đầy năng lượng cùng ly cà phê đậm đà.
          </p>
          <div className="flex justify-center md:justify-start gap-4">
            <a className="w-10 h-10 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
              href="#">
              <span className="material-symbols-outlined text-sm">social_leaderboard</span>
            </a>
            <a className="w-10 h-10 bg-white dark:bg-stone-800 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
              href="#">
              <span className="material-symbols-outlined text-sm">camera</span>
            </a>
          </div>
        </div>
        <div className="text-center md:text-left">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-4 md:mb-6 uppercase tracking-wider text-xs">Về chúng tôi</h4>
          <ul className="space-y-3">
            <li><Link className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm font-semibold" href="/">Trang chủ</Link></li>
            <li><Link className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="/blogs">Tin tức & Câu chuyện</Link></li>
            <li><a className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="#">Câu chuyện thương hiệu</a></li>
            <li><a className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="#">Hệ thống cửa hàng</a></li>
            <li><a className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="#">Liên hệ</a></li>
          </ul>
        </div>
        <div className="text-center md:text-left">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-4 md:mb-6 uppercase tracking-wider text-xs">Chính sách</h4>
          <ul className="space-y-3">
            <li><a className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="#">Chính sách bảo mật</a></li>
            <li><a className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="#">Điều khoản dịch vụ</a></li>
            <li><a className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="#">Chính sách đổi trả</a></li>
            <li><a className="text-stone-500 dark:text-stone-400 hover:text-emerald-700 transition-colors inline-block text-sm" href="#">Giao hàng & Thanh toán</a></li>
          </ul>
        </div>
        <div className="text-center md:text-left">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-4 md:mb-6 uppercase tracking-wider text-xs">Đăng ký bản tin</h4>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-4">Nhận ngay voucher 50k cho đơn hàng đầu tiên!</p>
          <div className="flex max-w-xs mx-auto md:mx-0">
            <input className="bg-white dark:bg-stone-800 border-none rounded-l-md px-4 py-3 text-sm flex-1 focus:ring-1 focus:ring-primary outline-none text-on-surface"
              placeholder="Email của bạn" type="email" />
            <button className="bg-primary text-white px-4 py-3 rounded-r-md hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
      <div
        className="max-w-7xl mx-auto px-6 md:px-8 pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-stone-500 dark:text-stone-400 text-[11px] md:text-sm text-center md:text-left">© 2026 Hậu Lê Coffee. Tất cả quyền được bảo lưu.</p>
        <div className="flex gap-4 md:gap-6 items-center opacity-60">
          <img alt="Visa" className="h-3 md:h-4 grayscale" src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" />
          <img alt="Mastercard" className="h-5 md:h-6 grayscale" src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" />
          <img alt="Momo" className="h-5 md:h-6 grayscale rounded" src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" />
        </div>
      </div>
    </footer>
  );
}

