import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DocumentType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const documentType = formData.get('documentType') as DocumentType;
    const file = formData.get('file') as File;

    if (!documentType || !file) {
      return NextResponse.json({ message: 'Missing document type or file' }, { status: 400 });
    }

    // In a real application, you would handle file storage (e.g., S3, local filesystem)
    // For now, we'll simulate file path and save to DB
    const filePath = `/uploads/${userId}/${documentType}/${file.name}`; // Placeholder path

    // Find or create an application for the student
    let application = await prisma.application.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Get the latest application
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          userId,
          status: 'DOCUMENTS_SUBMITTED', // Initial status after first document upload
        },
      });
    } else if (application.status === 'PENDING_REVIEW') {
      // Update status if it's still pending review and documents are being submitted
      await prisma.application.update({
        where: { id: application.id },
        data: { status: 'DOCUMENTS_SUBMITTED' },
      });
    }


    const newDocument = await prisma.document.create({
      data: {
        applicationId: application.id,
        documentType,
        filePath,
      },
    });

    return NextResponse.json({ message: 'Document uploaded successfully', document: newDocument }, { status: 201 });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function GET(_request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const documents = await prisma.document.findMany({
      where: {
        application: {
          userId: userId,
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json(documents, { status: 200 });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
