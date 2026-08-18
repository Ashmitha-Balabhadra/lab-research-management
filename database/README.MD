# Lab Resource Utilization Platform — Database

MySQL 8.x schema for the Lab Resource Utilization Platform, split into ordered scripts.

## Structure

```
database/
├── 01_database.sql   # CREATE DATABASE + USE
├── 02_tables.sql     # Tables, foreign keys, indexes (sections 1–41)
├── 03_rbac.sql       # Roles, permissions, mappings, bootstrap accounts, verification (42–53)
└── README.md
```

## Run order

Scripts are ordered and must run top to bottom:

```bash
mysql -u root -p < database/01_database.sql
mysql -u root -p < database/02_tables.sql
mysql -u root -p < database/03_rbac.sql
```

Or from the MySQL client:

```sql
SOURCE database/01_database.sql;
SOURCE database/02_tables.sql;
SOURCE database/03_rbac.sql;
```

## Contents

**01_database.sql** — creates `lab_resource_utilization` and selects it.

**02_tables.sql** — all entities:
- Identity & access: `Institution`, `Department`, `AppUser`, `OtpVerification`, `RefreshToken`, `PasswordResetToken`, `UserSession`, `UserPrivacyPreference`, `Role`, `Permission`, `UserRole`, `RolePermission`, `UserInvitation`
- Equipment: `Equipment`, `EquipmentDocument`, `EquipmentTag`, `EquipmentDepartmentAccess`, `EquipmentCalibration`, `EquipmentOperatingSchedule`
- Booking: `RecurringBooking`, `Booking`, `Waitlist`
- Inter-institution sharing: `InterInstitutionSharingAgreement`, `ResourceSharingRequest`, `SharedBooking`
- Utilization: `UtilizationLog`, `UtilizationMetric`
- Maintenance: `TechnicianAvailability`, `TechnicianUnavailability`, `MaintenanceRequest`, `MaintenanceAssignment`, `MaintenanceLog`, `EquipmentIssueReport`
- Notifications, finance, reporting: `Notification`, `NotificationPreference`, `CostRecord`, `Invoice`, `Budget`, `Report`, `AuditLog`

**03_rbac.sql** — seed roles and permissions, per-role permission grants (Researcher, Lab Technician, Lab Manager, Department Head, Institution Admin, System Admin, AI Service), bootstrap System Admin and AI service accounts, a sample institution/departments, and verification `SELECT`s.

## Design notes

- Institution Admin registers, verifies email via OTP, then invites all other users; the invitation carries institution, department and role.
- Files (images, PDFs) live in Cloudinary; MySQL stores public IDs, secure URLs and metadata.
- Students/Researchers can report issues only for equipment tied to one of their bookings.
- Inter-institution sharing is time-limited and controlled by the owning institution.
- Technician assignment considers availability, unavailability and active workload.
- OTP values should be hashed before storage in production.

## Notes before committing

- Bootstrap accounts in `03_rbac.sql` use placeholder password hashes — rotate them before any real deployment.
- Re-running `02_tables.sql` on an existing database fails; drop the database first for a clean rebuild.
