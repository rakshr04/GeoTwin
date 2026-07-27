// Authentication helper service for Hackathon Demo
// Modular structure designed to be easily replaced with Firebase or a real backend.

export interface UserSession {
  email: string;
  role: 'officer' | 'supervisor';
}

const STORAGE_KEY = 'gt_auth_user';

export const loginUser = (emailInput: string, passInput: string): Promise<UserSession> => {
  return new Promise((resolve, reject) => {
    // Simulated network latency
    setTimeout(() => {
      const email = emailInput.trim().toLowerCase();
      const password = passInput;

      if (email === 'officer@geotwin.in' && password === 'officer123') {
        const session: UserSession = { email, role: 'officer' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        resolve(session);
      } else if (email === 'supervisor@geotwin.in' && password === 'supervisor123') {
        const session: UserSession = { email, role: 'supervisor' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        resolve(session);
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 850);
  });
};

export const logoutUser = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getCurrentUser = (): UserSession | null => {
  const sessionData = localStorage.getItem(STORAGE_KEY);
  if (!sessionData) return null;
  try {
    return JSON.parse(sessionData) as UserSession;
  } catch (e) {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};
