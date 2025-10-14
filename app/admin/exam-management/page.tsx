'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, ReactNode } from 'react';
import { ApplicationStatus } from '@prisma/client';

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

  // Filter applications to show only those eligible for the exam
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
      }
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
        setEditingApplicationId(null); // Exit edit mode
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">กำลังโหลด...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">ผู้ดูแลระบบ: จัดการการสอบ</h1>

        {submitSuccess && <p className="text-green-500 text-xs italic mb-4">{submitSuccess}</p>}
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">เลขประจำตัวประชาชน</th>
                <th className="py-2 px-4 border-b">ชื่อ-สกุล</th>
                <th className="py-2 px-4 border-b">มีสิทธิ์สอบ</th>
                <th className="py-2 px-4 border-b">หมายเลขห้องสอบ</th>
                <th className="py-2 px-4 border-b">หมายเลขที่นั่งสอบ</th>
                <th className="py-2 px-4 border-b">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {eligibleApplications.length > 0 ? (
                eligibleApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{app.user.nationalId}</td>
                    <td className="py-2 px-4 border-b">
                      {app.user.studentProfile?.firstName || ''} {app.user.studentProfile?.lastName || ''}
                    </td>
                    {editingApplicationId === app.id ? (
                      <>
                        <td className="py-2 px-4 border-b">
                          <input
                            type="checkbox"
                            checked={editExamEligible}
                            onChange={(e) => setEditExamEligible(e.target.checked)}
                          />
                        </td>
                        <td className="py-2 px-4 border-b">
                          <input
                            type="text"
                            value={editRoomNumber}
                            onChange={(e) => setEditRoomNumber(e.target.value)}
                            className="border rounded px-2 py-1 w-24"
                          />
                        </td>
                        <td className="py-2 px-4 border-b">
                          <input
                            type="text"
                            value={editSeatNumber}
                            onChange={(e) => setEditSeatNumber(e.target.value)}
                            className="border rounded px-2 py-1 w-24"
                          />
                        </td>
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded mr-2"
                            disabled={submitting}
                          >
                            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-700 text-white text-sm py-1 px-2 rounded"
                            disabled={submitting}
                          >
                            ยกเลิก
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-4 border-b">{app.examDetails?.examEligible ? 'ใช่' : 'ไม่'}</td>
                        <td className="py-2 px-4 border-b">{app.examDetails?.roomNumber || '-'}</td>
                        <td className="py-2 px-4 border-b">{app.examDetails?.seatNumber || '-'}</td>
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={() => handleEditClick(app)}
                            className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-2 rounded"
                          >
                            แก้ไข
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">ไม่พบนักเรียนที่มีสิทธิ์สอบ</td>
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
