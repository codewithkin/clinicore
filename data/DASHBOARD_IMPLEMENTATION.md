# Dashboard Implementation

## Overview
The dashboard has been updated with a modern, professional design matching the reference design and now pulls real data from the database.

## Changes Made

### 1. Database Schema Updates
- Added `Patient` model with fields: firstName, lastName, email, phone, dateOfBirth, address
- Added `Appointment` model with fields: patientId, doctorName, time, type, status, notes
- Migration created: `20251220180913_add_patient_appointment_models`

### 2. API Routes (tRPC)
Created new tRPC endpoints in `packages/api/src/routers/index.ts`:

**`dashboard.stats`** - Returns dashboard statistics:
- Total patients count
- Patient growth percentage
- Today's appointments count
- Pending appointments count

**`dashboard.todayAppointments`** - Returns today's appointments with patient details

### 3. Dashboard UI Redesign
Updated `apps/web/src/app/dashboard/page.tsx`:

#### Design Changes:
- **Header**: Added action buttons ("Import Data" and "+ Add Patient")
- **Stats Cards**: 
  - First card (Total Patients) has teal background with white text
  - Other cards have white background
  - All cards have rounded corners (rounded-2xl)
  - Added arrow icon in top-right corner
  - Improved spacing and typography
- **Table**: 
  - Cleaner design with subtle borders
  - Added visual indicators (colored dots for time)
  - Better hover states
  - Empty state when no appointments
  - Displays real data from database

#### Data Integration:
- Fetches real patient and appointment data from PostgreSQL
- Calculates statistics server-side
- Handles empty states gracefully

### 4. Seed Data
Created `packages/db/seed.ts` to populate sample data:
- 6 sample patients
- 6 appointments for today (various statuses: completed, in progress, scheduled)

## Running the Project

### 1. Run Database Migration
```bash
cd packages/db
bunx prisma migrate dev
```

### 2. Seed the Database (Optional)
```bash
cd packages/db
bun run db:seed
```

### 3. Start Development Server
```bash
bun run dev
```

## Database Models

### Patient
```prisma
model Patient {
  id             String        @id @default(cuid())
  firstName      String
  lastName       String
  email          String?
  phone          String?
  dateOfBirth    DateTime?
  address        String?
  organizationId String
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  appointments   Appointment[]
}
```

### Appointment
```prisma
model Appointment {
  id         String   @id @default(cuid())
  patientId  String
  patient    Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctorName String
  time       DateTime
  type       String
  status     String   @default("scheduled")
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Brand Colors Used
- **Primary**: Teal (#14B8A6) - Main accent color
- **Background**: White (#FFFFFF)
- **Text**: Gray-900 (#1F2937) for headings
- **Borders**: Gray-200 for subtle dividers

---

## Role-Based Dashboard Implementation

### Overview
The dashboard now displays different data and features based on user role:
- **Admin/Doctor**: Full access to all data including revenue and staff management
- **Receptionist**: Limited access focused on patient check-in and appointment scheduling

### Implementation Details

#### 1. Role Detection
```typescript
// Get user's role from organization membership
const userRole = await getUserRole(session.user.id, organizationId);
const isAdminUser = isAdmin(userRole);
```

#### 2. Helper Functions Added
- `getUserRole(userId, organizationId)`: Fetches user's role from Member table
- `isAdmin(role)`: Returns true if role is "admin" or "doctor"

#### 3. Role-Based Stats Cards

**Admin/Doctor Stats (4 cards):**
1. Total Patients (teal background)
2. Appointments Today
3. Monthly Revenue
4. Active Staff

**Receptionist Stats (3 cards):**
1. Today's Appointments (teal background)
2. Pending Check-ins (overdue appointments)
3. Total Patients (with recently registered count)

#### 4. UI Differences

**Header:**
- Shows role badge (Admin/Receptionist)
- Admins see "View Reports" button
- Both roles see "Add Patient" button
- Different subtitle text based on role

**Appointments Table:**
- Admins: Full view of all appointments
- Receptionists: Additional "Check-in" button column for overdue scheduled appointments

#### 5. Data Filtering

**Receptionist Restrictions:**
- ❌ No revenue data
- ❌ No staff count
- ✅ Can see all today's appointments
- ✅ Can check-in patients
- ✅ Can add new patients
- ✅ Can schedule appointments

**Admin Permissions:**
- ✅ Full access to all data
- ✅ Revenue metrics
- ✅ Staff management data
- ✅ All appointment details

### Security Implementation
- Role checked server-side on every page load
- Organization membership verified before data access
- Stats calculated differently based on role
- UI elements conditionally rendered based on permissions

---

## Next Steps
- Implement "Check-in" button functionality for receptionists
- Add role-based tRPC middleware for API protection
- Create separate "View Reports" page for admins
- Implement "Add Patient" modal
- Add "Schedule Appointment" functionality
- Create staff management section for admins
- Add real revenue calculation from completed appointments
