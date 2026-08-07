import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { ApiError } from '../lib/apiClient';
import { fieldDashboardService } from '../services/fieldDashboard.service';
import type { OfficerNotification } from '../types/fieldOperations';

export default function FieldNotificationsPage() {
  const [items, setItems] = useState<OfficerNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(
        await fieldDashboardService.getNotifications(),
      );
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load notifications.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => void load(), []);

  async function read(item: OfficerNotification) {
    if (!item.readAt) {
      await fieldDashboardService.readNotification(item.id);
      await load();
    }
  }

  async function readAll() {
    await fieldDashboardService.readAllNotifications();
    await load();
  }

  const unread = items.filter((item) => !item.readAt).length;

  return (
    <FieldShell
      title="Notifications"
      subtitle="Assignment and supervisor updates"
      notificationCount={unread}
    >
      <div className="p-5 md:p-8 w-full text-[#F8FAF8]">
        <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-semibold text-sm text-[#F8FAF8]">
              {unread} unread
            </h2>
            <button
              type="button"
              onClick={() => void readAll()}
              disabled={unread === 0}
              className="flex items-center gap-2 text-[11px] font-semibold font-mono text-[#76B78C] hover:text-[#F8FAF8] disabled:opacity-40 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </div>
          {loading ? (
            <div className="h-32 bg-[#121A16] rounded-xl animate-pulse" />
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-sm text-[#EF4444] font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 text-xs font-semibold text-[#76B78C]"
              >
                Retry
              </button>
            </div>
          ) : items.length ? (
            <div className="space-y-2">
              {items.map((item) => {
                const content = (
                  <>
                    <Bell
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        item.readAt
                          ? 'text-[#819089]'
                          : 'text-emerald-400'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#F8FAF8]">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#AEB9B3] mt-1">
                        {item.message}
                      </p>
                    </div>
                  </>
                );
                const className = `flex gap-3 p-4 rounded-xl transition-all ${
                  item.readAt
                    ? 'bg-[#121A16] border-0'
                    : 'bg-[#1C2822] border-0 shadow-[0_0_12px_rgba(56,122,78,0.2)]'
                }`;
                return item.deepLink ? (
                  <Link
                    key={item.id}
                    to={item.deepLink}
                    onClick={() => void read(item)}
                    className={className}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => void read(item)}
                    className={`${className} w-full text-left`}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-8 h-8 mx-auto text-[#819089]/60" />
              <h2 className="font-semibold text-base mt-3 text-[#F8FAF8]">
                No notifications
              </h2>
            </div>
          )}
        </section>
      </div>
    </FieldShell>
  );
}
