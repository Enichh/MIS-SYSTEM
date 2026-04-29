import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { z } from "zod";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email/email-utils";

// ============================================================================
// Send Verification Code API Route
// ============================================================================

const SendCodeRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  type: z.enum(["signup", "login", "password_reset"]),
  tempToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SendCodeRequestSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Check rate limiting
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc(
      "check_code_rate_limit",
      {
        p_email: validatedData.email,
        p_type: validatedData.type,
      },
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      return NextResponse.json(
        { success: false, error: "Failed to check rate limit" },
        { status: 500 },
      );
    }

    const rateLimit = rateLimitData as {
      can_send: boolean;
      seconds_remaining: number;
    };

    if (!rateLimit.can_send) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${rateLimit.seconds_remaining} seconds before requesting another code`,
          code: "RATE_LIMITED",
          secondsRemaining: rateLimit.seconds_remaining,
        },
        { status: 429 },
      );
    }

    // For signup, encrypt temp token if provided
    let encryptedToken = null;
    if (validatedData.tempToken) {
      const algorithm = "aes-256-gcm";
      const key = Buffer.from(
        process.env.ENCRYPTION_KEY || "default-key-32-bytes-long!!",
        "utf-8",
      ).slice(0, 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(validatedData.tempToken, "utf-8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();
      encryptedToken = `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    }

    // Generate and store verification code
    const { data: code, error: codeError } = await supabase.rpc(
      "create_verification_code",
      {
        p_email: validatedData.email,
        p_type: validatedData.type,
        p_temp_token: encryptedToken,
      },
    );

    if (codeError) {
      console.error("Code generation error:", codeError);
      return NextResponse.json(
        { success: false, error: "Failed to generate verification code" },
        { status: 500 },
      );
    }

    // Send email using custom email template
    const emailResult = await sendVerificationEmail(
      validatedData.email,
      code as string,
      validatedData.type,
    );

    if (!emailResult.success) {
      console.error("Email send error:", emailResult.error);
      // Still return success even if email fails (code is stored)
      return NextResponse.json({
        success: true,
        message: "Verification code generated (email delivery may be delayed)",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("Send code API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
