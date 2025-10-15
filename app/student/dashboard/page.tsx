'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationStatus } from '@prisma/client';

interface Application {
  id: string;
  status: ApplicationStatus;
}

interface StudentProfile {
  firstName: string | null;
  lastName: string | null;
}

const statusTranslations: Record<ApplicationStatus, string> = {
  PENDING_REVIEW: 'รอตรวจสอบ',
  DOCUMENTS_SUBMITTED: 'ยื่นเอกสารแล้ว',
  ELIGIBLE_FOR_EXAM: 'มีสิทธิ์สอบ',
  ADMISSION_ANNOUNCED: 'ประกาศผลแล้ว',
  CONFIRMED_ADMISSION: 'ยืนยันสิทธิ์แล้ว',
  REJECTED_ADMISSION: 'สละสิทธิ์',
  NOT_PROCESSED: 'ไม่ดำเนินการ',
  WAITING_FOR_CALL: 'รอเรียก (ตัวสำรอง)',
};

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard'); // Redirect non-students
    }

    if (status === 'authenticated') {
      const fetchData = async () => {
        try {
          setLoadingData(true);
          // Fetch application status
          const appRes = await fetch('/api/student/status-tracking');
          if (appRes.ok) {
            const appData = await appRes.json();
            setApplication(appData);
          }

          // Fetch student profile
          const profileRes = await fetch('/api/student/profile');
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setProfile(profileData);
          }

        } catch (err) {
          console.error("Failed to fetch dashboard data", err);
          setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้');
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [status, router, session]);

  if (status === 'loading' || loadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">แดชบอร์ดนักเรียน</h1>
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            {profile ? `ยินดีต้อนรับ, ${profile.firstName} ${profile.lastName}` : `ยินดีต้อนรับ, ${session?.user?.email}`}
          </h2>
          {application ? (
            <p className="text-gray-700">
              สถานะการสมัครล่าสุดของคุณคือ: <span className="font-bold text-blue-600">{statusTranslations[application.status] || application.status}</span>
            </p>
          ) : (
            <p className="text-gray-700">คุณยังไม่มีใบสมัครในระบบ</p>
          )}
           {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

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
        </div>
      </div>
    </div>
  );
}
