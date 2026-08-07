import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
// @ts-ignore
import { Client } from 'pg';

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const dbHost = process.env.DATABASE_HOST || '127.0.0.1';
  const dbPort = Number(process.env.DATABASE_PORT || 5432);
  const dbName = process.env.DATABASE_NAME || 'geotwin';
  const dbUser = process.env.DATABASE_USER || 'postgres';
  const dbPassword = process.env.DATABASE_PASSWORD || 'vikram2320';

  const pg = new Client({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
  });

  await pg.connect();

  const stateRes = await pg.query("SELECT id FROM regions WHERE type='STATE' LIMIT 1");
  const distRes = await pg.query("SELECT id FROM regions WHERE type='DISTRICT' LIMIT 1");
  const stateId = stateRes.rows[0]?.id;
  const districtId = distRes.rows[0]?.id;

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing Supabase users:', error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users in Supabase Auth. Syncing profiles...`);

  for (const u of users) {
    const email = u.email;
    if (!email) continue;
    const authUserId = u.id;
    const fullName = u.user_metadata?.full_name || email.split('@')[0];
    const role = u.app_metadata?.geotwin_role || 'FIELD_OFFICER';
    const officerId =
      u.user_metadata?.officer_id ||
      (role === 'SUPERVISOR'
        ? 'SUP-' + authUserId.slice(0, 6).toUpperCase()
        : 'FDO-' + authUserId.slice(0, 6).toUpperCase());

    const check = await pg.query(
      'SELECT id FROM officer_profiles WHERE auth_user_id = $1 OR email = $2',
      [authUserId, email],
    );

    let profileId: string;
    if (check.rows.length === 0) {
      const ins = await pg.query(
        `INSERT INTO officer_profiles (auth_user_id, email, full_name, role, officer_id, active, onboarding_status, state_id, district_id)
         VALUES ($1, $2, $3, $4, $5, true, 'COMPLETE', $6, $7) RETURNING id`,
        [authUserId, email, fullName, role, officerId, stateId, districtId],
      );
      profileId = ins.rows[0].id;
      console.log(`✅ Created profile: ${email} | Role: ${role} | Officer ID: ${officerId}`);
    } else {
      profileId = check.rows[0].id;
      await pg.query(
        `UPDATE officer_profiles SET auth_user_id = $1, role = $2, officer_id = $3, active = true WHERE id = $4`,
        [authUserId, role, officerId, profileId],
      );
      console.log(`🔄 Updated profile: ${email} | Role: ${role} | Officer ID: ${officerId}`);
    }

    if (role === 'SUPERVISOR') {
      await pg.query(
        `INSERT INTO supervisor_scope_assignments (supervisor_profile_id, district_id, effective_from, active, coverage_color, assigned_by_admin_profile_id)
         VALUES ($1, $2, CURRENT_DATE, true, '#3B82F6', $1)
         ON CONFLICT DO NOTHING`,
        [profileId, districtId],
      );
    }
  }

  await pg.end();
  console.log('\n🎉 ALL SUPABASE USERS SYNCED SUCCESSFULLY!');
}

main().catch(console.error);
