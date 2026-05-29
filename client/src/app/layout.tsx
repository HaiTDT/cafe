import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AppShell } from "../components/AppShell";
import { AuthProvider } from "../components/AuthProvider";
import { CartProvider } from "../components/CartProvider";
import Chatbot from "../components/Chatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hậu Lê Coffee",
  description: "Hậu Lê Coffee - Thưởng thức hương vị cà phê đậm đà, trà sữa thơm ngon và các món bánh ngọt hấp dẫn trong không gian thư giãn tuyệt vời.",
  openGraph: {
    title: "Hậu Lê Coffee",
    description: "Thưởng thức hương vị cà phê đậm đà, trà sữa thơm ngon và các món bánh ngọt hấp dẫn trong không gian thư giãn tuyệt vời.",
    type: "website",
    locale: "vi_VN",
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <AuthProvider>
            <CartProvider>
              <AppShell>{children}</AppShell>
              <Chatbot />
            </CartProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
