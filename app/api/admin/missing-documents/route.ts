// import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';
// import { ApplicationStatus, DocumentType } from '@prisma/client';
// import nodemailer from 'nodemailer';

// const documentTypeTranslations: Record<DocumentType, string> = {
//   EXAM_CONFIRMATION_1: 'เอกสารยืนยันสิทธิ์การเข้าสอบ',
//   EXAM_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับยืนยันสิทธิ์สอบ)',
//   PAYMENT_SLIP: 'แบบยืนยันการชำระเงินค่าธรรมเนียม',
//   ADMISSION_CONFIRMATION_1: 'หนังสือยืนยันสิทธิ์ (สำหรับเข้าศึกษา)',
//   ADMISSION_CONFIRMATION_2: 'สัญญามอบตัว (สำหรับเข้าศึกษา)',
//   ADMISSION_CONFIRMATION_3: 'ใบมอบตัว',
//   ADMISSION_CONFIRMATION_4: 'ไฟล์ที่ 4 (สำหรับเข้าศึกษา)',
// };

// // GET handler to fetch documents for review
// export async function GET(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || session.user.role !== 'ADMIN') {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const status = searchParams.get('status') as ApplicationStatus | null;

//     const documents = await prisma.document.findMany({
//       where: {
//         application: {
//           status: status ? status : undefined,
//         },
//       },
//       include: {
//         application: {
//           include: {
//             user: {
//               select: {
//                 nationalId: true,
//                 email: true,
//                 studentProfile: {
//                   select: { firstName: true, lastName: true },
//                 },
//               },
//             },
//           },
//         },
//       },
//       orderBy: {
//         application: {
//           createdAt: 'desc',
//         },
//       },
//     });

//     return NextResponse.json(documents, { status: 200 });
//   } catch (error) {
//     console.error('Get documents for review error:', error);
//     return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
//   }
// }

// // POST handler for actions (confirm documents, notify missing)
// export async function POST(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || session.user.role !== 'ADMIN') {
//       return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//     }

//     const body = await request.json();
//     const { applicationId, action, missingDocumentTypes, message } = body;

//     if (!applicationId || !action) {
//       return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
//     }

//     const application = await prisma.application.findUnique({
//       where: { id: applicationId },
//       include: { user: true },
//     });

//     if (!application) {
//       return NextResponse.json({ message: 'Application not found' }, { status: 404 });
//     }

//     if (action === 'confirm_documents') {
//       await prisma.application.update({
//         where: { id: applicationId },
//         data: { status: ApplicationStatus.ELIGIBLE_FOR_EXAM },
//       });
//       return NextResponse.json({ message: 'ยืนยันเอกสารเรียบร้อยแล้ว' }, { status: 200 });
//     }

//     if (action === 'notify_missing_documents') {
//       if (!missingDocumentTypes || missingDocumentTypes.length === 0) {
//         return NextResponse.json({ message: 'Please specify missing document types' }, { status: 400 });
//       }

//       // --- Check for email configuration ---
//       if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
//         console.error('Email server is not configured. Please check your .env file.');
//         return NextResponse.json({ message: 'บริการส่งอีเมลยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์' }, { status: 500 });
//       }


//       // --- Email Sending Logic ---
//       const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_SERVER_HOST,
//         port: Number(process.env.EMAIL_SERVER_PORT),
//         secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports
//         auth: {
//           user: process.env.EMAIL_SERVER_USER,
//           pass: process.env.EMAIL_SERVER_PASSWORD,
//         },
//       });

//       const missingDocsList = missingDocumentTypes
//         .map((type: DocumentType) => `<li>${documentTypeTranslations[type] || type}</li>`)
//         .join('');

//       const mailOptions = {
//         from: `"${process.env.EMAIL_FROM_NAME || 'ระบบรับสมัครนักเรียน'}" <${process.env.EMAIL_FROM}>`,
//         to: application.user.email,
//         subject: 'แจ้งเตือน: เอกสารการสมัครไม่ครบถ้วน',
//         html: `
//           <p>เรียน ผู้สมัคร,</p>
//           <p>จากการตรวจสอบเอกสารของท่าน พบว่ายังขาดเอกสารดังต่อไปนี้:</p>
//           <ul>${missingDocsList}</ul>
//           <p>ข้อความเพิ่มเติมจากเจ้าหน้าที่: ${message || 'ไม่มี'}</p>
//           <p>กรุณาเข้าระบบเพื่ออัปโหลดเอกสารเพิ่มเติมโดยเร็วที่สุด</p>
//           <p>ขอแสดงความนับถือ,<br>ฝ่ายรับสมัคร</p>
//         `
//       };
      
//       // Send email and log the result
//       const info = await transporter.sendMail(mailOptions);
//       console.log('Message sent: %s', info.messageId);
      
//       return NextResponse.json({ message: 'ส่งอีเมลแจ้งเตือนนักเรียนเรียบร้อยแล้ว' }, { status: 200 });
//     }

//     return NextResponse.json({ message: 'Invalid action' }, { status: 400 });

//   } catch (error) {
//     console.error('Document review action error:', error);
//     return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
//   }
// }
