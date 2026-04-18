import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const displayFont = localFont({
  src: "../../public/ChillDINGothic_SemiBold.otf",
  variable: "--font-display",
  display: "swap",
  fallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
});

const bodyFont = localFont({
  src: "../../public/ZouLDFXKAJ.ttf",
  variable: "--font-body",
  display: "swap",
  fallback: ["PingFang SC", "Microsoft YaHei", "sans-serif"],
});

export const metadata: Metadata = {
  title: "与她的海大时光笺 | HNU-TimeLetter",
  description: "基于海南大学校园地图的交互式视觉叙事网站，展示 Galgame 角色与校园实景结合的决定性瞬间",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
