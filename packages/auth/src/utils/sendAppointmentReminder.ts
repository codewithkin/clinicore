import nodemailer from "nodemailer";

type SendAppointmentReminderParams = {
	to: string;
	patientName: string;
	appointmentDate: Date;
	appointmentTime: string;
	appointmentType: string;
	doctorName?: string;
	clinicName: string;
	notes?: string;
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

export async function sendAppointmentReminder({
	to,
	patientName,
	appointmentDate,
	appointmentTime,
	appointmentType,
	doctorName,
	clinicName,
	notes,
}: SendAppointmentReminderParams) {
	const formattedDate = appointmentDate.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                📅 Appointment Reminder
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hello <strong>${patientName}</strong>,
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                This is a friendly reminder about your upcoming appointment at <strong>${clinicName}</strong>.
              </p>
              
              <!-- Appointment Details Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdfa; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Date</span>
                          <p style="margin: 4px 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">${formattedDate}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Time</span>
                          <p style="margin: 4px 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">${appointmentTime}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Type</span>
                          <p style="margin: 4px 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">${appointmentType}</p>
                        </td>
                      </tr>
                      ${
							doctorName
								? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Doctor</span>
                          <p style="margin: 4px 0 0; color: #1f2937; font-size: 16px; font-weight: 600;">Dr. ${doctorName}</p>
                        </td>
                      </tr>
                      `
								: ""
						}
                    </table>
                  </td>
                </tr>
              </table>
              
              ${
					notes
						? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Note:</strong> ${notes}
                </p>
              </div>
              `
						: ""
				}
              
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Please arrive 10-15 minutes before your scheduled time. If you need to reschedule or cancel, please contact us as soon as possible.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                ${clinicName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated reminder. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

	const text = `
Appointment Reminder

Hello ${patientName},

This is a friendly reminder about your upcoming appointment at ${clinicName}.

APPOINTMENT DETAILS:
- Date: ${formattedDate}
- Time: ${appointmentTime}
- Type: ${appointmentType}
${doctorName ? `- Doctor: Dr. ${doctorName}` : ""}
${notes ? `\nNote: ${notes}` : ""}

Please arrive 10-15 minutes before your scheduled time. If you need to reschedule or cancel, please contact us as soon as possible.

Best regards,
${clinicName}

This is an automated reminder. Please do not reply to this email.
`;

	await transporter.sendMail({
		from: `"${clinicName}" <${process.env.MAIL_USER}>`,
		to,
		subject: `Appointment Reminder - ${formattedDate} at ${appointmentTime}`,
		text,
		html,
	});

	return true;
}
