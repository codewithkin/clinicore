import nodemailer from "nodemailer";

type SendVerificationEmailParams = {
    to: string;
    subject: string;
    text: string;
};

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === "true", // true for 465, false for 587
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

export async function sendVerificationEmail({
    to,
    subject,
    text,
}: SendVerificationEmailParams) {
    await transporter.sendMail({
        from: `"Clinicore" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
    });
}