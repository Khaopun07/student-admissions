// app/api/admin/document-review/route.ts

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/prisma'; // สมมติว่าคุณมีไฟล์ prisma client ที่นี่
import { DocumentType, ApplicationStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // สมมติว่าคุณมีไฟล์ authOptions

const resend = new Resend(process.env.RESEND_API_KEY);

// ฟังก์ชันสำหรับแปลง DocumentType เป็นภาษาไทย (ควรจะแชร์มาจากที่อื่น)
const documentTypeTranslations: Record<DocumentType, string> = {
  ADMISSION_CONFIRMATION_1: 'หนังสือยืนยันสิทธิ์ (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับเข้าศึกษา)',
  ADMISSION_CONFIRMATION_3: 'ใบมอบตัว',
  EXAM_CONFIRMATION_1: 'เอกสารยืนยันสิทธิ์การเข้าสอบ',
  EXAM_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับยืนยันสิทธิ์สอบ)',
  PAYMENT_SLIP: 'แบบยืนยันการชําระเงินค่าธรรมเนียม',
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ApplicationStatus | null;

    const documents = await prisma.document.findMany({
      where: {
        application: {
          status: status ? status : undefined,
        },
      },
      include: {
        application: {
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
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Get documents for review error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { applicationId, action, missingDocumentTypes, message } = body;

    if (!applicationId || !action) {
      return NextResponse.json({ message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    switch (action) {
      case 'confirm_documents':
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: ApplicationStatus.ELIGIBLE_FOR_EXAM },
        });
        return NextResponse.json({
          message: 'ยืนยันเอกสารเรียบร้อยแล้ว สถานะผู้สมัครถูกเปลี่ยนเป็น "มีสิทธิ์สอบ"',
        });

      case 'notify_missing_documents':
        if (!Array.isArray(missingDocumentTypes) || missingDocumentTypes.length === 0) {
          return NextResponse.json({ message: 'กรุณาเลือกประเภทเอกสารที่ขาด' }, { status: 400 });
        }

        if (!process.env.RESEND_API_KEY) {
          console.error('Resend API key is not configured.');
          return NextResponse.json({ message: 'บริการส่งอีเมลยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์' }, { status: 500 });
        }

        const application = await prisma.application.findUnique({
          where: { id: applicationId },
          include: {
            user: {
              select: {
                email: true,
                studentProfile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

        if (!application || !application.user.email) {
          return NextResponse.json({ message: 'ไม่พบใบสมัครหรืออีเมลผู้ใช้' }, { status: 404 });
        }

        const studentName = `${application.user.studentProfile?.firstName || ''} ${application.user.studentProfile?.lastName || ''}`.trim() || 'นักเรียน';
        const missingDocsList = missingDocumentTypes
          .map((docType: DocumentType) => `<li>${documentTypeTranslations[docType] || docType}</li>`)
          .join('');

        try {
          // --- ส่วนของการส่งอีเมล ---
          await resend.emails.send({
            from: 'ระบบรับสมัครนักเรียน <onboarding@resend.dev>',
            to: [application.user.email],
            subject: 'แจ้งเตือน: โปรดส่งเอกสารเพิ่มเติมสำหรับการสมัครเรียน',
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>เรียน คุณ ${studentName},</h2>
                <p>เจ้าหน้าที่ได้ทำการตรวจสอบเอกสารการสมัครของคุณ และพบว่ายังขาดเอกสารดังต่อไปนี้:</p>
                <ul>${missingDocsList}</ul>
                ${message ? `<p><strong>ข้อความเพิ่มเติมจากเจ้าหน้าที่:</strong><br>${message.replace(/\n/g, '<br>')}</p>` : ''}
                <p>กรุณาเข้าสู่ระบบเพื่ออัปโหลดเอกสารที่ยังขาดให้ครบถ้วนโดยเร็วที่สุด</p>
                <p>ขอแสดงความนับถือ,<br>ฝ่ายรับสมัครนักเรียน</p>
              </div>
            `,
          });
          // --- จบส่วนของการส่งอีเมล ---
        } catch (emailError) {
          console.error('Resend email error:', emailError);
          return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการส่งอีเมล' }, { status: 500 });
        }

        // อาจจะมีการอัปเดตสถานะในฐานข้อมูลด้วย
        // await prisma.application.update(...)

        return NextResponse.json({ message: 'ส่งการแจ้งเตือนเอกสารขาดไปยังนักเรียนเรียบร้อยแล้ว' });

      default:
        return NextResponse.json({ message: 'การดำเนินการไม่ถูกต้อง' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' }, { status: 500 });
  }
}
