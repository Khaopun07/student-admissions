'use client';

// components/Header.tsx
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const isStudent = session?.user?.role === "STUDENT";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 ">
          {/* Logo & Title */}
          <div className="flex items-center space-x-4">
            <Link href={isAdmin ? "/admin/dashboard" : "/student/dashboard"}>
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">TSU</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">ระบบรับสมัครนักเรียน</h1>
                  <p className="text-xs text-blue-100">มหาวิทยาลัยทักษิณ</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Conditional Rendering: User Info/Logout vs Login/Signup */}
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-3 focus:outline-none">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold">{session.user?.email}</p>
                  <p className="text-xs text-blue-100">
                    {isAdmin ? "ผู้ดูแลระบบ" : "นักเรียน"}
                  </p>
                </div>
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800">
                  {isStudent && (
                    <Link href="/student/profile">
                      <span className="block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">
                        จัดการข้อมูลส่วนตัว
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <span className="text-sm font-medium hover:text-blue-100 transition-colors">เข้าสู่ระบบ</span>
              </Link>
              <Link href="/signup">
                <span className="bg-white text-blue-600 text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">สมัครเข้าใช้งาน</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}