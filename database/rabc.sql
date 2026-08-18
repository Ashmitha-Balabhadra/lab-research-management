-- ============================================================
-- 03_rbac.sql : roles, permissions, role-permission mappings,
-- bootstrap accounts and verification queries (sections 42-53)
-- Requires: 02_tables.sql
-- ============================================================

USE lab_resource_utilization;



-- ============================================================
-- ============================================================
-- 42. INSERT ROLES
-- ============================================================
-- ============================================================

INSERT INTO Role (
    role_id,
    role_name
)
VALUES
    (1, 'RESEARCHER'),
    (2, 'LAB_TECHNICIAN'),
    (3, 'LAB_MANAGER'),
    (4, 'DEPARTMENT_HEAD'),
    (5, 'INSTITUTION_ADMIN'),
    (6, 'SYSTEM_ADMIN'),
    (7, 'AI_SERVICE');


-- ============================================================
-- 43. INSERT PERMISSIONS
-- ============================================================

INSERT INTO Permission (
    permission_name,
    description
)
VALUES

-- ------------------------------------------------------------
-- Equipment
-- ------------------------------------------------------------

(
    'VIEW_EQUIPMENT',
    'View laboratory equipment and availability'
),

(
    'MANAGE_EQUIPMENT',
    'Add, update and manage laboratory equipment'
),

(
    'REPORT_EQUIPMENT_ISSUE',
    'Report an issue with booked laboratory equipment'
),

(
    'VIEW_EQUIPMENT_DOCUMENTS',
    'View equipment manuals, datasheets and other documents'
),

(
    'MANAGE_EQUIPMENT_DOCUMENTS',
    'Upload and manage equipment documents'
),

-- ------------------------------------------------------------
-- Booking
-- ------------------------------------------------------------

(
    'BOOK_EQUIPMENT',
    'Book laboratory equipment'
),

(
    'CANCEL_BOOKING',
    'Cancel own equipment booking'
),

(
    'RESCHEDULE_BOOKING',
    'Reschedule own equipment booking'
),

(
    'APPROVE_BOOKING',
    'Approve equipment booking'
),

(
    'REJECT_BOOKING',
    'Reject equipment booking'
),

(
    'JOIN_WAITLIST',
    'Join equipment waitlist'
),

(
    'VIEW_BOOKING_HISTORY',
    'View equipment booking history'
),

(
    'MANAGE_RECURRING_BOOKING',
    'Create and manage recurring equipment bookings'
),

-- ------------------------------------------------------------
-- Maintenance
-- ------------------------------------------------------------

(
    'VIEW_MAINTENANCE',
    'View maintenance requests and maintenance status'
),

(
    'CREATE_MAINTENANCE_REQUEST',
    'Create maintenance request'
),

(
    'ASSIGN_MAINTENANCE',
    'Assign maintenance work to technician'
),

(
    'UPDATE_MAINTENANCE',
    'Update maintenance work status'
),

(
    'COMPLETE_MAINTENANCE',
    'Complete assigned maintenance work'
),

(
    'MANAGE_CALIBRATION',
    'Manage equipment calibration'
),

(
    'VIEW_EQUIPMENT_ISSUES',
    'View equipment issue reports'
),

(
    'ASSIGN_EQUIPMENT_ISSUE',
    'Assign reported equipment issues to technicians'
),

(
    'RESOLVE_EQUIPMENT_ISSUE',
    'Resolve equipment issues'
),

-- ------------------------------------------------------------
-- Technician
-- ------------------------------------------------------------

(
    'MANAGE_TECHNICIAN_AVAILABILITY',
    'Manage technician weekly availability and unavailability'
),

(
    'VIEW_TECHNICIAN_AVAILABILITY',
    'View technician availability'
),

(
    'VIEW_TECHNICIAN_WORKLOAD',
    'View technician active maintenance workload'
),

-- ------------------------------------------------------------
-- Utilization
-- ------------------------------------------------------------

(
    'VIEW_UTILIZATION',
    'View equipment utilization information'
),

(
    'VIEW_UTILIZATION_ANALYTICS',
    'View equipment, department and institution utilization analytics'
),

(
    'VIEW_USAGE_PATTERNS',
    'View peak usage, idle time and historical usage patterns'
),

-- ------------------------------------------------------------
-- Inter-Institution Equipment Sharing
-- ------------------------------------------------------------

(
    'VIEW_SHARED_EQUIPMENT',
    'View equipment available for inter-institution sharing'
),

(
    'REQUEST_RESOURCE_SHARING',
    'Request access to equipment from another institution'
),

(
    'APPROVE_SHARING_REQUEST',
    'Approve or reject resource sharing requests'
),

(
    'REJECT_SHARING_REQUEST',
    'Reject resource sharing requests'
),

(
    'MANAGE_SHARING_AGREEMENT',
    'Create and manage inter-institution equipment sharing agreements'
),

(
    'MANAGE_SHARED_EQUIPMENT_ACCESS',
    'Manage which external institutions can access shared equipment'
),

(
    'MANAGE_SHARED_BOOKING',
    'Manage bookings for shared equipment'
),

(
    'VIEW_SHARING_ANALYTICS',
    'View inter-institution resource sharing analytics'
),

-- ------------------------------------------------------------
-- Cost and Billing
-- ------------------------------------------------------------

(
    'VIEW_COST',
    'View equipment, maintenance and resource costs'
),

(
    'MANAGE_COST_ALLOCATION',
    'Manage department-wise cost allocation'
),

(
    'MANAGE_USAGE_CHARGES',
    'Manage usage-based equipment charges'
),

(
    'MANAGE_BILLING',
    'Manage inter-institution billing and chargeback'
),

(
    'MANAGE_BUDGET',
    'Manage and monitor budget utilization'
),

(
    'GENERATE_INVOICE',
    'Generate invoices for resource usage'
),

(
    'VIEW_FINANCIAL_REPORT',
    'View financial and cost reports'
),

-- ------------------------------------------------------------
-- Reports
-- ------------------------------------------------------------

(
    'GENERATE_REPORT',
    'Generate equipment, utilization, maintenance, sharing and cost reports'
),

(
    'VIEW_REPORT',
    'View generated reports'
),

(
    'EXPORT_REPORT_PDF',
    'Export reports as PDF'
),

(
    'EXPORT_REPORT_EXCEL',
    'Export reports as Excel'
),

-- ------------------------------------------------------------
-- User / Department / Institution
-- ------------------------------------------------------------

(
    'CREATE_USER',
    'Create or invite users within institution'
),

(
    'UPDATE_USER',
    'Update user information'
),

(
    'DEACTIVATE_USER',
    'Deactivate users'
),

(
    'CREATE_DEPARTMENT',
    'Create departments within institution'
),

(
    'UPDATE_DEPARTMENT',
    'Update department information'
),

(
    'DEACTIVATE_DEPARTMENT',
    'Deactivate departments'
),

(
    'MANAGE_INSTITUTION',
    'Manage institution information and configuration'
),

-- ------------------------------------------------------------
-- Notifications
-- ------------------------------------------------------------

(
    'MANAGE_NOTIFICATIONS',
    'Manage system notification settings and alerts'
),

-- ------------------------------------------------------------
-- RBAC
-- ------------------------------------------------------------

(
    'MANAGE_ROLES',
    'Create and manage roles'
),

(
    'MANAGE_PERMISSIONS',
    'Create and manage permissions'
),

(
    'VIEW_AUDIT_LOG',
    'View system audit logs'
),

-- ------------------------------------------------------------
-- AI
-- ------------------------------------------------------------

(
    'AI_RECOMMEND_EQUIPMENT',
    'AI service: recommend equipment'
),

(
    'AI_RECOMMEND_SCHEDULE',
    'AI service: recommend optimal booking schedule'
),

(
    'AI_RECOMMEND_MAINTENANCE',
    'AI service: recommend predictive maintenance'
),

(
    'AI_ANALYZE_UTILIZATION',
    'AI service: analyze utilization patterns'
),

(
    'AI_OPTIMIZE_SHARING',
    'AI service: recommend inter-institution sharing'
);


-- ============================================================
-- 44. RESEARCHER PERMISSIONS
-- ============================================================

INSERT INTO RolePermission (
    role_id,
    permission_id
)

SELECT
    1,
    permission_id

FROM Permission

WHERE permission_name IN (

    'VIEW_EQUIPMENT',

    'VIEW_EQUIPMENT_DOCUMENTS',

    'BOOK_EQUIPMENT',

    'CANCEL_BOOKING',

    'RESCHEDULE_BOOKING',

    'JOIN_WAITLIST',

    'VIEW_BOOKING_HISTORY',

    'REPORT_EQUIPMENT_ISSUE',

    'VIEW_MAINTENANCE',

    'CREATE_MAINTENANCE_REQUEST',

    'VIEW_SHARED_EQUIPMENT',

    'REQUEST_RESOURCE_SHARING'
);


-- ============================================================
-- 45. LAB TECHNICIAN PERMISSIONS
-- ============================================================

INSERT INTO RolePermission (
    role_id,
    permission_id
)

SELECT
    2,
    permission_id

FROM Permission

WHERE permission_name IN (

    'VIEW_EQUIPMENT',

    'VIEW_EQUIPMENT_DOCUMENTS',

    'VIEW_MAINTENANCE',

    'UPDATE_MAINTENANCE',

    'COMPLETE_MAINTENANCE',

    'MANAGE_CALIBRATION',

    'VIEW_EQUIPMENT_ISSUES',

    'ASSIGN_EQUIPMENT_ISSUE',

    'RESOLVE_EQUIPMENT_ISSUE',

    'VIEW_TECHNICIAN_AVAILABILITY',

    'VIEW_TECHNICIAN_WORKLOAD',

    'VIEW_SHARED_EQUIPMENT'
);


-- ============================================================
-- 46. LAB MANAGER PERMISSIONS
-- ============================================================

INSERT INTO RolePermission (
    role_id,
    permission_id
)

SELECT
    3,
    permission_id

FROM Permission

WHERE permission_name IN (

    'VIEW_EQUIPMENT',

    'MANAGE_EQUIPMENT',

    'VIEW_EQUIPMENT_DOCUMENTS',

    'MANAGE_EQUIPMENT_DOCUMENTS',

    'APPROVE_BOOKING',

    'REJECT_BOOKING',

    'MANAGE_RECURRING_BOOKING',

    'VIEW_BOOKING_HISTORY',

    'VIEW_MAINTENANCE',

    'CREATE_MAINTENANCE_REQUEST',

    'ASSIGN_MAINTENANCE',

    'UPDATE_MAINTENANCE',

    'COMPLETE_MAINTENANCE',

    'MANAGE_CALIBRATION',

    'VIEW_EQUIPMENT_ISSUES',

    'ASSIGN_EQUIPMENT_ISSUE',

    'RESOLVE_EQUIPMENT_ISSUE',

    'VIEW_TECHNICIAN_AVAILABILITY',

    'VIEW_TECHNICIAN_WORKLOAD',

    'MANAGE_TECHNICIAN_AVAILABILITY',

    'VIEW_UTILIZATION',

    'VIEW_UTILIZATION_ANALYTICS',

    'VIEW_USAGE_PATTERNS',

    'VIEW_SHARED_EQUIPMENT',

    'REQUEST_RESOURCE_SHARING',

    'APPROVE_SHARING_REQUEST',

    'REJECT_SHARING_REQUEST',

    'MANAGE_SHARING_AGREEMENT',

    'MANAGE_SHARED_EQUIPMENT_ACCESS',

    'MANAGE_SHARED_BOOKING',

    'VIEW_SHARING_ANALYTICS',

    'VIEW_COST',

    'GENERATE_REPORT',

    'VIEW_REPORT'
);


-- ============================================================
-- 47. DEPARTMENT HEAD PERMISSIONS
-- ============================================================

INSERT INTO RolePermission (
    role_id,
    permission_id
)

SELECT
    4,
    permission_id

FROM Permission

WHERE permission_name IN (

    'VIEW_EQUIPMENT',

    'VIEW_EQUIPMENT_DOCUMENTS',

    'VIEW_MAINTENANCE',

    'VIEW_EQUIPMENT_ISSUES',

    'VIEW_UTILIZATION',

    'VIEW_UTILIZATION_ANALYTICS',

    'VIEW_USAGE_PATTERNS',

    'VIEW_SHARED_EQUIPMENT',

    'REQUEST_RESOURCE_SHARING',

    'APPROVE_SHARING_REQUEST',

    'REJECT_SHARING_REQUEST',

    'MANAGE_SHARING_AGREEMENT',

    'MANAGE_SHARED_EQUIPMENT_ACCESS',

    'VIEW_SHARING_ANALYTICS',

    'VIEW_COST',

    'MANAGE_COST_ALLOCATION',

    'MANAGE_BUDGET',

    'VIEW_FINANCIAL_REPORT',

    'GENERATE_REPORT',

    'VIEW_REPORT',

    'EXPORT_REPORT_PDF',

    'EXPORT_REPORT_EXCEL'
);


-- ============================================================
-- 48. INSTITUTION ADMIN PERMISSIONS
-- ============================================================

INSERT INTO RolePermission (
    role_id,
    permission_id
)

SELECT
    5,
    permission_id

FROM Permission

WHERE permission_name IN (

    'VIEW_EQUIPMENT',

    'MANAGE_EQUIPMENT',

    'VIEW_EQUIPMENT_DOCUMENTS',

    'MANAGE_EQUIPMENT_DOCUMENTS',

    'VIEW_MAINTENANCE',

    'ASSIGN_MAINTENANCE',

    'MANAGE_CALIBRATION',

    'VIEW_EQUIPMENT_ISSUES',

    'ASSIGN_EQUIPMENT_ISSUE',

    'RESOLVE_EQUIPMENT_ISSUE',

    'VIEW_TECHNICIAN_AVAILABILITY',

    'VIEW_TECHNICIAN_WORKLOAD',

    'MANAGE_TECHNICIAN_AVAILABILITY',

    'VIEW_UTILIZATION',

    'VIEW_UTILIZATION_ANALYTICS',

    'VIEW_USAGE_PATTERNS',

    'VIEW_SHARED_EQUIPMENT',

    'APPROVE_SHARING_REQUEST',

    'REJECT_SHARING_REQUEST',

    'MANAGE_SHARING_AGREEMENT',

    'MANAGE_SHARED_EQUIPMENT_ACCESS',

    'MANAGE_SHARED_BOOKING',

    'VIEW_SHARING_ANALYTICS',

    'VIEW_COST',

    'MANAGE_COST_ALLOCATION',

    'MANAGE_USAGE_CHARGES',

    'MANAGE_BILLING',

    'MANAGE_BUDGET',

    'GENERATE_INVOICE',

    'VIEW_FINANCIAL_REPORT',

    'GENERATE_REPORT',

    'VIEW_REPORT',

    'EXPORT_REPORT_PDF',

    'EXPORT_REPORT_EXCEL',

    'CREATE_USER',

    'UPDATE_USER',

    'DEACTIVATE_USER',

    'CREATE_DEPARTMENT',

    'UPDATE_DEPARTMENT',

    'DEACTIVATE_DEPARTMENT',

    'MANAGE_INSTITUTION',

    'MANAGE_NOTIFICATIONS'
);


-- ============================================================
-- 49. SYSTEM ADMIN
-- ============================================================
--
-- Gets every normal permission except AI service permissions.
-- ============================================================

INSERT INTO RolePermission (
    role_id,
    permission_id
)

SELECT
    6,
    permission_id

FROM Permission

WHERE permission_name NOT LIKE 'AI_%';


-- ============================================================
-- 50. AI SERVICE
-- ============================================================

INSERT INTO RolePermission (
    role_id,
    permission_id
)

SELECT
    7,
    permission_id

FROM Permission

WHERE permission_name IN (

    'AI_RECOMMEND_EQUIPMENT',

    'AI_RECOMMEND_SCHEDULE',

    'AI_RECOMMEND_MAINTENANCE',

    'AI_ANALYZE_UTILIZATION',

    'AI_OPTIMIZE_SHARING'
);


-- ============================================================
-- 51. BOOTSTRAP SYSTEM ADMIN
-- ============================================================
--
-- IMPORTANT:
-- Replace TEMPORARY_HASH with an actual BCrypt hash.
-- ============================================================

INSERT INTO AppUser (
    institution_id,
    department_id,
    first_name,
    last_name,
    email,
    password_hash,
    auth_provider,
    is_active,
    is_email_verified,
    is_phone_verified,
    is_invitation_accepted,
    terms_version_accepted,
    terms_accepted_at,
    privacy_version_accepted,
    privacy_accepted_at
)

VALUES (
    NULL,
    NULL,
    'System',
    'Administrator',
    'admin@labresource.com',
    'TEMPORARY_HASH',
    'LOCAL',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '1.0',
    CURRENT_TIMESTAMP,
    '1.0',
    CURRENT_TIMESTAMP
);


-- Give System Admin role

INSERT INTO UserRole (
    user_id,
    role_id
)

SELECT
    user_id,
    6

FROM AppUser

WHERE email = 'admin@labresource.com';


-- Privacy preference

INSERT INTO UserPrivacyPreference (
    user_id,
    profile_visible,
    email_visible,
    phone_visible,
    analytics_consent,
    data_processing_consent
)

SELECT
    user_id,
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    TRUE

FROM AppUser

WHERE email = 'admin@labresource.com';


-- Notification preferences

INSERT INTO NotificationPreference (
    user_id,
    notification_type,
    email_enabled,
    sms_enabled,
    push_enabled
)

SELECT
    u.user_id,
    t.notification_type,
    TRUE,
    FALSE,
    TRUE

FROM AppUser u

CROSS JOIN (

    SELECT 'BOOKING_STATUS' AS notification_type

    UNION ALL
    SELECT 'MAINTENANCE_UPDATE'

    UNION ALL
    SELECT 'WAITLIST_AVAILABLE'

    UNION ALL
    SELECT 'SHARING_REQUEST'

    UNION ALL
    SELECT 'EQUIPMENT_ISSUE'

    UNION ALL
    SELECT 'SYSTEM_ALERT'

) t

WHERE u.email = 'admin@labresource.com';


-- ============================================================
-- 52. AI SERVICE ACCOUNT
-- ============================================================

INSERT INTO AppUser (
    institution_id,
    department_id,
    first_name,
    last_name,
    email,
    password_hash,
    auth_provider,
    is_active,
    is_email_verified,
    is_phone_verified,
    is_invitation_accepted,
    terms_version_accepted,
    terms_accepted_at,
    privacy_version_accepted,
    privacy_accepted_at
)

VALUES (
    NULL,
    NULL,
    'AI',
    'Service',
    'ai-service@labresource.com',
    'TEMPORARY_HASH',
    'LOCAL',
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    '1.0',
    CURRENT_TIMESTAMP,
    '1.0',
    CURRENT_TIMESTAMP
);


INSERT INTO UserRole (
    user_id,
    role_id
)

SELECT
    user_id,
    7

FROM AppUser

WHERE email = 'ai-service@labresource.com';


INSERT INTO UserPrivacyPreference (
    user_id,
    profile_visible,
    email_visible,
    phone_visible,
    analytics_consent,
    data_processing_consent
)

SELECT
    user_id,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    TRUE

FROM AppUser

WHERE email = 'ai-service@labresource.com';


-- ============================================================
-- 53. VERIFICATION
-- ============================================================

SELECT
    COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'lab_resource_utilization';


-- Roles

SELECT
    role_id,
    role_name
FROM Role
ORDER BY role_id;


-- Permission counts

SELECT
    r.role_id,
    r.role_name,
    COUNT(rp.permission_id) AS permission_count

FROM Role r

LEFT JOIN RolePermission rp
    ON r.role_id = rp.role_id

GROUP BY
    r.role_id,
    r.role_name

ORDER BY
    r.role_id;


-- AI permission verification

SELECT
    COUNT(*) AS ai_permission_count

FROM Role r

JOIN RolePermission rp
    ON r.role_id = rp.role_id

JOIN Permission p
    ON rp.permission_id = p.permission_id

WHERE r.role_name = 'AI_SERVICE';


-- Should return 0

SELECT
    COUNT(*) AS ai_non_ai_permission_count

FROM Role r

JOIN RolePermission rp
    ON r.role_id = rp.role_id

JOIN Permission p
    ON rp.permission_id = p.permission_id

WHERE r.role_name = 'AI_SERVICE'

AND p.permission_name NOT LIKE 'AI_%';


-- System admin

SELECT
    u.user_id,
    u.email,
    r.role_name

FROM AppUser u

JOIN UserRole ur
    ON u.user_id = ur.user_id

JOIN Role r
    ON ur.role_id = r.role_id

WHERE u.email = 'admin@labresource.com';


-- AI service

SELECT
    u.user_id,
    u.email,
    r.role_name

FROM AppUser u

JOIN UserRole ur
    ON u.user_id = ur.user_id

JOIN Role r
    ON ur.role_id = r.role_id

WHERE u.email = 'ai-service@labresource.com';

USE lab_resource_utilization;
UPDATE users SET status = 'ACTIVE', is_approved = true 
WHERE email = 'researcher@university.edu';
USE lab_resource_utilization;

-- Check current state
SELECT user_id, email, is_active, is_email_verified, is_invitation_accepted
FROM AppUser
WHERE email = 'researcher@university.edu';

SELECT * FROM Institution;
SELECT * FROM Department;

-- Insert Institution
INSERT INTO Institution (institution_id, name, address, city, state, country, contact_email, contact_phone, is_active)
VALUES (2, 'State Technology University', '456 University Blvd', 'Bengaluru', 'Karnataka', 'India', 'admin@stulab.edu.in', '08022445566', TRUE);

-- Insert Department
INSERT INTO Department (department_id, institution_id, name, budget_allocated, is_active)
VALUES (2, 2, 'Department of Nanotechnology', 2500000.00, TRUE);

INSERT INTO Department (department_id, institution_id, name, budget_allocated, is_active)
VALUES (3, 3, 'Department of Physics', 1000000.00, TRUE);

-- ============================================================
-- END OF COMPLETE SCHEMA
