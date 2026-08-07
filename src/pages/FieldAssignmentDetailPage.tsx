import { useCallback, useEffect, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { ApiError } from '../lib/apiClient';
import { fieldAssignmentsService } from '../services/fieldAssignments.service';
import type { FieldAssignment } from '../types/fieldOperations';

export default function FieldAssignmentDetailPage() {
  const { assignmentId = '' } = useParams();
  const [item, setItem] = useState<FieldAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      setItem(await fieldAssignmentsService.get(assignmentId));
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load assignment.',
      );
    }
  }, [assignmentId]);

  useEffect(() => void load(), [load]);

  async function accept() {
    setWorking(true);
    try {
      await fieldAssignmentsService.accept(assignmentId);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to accept assignment.',
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <FieldShell title="Assignment Details">
      <div className="p-5 md:p-8 w-full">
        {error ? (
          <div className="mb-4 p-3 rounded-lg bg-[#FDF1F0] text-[#C65C52] text-xs">
            {error}
          </div>
        ) : null}
        {!item ? (
          <div className="h-56 bg-[#FBFAEF] rounded-2xl animate-pulse" />
        ) : (
          <div className="space-y-5">
            <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-6">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-[9px] uppercase font-mono text-[#5F7F52]">
                    {item.status}
                  </p>
                  <h1 className="text-xl font-bold mt-1">
                    {item.project?.name}
                  </h1>
                  <p className="text-sm text-[#6C756D] mt-1">
                    {item.sector?.name ??
                      'Project-wide assignment'}
                  </p>
                </div>
                {item.status === 'ASSIGNED' ? (
                  <button
                    type="button"
                    onClick={() => void accept()}
                    disabled={working}
                    className="self-start flex items-center gap-2 px-4 py-2.5 bg-[#5F7F52] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                ) : null}
              </div>
              {item.instructions ? (
                <p className="mt-5 text-sm leading-relaxed">
                  {item.instructions}
                </p>
              ) : null}
              {item.sector ? (
                <Link
                  to={`/field/map?sector=${item.sector.id}`}
                  className="inline-flex items-center gap-2 mt-5 text-xs font-bold text-[#5F7F52]"
                >
                  <MapPin className="w-4 h-4" />
                  View assigned land
                </Link>
              ) : null}
            </section>
            <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-6">
              <h2 className="font-bold">Assigned Tasks</h2>
              {item.tasks.length ? (
                <div className="space-y-2 mt-4">
                  {item.tasks.map((task) => (
                    <Link
                      key={task.id}
                      to={`/field/tasks/${task.id}`}
                      className="block border border-[#D4D8D0] rounded-xl p-4 hover:border-[#5F7F52]/50"
                    >
                      <p className="text-sm font-semibold">
                        {task.title}
                      </p>
                      <p className="text-[9px] font-mono text-[#6C756D] mt-1">
                        {task.priority} · {task.status}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6C756D] mt-3">
                  No tasks have been added to this assignment.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </FieldShell>
  );
}
