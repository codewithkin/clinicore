import { PrismaClient } from "./prisma/generated";

const prisma = new PrismaClient();

async function main() {
	console.log("Seeding database...");

	// Create sample patients
	const patients = await Promise.all([
		prisma.patient.create({
			data: {
				id: "patient-1",
				firstName: "Sarah",
				lastName: "Johnson",
				email: "sarah.johnson@email.com",
				phone: "+1234567890",
				dateOfBirth: new Date("1985-03-15"),
				address: "123 Main St, New York, NY",
				organizationId: "org-1", // Replace with actual org ID
			},
		}),
		prisma.patient.create({
			data: {
				id: "patient-2",
				firstName: "Michael",
				lastName: "Chen",
				email: "michael.chen@email.com",
				phone: "+1234567891",
				dateOfBirth: new Date("1990-07-22"),
				address: "456 Oak Ave, Los Angeles, CA",
				organizationId: "org-1",
			},
		}),
		prisma.patient.create({
			data: {
				id: "patient-3",
				firstName: "Emma",
				lastName: "Davis",
				email: "emma.davis@email.com",
				phone: "+1234567892",
				dateOfBirth: new Date("1988-11-30"),
				address: "789 Pine Rd, Chicago, IL",
				organizationId: "org-1",
			},
		}),
		prisma.patient.create({
			data: {
				id: "patient-4",
				firstName: "James",
				lastName: "Wilson",
				email: "james.wilson@email.com",
				phone: "+1234567893",
				dateOfBirth: new Date("1975-05-18"),
				address: "321 Elm St, Houston, TX",
				organizationId: "org-1",
			},
		}),
		prisma.patient.create({
			data: {
				id: "patient-5",
				firstName: "Olivia",
				lastName: "Martinez",
				email: "olivia.martinez@email.com",
				phone: "+1234567894",
				dateOfBirth: new Date("1992-09-25"),
				address: "654 Maple Dr, Phoenix, AZ",
				organizationId: "org-1",
			},
		}),
		prisma.patient.create({
			data: {
				id: "patient-6",
				firstName: "Noah",
				lastName: "Anderson",
				email: "noah.anderson@email.com",
				phone: "+1234567895",
				dateOfBirth: new Date("1980-12-08"),
				address: "987 Birch Ln, Philadelphia, PA",
				organizationId: "org-1",
			},
		}),
	]);

	console.log(`Created ${patients.length} patients`);

	// Create today's appointments
	const today = new Date();
	today.setHours(9, 0, 0, 0);

	const appointments = await Promise.all([
		prisma.appointment.create({
			data: {
				patientId: "patient-1",
				doctorName: "Dr. Smith",
				time: new Date(today.getTime()),
				type: "Consultation",
				status: "completed",
				notes: "Regular checkup completed successfully",
			},
		}),
		prisma.appointment.create({
			data: {
				patientId: "patient-2",
				doctorName: "Dr. Williams",
				time: new Date(today.getTime() + 30 * 60000), // 9:30 AM
				type: "Follow-up",
				status: "completed",
				notes: "Follow-up appointment for previous treatment",
			},
		}),
		prisma.appointment.create({
			data: {
				patientId: "patient-3",
				doctorName: "Dr. Smith",
				time: new Date(today.getTime() + 60 * 60000), // 10:00 AM
				type: "Check-up",
				status: "in progress",
				notes: "Annual health checkup",
			},
		}),
		prisma.appointment.create({
			data: {
				patientId: "patient-4",
				doctorName: "Dr. Brown",
				time: new Date(today.getTime() + 90 * 60000), // 10:30 AM
				type: "Consultation",
				status: "scheduled",
			},
		}),
		prisma.appointment.create({
			data: {
				patientId: "patient-5",
				doctorName: "Dr. Williams",
				time: new Date(today.getTime() + 120 * 60000), // 11:00 AM
				type: "Treatment",
				status: "scheduled",
			},
		}),
		prisma.appointment.create({
			data: {
				patientId: "patient-6",
				doctorName: "Dr. Smith",
				time: new Date(today.getTime() + 150 * 60000), // 11:30 AM
				type: "Follow-up",
				status: "scheduled",
			},
		}),
	]);

	console.log(`Created ${appointments.length} appointments`);
	console.log("Seeding completed!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
