import type { Metadata } from "next";
import { Montserrat } from "next/font/google"; // Font updated to Montserrat

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/SidebarContext";
import { Toaster } from "sonner";


const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Udreamms | Tu Sueño en USA",
  description: "Asesoría experta para visas, estudios y nueva vida en Estados Unidos. Tecnología y soporte humano en un solo lugar.",
  icons: {
    icon: "/assets/Logo Udreamms.png",
    apple: "/assets/Logo Udreamms.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            {children}
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
