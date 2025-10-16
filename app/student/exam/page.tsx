'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
interface ExamDetails {
  id: string;
  examEligible: boolean;
  roomNumber: string | null;
  seatNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function StudentExamDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
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
    const fetchExamDetails = async () => {
      if (session?.user?.id) {
        try {
          setLoading(true);
          const response = await fetch('/api/student/exam-details');
          const data = await response.json();
          if (response.ok) {
            setExamDetails(data);
          } else {
            if (response.status === 404) {
              setExamDetails(null); // ไม่พบข้อมูล ให้ตั้งเป็น null
            } else {
              setError(data.message || 'ไม่สามารถดึงข้อมูลการสอบได้');
            }
          }
        } catch (err) {
          console.error('Failed to fetch exam details:', err);
          setError('An unexpected error occurred while fetching exam details.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchExamDetails();
  }, [session]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">รายละเอียดการสอบ</h1>

        {examDetails ? (
          examDetails.examEligible ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-900 p-6 rounded-r-lg shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h2 className="text-2xl font-bold">คุณมีสิทธิ์เข้าสอบ</h2>
              </div>
              <p className="text-blue-800 mb-6">ขอให้โชคดีกับการสอบ! กรุณาตรวจสอบรายละเอียดด้านล่างและไปถึงห้องสอบก่อนเวลา</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                <div className="bg-white p-4 rounded-lg flex items-center">
                  <Clock className="w-6 h-6 text-blue-500 mr-3" />
                  <strong>ห้องสอบ:</strong><span className="ml-2 font-mono text-blue-700">{examDetails.roomNumber || 'N/A'}</span>
                </div>
                <div className="bg-white p-4 rounded-lg flex items-center">
                  <FileText className="w-6 h-6 text-blue-500 mr-3" />
                  <strong>เลขที่นั่ง:</strong><span className="ml-2 font-mono text-blue-700">{examDetails.seatNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-900 p-6 rounded-r-lg shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-orange-500" />
                <h2 className="text-2xl font-bold">คุณยังไม่มีสิทธิ์เข้าสอบ</h2>
              </div>
              <p className="text-orange-800">อาจเนื่องมาจากเอกสารยังไม่ครบถ้วน หรือยังไม่ถึงกำหนดการประกาศ กรุณาตรวจสอบสถานะการสมัครหรือติดต่อเจ้าหน้าที่</p>
            </div>
          )
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีข้อมูลการสอบ</h3>
            <p className="mt-1 text-sm text-gray-500">ระบบจะแสดงข้อมูลเมื่อเจ้าหน้าที่ได้ทำการตรวจสอบและกำหนดสิทธิ์เรียบร้อยแล้ว</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    </div>
  );
}
