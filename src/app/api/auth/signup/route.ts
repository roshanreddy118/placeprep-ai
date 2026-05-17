import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { EmailVerification } from "@/models/EmailVerification";
import { rateLimit } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(`signup:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const { name, email, password, college } = await req.json();

    if (!name || !email || !password || !college) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length > 100) {
      return NextResponse.json({ error: "Name must be under 100 characters" }, { status: 400 });
    }
    if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (typeof college !== "string" || college.trim().length > 200) {
      return NextResponse.json({ error: "College name must be under 200 characters" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      college,
      emailVerified: false,
    });

    // Generate verification token
    await EmailVerification.deleteMany({ email });
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await EmailVerification.create({ email, token, expiresAt });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "PlacePrep AI <onboarding@resend.dev>",
      to: email,
      subject: "Verify your PlacePrep AI email",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a2e;">Verify Your Email</h2>
          <p style="color: #555; line-height: 1.6;">
            Thanks for signing up for PlacePrep AI! Please verify your email address by clicking the button below.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">
            This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      {
        message: "Account created. Please check your email to verify your account.",
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
