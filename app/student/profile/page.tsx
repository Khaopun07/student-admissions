'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentProfileWithUser } from '@/types/prisma';

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileWithUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'STUDENT') {
      router.push('/admin/dashboard');
    }
  }, [status, router, session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchProfile = async () => {
        try {
          setLoadingProfile(true);
          const response = await fetch('/api/student/profile');
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
            throw new Error(errorData.message);
          }
          const data = await response.json();
          setProfile(data);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setError(err instanceof Error ? err.message : 'An unexpected error occurred while fetching profile.');
        } finally {
          setLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [session, status]);

  if (status === 'loading' || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">กำลังโหลด...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">ข้อมูลส่วนตัวของคุณ</h1>
        {profile ? (
          <div>
            <p><strong>เลขประจำตัวประชาชน:</strong> {profile.user.nationalId}</p>
            <p><strong>อีเมล:</strong> {profile.user.email}</p>
            <p><strong>ชื่อ:</strong> {profile.firstName || 'ไม่มีข้อมูล'}</p>
            <p><strong>นามสกุล:</strong> {profile.lastName || 'ไม่มีข้อมูล'}</p>
            <p><strong>วัน/เดือน/ปีเกิด:</strong> {profile.dateofbirth || 'ไม่มีข้อมูล'}</p>
            <p><strong>รหัสหลังบัตรประชาชน:</strong> {profile.lasercode || 'ไม่มีข้อมูล'}</p>
            <p><strong>จังหวัด:</strong> {profile.province || 'ไม่มีข้อมูล'}</p>
            <p><strong>โรงเรียน:</strong> {profile.school || 'ไม่มีข้อมูล'}</p>
            <p><strong>GPAX:</strong> {profile.gpaxScore || 'ไม่มีข้อมูล'}</p>
            <p><strong>คะแนนคณิตศาสตร์:</strong> {profile.mathScore || 'ไม่มีข้อมูล'}</p>
            <p><strong>คะแนนวิทยาศาสตร์:</strong> {profile.scienceScore || 'ไม่มีข้อมูล'}</p>
            <p><strong>ยอมรับ PDPA:</strong> {profile.pdpaAccepted ? 'ใช่' : 'ไม่'}</p>
          </div>
        ) : (
          <p>ไม่มีข้อมูลส่วนตัว กรุณาอัปเดตข้อมูลของคุณ</p>
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