import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { connectDB } from "@/lib/mongodb";
import { Feedback } from "@/models/Feedback";
import { rateLimit } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// GET — fetch approved feedback for display
export async function GET() {
  try {
    await connectDB();

    const feedbacks = await Feedback.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("name message rating createdAt")
      .lean();

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ feedbacks: [] });
  }
}

// POST — submit new feedback + email notification
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = rateLimit(`feedback:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
    }

    const { name, email, message, rating } = await req.json();

    if (!name || !email || !message || !rating) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.length > 100) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || email.length > 254) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || message.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
    }

    await connectDB();

    const feedback = await Feedback.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      rating,
      approved: false,
    });

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "PlacePrep AI <onboarding@resend.dev>",
          to: adminEmail,
          subject: `New Feedback from ${escapeHtml(name)} (${rating}/5 stars)`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1a1a2e;">New Feedback Received</h2>
              <div style="padding: 16px; background: #f5f5f5; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p style="margin: 0 0 8px;"><strong>Rating:</strong> ${"⭐".repeat(rating)} (${rating}/5)</p>
                <p style="margin: 0;"><strong>Message:</strong></p>
                <p style="margin: 8px 0 0; color: #555; line-height: 1.6;">${escapeHtml(message)}</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Feedback email notification failed:", emailErr);
      }
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("Feedback submit error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
