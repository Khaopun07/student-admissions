'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { ApplicationStatus, DocumentType } from '@prisma/client';
import { CheckCircle, AlertCircle, FileText, ArrowLeft, X, Send, Filter } from 'lucide-react';

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

interface ApplicationDetails {
  id: string;
  status: ApplicationStatus;
  user: UserProfile;
}

interface Document {
  id: string;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
  application: ApplicationDetails;
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
  ADMISSION_COMPLETED: 'การสมัครเสร็จสมบูรณ์',
};

export default function AdminDocumentReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [missingDocsNotification, setMissingDocsNotification] = useState({
    show: false,
    applicationId: '',
    missingTypes: [] as DocumentType[],
    message: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/student/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchDocuments = async () => {
        try {
          setLoading(true);
          const query = filterStatus ? `?status=${filterStatus}` : '';
          const response = await fetch(`/api/admin/document-review${query}`);
          if (!response.ok) throw new Error('Failed to fetch documents for review');
          const data = await response.json();
          setDocuments(data);
        } catch (err) {
          console.error('Failed to fetch documents for review:', err);
          setError('เกิดข้อผิดพลาดในการดึงเอกสารตรวจสอบ');
        } finally {
          setLoading(false);
        }
      };
      fetchDocuments();
    }
  }, [session, filterStatus, submitSuccess, status]);

  const handleConfirmDocuments = async (applicationId: string) => {
    setError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/document-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'confirm_documents',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(data.message);
      } else {
        setError(data.message || 'ไม่สามารถยืนยันเอกสารได้');
      }
    } catch (err) {
      console.error('Confirm documents error:', err);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิดขณะยืนยันเอกสาร');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyMissingDocuments = (applicationId: string) => {
    setMissingDocsNotification({
      show: true,
      applicationId,
      missingTypes: [],
      message: '',
    });
  };

  const handleSendNotification = async () => {
    setError('');
    setSubmitSuccess('');
    setSubmitting(true);

    if (!missingDocsNotification.applicationId || missingDocsNotification.missingTypes.length === 0) {
      setError('โปรดเลือกประเภทเอกสารที่ขาด');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/document-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: missingDocsNotification.applicationId,
          action: 'notify_missing_documents',
          missingDocumentTypes: missingDocsNotification.missingTypes,
          message: missingDocsNotification.message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(data.message);
        setMissingDocsNotification({ show: false, applicationId: '', missingTypes: [], message: '' });
      } else {
        setError(data.message || 'ไม่สามารถส่งการแจ้งเตือนได้');
      }
    } catch (err) {
      console.error('Send notification error:', err);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิดขณะส่งการแจ้งเตือน');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-blue-700 font-semibold">กำลังโหลดเอกสาร...</p>
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

  const uniqueApplications = Array.from(
    new Map(documents.map((doc) => [doc.application.id, doc.application])).values()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-25 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={32} />
              <h1 className="text-3xl md:text-4xl font-bold">ตรวจสอบเอกสาร</h1>
            </div>
            <p className="text-blue-100">ตรวจสอบและยืนยันเอกสารของผู้สมัคร</p>
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

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-blue-600" />
            <label htmlFor="statusFilter" className="text-lg font-semibold text-gray-800">
              กรองตามสถานะใบสมัคร:
            </label>
          </div>
          <select
            id="statusFilter"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 text-gray-700"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ApplicationStatus | '')}
          >
            <option value="">ทุกสถานะ</option>
            {Object.values(ApplicationStatus).map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusTranslations[statusOption] || statusOption}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <h2 className="text-xl font-bold text-white">
              รายการเอกสาร ({uniqueApplications.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            {uniqueApplications.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">เลขประจำตัว</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">ชื่อ-สกุล</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">อีเมล</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                    <th className="px-4 md:px-6 py-4 text-left text-sm font-semibold text-gray-700">เอกสาร</th>
                    <th className="px-4 md:px-6 py-4 text-center text-sm font-semibold text-gray-700">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueApplications.map((app, idx) => (
                    <tr
                      key={app.id}
                      className={`border-b transition-colors hover:bg-blue-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">
                        {app.user.nationalId}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-medium text-gray-900">
                        {app.user.studentProfile?.firstName} {app.user.studentProfile?.lastName}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm text-gray-700">
                        {app.user.email}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {statusTranslations[app.status] || app.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm">
                        <ul className="space-y-2">
                          {documents
                            .filter((doc) => doc.application.id === app.id)
                            .map((doc) => (
                              <li key={doc.id} className="flex items-center gap-2">
                                <FileText size={14} className="text-blue-600 flex-shrink-0" />
                                <a
                                  href={doc.filePath.replace(/^public/, '')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  ดู
                                </a>
                                <span className="text-gray-500 text-xs">
                                  ({doc.documentType.replace(/_/g, ' ')})
                                </span>
                              </li>
                            ))}
                        </ul>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-center">
                        <div className="flex flex-col md:flex-row gap-2 justify-center">
                          <button
                            onClick={() => handleConfirmDocuments(app.id)}
                            className="inline-flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-semibold whitespace-nowrap"
                            disabled={submitting}
                          >
                            <CheckCircle size={16} />
                            <span className="hidden md:inline">ยืนยันเอกสาร</span>
                            <span className="md:hidden">ยืนยัน</span>
                          </button>
                          <button
                            onClick={() => handleNotifyMissingDocuments(app.id)}
                            className="inline-flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-semibold whitespace-nowrap"
                            disabled={submitting}
                          >
                            <AlertCircle size={16} />
                            <span className="hidden md:inline">แจ้งเอกสารขาด</span>
                            <span className="md:hidden">ขาด</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">ไม่พบเอกสารที่ต้องตรวจสอบ</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {missingDocsNotification.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 flex items-center gap-3">
                <AlertCircle size={28} className="text-white" />
                <h2 className="text-2xl font-bold text-white">แจ้งเอกสารขาด</h2>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-4">
                    เลือกประเภทเอกสารที่ขาด:
                  </label>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {Object.values(DocumentType).map((type) => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`missing-${type}`}
                          checked={missingDocsNotification.missingTypes.includes(type)}
                          onChange={(e) => {
                            const newMissingTypes = e.target.checked
                              ? [...missingDocsNotification.missingTypes, type]
                              : missingDocsNotification.missingTypes.filter((t) => t !== type);
                            setMissingDocsNotification((prev) => ({
                              ...prev,
                              missingTypes: newMissingTypes,
                            }));
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor={`missing-${type}`} className="ml-3 text-sm text-gray-700">
                          {type.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="notificationMessage"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    ข้อความเพิ่มเติม (ถ้ามี):
                  </label>
                  <textarea
                    id="notificationMessage"
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-200 text-gray-700 placeholder-gray-400 resize-none"
                    placeholder="กรุณากรอกข้อความแจ้งเตือน..."
                    value={missingDocsNotification.message}
                    onChange={(e) =>
                      setMissingDocsNotification((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                  ></textarea>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() =>
                      setMissingDocsNotification({
                        show: false,
                        applicationId: '',
                        missingTypes: [],
                        message: '',
                      })
                    }
                    className="inline-flex items-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
                    disabled={submitting}
                  >
                    <X size={16} />
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSendNotification}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                    disabled={submitting}
                  >
                    <Send size={16} />
                    {submitting ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือน'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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