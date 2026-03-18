import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "RealProblem — 真问题期刊",
  description:
    "一本由 LLM 自动评审的开放期刊，专门收录各学科中真正重要但难以在传统期刊发表的问题。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-stone-50 text-stone-900">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
