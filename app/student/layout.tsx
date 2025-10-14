import { ReactNode } from "react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Sidebar from "@/app/components/Sidebar";

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}