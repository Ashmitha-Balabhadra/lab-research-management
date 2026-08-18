-- ============================================================
-- 02_tables.sql : tables, foreign keys and indexes (sections 1-41)
-- Requires: 01_database.sql
-- ============================================================

USE lab_resource_utilization;


-- ============================================================
-- 1. INSTITUTION
-- ============================================================

CREATE TABLE Institution (
    institution_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),

    contact_email VARCHAR(150),
    contact_phone VARCHAR(20),

    -- Cloudinary public ID for institution logo
    logo_public_id VARCHAR(500),
    logo_secure_url VARCHAR(1000),
    logo_file_name VARCHAR(255),
    logo_content_type VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. DEPARTMENT
-- ============================================================

CREATE TABLE Department (
    department_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    institution_id BIGINT NOT NULL,

    name VARCHAR(100) NOT NULL,

    department_head_id BIGINT NULL,

    budget_allocated DECIMAL(14,2) DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_department_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT chk_department_budget
        CHECK (budget_allocated >= 0),

    CONSTRAINT uq_department_institution_name
        UNIQUE (institution_id, name)
);


-- ============================================================
-- 3. APP USER
-- ============================================================

CREATE TABLE AppUser (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    institution_id BIGINT NULL,
    department_id BIGINT NULL,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NULL,

    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',

    provider_user_id VARCHAR(255) NULL,

    phone_number VARCHAR(20),

    profile_picture_public_id VARCHAR(500),
    profile_picture_secure_url VARCHAR(1000),
    profile_picture_file_name VARCHAR(255),
    profile_picture_content_type VARCHAR(100),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- Useful for invitation-based accounts
    is_invitation_accepted BOOLEAN NOT NULL DEFAULT FALSE,

    terms_version_accepted VARCHAR(20),
    terms_accepted_at DATETIME,

    privacy_version_accepted VARCHAR(20),
    privacy_accepted_at DATETIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_user_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT chk_auth_provider
        CHECK (
            auth_provider IN (
                'LOCAL',
                'GOOGLE'
            )
        )
);


-- ============================================================
-- 4. DEPARTMENT HEAD FK
-- ============================================================
--
-- Department depends on AppUser for department_head_id,
-- while AppUser already exists.
--
-- Therefore the FK is added here.
-- ============================================================

ALTER TABLE Department
ADD CONSTRAINT fk_department_head
FOREIGN KEY (department_head_id)
REFERENCES AppUser(user_id);


-- ============================================================
-- 5. OTP VERIFICATION
-- ============================================================
--
-- Used for:
--
-- Institution Admin registration:
--     EMAIL verification
--     PHONE verification
--
-- Invitation users:
--     EMAIL verification
--     PHONE verification if required
--
-- OTP itself should ideally be hashed in production.
-- ============================================================

CREATE TABLE OtpVerification (
    otp_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NULL,

    identifier VARCHAR(150) NOT NULL,

    identifier_type VARCHAR(20) NOT NULL,

    purpose VARCHAR(40) NOT NULL,

    otp_hash VARCHAR(255) NOT NULL,

    expires_at DATETIME NOT NULL,

    verified_at DATETIME NULL,

    attempt_count INT NOT NULL DEFAULT 0,

    max_attempts INT NOT NULL DEFAULT 5,

    is_used BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_otp_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_otp_identifier_type
        CHECK (
            identifier_type IN (
                'EMAIL',
                'PHONE'
            )
        ),

    CONSTRAINT chk_otp_purpose
        CHECK (
            purpose IN (
                'REGISTRATION',
                'EMAIL_VERIFICATION',
                'PHONE_VERIFICATION',
                'EMAIL_CHANGE',
                'PHONE_CHANGE',
                'PASSWORD_RESET',
                'LOGIN'
            )
        ),

    CONSTRAINT chk_otp_attempts
        CHECK (
            attempt_count >= 0
            AND max_attempts > 0
        )
);

CREATE INDEX idx_otp_identifier
ON OtpVerification(identifier);

CREATE INDEX idx_otp_user_purpose
ON OtpVerification(user_id, purpose);

CREATE INDEX idx_otp_expiry
ON OtpVerification(expires_at);


-- ============================================================
-- 6. REFRESH TOKEN
-- ============================================================

CREATE TABLE RefreshToken (
    token_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    token VARCHAR(500) NOT NULL UNIQUE,

    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    expires_at TIMESTAMP NOT NULL,

    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,

    device_info VARCHAR(255),

    ip_address VARCHAR(45),

    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id)
);


-- ============================================================
-- 7. PASSWORD RESET TOKEN
-- ============================================================

CREATE TABLE PasswordResetToken (
    reset_token_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    token VARCHAR(255) NOT NULL UNIQUE,

    expires_at TIMESTAMP NOT NULL,

    is_used BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_password_reset_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id)
);


-- ============================================================
-- 8. USER SESSION
-- ============================================================

CREATE TABLE UserSession (
    session_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    login_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    logout_at DATETIME NULL,

    last_activity_at DATETIME NULL,

    ip_address VARCHAR(45),

    device_info VARCHAR(255),

    user_agent VARCHAR(500),

    session_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_user_session_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_session_status
        CHECK (
            session_status IN (
                'ACTIVE',
                'LOGGED_OUT',
                'EXPIRED',
                'REVOKED'
            )
        )
);

CREATE INDEX idx_user_session_user_status
ON UserSession(user_id, session_status);


-- ============================================================
-- 9. USER PRIVACY PREFERENCE
-- ============================================================

CREATE TABLE UserPrivacyPreference (
    preference_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    profile_visible BOOLEAN NOT NULL DEFAULT TRUE,

    email_visible BOOLEAN NOT NULL DEFAULT FALSE,

    phone_visible BOOLEAN NOT NULL DEFAULT FALSE,

    analytics_consent BOOLEAN NOT NULL DEFAULT FALSE,

    data_processing_consent BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_privacy_preference_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id)
);


-- ============================================================
-- 10. ROLE
-- ============================================================

CREATE TABLE Role (
    role_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    role_name VARCHAR(50) NOT NULL UNIQUE
);


-- ============================================================
-- 11. PERMISSION
-- ============================================================

CREATE TABLE Permission (
    permission_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    permission_name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 12. USER ROLE
-- ============================================================

CREATE TABLE UserRole (
    user_id BIGINT NOT NULL,

    role_id BIGINT NOT NULL,

    PRIMARY KEY (user_id, role_id),

    CONSTRAINT fk_userrole_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_userrole_role
        FOREIGN KEY (role_id)
        REFERENCES Role(role_id)
);


-- ============================================================
-- 13. ROLE PERMISSION
-- ============================================================

CREATE TABLE RolePermission (
    role_id BIGINT NOT NULL,

    permission_id BIGINT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_rolepermission_role
        FOREIGN KEY (role_id)
        REFERENCES Role(role_id),

    CONSTRAINT fk_rolepermission_permission
        FOREIGN KEY (permission_id)
        REFERENCES Permission(permission_id)
);


-- ============================================================
-- 14. USER INVITATION
-- ============================================================
--
-- Institution Admin invites:
--
-- Researcher / Student
-- Lab Technician
-- Lab Manager
-- Department Head
--
-- The invitation itself determines:
-- Institution
-- Department
-- Role
-- ============================================================

CREATE TABLE UserInvitation (
    invitation_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    email VARCHAR(150) NOT NULL,

    institution_id BIGINT NOT NULL,

    department_id BIGINT NULL,

    role_id BIGINT NOT NULL,

    invited_by BIGINT NOT NULL,

    token_hash VARCHAR(255) NOT NULL UNIQUE,

    expires_at DATETIME NOT NULL,

    accepted_at DATETIME NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invitation_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_invitation_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT fk_invitation_role
        FOREIGN KEY (role_id)
        REFERENCES Role(role_id),

    CONSTRAINT fk_invitation_invited_by
        FOREIGN KEY (invited_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_invitation_status
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'EXPIRED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_user_invitation_email
ON UserInvitation(email);

CREATE INDEX idx_user_invitation_status
ON UserInvitation(status);


-- ============================================================
-- 15. EQUIPMENT
-- ============================================================

CREATE TABLE Equipment (
    equipment_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    institution_id BIGINT NOT NULL,

    department_id BIGINT NOT NULL,

    name VARCHAR(150) NOT NULL,

    category VARCHAR(100),

    serial_number VARCHAR(100) NOT NULL UNIQUE,

    manufacturer VARCHAR(100),

    model VARCHAR(100),

    purchase_date DATE,

    purchase_cost DECIMAL(14,2),

    specifications JSON,

    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',

    location VARCHAR(150),

    capacity_per_slot INT NOT NULL DEFAULT 1,

    is_shareable BOOLEAN NOT NULL DEFAULT FALSE,

    -- Main equipment image in Cloudinary
    image_public_id VARCHAR(500),
    image_secure_url VARCHAR(1000),

    image_file_name VARCHAR(255),

    image_content_type VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_equipment_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_equipment_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT chk_equipment_status
        CHECK (
            status IN (
                'AVAILABLE',
                'BOOKED',
                'UNDER_MAINTENANCE',
                'OUT_OF_SERVICE',
                'RETIRED'
            )
        ),

    CONSTRAINT chk_equipment_capacity
        CHECK (
            capacity_per_slot > 0
        ),

    CONSTRAINT chk_equipment_purchase_cost
        CHECK (
            purchase_cost IS NULL
            OR purchase_cost >= 0
        )
);

CREATE INDEX idx_equipment_institution_department
ON Equipment(institution_id, department_id);

CREATE INDEX idx_equipment_status
ON Equipment(status);


-- ============================================================
-- 16. EQUIPMENT DOCUMENT
-- ============================================================
--
-- Actual PDF/document is stored in Cloudinary.
--
-- document_type tells the application what the document is:
--
-- MANUAL
-- DATASHEET
-- USER_GUIDE
-- SAFETY_DOCUMENT
-- OTHER
--
-- cloudinary_public_id identifies the Cloudinary asset.
-- ============================================================

CREATE TABLE EquipmentDocument (
    document_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    document_type VARCHAR(30) NOT NULL,

    document_name VARCHAR(255) NOT NULL,

    cloudinary_public_id VARCHAR(500) NOT NULL,
    cloudinary_secure_url VARCHAR(1000),

    file_size BIGINT,

    content_type VARCHAR(100),

    uploaded_by BIGINT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_equipment_document_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_equipment_document_user
        FOREIGN KEY (uploaded_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_equipment_document_type
        CHECK (
            document_type IN (
                'MANUAL',
                'DATASHEET',
                'USER_GUIDE',
                'SAFETY_DOCUMENT',
                'OTHER'
            )
        ),

    CONSTRAINT chk_equipment_document_size
        CHECK (
            file_size IS NULL
            OR file_size >= 0
        )
);

CREATE INDEX idx_equipment_document_equipment
ON EquipmentDocument(equipment_id);


-- ============================================================
-- 17. EQUIPMENT TAG
-- ============================================================

CREATE TABLE Tag (
    tag_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE EquipmentTag (
    equipment_id BIGINT NOT NULL,

    tag_id BIGINT NOT NULL,

    PRIMARY KEY (equipment_id, tag_id),

    CONSTRAINT fk_equipment_tag_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_equipment_tag_tag
        FOREIGN KEY (tag_id)
        REFERENCES Tag(tag_id)
);


-- ============================================================
-- 18. EQUIPMENT DEPARTMENT ACCESS
-- ============================================================
--
-- Allows another department to access equipment.
-- ============================================================

CREATE TABLE EquipmentDepartmentAccess (
    equipment_id BIGINT NOT NULL,

    department_id BIGINT NOT NULL,

    access_level VARCHAR(20) NOT NULL,

    PRIMARY KEY (equipment_id, department_id),

    CONSTRAINT fk_equipment_access_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_equipment_access_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT chk_access_level
        CHECK (
            access_level IN (
                'OWNER',
                'SHARED'
            )
        )
);


-- ============================================================
-- 19. EQUIPMENT CALIBRATION
-- ============================================================

CREATE TABLE EquipmentCalibration (
    calibration_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    calibration_date DATE NOT NULL,

    next_due_date DATE NOT NULL,

    certificate_public_id VARCHAR(500),
    certificate_secure_url VARCHAR(1000),

    certificate_file_name VARCHAR(255),

    performed_by VARCHAR(150),

    notes TEXT,

    CONSTRAINT fk_calibration_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT chk_calibration_dates
        CHECK (
            next_due_date >= calibration_date
        )
);


-- ============================================================
-- 20. EQUIPMENT OPERATING SCHEDULE
-- ============================================================

CREATE TABLE EquipmentOperatingSchedule (
    schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    day_of_week TINYINT NOT NULL,

    open_time TIME NOT NULL,

    close_time TIME NOT NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_schedule_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT chk_schedule_day
        CHECK (
            day_of_week BETWEEN 1 AND 7
        ),

    CONSTRAINT chk_schedule_time
        CHECK (
            close_time > open_time
        ),

    CONSTRAINT uq_equipment_day
        UNIQUE (equipment_id, day_of_week)
);


-- ============================================================
-- 21. RECURRING BOOKING
-- ============================================================

CREATE TABLE RecurringBooking (
    recurring_booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    recurrence_pattern VARCHAR(100) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recurring_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_recurring_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_recurring_status
        CHECK (
            status IN (
                'ACTIVE',
                'PAUSED',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_recurring_time
        CHECK (
            end_time > start_time
        ),

    CONSTRAINT chk_recurring_dates
        CHECK (
            end_date >= start_date
        )
);


-- ============================================================
-- 22. BOOKING
-- ============================================================
--
-- Booking is the important relationship for issue reporting.
--
-- User books Equipment.
--
-- Later:
-- EquipmentIssueReport.booking_id
-- ensures the issue is associated with a booking.
-- ============================================================

CREATE TABLE Booking (
    booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    institution_id BIGINT NOT NULL,

    department_id BIGINT NULL,

    start_time DATETIME NOT NULL,

    end_time DATETIME NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_APPROVAL',

    purpose TEXT,

    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,

    recurring_booking_id BIGINT NULL,

    recurrence_pattern VARCHAR(100),

    approved_by BIGINT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_booking_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_booking_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_booking_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT fk_booking_approver
        FOREIGN KEY (approved_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_booking_recurring_template
        FOREIGN KEY (recurring_booking_id)
        REFERENCES RecurringBooking(recurring_booking_id),

    CONSTRAINT chk_booking_status
        CHECK (
            status IN (
                'PENDING_APPROVAL',
                'CONFIRMED',
                'IN_USE',
                'COMPLETED',
                'CANCELLED',
                'NO_SHOW'
            )
        ),

    CONSTRAINT chk_booking_time
        CHECK (
            end_time > start_time
        )
);

CREATE INDEX idx_booking_equipment_time
ON Booking(equipment_id, start_time, end_time);

CREATE INDEX idx_booking_user_status
ON Booking(user_id, status);


-- ============================================================
-- 23. WAITLIST
-- ============================================================

CREATE TABLE Waitlist (
    waitlist_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    user_id BIGINT NOT NULL,

    requested_start_time DATETIME NOT NULL,

    requested_end_time DATETIME NOT NULL,

    position INT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',

    notified_at DATETIME NULL,

    expires_at DATETIME NULL,

    booking_id BIGINT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_waitlist_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_waitlist_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_waitlist_booking
        FOREIGN KEY (booking_id)
        REFERENCES Booking(booking_id),

    CONSTRAINT chk_waitlist_status
        CHECK (
            status IN (
                'WAITING',
                'NOTIFIED',
                'BOOKED',
                'EXPIRED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_waitlist_position
        CHECK (
            position > 0
        ),

    CONSTRAINT chk_waitlist_time
        CHECK (
            requested_end_time > requested_start_time
        )
);


-- ============================================================
-- 24. INTER-INSTITUTION SHARING AGREEMENT
-- ============================================================
--
-- Owning institution controls:
--
-- whether equipment can be shared
-- start_date
-- end_date
--
-- Example:
--
-- Institution A owns Agilent HPLC.
--
-- Institution A allows Institution B:
--
-- 01-09-2026 to 30-09-2026
--
-- Institution B cannot book outside this period.
-- ============================================================

CREATE TABLE SharingAgreement (
    agreement_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    requesting_institution_id BIGINT NOT NULL,

    owning_institution_id BIGINT NOT NULL,

    equipment_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',

    cost_sharing_terms TEXT,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    approved_by BIGINT NULL,

    approved_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_agreement_requesting_institution
        FOREIGN KEY (requesting_institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_agreement_owning_institution
        FOREIGN KEY (owning_institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_agreement_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_agreement_approver
        FOREIGN KEY (approved_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_agreement_status
        CHECK (
            status IN (
                'REQUESTED',
                'APPROVED',
                'REJECTED',
                'ACTIVE',
                'EXPIRED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_agreement_institutions
        CHECK (
            requesting_institution_id <> owning_institution_id
        ),

    CONSTRAINT chk_agreement_dates
        CHECK (
            end_date >= start_date
        )
);

CREATE INDEX idx_sharing_agreement_equipment
ON SharingAgreement(equipment_id, status);

CREATE INDEX idx_sharing_agreement_institutions
ON SharingAgreement(
    requesting_institution_id,
    owning_institution_id
);


-- ============================================================
-- 25. RESOURCE SHARING REQUEST
-- ============================================================

CREATE TABLE ResourceSharingRequest (
    request_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    requesting_institution_id BIGINT NOT NULL,

    owning_institution_id BIGINT NOT NULL,

    equipment_id BIGINT NOT NULL,

    requested_by BIGINT NOT NULL,

    requested_start_date DATE NOT NULL,

    requested_end_date DATE NOT NULL,

    purpose TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    reviewed_by BIGINT NULL,

    reviewed_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sharing_request_requesting_institution
        FOREIGN KEY (requesting_institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_sharing_request_owning_institution
        FOREIGN KEY (owning_institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_sharing_request_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_sharing_request_user
        FOREIGN KEY (requested_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_sharing_request_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_sharing_request_status
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_sharing_request_institutions
        CHECK (
            requesting_institution_id <> owning_institution_id
        ),

    CONSTRAINT chk_sharing_request_dates
        CHECK (
            requested_end_date >= requested_start_date
        )
);

CREATE INDEX idx_resource_sharing_status
ON ResourceSharingRequest(status);


-- ============================================================
-- 26. SHARED BOOKING
-- ============================================================
--
-- Connects a normal Booking to a SharingAgreement.
-- ============================================================

CREATE TABLE SharedBooking (
    shared_booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    agreement_id BIGINT NOT NULL,

    booking_id BIGINT NOT NULL UNIQUE,

    external_institution_id BIGINT NOT NULL,

    usage_fee DECIMAL(12,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shared_booking_agreement
        FOREIGN KEY (agreement_id)
        REFERENCES SharingAgreement(agreement_id),

    CONSTRAINT fk_shared_booking_booking
        FOREIGN KEY (booking_id)
        REFERENCES Booking(booking_id),

    CONSTRAINT fk_shared_booking_institution
        FOREIGN KEY (external_institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT chk_shared_booking_fee
        CHECK (
            usage_fee >= 0
        )
);


-- ============================================================
-- 27. UTILIZATION LOG
-- ============================================================

CREATE TABLE UtilizationLog (
    utilization_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    booking_id BIGINT NULL,

    usage_start_time DATETIME NOT NULL,

    usage_end_time DATETIME NULL,

    duration_minutes INT,

    recorded_by BIGINT NULL,

    source VARCHAR(20) NOT NULL DEFAULT 'MANUAL',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_utilization_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_utilization_booking
        FOREIGN KEY (booking_id)
        REFERENCES Booking(booking_id),

    CONSTRAINT fk_utilization_recorder
        FOREIGN KEY (recorded_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_utilization_source
        CHECK (
            source IN (
                'IOT_SENSOR',
                'MANUAL'
            )
        ),

    CONSTRAINT chk_utilization_duration
        CHECK (
            duration_minutes IS NULL
            OR duration_minutes >= 0
        )
);

CREATE INDEX idx_utilization_equipment_time
ON UtilizationLog(
    equipment_id,
    usage_start_time
);


-- ============================================================
-- 28. UTILIZATION METRIC
-- ============================================================
--
-- Supports:
--
-- Daily
-- Weekly
-- Monthly
--
-- Utilization
-- Idle time
-- Downtime
-- Idle rate
-- ============================================================

CREATE TABLE UtilizationMetric (
    metric_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    department_id BIGINT NOT NULL,

    institution_id BIGINT NOT NULL,

    period_type VARCHAR(20) NOT NULL,

    period_date DATE NOT NULL,

    total_available_hours DECIMAL(8,2) NOT NULL DEFAULT 0,

    total_used_hours DECIMAL(8,2) NOT NULL DEFAULT 0,

    idle_time_hours DECIMAL(8,2) NOT NULL DEFAULT 0,

    downtime_hours DECIMAL(8,2) NOT NULL DEFAULT 0,

    utilization_rate DECIMAL(5,2) NOT NULL DEFAULT 0,

    idle_rate DECIMAL(5,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_metric_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_metric_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT fk_metric_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT chk_metric_period
        CHECK (
            period_type IN (
                'DAILY',
                'WEEKLY',
                'MONTHLY'
            )
        ),

    CONSTRAINT chk_metric_values
        CHECK (
            total_available_hours >= 0
            AND total_used_hours >= 0
            AND idle_time_hours >= 0
            AND downtime_hours >= 0
            AND utilization_rate BETWEEN 0 AND 100
            AND idle_rate BETWEEN 0 AND 100
        ),

    CONSTRAINT uq_equipment_metric_period
        UNIQUE (
            equipment_id,
            period_type,
            period_date
        )
);


-- ============================================================
-- 29. TECHNICIAN AVAILABILITY
-- ============================================================
--
-- Weekly working availability.
--
-- Example:
-- Technician works:
-- Monday 09:00 - 17:00
-- Tuesday 09:00 - 17:00
--
-- ============================================================

CREATE TABLE TechnicianAvailability (
    availability_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    technician_id BIGINT NOT NULL,

    day_of_week TINYINT NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_technician_availability_user
        FOREIGN KEY (technician_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_technician_day
        CHECK (
            day_of_week BETWEEN 1 AND 7
        ),

    CONSTRAINT chk_technician_time
        CHECK (
            end_time > start_time
        ),

    CONSTRAINT uq_technician_day
        UNIQUE (
            technician_id,
            day_of_week
        )
);


-- ============================================================
-- 30. TECHNICIAN UNAVAILABILITY
-- ============================================================
--
-- Handles:
--
-- Leave
-- Holiday
-- Sick leave
-- Personal leave
-- Training
-- Other
--
-- This is important because weekly availability alone is not
-- enough to determine whether a technician is actually free.
-- ============================================================

CREATE TABLE TechnicianUnavailability (
    unavailability_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    technician_id BIGINT NOT NULL,

    start_datetime DATETIME NOT NULL,

    end_datetime DATETIME NOT NULL,

    reason VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_technician_unavailability_user
        FOREIGN KEY (technician_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_technician_unavailability_time
        CHECK (
            end_datetime > start_datetime
        ),

    CONSTRAINT chk_technician_unavailability_status
        CHECK (
            status IN (
                'ACTIVE',
                'CANCELLED'
            )
        )
);


CREATE INDEX idx_technician_unavailability
ON TechnicianUnavailability(
    technician_id,
    start_datetime,
    end_datetime
);


-- ============================================================
-- 31. MAINTENANCE REQUEST
-- ============================================================

CREATE TABLE MaintenanceRequest (
    maintenance_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    maintenance_code VARCHAR(30) UNIQUE,

    equipment_id BIGINT NOT NULL,

    requested_by BIGINT NOT NULL,

    assigned_technician_id BIGINT NULL,

    issue_type VARCHAR(100),

    issue_description TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

    attachment_public_id VARCHAR(500),
    attachment_secure_url VARCHAR(1000),

    attachment_file_name VARCHAR(255),

    attachment_content_type VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',

    scheduled_date DATE NULL,

    completed_date DATE NULL,

    downtime_hours DECIMAL(8,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_maintenance_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_maintenance_requester
        FOREIGN KEY (requested_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_maintenance_technician
        FOREIGN KEY (assigned_technician_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_maintenance_priority
        CHECK (
            priority IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    CONSTRAINT chk_maintenance_status
        CHECK (
            status IN (
                'OPEN',
                'IN_PROGRESS',
                'WAITING_FOR_PARTS',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_maintenance_downtime
        CHECK (
            downtime_hours IS NULL
            OR downtime_hours >= 0
        )
);

CREATE INDEX idx_maintenance_equipment_status
ON MaintenanceRequest(
    equipment_id,
    status
);


-- ============================================================
-- 32. MAINTENANCE ASSIGNMENT
-- ============================================================
--
-- Keeps assignment history.
--
-- This is better than only storing assigned_technician_id
-- because a maintenance request can be reassigned.
-- ============================================================

CREATE TABLE MaintenanceAssignment (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    maintenance_id BIGINT NOT NULL,

    technician_id BIGINT NOT NULL,

    assigned_by BIGINT NOT NULL,

    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    started_at DATETIME NULL,

    completed_at DATETIME NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',

    notes TEXT,

    CONSTRAINT fk_assignment_maintenance
        FOREIGN KEY (maintenance_id)
        REFERENCES MaintenanceRequest(maintenance_id),

    CONSTRAINT fk_assignment_technician
        FOREIGN KEY (technician_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_assignment_assigner
        FOREIGN KEY (assigned_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_assignment_status
        CHECK (
            status IN (
                'ASSIGNED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_assignment_technician_status
ON MaintenanceAssignment(
    technician_id,
    status
);


-- ============================================================
-- 33. MAINTENANCE LOG
-- ============================================================

CREATE TABLE MaintenanceLog (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    maintenance_id BIGINT NOT NULL,

    technician_id BIGINT NOT NULL,

    action_taken TEXT NOT NULL,

    parts_used TEXT,

    cost DECIMAL(12,2) NOT NULL DEFAULT 0,

    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_maintenance_log_request
        FOREIGN KEY (maintenance_id)
        REFERENCES MaintenanceRequest(maintenance_id),

    CONSTRAINT fk_maintenance_log_technician
        FOREIGN KEY (technician_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_maintenance_log_cost
        CHECK (
            cost >= 0
        )
);


-- ============================================================
-- 34. EQUIPMENT ISSUE REPORT
-- ============================================================
--
-- STUDENT / RESEARCHER can report an issue only for equipment
-- associated with their booking.
--
-- Backend MUST additionally verify:
--
-- Booking.user_id = logged-in user
-- Booking.equipment_id = selected equipment
--
-- before inserting this record.
-- ============================================================

CREATE TABLE EquipmentIssueReport (
    issue_report_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    booking_id BIGINT NOT NULL,

    reported_by BIGINT NOT NULL,

    issue_type VARCHAR(100),

    issue_description TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',

    attachment_public_id VARCHAR(500),
    attachment_secure_url VARCHAR(1000),

    attachment_file_name VARCHAR(255),

    attachment_content_type VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',

    assigned_technician_id BIGINT NULL,

    resolved_by BIGINT NULL,

    resolved_at DATETIME NULL,

    resolution_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_issue_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_issue_booking
        FOREIGN KEY (booking_id)
        REFERENCES Booking(booking_id),

    CONSTRAINT fk_issue_reporter
        FOREIGN KEY (reported_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_issue_assigned_technician
        FOREIGN KEY (assigned_technician_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_issue_resolved_by
        FOREIGN KEY (resolved_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_issue_priority
        CHECK (
            priority IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    CONSTRAINT chk_issue_status
        CHECK (
            status IN (
                'OPEN',
                'ASSIGNED',
                'IN_PROGRESS',
                'RESOLVED',
                'CLOSED',
                'CANCELLED'
            )
        )
);

CREATE INDEX idx_issue_equipment_status
ON EquipmentIssueReport(
    equipment_id,
    status
);

CREATE INDEX idx_issue_reporter
ON EquipmentIssueReport(reported_by);


-- ============================================================
-- 35. NOTIFICATION
-- ============================================================

CREATE TABLE Notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    type VARCHAR(50) NOT NULL,

    channel VARCHAR(20) NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    sent_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT chk_notification_channel
        CHECK (
            channel IN (
                'EMAIL',
                'SMS',
                'PUSH'
            )
        )
);


-- ============================================================
-- 36. NOTIFICATION PREFERENCE
-- ============================================================

CREATE TABLE NotificationPreference (
    preference_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    notification_type VARCHAR(50) NOT NULL,

    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_pref_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id),

    CONSTRAINT uq_notification_pref_user_type
        UNIQUE (
            user_id,
            notification_type
        )
);


-- ============================================================
-- 37. COST RECORD
-- ============================================================

CREATE TABLE CostRecord (
    cost_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    equipment_id BIGINT NOT NULL,

    department_id BIGINT NOT NULL,

    institution_id BIGINT NOT NULL,

    booking_id BIGINT NULL,

    cost_type VARCHAR(30) NOT NULL,

    amount DECIMAL(14,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'INR',

    billing_period VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cost_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES Equipment(equipment_id),

    CONSTRAINT fk_cost_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT fk_cost_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_cost_booking
        FOREIGN KEY (booking_id)
        REFERENCES Booking(booking_id),

    CONSTRAINT chk_cost_type
        CHECK (
            cost_type IN (
                'USAGE',
                'MAINTENANCE',
                'SHARING_FEE'
            )
        ),

    CONSTRAINT chk_cost_amount
        CHECK (
            amount >= 0
        )
);


-- ============================================================
-- 38. INVOICE
-- ============================================================

CREATE TABLE Invoice (
    invoice_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    institution_id BIGINT NOT NULL,

    department_id BIGINT NULL,

    total_amount DECIMAL(14,2) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',

    issue_date DATE NOT NULL,

    due_date DATE,

    paid_date DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_invoice_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT chk_invoice_status
        CHECK (
            status IN (
                'DRAFT',
                'SENT',
                'PAID',
                'OVERDUE'
            )
        ),

    CONSTRAINT chk_invoice_amount
        CHECK (
            total_amount >= 0
        ),

    CONSTRAINT chk_invoice_dates
        CHECK (
            due_date IS NULL
            OR due_date >= issue_date
        )
);


-- ============================================================
-- 39. BUDGET
-- ============================================================

CREATE TABLE Budget (
    budget_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    institution_id BIGINT NOT NULL,

    department_id BIGINT NULL,

    fiscal_year VARCHAR(20) NOT NULL,

    allocated_amount DECIMAL(14,2) NOT NULL DEFAULT 0,

    used_amount DECIMAL(14,2) NOT NULL DEFAULT 0,

    remaining_amount DECIMAL(14,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_budget_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_budget_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT chk_budget_amounts
        CHECK (
            allocated_amount >= 0
            AND used_amount >= 0
            AND remaining_amount >= 0
        ),

    CONSTRAINT uq_budget_scope_year
        UNIQUE (
            institution_id,
            department_id,
            fiscal_year
        )
);


-- ============================================================
-- 40. REPORT
-- ============================================================
--
-- Generated PDF / Excel is stored in Cloudinary.
--
-- Example:
--
-- Cloudinary public ID example: institutions/5/reports/utilization/abc
--
-- Database stores:
--
-- cloudinary_public_id
-- cloudinary_secure_url
-- file_name
-- content_type
-- ============================================================

CREATE TABLE Report (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    generated_by BIGINT NOT NULL,

    report_type VARCHAR(30) NOT NULL,

    institution_id BIGINT NOT NULL,

    department_id BIGINT NULL,

    cloudinary_public_id VARCHAR(500),
    cloudinary_secure_url VARCHAR(1000),

    file_name VARCHAR(255),

    content_type VARCHAR(100),

    format VARCHAR(10) NOT NULL,

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_generator
        FOREIGN KEY (generated_by)
        REFERENCES AppUser(user_id),

    CONSTRAINT fk_report_institution
        FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id),

    CONSTRAINT fk_report_department
        FOREIGN KEY (department_id)
        REFERENCES Department(department_id),

    CONSTRAINT chk_report_type
        CHECK (
            report_type IN (
                'UTILIZATION',
                'MAINTENANCE',
                'SHARING',
                'PROCUREMENT',
                'BUDGET'
            )
        ),

    CONSTRAINT chk_report_format
        CHECK (
            format IN (
                'PDF',
                'EXCEL'
            )
        )
);


-- ============================================================
-- 41. AUDIT LOG
-- ============================================================

CREATE TABLE AuditLog (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    action VARCHAR(50) NOT NULL,

    entity_type VARCHAR(50) NOT NULL,

    entity_id BIGINT NOT NULL,

    old_value JSON,

    new_value JSON,

    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES AppUser(user_id)
);

CREATE INDEX idx_audit_user_timestamp
ON AuditLog(
    user_id,
    timestamp
);
