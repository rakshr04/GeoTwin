import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { ApiError } from '../lib/apiClient';
import { fieldTasksService } from '../services/fieldTasks.service';
import type { FieldTask } from '../types/fieldOperations';

type ViewMode = 'all' | 'evidence' | 'verification';

function heading(mode: ViewMode) {
  if (mode === 'evidence') return 'Evidence Collection';
  if (mode === 'verification') return 'Verification Tasks';
  return 'Implementation Tasks';
}

export default function FieldTasksPage() {
  const location = useLocation();
  const mode: ViewMode = location.pathname.includes('evidence')
    ? 'evidence'
    : location.pathname.includes('verification')
      ? 'verification'
      : 'all';
  const [tasks, setTasks] = useState<FieldTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setTasks(await fieldTasksService.list());
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load tasks.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleTasks = useMemo(() => {
    if (mode === 'evidence') {
      return tasks.filter((task) => task.requiresEvidence);
    }
    if (mode === 'verification') {
      return tasks.filter((task) =>
        task.taskType.toLowerCase().includes('verif'),
      );
    }
    return tasks;
  }, [mode, tasks]);

  return (
    <FieldShell
      title={heading(mode)}
      subtitle="Only tasks assigned to your officer profile"
    >
      <div className="p-5 md:p-8 max-w-5xl mx-auto">
        <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-20 bg-[#EFF0EA] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#C65C52]">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 px-4 py-2 bg-[#5F7F52] text-white rounded-lg text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : visibleTasks.length ? (
            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/field/tasks/${task.id}`}
                  className="flex items-center gap-4 p-4 border border-[#D4D8D0] rounded-xl hover:border-[#5F7F52]/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EFF0EA] flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-[#5F7F52]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 items-center">
                      <h2 className="text-sm font-bold truncate">
                        {task.title}
                      </h2>
                      {task.requiresEvidence ? (
                        <span className="text-[8px] uppercase bg-[#EAF3E7] text-[#5F7F52] px-2 py-1 rounded-full">
                          Evidence
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[9px] font-mono text-[#6C756D] mt-1">
                      {task.projectName ?? 'Assigned project'} ·{' '}
                      {task.priority} · {task.status}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#5F7F52]" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-14">
              <ClipboardList className="w-8 h-8 mx-auto text-[#6C756D]/50" />
              <h2 className="font-bold mt-3">
                No assigned tasks
              </h2>
              <p className="text-sm text-[#6C756D] mt-1">
                Matching tasks will appear here only after a
                supervisor assigns them to you.
              </p>
            </div>
          )}
        </section>
      </div>
    </FieldShell>
  );
}
