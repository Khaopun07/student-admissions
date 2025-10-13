import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as ApplicationStatus | null;

    const documents = await prisma.document.findMany({
      where: {
        application: {
          status: statusFilter || undefined,
        },
      },
      include: {
        application: {
          include: {
            user: {
              select: {
                nationalId: true,
                email: true,
                studentProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json(documents, { status: 200 });

  } catch (error) {
    console.error('Get documents for review error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, action, missingDocumentTypes, message } = await request.json();

    if (!applicationId || !action) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    if (action === 'confirm_documents') {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.ELIGIBLE_FOR_EXAM }, // Or another appropriate status
      });
      return NextResponse.json({ message: 'Documents confirmed and application status updated' }, { status: 200 });
    } else if (action === 'notify_missing_documents') {
      // In a real application, you would send an email to the student
      // For now, we'll just log the notification
      console.log(`Notification sent to student for application ${applicationId}: Missing documents: ${missingDocumentTypes.join(', ')}. Message: ${message}`);
      return NextResponse.json({ message: 'Notification sent to student about missing documents' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Admin document review action error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
