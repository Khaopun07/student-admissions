import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus } from '@prisma/client';

/**
 * GET handler to fetch applications that have been confirmed by students
 * but not yet finalized by an admin.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      where: {
        status: ApplicationStatus.CONFIRMED_ADMISSION,
      },
      include: {
        user: {
          select: {
            nationalId: true,
            email: true,
            studentProfile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        documents: {
          where: {
            documentType: {
              in: ['ADMISSION_CONFIRMATION_1', 'ADMISSION_CONFIRMATION_2', 'ADMISSION_CONFIRMATION_3'],
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });

    return NextResponse.json(applications, { status: 200 });
  } catch (error) {
    console.error('Get confirmed applications error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * POST handler for admin to finalize the admission confirmation.
 * This updates the application status to ADMISSION_COMPLETED.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ message: 'Application ID is required' }, { status: 400 });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.ADMISSION_COMPLETED,
      },
    });

    console.log(`Admin finalized admission for application ID: ${updatedApplication.id}, status set to ADMISSION_COMPLETED`);

    return NextResponse.json({ message: `ยืนยันการมอบตัวสำหรับใบสมัคร ${applicationId} สำเร็จแล้ว` }, { status: 200 });
  } catch (error) {
    console.error('Finalize admission error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
