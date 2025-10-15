'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ChangeEvent } from 'react';
import { DocumentType, ApplicationStatus } from '@prisma/client';
import { FiFile, FiUpload, FiAlertCircle, FiLoader } from 'react-icons/fi';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';

const REQUIRED_DOCUMENTS = [
  DocumentType.ADMISSION_CONFIRMATION_1,
  DocumentType.ADMISSION_CONFIRMATION_2,
  DocumentType.ADMISSION_CONFIRMATION_3
];

interface AdmissionResult {
  id: string;
  applicationId: string;
  isAdmitted: boolean | null;
  isConfirmed: boolean | null;
  confirmationDate: string | null;
  application: {
    status: ApplicationStatus;
  };
}

interface DocumentUploadState {
  [key: string]: File | null;
}

const documentTypeTranslations: Record<DocumentType, string> = {
  ADMISSION_CONFIRMATION_1: 'หนังสือยืนยันสิทธิ์ (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_3: 'ใบมอบตัว',
  EXAM_CONFIRMATION_1: 'เอกสารยืนยันสิทธิ์การเข้าสอบ',
  EXAM_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับยืนยันสิทธิ์สอบ)',
  PAYMENT_SLIP: 'แบบยืนยันการชําระเงินค่าธรรมเนียม',
};

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

export default function StudentAdmissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admissionResult, setAdmissionResult] = useState<AdmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmationSuccess, setConfirmationSuccess] = useState('');
  const [documentUploads, setDocumentUploads] = useState<DocumentUploadState>({
    [DocumentType.ADMISSION_CONFIRMATION_1]: null,
    [DocumentType.ADMISSION_CONFIRMATION_2]: null,
    [DocumentType.ADMISSION_CONFIRMATION_3]: null,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    const fetchAdmissionResult = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/student/admission-status');
          const data = await response.json();
          if (response.ok) {
            setAdmissionResult(data);
          } else {
            setError(data.message || 'Failed to fetch admission status');
          }
        } catch (err) {
          console.error('Failed to fetch admission status:', err);
          setError('An unexpected error occurred while fetching admission status.');
        } finally {
          setLoading(false);
        }
      }
    };
    if (status === 'authenticated') {
      fetchAdmissionResult();
    }
  }, [session, status, confirmationSuccess]);

  const handleDocumentChange = (e: ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    const files = e.target.files;
    if (files && files[0]) {
      setDocumentUploads(prev => ({ ...prev, [docType]: files[0] }));
    } else {
      setDocumentUploads(prev => ({ ...prev, [docType]: null }));
    }
  };

  const handleConfirmAdmission = async (confirm: boolean) => {
    setError('');
    setConfirmationSuccess('');

    if (!admissionResult?.applicationId) {
      setError('ไม่พบใบสมัครเพื่อยืนยันหรือสละสิทธิ์');
      return;
    }

    const allDocsUploaded = REQUIRED_DOCUMENTS.every(docType => documentUploads[docType]);
    if (confirm && !allDocsUploaded) {
      setError('กรุณาอัปโหลดเอกสารที่จำเป็นให้ครบทุกไฟล์เพื่อยืนยันสิทธิ์');
      return;
    }

    setConfirming(true);
    try {
      const formData = new FormData();
      formData.append('applicationId', admissionResult.applicationId);
      formData.append('confirmAdmission', String(confirm));

      if (confirm) {
        REQUIRED_DOCUMENTS.forEach(docType => {
          if (documentUploads[docType]) {
            formData.append(docType, documentUploads[docType]!);
          }
        });
      }

      const response = await fetch('/api/student/admission-status', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setConfirmationSuccess(data.message);
        // Reset form state
        setDocumentUploads({
          [DocumentType.ADMISSION_CONFIRMATION_1]: null,
          [DocumentType.ADMISSION_CONFIRMATION_2]: null,
          [DocumentType.ADMISSION_CONFIRMATION_3]: null,
        });
      } else {
        setError(data.message || 'การดำเนินการล้มเหลว');
      }
    } catch (err) {
      console.error('Admission confirmation error:', err);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
      setConfirming(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <FiLoader className="inline-block animate-spin h-12 w-12 text-blue-600" />
          <p className="mt-4 text-gray-700">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full mb-4">
            <IoCheckmarkCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent mb-2">
            สถานะการรับเข้าศึกษา
          </h1>
          <p className="text-gray-600">ยืนยัน หรือ สละสิทธิ์การเข้าศึกษา</p>
        </div>

        {admissionResult ? (
          <div className="space-y-6">
            {/* Admission Result Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-l-4 border-blue-500">
              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FiFile className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-semibold">ผลการรับเข้าศึกษา</p>
                      <p className="text-xl font-bold">
                        {admissionResult.isAdmitted ? (
                          <span className="text-green-600">✓ ผ่านการคัดเลือก (ตัวจริง)</span>
                        ) : admissionResult.isAdmitted === false ? (
                          <span className="text-orange-600">→ ผ่านการคัดเลือก (ตัวสำรอง)</span>
                        ) : (
                          <span className="text-gray-600">- ยังไม่ประกาศผล</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-blue-200 to-orange-200"></div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <FiAlertCircle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-semibold">สถานะปัจจุบัน</p>
                      <p className="text-lg font-semibold text-blue-800">
                        {statusTranslations[admissionResult.application.status] || admissionResult.application.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            {admissionResult.isAdmitted !== null && admissionResult.isConfirmed === null && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <FiUpload className="w-6 h-6 text-orange-500" />
                  ยืนยัน หรือ สละสิทธิ์การเข้าศึกษา
                </h2>
                <p className="text-gray-600 mb-8">
                  หากคุณต้องการยืนยันสิทธิ์ กรุณาอัปโหลดเอกสารที่จำเป็นให้ครบถ้วน
                </p>

                <div className="space-y-6">
                  {REQUIRED_DOCUMENTS.map((docType, index) => (
                    <div key={docType} className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-orange-100 rounded-full">
                          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text">
                            เอกสารที่ {index + 1}
                          </span>
                        </div>
                        <label htmlFor={docType} className="block text-gray-800 font-semibold text-sm md:text-base">
                          {documentTypeTranslations[docType]}
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          id={docType}
                          name={docType}
                          type="file"
                          className="sr-only"
                          onChange={(e) => handleDocumentChange(e, docType)}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label
                          htmlFor={docType}
                          className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
                        >
                          <div className="text-center">
                            <FiUpload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                            <div className="flex text-sm text-gray-600">
                              <span className="relative font-semibold text-orange-500 hover:text-orange-600">
                                อัปโหลดไฟล์
                              </span>
                              <p className="pl-1">หรือลากและวาง</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG ขนาดไม่เกิน 5MB</p>
                          </div>
                        </label>
                      </div>

                      {documentUploads[docType] && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                          <IoCheckmarkCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <p className="text-sm text-green-800 font-medium">ไฟล์ที่เลือก: {documentUploads[docType]?.name}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <IoCloseCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}

                {confirmationSuccess && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <IoCheckmarkCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-green-700 font-medium">{confirmationSuccess}</p>
                  </div>
                )}

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleConfirmAdmission(true)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                    disabled={confirming}
                  >
                    {confirming ? (
                      <span className="flex items-center justify-center">
                        <FiLoader className="animate-spin h-5 w-5 mr-2" />
                        กำลังยืนยัน...
                      </span>
                    ) : (
                      '✓ ยืนยันสิทธิ์'
                    )}
                  </button>
                  <button
                    onClick={() => handleConfirmAdmission(false)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 shadow-lg"
                    disabled={confirming}
                  >
                    {confirming ? (
                      <span className="flex items-center justify-center">
                        <FiLoader className="animate-spin h-5 w-5 mr-2" />
                        กำลังดำเนินการ...
                      </span>
                    ) : '✗ สละสิทธิ์'}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation Status */}
            {admissionResult.isConfirmed !== null && (
              <div
                className={`rounded-xl shadow-lg p-8 border-l-4 ${
                  admissionResult.isConfirmed
                    ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500'
                    : 'bg-gradient-to-r from-red-50 to-red-100 border-red-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  {admissionResult.isConfirmed ? (
                    <IoCheckmarkCircle className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
                  ) : (
                    <IoCloseCircle className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">การตัดสินใจของคุณ</h2>
                    <p className="text-gray-800">
                      คุณได้ทำการ{' '}
                      <span
                        className={`font-bold ${
                          admissionResult.isConfirmed ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {admissionResult.isConfirmed ? 'ยืนยันสิทธิ์' : 'สละสิทธิ์'}
                      </span>{' '}
                      เมื่อวันที่{' '}
                      <span className="font-semibold">
                        {new Date(admissionResult.confirmationDate || Date.now()).toLocaleDateString(
                          'th-TH',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">ยังไม่มีผลการรับเข้าศึกษา</p>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-lg shadow-md border border-gray-200 transition-all transform hover:scale-105"
          >
            ← กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
