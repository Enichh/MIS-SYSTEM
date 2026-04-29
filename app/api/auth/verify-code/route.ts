import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { z } from "zod";
import crypto from "crypto";

// ============================================================================
// Verify Code API Route
// ============================================================================

const VerifyCodeRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(6, "Code must be 6 digits"),
  type: z.enum(["signup", "login", "password_reset"]),
  tempToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = VerifyCodeRequestSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Verify the code
    const { data: verifyData, error: verifyError } = await supabase.rpc(
      "verify_code",
      {
        p_email: validatedData.email,
        p_code: validatedData.code,
        p_type: validatedData.type,
      },
    );

    if (verifyError) {
      console.error("Code verification error:", verifyError);
      return NextResponse.json(
        { success: false, error: "Failed to verify code" },
        { status: 500 },
      );
    }

    const result = verifyData as {
      success: boolean;
      error?: string;
      temp_token?: string;
      attempts_remaining?: number;
    };

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Invalid verification code",
          attemptsRemaining: result.attempts_remaining || 0,
        },
        { status: 400 },
      );
    }

    // For signup, decrypt temp token and create user
    if (validatedData.type === "signup" && result.temp_token) {
      try {
        const algorithm = "aes-256-gcm";
        const key = Buffer.from(
          process.env.ENCRYPTION_KEY || "default-key-32-bytes-long!!",
          "utf-8",
        ).slice(0, 32);
        const [ivHex, authTagHex, encrypted] = result.temp_token.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, "hex", "utf-8");
        decrypted += decipher.final("utf-8");

        const userData = JSON.parse(decrypted);

        // Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: userData.email,
            password: userData.password,
            options: {
              data: {
                full_name: userData.full_name,
                role: userData.role,
              },
            },
          },
        );

        if (authError) {
          return NextResponse.json(
            { success: false, error: authError.message },
            { status: 400 },
          );
        }

        if (!authData.user) {
          return NextResponse.json(
            { success: false, error: "Failed to create user" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Account created successfully",
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
        });
      } catch (decryptError) {
        console.error("Token decryption error:", decryptError);
        return NextResponse.json(
          { success: false, error: "Failed to process signup data" },
          { status: 500 },
        );
      }
    }

    // For login, decrypt temp token and sign in the user
    if (validatedData.type === "login" && result.temp_token) {
      try {
        const algorithm = "aes-256-gcm";
        const key = Buffer.from(
          process.env.ENCRYPTION_KEY || "default-key-32-bytes-long!!",
          "utf-8",
        ).slice(0, 32);
        const [ivHex, authTagHex, encrypted] = result.temp_token.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, "hex", "utf-8");
        decrypted += decipher.final("utf-8");

        const credentials = JSON.parse(decrypted);

        // Sign in the user
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError) {
          return NextResponse.json(
            { success: false, error: authError.message },
            { status: 400 },
          );
        }

        if (!authData.user) {
          return NextResponse.json(
            { success: false, error: "Failed to sign in" },
            { status: 500 },
          );
        }

        // Check if user is an active admin
        const { data: admin, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("id", authData.user.id)
          .eq("is_active", true)
          .single();

        if (adminError || !admin) {
          await supabase.auth.signOut();
          return NextResponse.json(
            {
              success: false,
              error: "Access denied. Admin privileges required.",
            },
            { status: 403 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Login successful",
          admin: {
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role,
          },
        });
      } catch (decryptError) {
        console.error("Token decryption error:", decryptError);
        return NextResponse.json(
          { success: false, error: "Failed to process login data" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Code verified successfully",
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

    console.error("Verify code API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
