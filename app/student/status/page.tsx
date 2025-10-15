'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ApplicationStatus, DocumentType } from '@prisma/client';

interface Document {
  id: string;
  documentType: DocumentType;
  filePath: string;
  uploadedAt: string;
}

interface ExamDetails {
  id: string;
  examEligible: boolean;
  roomNumber: string | null;
  seatNumber: string | null;
}

interface AdmissionResult {
  id: string;
  isAdmitted: boolean | null;
  isConfirmed: boolean | null;
  confirmationDate: string | null;
}

interface Application {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  examDetails: ExamDetails | null;
  admissionResult: AdmissionResult | null;
  documents: Document[];
}

const documentTypeTranslations: Record<DocumentType, string> = {
  EXAM_CONFIRMATION_1: 'เอกสารยืนยันสิทธิ์การเข้าสอบ',
  EXAM_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับยืนยันสิทธิ์สอบ)',
  PAYMENT_SLIP: 'แบบยืนยันการชําระเงินค่าธรรมเนียม',
  ADMISSION_CONFIRMATION_1: 'หนังสือยืนยันสิทธิ์ (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_3: 'ใบมอบตัว',
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

export default function StudentStatusTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/student/status-tracking');
          const data = await response.json();
          if (response.ok) {
            setApplication(data);
          } else {
            setError(data.message || 'ไม่สามารถดึงข้อมูลสถานะการสมัครได้');
          }
        } catch (err) {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ:', err);
          setError('เกิดข้อผิดพลาดที่ไม่คาดคิดขณะดึงข้อมูลสถานะการสมัคร');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchApplicationStatus();
  }, [session]);

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">กำลังโหลด...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">ติดตามสถานะการสมัคร</h1>

        {application ? (
          <div>
            <p className="mb-2">
              <strong>สถานะปัจจุบัน:</strong>{' '}
              <span className="font-semibold">{statusTranslations[application.status] || application.status.replace(/_/g, ' ')}</span>
            </p>
            <p className="mb-2">
              <strong>วันที่สมัคร:</strong> {new Date(application.createdAt).toLocaleDateString()}
            </p>

            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">รายละเอียดการสอบ</h2>
              {application.examDetails ? (
                <div>
                  <p>
                    <strong>มีสิทธิ์สอบ:</strong>{' '}
                    <span className={application.examDetails.examEligible ? 'text-green-600' : 'text-red-600'}>
                      {application.examDetails.examEligible ? 'ใช่' : 'ไม่'}
                    </span>
                  </p>
                  {application.examDetails.examEligible && (
                    <>
                      <p><strong>หมายเลขห้องสอบ:</strong> {application.examDetails.roomNumber || '-'}</p>
                      <p><strong>หมายเลขที่นั่งสอบ:</strong> {application.examDetails.seatNumber || '-'}</p>
                    </>
                  )}
                </div>
              ) : (
                <p>ยังไม่มีรายละเอียดการสอบ</p>
              )}
            </div>

            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">ผลการรับเข้าศึกษา</h2>
              {application.admissionResult ? (
                <div>
                  <p>
                    <strong>ผลการคัดเลือก:</strong>{' '}
                    {application.admissionResult.isAdmitted === true ? (
                      <span className="text-green-600">ผ่านการคัดเลือก (ตัวจริง)</span>
                    ) : application.admissionResult.isAdmitted === false ? (
                      <span className="text-yellow-600">Reserve (สำรอง)</span>
                    ) : (
                      <span className="text-gray-600">ยังไม่ประกาศผล</span>
                    )}
                  </p>
                  <p>
                    <strong>การยืนยันสิทธิ์:</strong>{' '}
                    {application.admissionResult.isConfirmed === true ? (
                      <span className="text-green-600">ยืนยันสิทธิ์แล้ว</span>
                    ) : application.admissionResult.isConfirmed === false ? (
                      <span className="text-red-600">สละสิทธิ์</span>
                    ) : (
                      <span className="text-gray-600">รอดำเนินการ</span>
                    )}
                  </p>
                  {application.admissionResult.confirmationDate && (
                    <p>
                      <strong>วันที่ตัดสินใจ:</strong> {new Date(application.admissionResult.confirmationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p>ยังไม่มีผลการรับเข้าศึกษา</p>
              )}
            </div>

            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">เอกสารที่อัปโหลดแล้ว</h2>
              {application.documents.length > 0 ? (
                <ul className="list-disc pl-5">
                  {application.documents.map((doc) => (
                    <li key={doc.id} className="mb-2">
                      <strong>{documentTypeTranslations[doc.documentType] || doc.documentType.replace(/_/g, ' ')}:</strong>{' '}
                      <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {doc.filePath.split('/').pop()}
                      </a>{' '}
                      (อัปโหลดเมื่อ: {new Date(doc.uploadedAt).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>ยังไม่มีเอกสารที่อัปโหลด</p>
              )}
            </div>
          </div>
        ) : (
          <p>ยังไม่มีข้อมูลการสมัคร</p>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
