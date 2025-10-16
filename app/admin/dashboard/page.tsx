'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationStatus } from '@prisma/client';
import { BarChart3, Users, CheckCircle, XCircle, Clock, Download, AlertCircle } from 'lucide-react';

interface Phase2Data {
  totalConfirmed: number;
  confirmedByProvince: { status: ApplicationStatus; _count: { id: number } }[];
  confirmedBySchool: { status: ApplicationStatus; _count: { id: number } }[];
}

interface Phase3Data {
  totalApplicants: number;
  confirmedCount: number;
  admittedCount: number;
  waitlistedCount: number;
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
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/student/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
          const [res2, res3] = await Promise.all([
            fetch('/api/admin/dashboard-phase2'),
            fetch('/api/admin/dashboard-phase3'),
          ]);

          if (!res2.ok) throw new Error('ไม่สามารถโหลดข้อมูลระยะที่ 2');
          if (!res3.ok) throw new Error('ไม่สามารถโหลดข้อมูลระยะที่ 3');

          const [data2, data3] = await Promise.all([res2.json(), res3.json()]);

          setPhase2Data(data2 as Phase2Data);
          setPhase3Data(data3 as Phase3Data);
        } catch (err) {
          console.error('Failed to fetch dashboard data:', err);
          setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
          setLoading(false);
        }
      };
      fetchDashboardData();
    }
  }, [session, status]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/export-data');
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      setError('ไม่สามารถส่งออกข้อมูล');
    } finally {
      setExporting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-blue-700 font-semibold">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-red-600">เกิดข้อผิดพลาด</h2>
          </div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={32} />
              <h1 className="text-4xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
            </div>
            <p className="text-blue-100 text-lg">ยินดีต้อนรับ, {session?.user?.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Phase 2 Dashboard */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex items-center gap-3">
                <Users size={28} className="text-white" />
                <h2 className="text-2xl font-bold text-white">ระยะที่ 2: การจัดการสอบ</h2>
              </div>
            </div>
            <div className="p-8">
              {phase2Data ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                    <p className="text-gray-600 text-sm font-medium">จำนวนผู้มีสิทธิ์สอบทั้งหมด</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{phase2Data.totalConfirmed}</p>
                    <p className="text-xs text-gray-500 mt-2">ผู้สมัครที่ผ่านการคัดเลือกระยะแรก</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">ไม่มีข้อมูลระยะที่ 2</p>
              )}
            </div>
          </div>

          {/* Phase 3 Dashboard */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
              <div className="flex items-center gap-3">
                <BarChart3 size={28} className="text-white" />
                <h2 className="text-2xl font-bold text-white">ระยะที่ 3: การยืนยันสิทธิ์</h2>
              </div>
            </div>
            <div className="p-8">
              {phase3Data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-gray-600 text-xs font-medium">ผ่านการคัดเลือก (ตัวจริง)</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">{phase3Data.admittedCount}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <p className="text-gray-600 text-xs font-medium">ผ่านการคัดเลือก (ตัวสำรอง)</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">{phase3Data.waitlistedCount}</p>
                    </div>
                  </div>
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">สถานะการยืนยันสิทธิ์</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-gray-600 text-xs font-medium">ผู้สมัครทั้งหมด</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-1">{phase3Data.totalApplicants}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-600" />
                        <span className="text-gray-600 text-xs font-medium">ยืนยันแล้ว</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600 mt-1">{phase3Data.confirmedCount}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center gap-2">
                        <XCircle size={18} className="text-red-600" />
                        <span className="text-gray-600 text-xs font-medium">สละสิทธิ์</span>
                      </div>
                      <p className="text-3xl font-bold text-red-600 mt-1">{phase3Data.rejectedCount}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-yellow-600" />
                        <span className="text-gray-600 text-xs font-medium">ยังไม่ดำเนินการ</span>
                      </div>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">{phase3Data.notProcessedCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">ไม่มีข้อมูลระยะที่ 3</p>
              )}
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-center">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 transform hover:scale-105 active:scale-95 disabled:shadow-none"
          >
            <Download size={20} />
            {exporting ? 'กำลังส่งออก...' : 'ส่งออกข้อมูลทั้งหมดเป็น Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}