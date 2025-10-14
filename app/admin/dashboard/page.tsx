'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationStatus } from '@prisma/client';

interface Phase2Data {
  totalConfirmed: number;
  confirmedByProvince: { status: ApplicationStatus; _count: { id: number } }[];
  confirmedBySchool: { status: ApplicationStatus; _count: { id: number } }[];
}

interface Phase3Data {
  totalApplicants: number;
  confirmedCount: number;
  rejectedCount: number;
  notProcessedCount: number;
  waitingForCallCount: number;
  countBySchool: { status: ApplicationStatus; _count: { id: number } }[];
  countByProvince: { status: ApplicationStatus; _count: { id: number } }[];
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phase2Data, setPhase2Data] = useState<Phase2Data | null>(null);
  const [phase3Data, setPhase3Data] = useState<Phase3Data | null>(null);
  const [loadingPhase2, setLoadingPhase2] = useState(true);
  const [loadingPhase3, setLoadingPhase3] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/student/dashboard'); // Redirect non-admins
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchDashboardData = async () => {
        try {
          setLoadingPhase2(true);
          const res2 = await fetch('/api/admin/dashboard-phase2');
          if (!res2.ok) throw new Error('Failed to fetch Phase 2 dashboard data');
          const data2 = await res2.json();
          setPhase2Data(data2);
        } catch (err) {
          console.error('Failed to fetch Phase 2 dashboard data:', err);
          setError('An unexpected error occurred while fetching Phase 2 dashboard data.');
        } finally {
          setLoadingPhase2(false);
        }
  
        try {
          setLoadingPhase3(true);
          const res3 = await fetch('/api/admin/dashboard-phase3');
          if (!res3.ok) throw new Error('Failed to fetch Phase 3 dashboard data');
          const data3 = await res3.json();
          setPhase3Data(data3);
        } catch (err) {
          console.error('Failed to fetch Phase 3 dashboard data:', err);
          setError('An unexpected error occurred while fetching Phase 3 dashboard data.');
        } finally {
          setLoadingPhase3(false);
        }
      };
      fetchDashboardData();
    }
  }, [session, status]);

  if (status === 'loading' || loadingPhase2 || loadingPhase3) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-lg mb-4">ยินดีต้อนรับ, ผู้ดูแลระบบ {session?.user?.email}!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Phase 2 Dashboard */}
          <div className="p-6 border rounded-md bg-blue-50">
            <h2 className="text-2xl font-semibold mb-4">ภาพรวมระยะที่ 2: การจัดการสอบ</h2>
            {phase2Data ? (
              <div>
                <p><strong>จำนวนผู้มีสิทธิ์สอบทั้งหมด:</strong> {phase2Data.totalConfirmed}</p>
                {/* Add more detailed breakdown by province/school if schema is updated */}
                <p className="text-gray-600 mt-2">
                  (การแบ่งข้อมูลอย่างละเอียดตามจังหวัด/โรงเรียนต้องมีการอัปเดตสกีมา)
                </p>
              </div>
            ) : (
              <p>ไม่มีข้อมูลระยะที่ 2</p>
            )}
          </div>

          {/* Phase 3 Dashboard */}
          <div className="p-6 border rounded-md bg-green-50">
            <h2 className="text-2xl font-semibold mb-4">ภาพรวมระยะที่ 3: การยืนยันสิทธิ์เข้าศึกษา</h2>
            {phase3Data ? (
              <div>
                <p><strong>ผู้สมัครทั้งหมด (ที่คาดหวัง):</strong> {phase3Data.totalApplicants}</p>
                <p><strong>ยืนยันสิทธิ์แล้ว:</strong> {phase3Data.confirmedCount}</p>
                <p><strong>สละสิทธิ์:</strong> {phase3Data.rejectedCount}</p>
                <p><strong>ยังไม่ดำเนินการ:</strong> {phase3Data.notProcessedCount}</p>
                <p><strong>รอเรียก (ตัวสำรอง):</strong> {phase3Data.waitingForCallCount}</p>
                {/* Add more detailed breakdown by province/school if schema is updated */}
                <p className="text-gray-600 mt-2">
                  (การแบ่งข้อมูลอย่างละเอียดตามโรงเรียน/จังหวัดต้องมีการอัปเดตสกีมา)
                </p>
              </div>
            ) : (
              <p>ไม่มีข้อมูลระยะที่ 3</p>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={() => router.push('/admin/exam-management')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            จัดการข้อมูลการสอบ
          </button>
          <button
            onClick={() => router.push('/admin/admission-management')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            จัดการผลการรับเข้าศึกษา
          </button>
          <button
            onClick={() => router.push('/admin/document-review')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            ตรวจสอบเอกสาร
          </button>
          <button
            onClick={() => router.push('/api/admin/export-data')} // This will trigger a download
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            ส่งออกข้อมูลทั้งหมดเป็น Excel
          </button>
        </div>
      </div>
    </div>
  );
}
