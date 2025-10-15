'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DocumentType } from '@prisma/client';

interface Document {
  id: string;
  documentType: DocumentType;
  filePath: string;
}

interface Application {
  id: string;
  user: {
    nationalId: string;
    email: string;
    studentProfile: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  documents: Document[];
}

const documentTypeTranslations: Record<DocumentType, string> = {
  ADMISSION_CONFIRMATION_1: 'หนังสือยืนยันสิทธิ์ (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_3: 'ใบมอบตัว',
  EXAM_CONFIRMATION_1: 'เอกสารยืนยันสิทธิ์การเข้าสอบ',
  EXAM_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับยืนยันสิทธิ์สอบ)',
  PAYMENT_SLIP: 'แบบยืนยันการชําระเงินค่าธรรมเนียม',
};

export default function AdminConfirmAdmissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/confirm-admission');
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/student/dashboard');
    } else if (status === 'authenticated') {
      fetchApplications();
    }
  }, [status, router, session]);

  const handleFinalConfirm = async (applicationId: string) => {
    setSubmitting(applicationId);
    setError('');
    setSubmitSuccess('');
    try {
      const response = await fetch('/api/admin/confirm-admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to confirm admission');
      setSubmitSuccess(data.message);
      // Refresh the list after confirmation
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">ยืนยันการมอบตัวนักเรียน</h1>

        {submitSuccess && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert"><p>{submitSuccess}</p></div>}
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p>{error}</p></div>}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-sm text-left text-gray-500">
            <thead className="text-xs text-blue-800 uppercase bg-blue-50">
              <tr>
                <th scope="col" className="py-3 px-6">ชื่อ-สกุล</th>
                <th scope="col" className="py-3 px-6">อีเมล</th>
                <th scope="col" className="py-3 px-6">เอกสารมอบตัว</th>
                <th scope="col" className="py-3 px-6 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 border-b">
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {app.user.studentProfile?.firstName} {app.user.studentProfile?.lastName}
                    </td>
                    <td className="py-4 px-6">{app.user.email}</td>
                    <td className="py-4 px-6">
                      <ul className="space-y-2">
                        {app.documents
                          .filter(doc => doc.documentType.startsWith('ADMISSION_CONFIRMATION'))
                          .map(doc => (
                            <li key={doc.id}>
                              <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {documentTypeTranslations[doc.documentType] || doc.documentType}
                              </a>
                            </li>
                          ))}
                      </ul>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleFinalConfirm(app.id)}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submitting === app.id}
                      >
                        {submitting === app.id ? 'กำลังยืนยัน...' : 'ยืนยันการมอบตัว'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    ไม่พบนักเรียนที่ต้องยืนยันการมอบตัว
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}