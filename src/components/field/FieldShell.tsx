import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Bot,
  Briefcase,
  Camera,
  CheckSquare,
  FileCheck,
  LayoutDashboard,
  LogOut,
  MapPin,
} from 'lucide-react';

import { GeotwinLogo } from '../shared/GeotwinLogo';
import { logoutUser } from '../../utils/auth';
import { fieldDashboardService } from '../../services/fieldDashboard.service';

interface FieldShellProps {
  title: string;
  subtitle?: string;
  officerName?: string;
  notificationCount?: number;
  children: ReactNode;
}

const links = [
  {
    to: '/field/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/field/assignments',
    label: 'Assigned Projects',
    icon: Briefcase,
  },
  {
    to: '/field/map',
    label: 'Assigned Land Map',
    icon: MapPin,
  },
  {
    to: '/field/evidence',
    label: 'Evidence Collection',
    icon: Camera,
  },
  {
    to: '/field/tasks',
    label: 'Implementation Tasks',
    icon: CheckSquare,
  },
  {
    to: '/field/verification',
    label: 'Verification',
    icon: FileCheck,
  },
  {
    to: '/field/notifications',
    label: 'Notifications',
    icon: Bell,
  },
];

export function FieldShell({
  title,
  subtitle,
  officerName = 'Field Officer',
  notificationCount,
  children,
}: FieldShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [actualCount, setActualCount] = useState<number>(notificationCount ?? 0);

  useEffect(() => {
    if (typeof notificationCount === 'number') {
      setActualCount(notificationCount);
    }
  }, [notificationCount]);

  useEffect(() => {
    let isMounted = true;
    fieldDashboardService
      .getNotifications()
      .then((notifs) => {
        if (isMounted && Array.isArray(notifs)) {
          const unread = notifs.filter((n) => !n.readAt).length;
          setActualCount(unread);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  async function signOut() {
    try {
      await logoutUser();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1411] text-[#F8FAF8] flex flex-col md:flex-row font-sans antialiased">
      <aside className="w-64 bg-[#0D2A26] border-0 p-6 hidden md:flex flex-col justify-between shrink-0 shadow-2xl z-40">
        <div className="space-y-8">
          <NavLink
            to="/field/dashboard"
            className="flex items-center space-x-2.5 pl-1"
          >
            <GeotwinLogo size={32} iconOnly />
            <div className="min-w-0">
              <span className="font-semibold text-sm tracking-tight text-[#F8FAF8] block">
                Geotwin GIS
              </span>
              <span className="text-[10px] font-medium text-[#76B78C] block uppercase tracking-wider font-mono">
                Field Operations
              </span>
            </div>
          </NavLink>
          <nav className="space-y-1 text-xs" aria-label="Field operations">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#94C7A5]" />
                  {label}
                </span>
                {to === '/field/notifications' &&
                actualCount > 0 ? (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-[#EF4444] text-[#F8FAF8] text-[9px] font-bold font-mono flex items-center justify-center shadow-[0_0_8px_#EF4444]">
                    {actualCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
            <button
              type="button"
              disabled
              title="AI Field Assistant is coming soon."
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-[#819089]/60 cursor-not-allowed"
            >
              <span className="flex items-center gap-3">
                <Bot className="w-4 h-4 text-[#819089]/60" />
                AI Field Assistant
              </span>
              <span className="text-[9px] uppercase font-mono bg-[#121A16] px-1.5 py-0.5 rounded text-[#819089]">Soon</span>
            </button>
          </nav>
        </div>
        <div className="border-t border-[#387A4E]/20 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-xl bg-[#387A4E] flex items-center justify-center text-xs font-bold text-[#F8FAF8] shadow-[0_0_12px_rgba(56,122,78,0.4)]">
              {officerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#F8FAF8] truncate">
                {officerName}
              </p>
              <p className="text-[9px] font-mono text-[#76B78C] uppercase">
                Field Officer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <header className="h-16 border-b border-[#387A4E]/20 bg-[#121A16]/90 backdrop-blur-md px-5 md:px-6 flex justify-between items-center sticky top-0 z-30">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-[#F8FAF8] truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[10px] font-mono text-[#76B78C] truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="p-2 bg-[#18211D] border-0 rounded-xl text-[#94C7A5] hover:text-red-400 transition-all cursor-pointer flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-[#243028]/95 backdrop-blur-lg px-4 flex justify-around items-center z-40">
        {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[8px] uppercase ${
                isActive ? 'text-white' : 'text-[#A9B3A8]/60'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
