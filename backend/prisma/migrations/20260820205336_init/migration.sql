BEGIN TRY

BEGIN TRAN;

-- CreateTable: specialties
CREATE TABLE [dbo].[specialties] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(MAX),
    [is_active] BIT NOT NULL CONSTRAINT [specialties_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [specialties_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [specialties_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [specialties_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable: users
CREATE TABLE [dbo].[users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [first_name] NVARCHAR(100) NOT NULL,
    [last_name] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [password_hash] NVARCHAR(255) NOT NULL,
    [phone] NVARCHAR(30),
    [role] NVARCHAR(50) NOT NULL,
    [date_of_birth] DATE,
    [gender] NVARCHAR(30),
    [address] NVARCHAR(MAX),
    [license_number] NVARCHAR(100),
    [specialty_id] INT,
    [bio] NVARCHAR(MAX),
    [profile_image] NVARCHAR(255),
    [forgot_password_token] NVARCHAR(255),
    [forgot_password_expires] DATETIME2,
    [is_active] BIT NOT NULL CONSTRAINT [users_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [users_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable: establishments
CREATE TABLE [dbo].[establishments] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(200) NOT NULL,
    [type] NVARCHAR(100),
    [address] NVARCHAR(MAX) NOT NULL,
    [city] NVARCHAR(100),
    [phone] NVARCHAR(30),
    [email] NVARCHAR(255),
    [is_active] BIT NOT NULL CONSTRAINT [establishments_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [establishments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [establishments_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [establishments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable: establishment_users
CREATE TABLE [dbo].[establishment_users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [establishment_id] INT NOT NULL,
    [user_id] INT NOT NULL,
    [role] NVARCHAR(50) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [establishment_users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [establishment_users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [establishment_users_establishment_id_user_id_key] UNIQUE NONCLUSTERED ([establishment_id],[user_id])
);

-- CreateTable: appointment_types
CREATE TABLE [dbo].[appointment_types] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(150) NOT NULL,
    [description] NVARCHAR(MAX),
    [duration_minutes] INT NOT NULL,
    [price] DECIMAL(10,2),
    [is_active] BIT NOT NULL CONSTRAINT [appointment_types_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [appointment_types_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [appointment_types_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable: appointments
CREATE TABLE [dbo].[appointments] (
    [id] INT NOT NULL IDENTITY(1,1),
    [patient_id] INT NOT NULL,
    [doctor_id] INT NOT NULL,
    [establishment_id] INT NOT NULL,
    [appointment_type_id] INT NOT NULL,
    [appointment_date] DATE NOT NULL,
    [start_time] DATETIME2 NOT NULL,
    [end_time] DATETIME2 NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [appointments_status_df] DEFAULT 'PENDING',
    [reason] NVARCHAR(MAX),
    [notes] NVARCHAR(MAX),
    [created_by] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [appointments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [appointments_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [appointments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable: doctor_schedules
CREATE TABLE [dbo].[doctor_schedules] (
    [id] INT NOT NULL IDENTITY(1,1),
    [doctor_id] INT NOT NULL,
    [establishment_id] INT NOT NULL,
    [day_of_week] INT NOT NULL,
    [start_time] DATETIME2 NOT NULL,
    [end_time] DATETIME2 NOT NULL,
    [is_active] BIT NOT NULL CONSTRAINT [doctor_schedules_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [doctor_schedules_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [doctor_schedules_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable: doctor_schedule_exceptions
CREATE TABLE [dbo].[doctor_schedule_exceptions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [doctor_id] INT NOT NULL,
    [establishment_id] INT NOT NULL,
    [exception_date] DATE NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [reason] NVARCHAR(MAX),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [doctor_schedule_exceptions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [doctor_schedule_exceptions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable: transfers
CREATE TABLE [dbo].[transfers] (
    [id] INT NOT NULL IDENTITY(1,1),
    [appointment_id] INT NOT NULL,
    [patient_id] INT NOT NULL,
    [from_establishment_id] INT NOT NULL,
    [to_establishment_id] INT NOT NULL,
    [from_doctor_id] INT NOT NULL,
    [to_doctor_id] INT NOT NULL,
    [reason] NVARCHAR(MAX) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [transfers_status_df] DEFAULT 'REQUESTED',
    [requested_by] INT NOT NULL,
    [approved_by] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [transfers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [transfers_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [transfers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable: notifications
CREATE TABLE [dbo].[notifications] (
    [id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [message] NVARCHAR(MAX) NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [is_read] BIT NOT NULL CONSTRAINT [notifications_is_read_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [notifications_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [notifications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable: audit_logs
CREATE TABLE [dbo].[audit_logs] (
    [id] INT NOT NULL IDENTITY(1,1),
    [user_id] INT NOT NULL,
    [action] NVARCHAR(100) NOT NULL,
    [entity] NVARCHAR(100) NOT NULL,
    [entity_id] INT NOT NULL,
    [old_value] NVARCHAR(MAX),
    [new_value] NVARCHAR(MAX),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [audit_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [appointments_doctor_id_appointment_date_start_time_idx] ON [dbo].[appointments]([doctor_id], [appointment_date], [start_time]);
CREATE NONCLUSTERED INDEX [appointments_patient_id_appointment_date_idx] ON [dbo].[appointments]([patient_id], [appointment_date]);
CREATE NONCLUSTERED INDEX [appointments_establishment_id_appointment_date_idx] ON [dbo].[appointments]([establishment_id], [appointment_date]);
CREATE NONCLUSTERED INDEX [doctor_schedules_doctor_id_establishment_id_day_of_week_idx] ON [dbo].[doctor_schedules]([doctor_id], [establishment_id], [day_of_week]);
CREATE NONCLUSTERED INDEX [doctor_schedule_exceptions_doctor_id_establishment_id_exception_date_idx] ON [dbo].[doctor_schedule_exceptions]([doctor_id], [establishment_id], [exception_date]);
CREATE NONCLUSTERED INDEX [notifications_user_id_is_read_idx] ON [dbo].[notifications]([user_id], [is_read]);
CREATE NONCLUSTERED INDEX [audit_logs_entity_entity_id_idx] ON [dbo].[audit_logs]([entity], [entity_id]);
CREATE NONCLUSTERED INDEX [audit_logs_user_id_created_at_idx] ON [dbo].[audit_logs]([user_id], [created_at]);

-- AddForeignKey: users.specialty_id -> specialties
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_specialty_id_fkey] FOREIGN KEY ([specialty_id]) REFERENCES [dbo].[specialties]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey: establishment_users
ALTER TABLE [dbo].[establishment_users] ADD CONSTRAINT [establishment_users_establishment_id_fkey] FOREIGN KEY ([establishment_id]) REFERENCES [dbo].[establishments]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[establishment_users] ADD CONSTRAINT [establishment_users_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: appointments
ALTER TABLE [dbo].[appointments] ADD CONSTRAINT [appointments_patient_id_fkey] FOREIGN KEY ([patient_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[appointments] ADD CONSTRAINT [appointments_doctor_id_fkey] FOREIGN KEY ([doctor_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[appointments] ADD CONSTRAINT [appointments_establishment_id_fkey] FOREIGN KEY ([establishment_id]) REFERENCES [dbo].[establishments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[appointments] ADD CONSTRAINT [appointments_appointment_type_id_fkey] FOREIGN KEY ([appointment_type_id]) REFERENCES [dbo].[appointment_types]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[appointments] ADD CONSTRAINT [appointments_created_by_fkey] FOREIGN KEY ([created_by]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: doctor_schedules
ALTER TABLE [dbo].[doctor_schedules] ADD CONSTRAINT [doctor_schedules_doctor_id_fkey] FOREIGN KEY ([doctor_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[doctor_schedules] ADD CONSTRAINT [doctor_schedules_establishment_id_fkey] FOREIGN KEY ([establishment_id]) REFERENCES [dbo].[establishments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: doctor_schedule_exceptions
ALTER TABLE [dbo].[doctor_schedule_exceptions] ADD CONSTRAINT [doctor_schedule_exceptions_doctor_id_fkey] FOREIGN KEY ([doctor_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[doctor_schedule_exceptions] ADD CONSTRAINT [doctor_schedule_exceptions_establishment_id_fkey] FOREIGN KEY ([establishment_id]) REFERENCES [dbo].[establishments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: transfers
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_appointment_id_fkey] FOREIGN KEY ([appointment_id]) REFERENCES [dbo].[appointments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_patient_id_fkey] FOREIGN KEY ([patient_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_from_establishment_id_fkey] FOREIGN KEY ([from_establishment_id]) REFERENCES [dbo].[establishments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_to_establishment_id_fkey] FOREIGN KEY ([to_establishment_id]) REFERENCES [dbo].[establishments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_from_doctor_id_fkey] FOREIGN KEY ([from_doctor_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_to_doctor_id_fkey] FOREIGN KEY ([to_doctor_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_requested_by_fkey] FOREIGN KEY ([requested_by]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[transfers] ADD CONSTRAINT [transfers_approved_by_fkey] FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey: notifications
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: audit_logs
ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
