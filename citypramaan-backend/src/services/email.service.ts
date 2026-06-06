import nodemailer from 'nodemailer';
import { env, hasSmtpConfig } from '../config/env';
import { HttpError } from '../utils/http-error';

export interface VerificationEmailInput {
  email: string;
  name: string;
  code: string;
  expiresAt: string;
}

export interface EmailDeliveryResult {
  delivery: 'smtp' | 'console';
  devCodeExposed: boolean;
  messageId?: string;
}

export async function sendVerificationEmail(input: VerificationEmailInput): Promise<EmailDeliveryResult> {
  if (!hasSmtpConfig()) {
    if (env.nodeEnv === 'production') {
      throw new HttpError(503, 'SMTP is required to send verification emails in production.', 'SMTP_REQUIRED');
    }

    console.log(
      `[CityPramaan] Verification code for ${input.email}: ${input.code} ` +
        `(expires ${input.expiresAt})`
    );

    return {
      delivery: 'console',
      devCodeExposed: env.exposeDevVerificationCode,
    };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    connectionTimeout: env.smtpTimeoutMs,
    greetingTimeout: env.smtpTimeoutMs,
    socketTimeout: env.smtpTimeoutMs,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
  const minutes = Math.max(
    1,
    Math.ceil((new Date(input.expiresAt).getTime() - Date.now()) / 60_000)
  );
  let info;

  try {
    info = await transporter.sendMail({
      from: env.smtpFrom,
      to: input.email,
      subject: 'Verify your CityPramaan email',
      text: [
        `Hi ${input.name || 'there'},`,
        '',
        `Your CityPramaan verification code is ${input.code}.`,
        `It expires in ${minutes} minutes.`,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: [
        `<p>Hi ${escapeHtml(input.name || 'there')},</p>`,
        '<p>Your CityPramaan verification code is:</p>',
        `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${input.code}</p>`,
        `<p>It expires in ${minutes} minutes.</p>`,
        '<p>If you did not request this, you can ignore this email.</p>',
      ].join(''),
    });
  } catch (error) {
    console.error('Verification email delivery failed:', error);
    throw new HttpError(
      503,
      'Could not send verification email. Check SMTP settings in Render.',
      'EMAIL_DELIVERY_FAILED'
    );
  }

  return {
    delivery: 'smtp',
    devCodeExposed: false,
    messageId: info.messageId,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
