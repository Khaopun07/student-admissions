'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  // Use `startsWith` for admin pages to handle sub-routes
  const isActive = pathname.startsWith(href);

  return (
    <Link href={href}>
      <span
        className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        {children}
      </span>
    </Link>
  );
};

export default function Sidebar() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const isStudent = session?.user?.role === 'STUDENT';

  if (!session) {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <nav className="flex-grow space-y-2">
        {isStudent && (
          <>
            <NavLink href="/student/dashboard">แดชบอร์ดนักเรียน</NavLink>
            <NavLink href="/student/documents">จัดการเอกสาร</NavLink>
            <NavLink href="/student/exam">ดูรายละเอียดการสอบ</NavLink>
            <NavLink href="/student/admission">สถานะการรับเข้าศึกษา</NavLink>
            <NavLink href="/student/status">ติดตามสถานะการสมัคร</NavLink>
          </>
        )}
        {isAdmin && (
          <>
            <NavLink href="/admin/dashboard">แดชบอร์ดผู้ดูแลระบบ</NavLink>
            <NavLink href="/admin/exam-management">จัดการข้อมูลการสอบ</NavLink>
            <NavLink href="/admin/admission-management">จัดการผลการรับเข้าศึกษา</NavLink>
            <NavLink href="/admin/document-review">ตรวจสอบเอกสาร</NavLink>
            <NavLink href="/admin/confirm-admission">ยืนยันการมอบตัว</NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}