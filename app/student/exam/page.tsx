'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
            setError(data.message || 'Failed to fetch exam details');
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">รายละเอียดการสอบ</h1>

        {examDetails ? (
          examDetails.examEligible ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-900 p-6 rounded-r-lg shadow-md">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-2xl font-bold">คุณมีสิทธิ์เข้าสอบ</h2>
              </div>
              <p className="text-blue-800 mb-6">ขอให้โชคดีกับการสอบ! กรุณาตรวจสอบรายละเอียดด้านล่างและไปถึงห้องสอบก่อนเวลา</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                <div className="bg-white p-4 rounded-lg flex items-center">
                  <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                  <strong>ห้องสอบ:</strong><span className="ml-2 font-mono text-blue-700">{examDetails.roomNumber || 'N/A'}</span>
                </div>
                <div className="bg-white p-4 rounded-lg flex items-center">
                  <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z"></path></svg>
                  <strong>เลขที่นั่ง:</strong><span className="ml-2 font-mono text-blue-700">{examDetails.seatNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-900 p-6 rounded-r-lg shadow-md">
              <div className="flex items-center mb-4">
                <svg className="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <h2 className="text-2xl font-bold">คุณยังไม่มีสิทธิ์เข้าสอบ</h2>
              </div>
              <p className="text-orange-800">อาจเนื่องมาจากเอกสารยังไม่ครบถ้วน หรือยังไม่ถึงกำหนดการประกาศ กรุณาตรวจสอบสถานะการสมัครหรือติดต่อเจ้าหน้าที่</p>
            </div>
          )
        ) : (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">ยังไม่มีรายละเอียดการสอบ</h3>
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
