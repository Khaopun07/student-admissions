import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ระบบสมัครสอบคัดเลือกนักเรียนเข้าเป็นนักเรียนโรงเรียนชั้นมัธยมศึกษาปีที่4",
  description: "พอร์ทัลรับสมัครนักเรียน สร้างด้วย Next.js และ Prisma",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
