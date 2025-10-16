import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const signupSchema = z.object({
  nationalId: z.string().min(1, 'National ID is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { nationalId, email, password } = validation.data;

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
            pdpaAccepted: false, // Correct: Set pdpaAccepted on the related StudentProfile
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
