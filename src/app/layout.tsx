import type { Metadata } from "next";
import { AppProviders } from "@/shared/components/app-providers";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circo · Growth to outcomes",
  description:
    "A local-first platform for personal growth cycles and outcomes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full overflow-hidden">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
