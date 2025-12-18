import nodemailer from "nodemailer";

type SendInvitationEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

export async function sendInvitationEmail({ to, subject, text, html }: SendInvitationEmailParams) {
  await transporter.sendMail({
    from: `"Clinicore" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}

export default sendInvitationEmail;
