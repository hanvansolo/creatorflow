import nodemailer from 'nodemailer';

let _transport: nodemailer.Transporter | null = null;

export function getTransport(): nodemailer.Transporter {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transport;
}

export const FROM_EMAIL = process.env.SMTP_FROM || 'Footy Feed <noreply@footy-feed.com>';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://footy-feed.com';
