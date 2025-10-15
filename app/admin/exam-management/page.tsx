'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ApplicationStatus } from '@prisma/client';
import { Edit2, Save, X, ArrowLeft, AlertCircle, CheckCircle, Users } from 'lucide-react';

interface UserProfile {
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

interface Application {
  id: string;
  user: UserProfile;
  examDetails: ExamDetails | null;
  status: ApplicationStatus;
}

export default function AdminExamManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [editExamEligible, setEditExamEligible] = useState(false);
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editSeatNumber, setEditSeatNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const eligibleApplications = useMemo(() => {
    return applications.filter(
      (app) => app.status === ApplicationStatus.ELIGIBLE_FOR_EXAM
    );
  }, [applications]);

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
          const response = await fetch('/api/admin/exam-management');
          const data = await response.json();
          if (response.ok) {
            setApplications(data);
          } else {
            setError(data.message || 'ไม่สามารถดึงข้อมูลใบสมัครได้');
          }
        } catch (err) {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลใบสมัคร:', err);
          setError('เกิดข้อผิดพลาดที่ไม่คาดคิดขณะดึงข้อมูลใบสมัคร');
        } finally {
          setLoading(false);
        }
      };
      fetchApplications();
    }
  }, [status, session, submitSuccess]);

  const handleEditClick = (application: Application) => {
    setEditingApplicationId(application.id);
    setEditExamEligible(application.examDetails?.examEligible || false);
    setEditRoomNumber(application.examDetails?.roomNumber || '');
    setEditSeatNumber(application.examDetails?.seatNumber || '');
    setError('');
    setSubmitSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingApplicationId(null);
    setEditRoomNumber('');
    setEditSeatNumber('');
    setError('');
    setSubmitSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitSuccess('');

    if (!editingApplicationId) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/exam-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: editingApplicationId,
          examEligible: editExamEligible,
          roomNumber: editRoomNumber,
          seatNumber: editSeatNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(data.message);
        setEditingApplicationId(null);
      } else {
        setError(data.message || 'Failed to update exam details');
      }
    } catch (err) {
      console.error('Save exam details error:', err);
      setError('An unexpected error occurred while saving exam details.');
    } finally {
      setSubmitting(false);
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Users size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">จัดการการสอบ</h1>
            </div>
            <p className="text-blue-100">จัดการรายชื่อและที่นั่งสอบของผู้เข้าสอบ</p>
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <h2 className="text-xl font-bold text-white">
              ผู้สมัครที่มีสิทธิ์สอบ ({eligibleApplications.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            {eligibleApplications.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">เลขประจำตัว</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อ-สกุล</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">มีสิทธิ์สอบ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">หมายเลขห้องสอบ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ที่นั่งสอบ</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleApplications.map((app, idx) => (
                    <tr
                      key={app.id}
                      className={`border-b transition-colors hover:bg-blue-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {editingApplicationId === app.id ? (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {app.user.nationalId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {app.user.studentProfile?.firstName || ''} {app.user.studentProfile?.lastName || ''}
                          </td>
                          <td className="px-6 py-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editExamEligible}
                                onChange={(e) => setEditExamEligible(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {editExamEligible ? 'ใช่' : 'ไม่'}
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editRoomNumber}
                              onChange={(e) => setEditRoomNumber(e.target.value)}
                              placeholder="กรอกหมายเลข"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editSeatNumber}
                              onChange={(e) => setEditSeatNumber(e.target.value)}
                              placeholder="กรอกหมายเลข"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={handleSave}
                                disabled={submitting}
                                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                              >
                                <Save size={16} />
                                {submitting ? 'บันทึก...' : 'บันทึก'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={submitting}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                              >
                                <X size={16} />
                                ยกเลิก
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {app.user.nationalId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {app.user.studentProfile?.firstName || ''} {app.user.studentProfile?.lastName || ''}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                app.examDetails?.examEligible
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {app.examDetails?.examEligible ? 'ใช่' : 'ไม่'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {app.examDetails?.roomNumber || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {app.examDetails?.seatNumber || '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleEditClick(app)}
                              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                            >
                              <Edit2 size={16} />
                              แก้ไข
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">ไม่พบนักเรียนที่มีสิทธิ์สอบ</p>
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