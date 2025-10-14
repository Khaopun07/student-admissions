'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { ApplicationStatus } from '@prisma/client';

interface UserProfile {
  firstName: ReactNode;
  lastName: ReactNode;
  nationalId: string;
  email: string;
  studentProfile: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface ExamDetails {
  examEligible: boolean;
  roomNumber: string | null;
  seatNumber: string | null;
}

interface AdmissionResult {
  isAdmitted: boolean | null;
  isConfirmed: boolean | null;
}

interface Application {
  id: string;
  user: UserProfile;
  status: ApplicationStatus;
  examDetails: ExamDetails | null;
  admissionResult: AdmissionResult | null;
}

export default function AdminAdmissionManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/student/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchApplications = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/admin/admission-management');
          if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลใบสมัครได้');
          const data = await response.json();
          setApplications(data);
        } catch (err) {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลใบสมัคร:', err);
          setError('เกิดข้อผิดพลาดที่ไม่คาดคิดขณะดึงข้อมูลใบสมัคร');
        } finally {
          setLoading(false);
        }
      };
      fetchApplications();
    }
  }, [session, submitSuccess, status]);

  const handleAnnounceResult = async (applicationId: string, isAdmitted: boolean) => {
    setError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/admission-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'announce',
          isAdmitted,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(data.message);
      } else {
        setError(data.message || 'ไม่สามารถประกาศผลการรับเข้าศึกษาได้');
      }
    } catch (err) {
      console.error('เกิดข้อผิดพลาดในการประกาศผล:', err);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิดขณะประกาศผล');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">กำลังโหลด...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">ผู้ดูแลระบบ: จัดการผลการรับเข้าศึกษา</h1>

        {submitSuccess && <p className="text-green-500 text-xs italic mb-4">{submitSuccess}</p>}
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">เลขประจำตัวประชาชน</th>
                <th className="py-2 px-4 border-b">ชื่อ-สกุล</th>
                <th className="py-2 px-4 border-b">อีเมล</th>
                <th className="py-2 px-4 border-b">สถานะปัจจุบัน</th>
                <th className="py-2 px-4 border-b">ผลการรับเข้าศึกษา</th>
                <th className="py-2 px-4 border-b">นักเรียนยืนยันสิทธิ์?</th>
                <th className="py-2 px-4 border-b">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{app.user.nationalId}</td>
                    <td className="py-2 px-4 border-b">
                      {app.user.studentProfile?.firstName} {app.user.studentProfile?.lastName}
                    </td>
                    <td className="py-2 px-4 border-b">{app.user.email}</td>
                    <td className="py-2 px-4 border-b">{app.status.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-4 border-b">
                      {app.admissionResult?.isAdmitted === true ? 'ตัวจริง' :
                       app.admissionResult?.isAdmitted === false ? 'สำรอง' : 'ไม่มีข้อมูล'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {app.admissionResult?.isConfirmed === true ? 'ใช่' :
                       app.admissionResult?.isConfirmed === false ? 'ไม่' : 'รอดำเนินการ'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {app.status === ApplicationStatus.ADMISSION_ANNOUNCED || app.status === ApplicationStatus.CONFIRMED_ADMISSION || app.status === ApplicationStatus.REJECTED_ADMISSION ? (
                        <span className="text-gray-500">ประกาศผลแล้ว</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAnnounceResult(app.id, true)}
                            className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded mr-2"
                            disabled={submitting}
                          >
                            ประกาศเป็นตัวจริง
                          </button>
                          <button
                            onClick={() => handleAnnounceResult(app.id, false)}
                            className="bg-yellow-500 hover:bg-yellow-700 text-white text-sm py-1 px-2 rounded"
                            disabled={submitting}
                          >
                            ประกาศเป็นตัวสำรอง
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center">ไม่พบใบสมัคร</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
