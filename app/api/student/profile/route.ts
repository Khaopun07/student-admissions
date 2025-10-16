import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
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

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'ต้องกรอกชื่อ').optional(),
  lastName: z.string().min(1, 'ต้องกรอกนามสกุล').optional(),
  dateofbirth: z.string().optional(),
  lasercode: z.string().optional(),
  province: z.string().optional(),
  school: z.string().optional(),
  gpaxScore: z.number().min(0).max(4).optional(),
  mathScore: z.number().min(0).optional(),
  scienceScore: z.number().min(0).optional(),
  pdpaAccepted: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'STUDENT') {
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'ข้อมูลไม่ถูกต้อง', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { firstName, lastName, dateofbirth, lasercode, province, school, gpaxScore, mathScore, scienceScore, pdpaAccepted } = validation.data;

    // Use upsert to either create a new profile or update an existing one.
    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      update: { // Data to use if the record is found
        firstName,
        lastName,
        dateofbirth,
        lasercode,
        province,
        school,
        gpaxScore, mathScore, scienceScore, pdpaAccepted,
      },
      create: { // Data to use if the record is NOT found
        userId: session.user.id,
        firstName, lastName, dateofbirth, lasercode, province, school,
        gpaxScore, mathScore, scienceScore, pdpaAccepted,
      },
      include: {
        user: {
          select: {
            nationalId: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์นักเรียน:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 });
  }
}