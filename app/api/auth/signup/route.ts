import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { nationalId, email, password } = await request.json();

    if (!nationalId || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { nationalId: nationalId },
          { email: email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this National ID or Email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nationalId,
        email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            // Initial student profile data, can be updated later
          },
        },
      },
    });

    // In a real application, you might want to return a token or session info
    return NextResponse.json({ message: 'Student registered successfully', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
