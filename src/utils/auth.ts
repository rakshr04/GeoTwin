import type {
  Session,
  User,
} from '@supabase/supabase-js';

import { apiBaseUrl } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
import type { ApplicationRole } from '../types/fieldOperations';

export type GeoTwinRole = 'officer' | 'supervisor';

export interface UserSession {
  id: string;
  email: string;
  role: GeoTwinRole;
  applicationRole: ApplicationRole;
  name: string;
  profileId: string;
  districtName?: string;
  avatarUrl?: string;
}

interface ProfileResponse {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
  role: ApplicationRole;
  active: boolean;
  districtName: string | null;
}

function frontendRole(
  role: ApplicationRole,
): GeoTwinRole {
  return [
    'FIELD_OFFICER',
    'FIELD_VERIFICATION_OFFICER',
  ].includes(role)
    ? 'officer'
    : 'supervisor';
}

async function fetchApplicationProfile(
  accessToken: string,
): Promise<ProfileResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = (await response
    .json()
    .catch(() => ({}))) as {
    data?: ProfileResponse;
    error?: { message?: string };
  };
  if (!response.ok || !payload.data) {
    throw new Error(
      payload.error?.message ??
        'No active GeoTwin officer profile is linked to this account.',
    );
  }
  return payload.data;
}

async function mapSession(
  session: Session,
): Promise<UserSession> {
  const profile = await fetchApplicationProfile(
    session.access_token,
  );
  const user: User = session.user;
  return {
    id: user.id,
    profileId: profile.id,
    email: profile.email || user.email || '',
    role: frontendRole(profile.role),
    applicationRole: profile.role,
    name: profile.displayName,
    districtName: profile.districtName ?? undefined,
    avatarUrl:
      user.user_metadata?.avatar_url ??
      user.user_metadata?.picture,
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<UserSession> {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
  if (error) {
    throw new Error(error.message);
  }
  if (!data.session) {
    throw new Error('No session was returned after sign-in.');
  }
  try {
    return await mapSession(data.session);
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<void> {
  const { error } =
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePassword(
  newPassword: string,
): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function logoutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    return null;
  }
  try {
    return await mapSession(session);
  } catch {
    await supabase.auth.signOut();
    return null;
  }
}

export function subscribeToAuthChanges(
  callback: (user: UserSession | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      callback(null);
      return;
    }
    window.setTimeout(() => {
      void mapSession(session)
        .then(callback)
        .catch(async () => {
          await supabase.auth.signOut();
          callback(null);
        });
    }, 0);
  });
  return () => subscription.unsubscribe();
}
