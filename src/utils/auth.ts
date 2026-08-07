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

const STORAGE_KEY = 'gt_auth_user';

const listeners = new Set<(user: UserSession | null) => void>();

function notifyListeners(user: UserSession | null) {
  for (const listener of listeners) {
    listener(user);
  }
}

export async function loginUser(
  emailInput: string,
  passwordInput: string,
): Promise<UserSession> {
  const email = emailInput.trim().toLowerCase();
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const isSupervisor =
        email === 'supervisor@geotwin.in' ||
        email === 'rakshitharao163@gmail.com';

      if (isSupervisor) {
        const session: UserSession = {
          id: 'supervisor-rakshitha-id',
          profileId: 'supervisor-rakshitha-profile-id',
          email: emailInput.trim(),
          role: 'supervisor',
          applicationRole: 'SUPERVISOR',
          name: 'Rakshitha (Supervisor)',
          districtName: 'State Headquarters',
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        notifyListeners(session);
        resolve(session);
      } else if (email.length > 0 && passwordInput.length > 0) {
        const session: UserSession = {
          id: 'user-' + Date.now(),
          profileId: 'profile-' + Date.now(),
          email: emailInput.trim(),
          role: 'officer',
          applicationRole: 'FIELD_OFFICER',
          name: emailInput.split('@')[0] || 'Field Officer',
          districtName: 'Demo District',
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        notifyListeners(session);
        resolve(session);
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 500);
  });
}

export async function requestPasswordReset(
  _email: string,
): Promise<void> {
  return Promise.resolve();
}

export async function updatePassword(
  _newPassword: string,
): Promise<void> {
  return Promise.resolve();
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners(null);
  return Promise.resolve();
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const sessionData = localStorage.getItem(STORAGE_KEY);
  if (!sessionData) return null;
  try {
    return JSON.parse(sessionData) as UserSession;
  } catch (e) {
    return null;
  }
}

export function subscribeToAuthChanges(
  callback: (user: UserSession | null) => void,
): () => void {
  listeners.add(callback);
  getCurrentUser().then(callback);
  return () => {
    listeners.delete(callback);
  };
}

