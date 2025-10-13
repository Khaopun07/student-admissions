import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus, DocumentType as PrismaDocumentType } from '@prisma/client';

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const admissionResult = await prisma.admissionResult.findFirst({
      where: {
        application: {
          userId: userId,
        },
      },
      include: {
        application: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!admissionResult) {
      return NextResponse.json({ message: 'Admission result not found' }, { status: 404 });
    }

    return NextResponse.json(admissionResult, { status: 200 });

  } catch (error) {
    console.error('Get admission status error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { confirmAdmission, documentPaths } = await request.json(); // documentPaths will be an array of file paths

    if (typeof confirmAdmission !== 'boolean' || !documentPaths || !Array.isArray(documentPaths)) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const application = await prisma.application.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      return NextResponse.json({ message: 'No application found for this student' }, { status: 404 });
    }

    // Update admission result
    const updatedAdmissionResult = await prisma.admissionResult.update({
      where: { applicationId: application.id },
      data: {
        isConfirmed: confirmAdmission,
        confirmationDate: new Date(),
      },
    });

    // Update application status
    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: confirmAdmission ? ApplicationStatus.CONFIRMED_ADMISSION : ApplicationStatus.REJECTED_ADMISSION,
      },
    });

    // Create document entries for the confirmation/rejection documents
    const documentCreations = documentPaths.map((path: string, index: number) => {
      let documentType: PrismaDocumentType;
      switch (index) {
        case 0: documentType = PrismaDocumentType.ADMISSION_CONFIRMATION_1; break;
        case 1: documentType = PrismaDocumentType.ADMISSION_CONFIRMATION_2; break;
        case 2: documentType = PrismaDocumentType.ADMISSION_CONFIRMATION_3; break;
        case 3: documentType = PrismaDocumentType.ADMISSION_CONFIRMATION_4; break;
        default: documentType = PrismaDocumentType.ADMISSION_CONFIRMATION_1; // Fallback
      }
      return prisma.document.create({
        data: {
          applicationId: application.id,
          documentType,
          filePath: path,
        },
      });
    });
    await prisma.$transaction(documentCreations);


    return NextResponse.json({ message: 'Admission status updated successfully', result: updatedAdmissionResult }, { status: 200 });

  } catch (error) {
    console.error('Update admission status error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
