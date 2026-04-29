import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

// ============================================================================
// Email Template Utilities
// ============================================================================

interface EmailTemplateData {
  code: string;
  isSignup?: boolean;
  isLogin?: boolean;
  isPasswordReset?: boolean;
  expiresIn: number;
  year?: number;
  supportUrl?: string;
}

/**
 * Render the verification email template with provided data
 */
export async function renderVerificationTemplate(
  data: EmailTemplateData,
): Promise<string> {
  const templatePath = path.join(
    process.cwd(),
    "lib",
    "email",
    "verification-template.html",
  );

  try {
    let template = fs.readFileSync(templatePath, "utf-8");

    // Replace template variables
    template = template.replace(/\{\{code\}\}/g, data.code);
    template = template.replace(
      /\{\{expiresIn\}\}/g,
      data.expiresIn.toString(),
    );
    template = template.replace(
      /\{\{year\}\}/g,
      (data.year || new Date().getFullYear()).toString(),
    );
    template = template.replace(
      /\{\{supportUrl\}\}/g,
      data.supportUrl || "/support",
    );

    // Handle conditional blocks
    if (data.isSignup) {
      template = template.replace(
        /\{\{#if isSignup\}\}.*?\{\{\/if\}\}/gs,
        (match) => {
          return match
            .replace(/\{\{#if isSignup\}\}|\{\{\/if\}\}/g, "")
            .replace(/\{\{else if.*?\}\}.*?\{\{\/if\}\}/gs, "");
        },
      );
      template = template.replace(/\{\{#if isLogin\}\}.*?\{\{\/if\}\}/gs, "");
      template = template.replace(
        /\{\{#if isPasswordReset\}\}.*?\{\{\/if\}\}/gs,
        "",
      );
      template = template.replace(/\{\{else if.*?\}\}/g, "");
    } else if (data.isLogin) {
      template = template.replace(
        /\{\{#if isLogin\}\}.*?\{\{\/if\}\}/gs,
        (match) => {
          return match
            .replace(/\{\{#if isLogin\}\}|\{\{\/if\}\}/g, "")
            .replace(/\{\{#if isSignup\}\}.*?\{\{\/if\}\}/gs, "")
            .replace(/\{\{#if isPasswordReset\}\}.*?\{\{\/if\}\}/gs, "");
        },
      );
      template = template.replace(/\{\{#if isSignup\}\}.*?\{\{\/if\}\}/gs, "");
      template = template.replace(
        /\{\{#if isPasswordReset\}\}.*?\{\{\/if\}\}/gs,
        "",
      );
      template = template.replace(/\{\{else if.*?\}\}/g, "");
    } else if (data.isPasswordReset) {
      template = template.replace(
        /\{\{#if isPasswordReset\}\}.*?\{\{\/if\}\}/gs,
        (match) => {
          return match
            .replace(/\{\{#if isPasswordReset\}\}|\{\{\/if\}\}/g, "")
            .replace(/\{\{#if isSignup\}\}.*?\{\{\/if\}\}/gs, "")
            .replace(/\{\{#if isLogin\}\}.*?\{\{\/if\}\}/gs, "");
        },
      );
      template = template.replace(/\{\{#if isSignup\}\}.*?\{\{\/if\}\}/gs, "");
      template = template.replace(/\{\{#if isLogin\}\}.*?\{\{\/if\}\}/gs, "");
      template = template.replace(/\{\{else if.*?\}\}/g, "");
    } else {
      // Default case
      template = template.replace(/\{\{#if isSignup\}\}.*?\{\{\/if\}\}/gs, "");
      template = template.replace(/\{\{#if isLogin\}\}.*?\{\{\/if\}\}/gs, "");
      template = template.replace(
        /\{\{#if isPasswordReset\}\}.*?\{\{\/if\}\}/gs,
        "",
      );
      template = template.replace(
        /\{\{else if.*?\}\}.*?\{\{\/if\}\}/gs,
        (match) => {
          return match.replace(/\{\{else if.*?\}\}|\{\{\/if\}\}/g, "");
        },
      );
    }

    return template;
  } catch (error) {
    console.error("Error rendering email template:", error);
    throw new Error("Failed to render email template");
  }
}

/**
 * Create Gmail SMTP transporter
 */
function createGmailTransporter() {
  const gmailEmail = process.env.GMAIL_EMAIL;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailEmail || !gmailAppPassword) {
    throw new Error(
      "GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables are required",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailEmail,
      pass: gmailAppPassword,
    },
  });
}

/**
 * Send verification email using Gmail SMTP with custom template
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  type: "signup" | "login" | "password_reset",
): Promise<{ success: boolean; error?: string }> {
  try {
    // Render the custom HTML template
    const html = await renderVerificationTemplate({
      code,
      isSignup: type === "signup",
      isLogin: type === "login",
      isPasswordReset: type === "password_reset",
      expiresIn: type === "signup" ? 10 : 5,
      year: new Date().getFullYear(),
      supportUrl: process.env.NEXT_PUBLIC_APP_URL + "/support",
    });

    // Create transporter
    const transporter = createGmailTransporter();

    // Send email
    const subject =
      type === "signup"
        ? "Verify Your Email - MIS System"
        : type === "login"
          ? "Your Verification Code - MIS System"
          : "Password Reset Code - MIS System";

    const mailOptions = {
      from: process.env.GMAIL_EMAIL,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Verification email sent to ${email} for ${type}`);

    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
