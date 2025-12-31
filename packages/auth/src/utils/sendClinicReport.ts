import nodemailer from "nodemailer";

type ReportData = {
	totalPatients: number;
	newPatientsThisPeriod: number;
	totalAppointments: number;
	appointmentsThisPeriod: number;
	completedAppointments: number;
	cancelledAppointments: number;
	noShowAppointments: number;
	completionRate: string;
	noShowRate: string;
	periodDays: number;
};

type SendClinicReportParams = {
	to: string;
	adminName: string;
	clinicName: string;
	reportData: ReportData;
	periodStart: Date;
	periodEnd: Date;
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

export async function sendClinicReport({
	to,
	adminName,
	clinicName,
	reportData,
	periodStart,
	periodEnd,
}: SendClinicReportParams) {
	const formatDate = (date: Date) =>
		date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clinic Report - ${clinicName}</title>
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
                📊 Clinic Performance Report
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${formatDate(periodStart)} - ${formatDate(periodEnd)}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hello ${adminName},
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Here's your ${reportData.periodDays}-day performance summary for <strong>${clinicName}</strong>:
              </p>
              
              <!-- Stats Grid -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #f0fdfa; border-radius: 12px; text-align: center; width: 50%;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total Patients</p>
                    <p style="margin: 4px 0 0; color: #0d9488; font-size: 28px; font-weight: 700;">${reportData.totalPatients}</p>
                    <p style="margin: 4px 0 0; color: #059669; font-size: 12px;">+${reportData.newPatientsThisPeriod} new this period</p>
                  </td>
                  <td style="width: 16px;"></td>
                  <td style="padding: 16px; background-color: #eff6ff; border-radius: 12px; text-align: center; width: 50%;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total Appointments</p>
                    <p style="margin: 4px 0 0; color: #2563eb; font-size: 28px; font-weight: 700;">${reportData.totalAppointments}</p>
                    <p style="margin: 4px 0 0; color: #2563eb; font-size: 12px;">${reportData.appointmentsThisPeriod} this period</p>
                  </td>
                </tr>
              </table>
              
              <!-- Appointment Breakdown -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Appointment Summary (This Period)
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #374151; font-size: 14px;">✅ Completed</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                      <span style="color: #059669; font-size: 14px; font-weight: 600;">${reportData.completedAppointments}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #374151; font-size: 14px;">❌ Cancelled</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                      <span style="color: #dc2626; font-size: 14px; font-weight: 600;">${reportData.cancelledAppointments}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #374151; font-size: 14px;">⚠️ No-Shows</span>
                    </td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="color: #f59e0b; font-size: 14px; font-weight: 600;">${reportData.noShowAppointments}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Performance Metrics -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; background-color: #ecfdf5; border-radius: 12px; text-align: center; width: 50%;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Completion Rate</p>
                    <p style="margin: 4px 0 0; color: #059669; font-size: 24px; font-weight: 700;">${reportData.completionRate}%</p>
                  </td>
                  <td style="width: 16px;"></td>
                  <td style="padding: 16px; background-color: #fef3c7; border-radius: 12px; text-align: center; width: 50%;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">No-Show Rate</p>
                    <p style="margin: 4px 0 0; color: #d97706; font-size: 24px; font-weight: 700;">${reportData.noShowRate}%</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                View detailed analytics and insights in your dashboard.
              </p>
              
              <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3001"}/dashboard/reports" 
                 style="display: inline-block; background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View Full Reports →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated report from ${clinicName}.<br>
                You can manage report settings in your organization settings.
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
Clinic Performance Report - ${clinicName}
${formatDate(periodStart)} - ${formatDate(periodEnd)}

Hello ${adminName},

Here's your ${reportData.periodDays}-day performance summary:

PATIENTS
- Total Patients: ${reportData.totalPatients}
- New Patients This Period: ${reportData.newPatientsThisPeriod}

APPOINTMENTS
- Total Appointments: ${reportData.totalAppointments}
- This Period: ${reportData.appointmentsThisPeriod}
- Completed: ${reportData.completedAppointments}
- Cancelled: ${reportData.cancelledAppointments}
- No-Shows: ${reportData.noShowAppointments}

PERFORMANCE
- Completion Rate: ${reportData.completionRate}%
- No-Show Rate: ${reportData.noShowRate}%

View detailed analytics at: ${process.env.BETTER_AUTH_URL || "http://localhost:3001"}/dashboard/reports

---
This is an automated report from ${clinicName}.
`;

	const info = await transporter.sendMail({
		from: `"${clinicName}" <${process.env.MAIL_USER}>`,
		to,
		subject: `📊 ${reportData.periodDays}-Day Performance Report - ${clinicName}`,
		text,
		html,
	});

	return info;
}
