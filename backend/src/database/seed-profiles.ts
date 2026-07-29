import 'dotenv/config';

import { AppDataSource } from '../database';
import { OfficerRole } from '../common';
import { OfficerProfile, Region } from '../entities';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is required. Copy the Supabase Auth user UUID into backend/.env before running this command.`,
    );
  }
  return value;
}

async function upsertProfile(input: {
  authUserId: string;
  email: string;
  fullName: string;
  role: OfficerRole;
  stateId: string;
  districtId: string;
}) {
  const repository =
    AppDataSource.getRepository(OfficerProfile);
  const existing =
    (await repository.findOneBy({
      authUserId: input.authUserId,
    })) ??
    (await repository.findOneBy({
      email: input.email.toLowerCase(),
    }));
  return repository.save(
    repository.create({
      ...existing,
      ...input,
      email: input.email.toLowerCase(),
      active: true,
    }),
  );
}

async function seedProfiles() {
  await AppDataSource.initialize();
  const regions = AppDataSource.getRepository(Region);
  let state = await regions.findOneBy({
    type: 'STATE',
    code: 'TG',
  });
  state ??= await regions.save(
    regions.create({
      name: 'Telangana',
      type: 'STATE',
      code: 'TG',
    }),
  );
  let district = await regions.findOneBy({
    type: 'DISTRICT',
    code: 'VKB',
  });
  district ??= await regions.save(
    regions.create({
      name: 'Vikarabad',
      type: 'DISTRICT',
      code: 'VKB',
      parentId: state.id,
    }),
  );

  const supervisor = await upsertProfile({
    authUserId: required(
      'DEMO_SUPERVISOR_AUTH_USER_ID',
    ),
    email: required('DEMO_SUPERVISOR_EMAIL'),
    fullName:
      process.env.DEMO_SUPERVISOR_NAME?.trim() ??
      'Demo District Supervisor',
    role: OfficerRole.DISTRICT_RESTORATION_OFFICER,
    stateId: state.id,
    districtId: district.id,
  });
  const fieldOfficer = await upsertProfile({
    authUserId: required('DEMO_FIELD_AUTH_USER_ID'),
    email: required('DEMO_FIELD_EMAIL'),
    fullName:
      process.env.DEMO_FIELD_NAME?.trim() ??
      'Demo Field Officer',
    role: OfficerRole.FIELD_VERIFICATION_OFFICER,
    stateId: state.id,
    districtId: district.id,
  });

  console.log(
    `Profiles ready: supervisor=${supervisor.id}, fieldOfficer=${fieldOfficer.id}. No assignments were created.`,
  );
}

seedProfiles()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
