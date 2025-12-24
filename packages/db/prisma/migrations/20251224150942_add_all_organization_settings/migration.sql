-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "appointmentCancellation" BOOLEAN DEFAULT true,
ADD COLUMN     "appointmentConfirmation" BOOLEAN DEFAULT true,
ADD COLUMN     "appointmentReminder" BOOLEAN DEFAULT true,
ADD COLUMN     "bookingWindow" INTEGER DEFAULT 30,
ADD COLUMN     "bufferTime" INTEGER DEFAULT 15,
ADD COLUMN     "cancellationPolicy" INTEGER DEFAULT 24,
ADD COLUMN     "emailReminders" BOOLEAN DEFAULT true,
ADD COLUMN     "patientRegistration" BOOLEAN DEFAULT false,
ADD COLUMN     "reminderTiming" INTEGER DEFAULT 24;
