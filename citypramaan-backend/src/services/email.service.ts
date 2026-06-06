import { resolve4 } from 'dns/promises';
import nodemailer from 'nodemailer';
import { env, hasResendConfig, hasSmtpConfig } from '../config/env';
import { HttpError } from '../utils/http-error';

export interface VerificationEmailInput {
  email: string;
  name: string;
  code: string;
  expiresAt: string;
}

export interface EmailDeliveryResult {
  delivery: 'resend' | 'smtp' | 'console';
  devCodeExposed: boolean;
  messageId?: string;
}

export async function sendVerificationEmail(input: VerificationEmailInput): Promise<EmailDeliveryResult> {
  if (hasResendConfig()) {
    return sendViaResend(input);
  }

  if (hasSmtpConfig()) {
    return sendViaSmtp(input);
  }

  if (env.nodeEnv === 'production') {
    throw new HttpError(
      503,
      'An email provider is required to send verification emails in production.',
      'EMAIL_PROVIDER_REQUIRED'
    );
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

async function sendViaSmtp(input: VerificationEmailInput): Promise<EmailDeliveryResult> {
  const smtpConnectionHost = await getSmtpConnectionHost();
  const transporter = nodemailer.createTransport({
    host: smtpConnectionHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    connectionTimeout: env.smtpTimeoutMs,
    greetingTimeout: env.smtpTimeoutMs,
    socketTimeout: env.smtpTimeoutMs,
    tls: smtpConnectionHost !== env.smtpHost ? { servername: env.smtpHost } : undefined,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
  const content = buildVerificationEmailContent(input);
  let info;

  try {
    info = await transporter.sendMail({
      from: env.smtpFrom,
      to: input.email,
      ...content,
    });
  } catch (error) {
    console.error('Verification email delivery failed:', error);
    throw new HttpError(
      503,
      'Could not send verification email. Check email provider settings in Render.',
      'EMAIL_DELIVERY_FAILED'
    );
  }

  return {
    delivery: 'smtp',
    devCodeExposed: false,
    messageId: info.messageId,
  };
}

async function sendViaResend(input: VerificationEmailInput): Promise<EmailDeliveryResult> {
  const content = buildVerificationEmailContent(input);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.resendFrom,
        to: [input.email],
        ...content,
      }),
    });

    const responseText = await response.text();
    let responseBody: unknown = undefined;

    if (responseText) {
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }
    }

    if (!response.ok) {
      throw new Error(`Resend API error ${response.status}: ${JSON.stringify(responseBody)}`);
    }

    return {
      delivery: 'resend',
      devCodeExposed: false,
      messageId: getResendMessageId(responseBody),
    };
  } catch (error) {
    console.error('Verification email delivery failed:', error);
    throw new HttpError(
      503,
      'Could not send verification email. Check email provider settings in Render.',
      'EMAIL_DELIVERY_FAILED'
    );
  }
}

async function getSmtpConnectionHost(): Promise<string> {
  if (!env.smtpForceIpv4) {
    return env.smtpHost;
  }

  try {
    const addresses = await resolve4(env.smtpHost);
    return addresses[0] || env.smtpHost;
  } catch (error) {
    console.warn('Could not resolve SMTP IPv4 address, using configured SMTP host:', error);
    return env.smtpHost;
  }
}

function buildVerificationEmailContent(input: VerificationEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const minutes = Math.max(
    1,
    Math.ceil((new Date(input.expiresAt).getTime() - Date.now()) / 60_000)
  );

  return {
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
  };
}

function getResendMessageId(responseBody: unknown): string | undefined {
  if (!responseBody || typeof responseBody !== 'object' || !('id' in responseBody)) {
    return undefined;
  }

  const id = (responseBody as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
