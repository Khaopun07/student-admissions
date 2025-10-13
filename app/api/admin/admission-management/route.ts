import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { type AuthOptions } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus } from '@prisma/client';

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      include: {
        user: {
          select: {
            nationalId: true,
            email: true,
            studentProfile: true,
          },
        },
        examDetails: true,
        admissionResult: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applications, { status: 200 });

  } catch (error) {
    console.error('Get all applications error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, action, isAdmitted } = await request.json(); // action: 'announce' or 'update'

    if (!applicationId || !action) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    let updatedApplication;
    let updatedAdmissionResult;

    if (action === 'announce') {
      if (typeof isAdmitted !== 'boolean') {
        return NextResponse.json({ message: 'Missing isAdmitted for announce action' }, { status: 400 });
      }

      updatedAdmissionResult = await prisma.admissionResult.upsert({
        where: { applicationId },
        update: {
          isAdmitted,
          isConfirmed: null, // Reset confirmation status on new announcement
          confirmationDate: null,
        },
        create: {
          applicationId,
          isAdmitted,
        },
      });

      updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.ADMISSION_ANNOUNCED },
      });

    } else if (action === 'update') {
      // This action could be used to manually change status (e.g., from PENDING_REVIEW to ELIGIBLE_FOR_EXAM)
      // For now, we'll assume 'announce' is the primary POST action for admission management.
      // More specific update logic can be added here if needed.
      return NextResponse.json({ message: 'Update action not fully implemented yet' }, { status: 501 });
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Admission status updated successfully', application: updatedApplication, admissionResult: updatedAdmissionResult }, { status: 200 });

  } catch (error) {
    console.error('Admin admission management error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
