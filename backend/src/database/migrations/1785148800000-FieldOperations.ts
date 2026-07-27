import { MigrationInterface, QueryRunner } from 'typeorm';

export class FieldOperations1785148800000 implements MigrationInterface {
  name = 'FieldOperations1785148800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE officer_profiles
        ALTER COLUMN user_id DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS auth_user_id uuid,
        ADD COLUMN IF NOT EXISTS email varchar,
        ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

      CREATE UNIQUE INDEX IF NOT EXISTS uq_officer_profiles_auth_user
        ON officer_profiles(auth_user_id) WHERE auth_user_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_officer_profiles_email
        ON officer_profiles(email);

      CREATE TABLE IF NOT EXISTS restoration_projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        description text,
        district_id uuid REFERENCES regions(id),
        status varchar NOT NULL,
        created_by_profile_id uuid NOT NULL REFERENCES officer_profiles(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS land_sectors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES restoration_projects(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        village_name varchar,
        mandal_name varchar,
        district_name varchar,
        area_hectares decimal(14,4) NOT NULL,
        geometry jsonb NOT NULL,
        centroid jsonb,
        status varchar NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_land_sector_geometry_type
          CHECK (geometry->>'type' IN ('Polygon', 'MultiPolygon'))
      );

      CREATE TABLE IF NOT EXISTS officer_assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES restoration_projects(id),
        sector_id uuid REFERENCES land_sectors(id),
        assigned_to_profile_id uuid NOT NULL REFERENCES officer_profiles(id),
        assigned_by_profile_id uuid NOT NULL REFERENCES officer_profiles(id),
        assignment_type varchar NOT NULL,
        status varchar NOT NULL,
        start_date date,
        due_date date,
        instructions text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS field_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        assignment_id uuid NOT NULL REFERENCES officer_assignments(id) ON DELETE CASCADE,
        title varchar NOT NULL,
        description text,
        task_type varchar NOT NULL,
        priority varchar NOT NULL,
        status varchar NOT NULL,
        due_at timestamptz,
        requires_evidence boolean NOT NULL DEFAULT false,
        created_by_profile_id uuid NOT NULL REFERENCES officer_profiles(id),
        assigned_to_profile_id uuid NOT NULL REFERENCES officer_profiles(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS field_reports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL REFERENCES field_tasks(id),
        assignment_id uuid NOT NULL REFERENCES officer_assignments(id),
        submitted_by_profile_id uuid NOT NULL REFERENCES officer_profiles(id),
        report_type varchar NOT NULL,
        notes text NOT NULL,
        change_category varchar,
        latitude decimal(10,7),
        longitude decimal(10,7),
        payload jsonb NOT NULL DEFAULT '{}',
        submitted_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE evidence_items
        ALTER COLUMN case_id DROP NOT NULL,
        ALTER COLUMN mission_id DROP NOT NULL,
        ALTER COLUMN source DROP NOT NULL,
        ALTER COLUMN source_date DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES field_tasks(id),
        ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES officer_assignments(id),
        ADD COLUMN IF NOT EXISTS description text,
        ADD COLUMN IF NOT EXISTS storage_path varchar,
        ADD COLUMN IF NOT EXISTS latitude decimal(10,7),
        ADD COLUMN IF NOT EXISTS longitude decimal(10,7),
        ADD COLUMN IF NOT EXISTS captured_at timestamptz,
        ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

      ALTER TABLE audit_events
        ADD COLUMN IF NOT EXISTS assignment_id uuid REFERENCES officer_assignments(id);

      CREATE INDEX IF NOT EXISTS idx_projects_status_district
        ON restoration_projects(status, district_id);
      CREATE INDEX IF NOT EXISTS idx_sectors_project_status
        ON land_sectors(project_id, status);
      CREATE INDEX IF NOT EXISTS idx_assignments_officer_status
        ON officer_assignments(assigned_to_profile_id, status);
      CREATE INDEX IF NOT EXISTS idx_assignments_due
        ON officer_assignments(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_officer_status_due
        ON field_tasks(assigned_to_profile_id, status, due_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_assignment
        ON field_tasks(assignment_id);
      CREATE INDEX IF NOT EXISTS idx_reports_assignment
        ON field_reports(assignment_id, submitted_at);
      CREATE INDEX IF NOT EXISTS idx_evidence_task
        ON evidence_items(task_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
        ON notifications(recipient_profile_id, read_at);
      CREATE INDEX IF NOT EXISTS idx_audit_assignment
        ON audit_events(assignment_id, created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_assignment;
      DROP INDEX IF EXISTS idx_notifications_recipient_unread;
      DROP INDEX IF EXISTS idx_evidence_task;
      DROP INDEX IF EXISTS idx_reports_assignment;
      DROP INDEX IF EXISTS idx_tasks_assignment;
      DROP INDEX IF EXISTS idx_tasks_officer_status_due;
      DROP INDEX IF EXISTS idx_assignments_due;
      DROP INDEX IF EXISTS idx_assignments_officer_status;
      DROP INDEX IF EXISTS idx_sectors_project_status;
      DROP INDEX IF EXISTS idx_projects_status_district;
      ALTER TABLE audit_events DROP COLUMN IF EXISTS assignment_id;
      ALTER TABLE evidence_items
        DROP COLUMN IF EXISTS metadata,
        DROP COLUMN IF EXISTS captured_at,
        DROP COLUMN IF EXISTS longitude,
        DROP COLUMN IF EXISTS latitude,
        DROP COLUMN IF EXISTS storage_path,
        DROP COLUMN IF EXISTS description,
        DROP COLUMN IF EXISTS assignment_id,
        DROP COLUMN IF EXISTS task_id;
      DROP TABLE IF EXISTS field_reports;
      DROP TABLE IF EXISTS field_tasks;
      DROP TABLE IF EXISTS officer_assignments;
      DROP TABLE IF EXISTS land_sectors;
      DROP TABLE IF EXISTS restoration_projects;
      DROP INDEX IF EXISTS idx_officer_profiles_email;
      DROP INDEX IF EXISTS uq_officer_profiles_auth_user;
      ALTER TABLE officer_profiles
        DROP COLUMN IF EXISTS active,
        DROP COLUMN IF EXISTS email,
        DROP COLUMN IF EXISTS auth_user_id;
    `);
  }
}
