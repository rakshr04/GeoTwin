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
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-sm">
              {unread} unread
            </h2>
            <button
              type="button"
              onClick={() => void readAll()}
              disabled={unread === 0}
              className="flex items-center gap-2 text-[10px] font-bold text-[#5F7F52] disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </div>
          {loading ? (
            <div className="h-32 bg-[#EFF0EA] rounded-xl animate-pulse" />
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-sm text-[#C65C52]">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 text-xs font-bold text-[#5F7F52]"
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
                      className={`w-4 h-4 mt-0.5 ${
                        item.readAt
                          ? 'text-[#6C756D]'
                          : 'text-[#5F7F52]'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#6C756D] mt-1">
                        {item.message}
                      </p>
                    </div>
                  </>
                );
                const className = `flex gap-3 p-4 rounded-xl border ${
                  item.readAt
                    ? 'border-[#D4D8D0]'
                    : 'border-[#5F7F52]/30 bg-[#EAF3E7]/40'
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
              <Bell className="w-8 h-8 mx-auto text-[#6C756D]/40" />
              <h2 className="font-bold mt-3">
                No notifications
              </h2>
            </div>
          )}
        </section>
      </div>
    </FieldShell>
  );
}
