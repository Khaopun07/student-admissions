'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard'); // Redirect non-students
    }
  }, [status, router, session]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">แดชบอร์ดนักเรียน</h1>
        <p className="text-lg mb-4">ยินดีต้อนรับ, {session?.user?.email}!</p>

        <div className="flex flex-col space-y-4 mt-6">
          <button
            onClick={() => router.push('/student/profile')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            จัดการข้อมูลส่วนตัว
          </button>
          <button
            onClick={() => router.push('/student/documents')}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            จัดการเอกสาร
          </button>
          <button
            onClick={() => router.push('/student/exam')}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            ดูรายละเอียดการสอบ
          </button>
          <button
            onClick={() => router.push('/student/admission')}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            สถานะการรับเข้าศึกษา
          </button>
          <button
            onClick={() => router.push('/student/status')}
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
          >
            ติดตามสถานะการสมัคร
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
