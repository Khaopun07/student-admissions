'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { ApplicationStatus } from '@prisma/client';
import { CheckCircle, XCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown, ArrowLeft, Trophy } from 'lucide-react';

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

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.ELIGIBLE_FOR_EXAM:
        return <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold"><Clock size={14} className="mr-1" /> มีสิทธิ์สอบ</span>;
      case ApplicationStatus.ADMISSION_ANNOUNCED:
        return <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold"><Trophy size={14} className="mr-1" /> ประกาศผลแล้ว</span>;
      case ApplicationStatus.CONFIRMED_ADMISSION:
        return <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold"><CheckCircle size={14} className="mr-1" /> ยืนยันเข้าศึกษา</span>;
      case ApplicationStatus.REJECTED_ADMISSION:
        return <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold"><XCircle size={14} className="mr-1" /> สละสิทธิ์</span>;
      default:
        return <span className="text-gray-500 text-sm">{status.replace(/_/g, ' ')}</span>;
    }
  };

  const getAdmissionBadge = (isAdmitted: boolean | null) => {
    if (isAdmitted === true) {
      return <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold"><CheckCircle size={14} className="mr-1" /> ตัวจริง</span>;
    } else if (isAdmitted === false) {
      return <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold"><Clock size={14} className="mr-1" /> สำรอง</span>;
    }
    return <span className="text-gray-400 text-sm">ไม่มีข้อมูล</span>;
  };

  const getConfirmBadge = (isConfirmed: boolean | null) => {
    if (isConfirmed === true) {
      return <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold"><CheckCircle size={14} className="mr-1" /> ใช่</span>;
    } else if (isConfirmed === false) {
      return <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold"><XCircle size={14} className="mr-1" /> ไม่</span>;
    }
    return <span className="text-gray-400 text-sm">รอดำเนินการ</span>;
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

  if (error && !submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-600" />
            <h2 className="text-xl font-bold text-red-600">เกิดข้อผิดพลาด</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            รีเฟรชหน้า
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">จัดการผลการรับเข้าศึกษา</h1>
            </div>
            <p className="text-blue-100">ประกาศผลการรับเข้าศึกษาและติดตามการยืนยันสิทธิ์</p>
          </div>
        </div>

        {/* Messages */}
        {submitSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 font-medium">{submitSuccess}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <h2 className="text-xl font-bold text-white">
              รายชื่อผู้สมัคร ({applications.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            {applications.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">เลขประจำตัว</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อ-สกุล</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">อีเมล</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">ผลการรับ</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">ยืนยันสิทธิ์</th>
                    <th className="px-4 md:px-6 py-4 text-center text-sm font-semibold text-gray-700">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr
                      key={app.id}
                      className={`border-b transition-colors hover:bg-blue-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">
                        {app.user.nationalId}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                        {app.user.studentProfile?.firstName} {app.user.studentProfile?.lastName}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-700">
                        {app.user.email}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        {getAdmissionBadge(app.admissionResult?.isAdmitted ?? null)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        {getConfirmBadge(app.admissionResult?.isConfirmed ?? null)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-center">
                        {app.status === ApplicationStatus.ADMISSION_ANNOUNCED || 
                         app.status === ApplicationStatus.CONFIRMED_ADMISSION || 
                         app.status === ApplicationStatus.REJECTED_ADMISSION ? (
                          <span className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold">
                            <CheckCircle size={16} className="mr-2" />
                            ประกาศแล้ว
                          </span>
                        ) : (
                          <div className="flex flex-col md:flex-row gap-2 justify-center">
                            <button
                              onClick={() => handleAnnounceResult(app.id, true)}
                              disabled={submitting}
                              className="inline-flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap"
                            >
                              <ThumbsUp size={16} />
                              <span className="hidden md:inline">ตัวจริง</span>
                              <span className="md:hidden">จริง</span>
                            </button>
                            <button
                              onClick={() => handleAnnounceResult(app.id, false)}
                              disabled={submitting}
                              className="inline-flex items-center justify-center gap-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap"
                            >
                              <Clock size={16} />
                              <span className="hidden md:inline">สำรอง</span>
                              <span className="md:hidden">สำรอง</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">ไม่พบใบสมัคร</p>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={20} />
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
