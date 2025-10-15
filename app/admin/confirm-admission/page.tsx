'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DocumentType } from '@prisma/client';
import { CheckCircle, AlertCircle, FileText, ArrowLeft, Handshake, Users, HandshakeIcon } from 'lucide-react';

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
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลใบสมัครได้');
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
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
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถยืนยันการมอบตัวได้');
      setSubmitSuccess(data.message);
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-blue-700 font-semibold">กำลังโหลดข้อมูล...</p>
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
              <HandshakeIcon size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">ยืนยันการมอบตัวนักเรียน</h1>
            </div>
            <p className="text-blue-100">ยืนยันการมอบตัวและการเข้าศึกษาของนักเรียน</p>
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
              รายชื่อนักเรียน ({applications.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            {applications.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อ-สกุล</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">อีเมล</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">เอกสารมอบตัว</th>
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
                        {app.user.studentProfile?.firstName} {app.user.studentProfile?.lastName}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-700">
                        {app.user.email}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        <ul className="space-y-2">
                          {app.documents
                            .filter((doc) => doc.documentType.startsWith('ADMISSION_CONFIRMATION'))
                            .map((doc) => (
                              <li key={doc.id} className="flex items-center gap-2">
                                <FileText size={14} className="text-blue-600 flex-shrink-0" />
                                <a
                                  href={doc.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs md:text-sm"
                                >
                                  {documentTypeTranslations[doc.documentType] || doc.documentType}
                                </a>
                              </li>
                            ))}
                        </ul>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-center">
                        <button
                          onClick={() => handleFinalConfirm(app.id)}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 md:px-6 py-2 rounded-lg transition-all duration-200 text-xs md:text-sm font-bold whitespace-nowrap shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 active:scale-95"
                          disabled={submitting === app.id}
                        >
                          <CheckCircle size={16} />
                          {submitting === app.id ? 'กำลังยืนยัน...' : 'ยืนยันการมอบตัว'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">ไม่พบนักเรียนที่ต้องยืนยันการมอบตัว</p>
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