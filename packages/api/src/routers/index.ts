import { protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	dashboard: router({
		stats: protectedProcedure.query(async ({ ctx }) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const lastMonth = new Date();
			lastMonth.setMonth(lastMonth.getMonth() - 1);

			// Get total patients count
			const totalPatients = await ctx.db.patient.count();
			const lastMonthPatients = await ctx.db.patient.count({
				where: {
					createdAt: {
						lt: lastMonth,
					},
				},
			});

			// Get today's appointments
			const todayAppointments = await ctx.db.appointment.count({
				where: {
					time: {
						gte: today,
						lt: tomorrow,
					},
				},
			});

			const pendingAppointments = await ctx.db.appointment.count({
				where: {
					time: {
						gte: today,
						lt: tomorrow,
					},
					status: "scheduled",
				},
			});

			// Calculate patient growth
			const patientGrowth = lastMonthPatients > 0 
				? ((totalPatients - lastMonthPatients) / lastMonthPatients * 100).toFixed(0)
				: "0";

			return {
				totalPatients,
				patientGrowth: `+${patientGrowth}% from last month`,
				todayAppointments,
				pendingAppointments: `${pendingAppointments} pending confirmation`,
			};
		}),
		todayAppointments: protectedProcedure.query(async ({ ctx }) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const appointments = await ctx.db.appointment.findMany({
				where: {
					time: {
						gte: today,
						lt: tomorrow,
					},
				},
				include: {
					patient: true,
				},
				orderBy: {
					time: "asc",
				},
			});

			return appointments.map((apt) => ({
				id: apt.id,
				patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
				doctor: apt.doctorName,
				time: apt.time.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
				}),
				type: apt.type,
				status: apt.status,
			}));
		}),
	}),
});
export type AppRouter = typeof appRouter;
