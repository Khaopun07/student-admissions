'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { StudentProfileWithUser } from '@/types/prisma';

type ProfileFormData = Omit<StudentProfileWithUser, 'user' | 'id' | 'userId'> & {
  email: string;
  nationalId: string;
};

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfileWithUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '', lastName: '', dateofbirth: '', lasercode: '',
    province: '', school: '', gpaxScore: 0, mathScore: 0,
    scienceScore: 0, pdpaAccepted: false,
    email: '', nationalId: '', // These will be populated by setFormData(data) after fetching profile
  });


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
          setFormData(data); // Initialize form data
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

  const handleEdit = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        dateofbirth: profile.dateofbirth || '',
        lasercode: profile.lasercode || '',
        province: profile.province || '',
        school: profile.school || '',
        gpaxScore: profile.gpaxScore || 0,
        mathScore: profile.mathScore || 0,
        scienceScore: profile.scienceScore || 0,
        pdpaAccepted: profile.pdpaAccepted,
        email: profile.user.email,
        nationalId: profile.user.nationalId,
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/student/profile', { method: 'POST', body: JSON.stringify(formData) });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to update profile');
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

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

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Example for one field, repeat for others */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">ชื่อ</label>
              <input type="text" name="firstName" id="firstName" value={formData.firstName || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">นามสกุล</label>
              <input type="text" name="lastName" id="lastName" value={formData.lastName || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="dateofbirth" className="block text-sm font-medium text-gray-700">วัน/เดือน/ปีเกิด</label>
              <input type="text" name="dateofbirth" id="dateofbirth" value={formData.dateofbirth || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="lasercode" className="block text-sm font-medium text-gray-700">รหัสหลังบัตรประชาชน</label>
              <input type="text" name="lasercode" id="lasercode" value={formData.lasercode || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700">จังหวัด</label>
              <input type="text" name="province" id="province" value={formData.province || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700">โรงเรียน</label>
              <input type="text" name="school" id="school" value={formData.school || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="gpaxScore" className="block text-sm font-medium text-gray-700">GPAX</label>
              <input type="number" step="0.01" name="gpaxScore" id="gpaxScore" value={formData.gpaxScore || 0} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="mathScore" className="block text-sm font-medium text-gray-700">คะแนนคณิตศาสตร์</label>
              <input type="number" step="0.01" name="mathScore" id="mathScore" value={formData.mathScore || 0} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="scienceScore" className="block text-sm font-medium text-gray-700">คะแนนวิทยาศาสตร์</label>
              <input type="number" step="0.01" name="scienceScore" id="scienceScore" value={formData.scienceScore || 0} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div className="flex items-center space-x-4">
              <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
                {submitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
              <button type="button" onClick={handleCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                ยกเลิก
              </button>
            </div>
          </form>
        ) : profile ? (
          <div className="space-y-2">
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
            <div className="mt-6 text-center">
              <button onClick={handleEdit} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                แก้ไขข้อมูล
              </button>
            </div>
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
