import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'STUDENT') {
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต' }, { status: 401 });
  }

  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            nationalId: true,
            email: true,
          },
        },
      },
    });

    if (!studentProfile) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์' }, { status: 404 });
    }

    return NextResponse.json(studentProfile);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์นักเรียน:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
