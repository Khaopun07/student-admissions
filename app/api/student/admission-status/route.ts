// route.ts (นักเรียนอัปโหลดเอกสารการยืนยันสิทธิ์)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ApplicationStatus, DocumentType as PrismaDocumentType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export async function GET() {
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
    const formData = await request.formData();
    const applicationId = formData.get('applicationId') as string;
    const confirmAdmissionStr = formData.get('confirmAdmission') as string;
    const confirmAdmission = confirmAdmissionStr === 'true';

    if (typeof confirmAdmission !== 'boolean' || !applicationId) {
      return NextResponse.json({ message: 'Invalid request body: Missing applicationId or confirmAdmission flag' }, { status: 400 });
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
    if (confirmAdmission) {
      const documentEntries = Array.from(formData.entries()).filter(
        ([key]) => key !== 'applicationId' && key !== 'confirmAdmission'
      );

      const fileProcessingPromises = documentEntries.map(async ([key, value]) => {
        const documentType = key as PrismaDocumentType;
        const file = value as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        return { documentType, file, buffer };
      });

      const processedFiles = await Promise.all(fileProcessingPromises);

      const documentCreations = processedFiles.map(processedFile => {
        const { documentType, file, buffer } = processedFile;

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', userId, 'admission');
        const filePathOnDisk = path.join(uploadDir, file.name);
        const fileUrl = `/uploads/${userId}/admission/${file.name}`;

        // Ensure directory exists
        fs.mkdirSync(uploadDir, { recursive: true });

        // Save the file
        fs.writeFileSync(filePathOnDisk, buffer);

        return prisma.document.create({
          data: {
            applicationId: application.id,
            documentType,
            filePath: fileUrl,
          },
        });
      });

      await prisma.$transaction(documentCreations);
    }

    return NextResponse.json({ message: 'Admission status updated successfully', result: updatedAdmissionResult }, { status: 200 });

  } catch (error) {
    console.error('Update admission status error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
