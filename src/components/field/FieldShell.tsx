import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
    label: 'Assigned Land',
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
  notificationCount = 0,
  children,
}: FieldShellProps) {
  const navigate = useNavigate();

  async function signOut() {
    try {
      await logoutUser();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-[#E8E9E2] text-[#252B26] flex flex-col md:flex-row font-sans">
      <aside className="w-64 bg-[#243028] border-r border-[#D4D8D0]/10 p-6 hidden md:flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <NavLink
            to="/field/dashboard"
            className="flex items-center space-x-2 pl-2"
          >
            <GeotwinLogo size={36} iconOnly />
            <span className="font-bold text-sm tracking-wide uppercase text-[#D7DED5]">
              GeoTwin
            </span>
          </NavLink>
          <nav className="space-y-1" aria-label="Field operations">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                    isActive
                      ? 'bg-[#344638] text-white border-l-2 border-[#5F7F52]'
                      : 'text-[#A9B3A8] hover:bg-[#344638]/40 hover:text-white'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
                {to === '/field/notifications' &&
                notificationCount > 0 ? (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-[#C65C52] text-white text-[9px] flex items-center justify-center">
                    {notificationCount}
                  </span>
                ) : null}
              </NavLink>
            ))}
            <button
              type="button"
              disabled
              title="AI Field Assistant is coming soon."
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-[#A9B3A8]/50 cursor-not-allowed"
            >
              <span className="flex items-center gap-3">
                <Bot className="w-4 h-4" />
                AI Field Assistant
              </span>
              <span className="text-[8px] uppercase">Soon</span>
            </button>
          </nav>
        </div>
        <div className="border-t border-[#D4D8D0]/10 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#344638] flex items-center justify-center text-xs font-bold text-[#D7DED5]">
              {officerName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#D7DED5] truncate">
                {officerName}
              </p>
              <p className="text-[8px] font-mono text-[#A9B3A8] uppercase">
                Field officer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full flex items-center gap-3 px-3.5 py-2 text-xs font-semibold text-red-400/80 hover:bg-red-500/5 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <header className="h-16 border-b border-[#D4D8D0] bg-[#FBFAEF]/90 backdrop-blur-md px-5 md:px-6 flex justify-between items-center sticky top-0 z-30">
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-wide truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[9px] font-mono text-[#6C756D] truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/field/notifications"
              aria-label={`Notifications, ${notificationCount} unread`}
              className="relative p-2 bg-[#FBFAEF] border border-[#D4D8D0] rounded-lg text-[#6C756D] hover:text-[#5F7F52]"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C65C52] text-white text-[8px] flex items-center justify-center">
                  {notificationCount}
                </span>
              ) : null}
            </NavLink>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="p-2 bg-[#FBFAEF] border border-[#D4D8D0] rounded-lg text-[#6C756D] hover:text-red-500"
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
