'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, PieLabelRenderProps } from 'recharts';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

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

  const phase3ChartData = useMemo(() => {
    if (!phase3Data) return [];
    return [
      { name: 'ยืนยันสิทธิ์แล้ว', value: phase3Data.confirmedCount },
      { name: 'สละสิทธิ์', value: phase3Data.rejectedCount },
      { name: 'ยังไม่ดำเนินการ', value: phase3Data.notProcessedCount },
      { name: 'รอเรียก (ตัวสำรอง)', value: phase3Data.waitingForCallCount },
    ].filter(item => item.value > 0);
  }, [phase3Data]);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Phase 2 Dashboard */}
          <div className="p-6 border rounded-md bg-blue-50">
            <h2 className="text-2xl font-semibold mb-4">ภาพรวมระยะที่ 2: การจัดการสอบ</h2>
            {phase2Data ? (
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-800">{phase2Data.totalConfirmed}</p>
                <p className="text-lg text-gray-600">จำนวนผู้มีสิทธิ์สอบทั้งหมด</p>
                <p className="text-gray-500 mt-4 text-sm">
                  (ข้อมูลสำหรับกราฟวงกลมในส่วนนี้ยังไม่พร้อมใช้งาน)
                </p>
              </div>
            ) : (
              <p>ไม่มีข้อมูลระยะที่ 2</p>
            )}
          </div>

          {/* Phase 3 Dashboard */}
          <div className="p-6 border rounded-md bg-green-50">
            <h2 className="text-2xl font-semibold mb-4">ภาพรวมระยะที่ 3: การยืนยันสิทธิ์เข้าศึกษา</h2>
            {phase3Data && phase3ChartData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={phase3ChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, value }: PieLabelRenderProps) => `${name}: ${value} `}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {phase3ChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p>ไม่มีข้อมูลระยะที่ 3</p>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-4">
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
