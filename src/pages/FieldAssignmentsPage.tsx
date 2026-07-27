import { useEffect, useState } from 'react';
import { Briefcase, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { ApiError } from '../lib/apiClient';
import { fieldAssignmentsService } from '../services/fieldAssignments.service';
import type { FieldAssignment } from '../types/fieldOperations';

export default function FieldAssignmentsPage() {
  const [items, setItems] = useState<FieldAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await fieldAssignmentsService.list());
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load assignments.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => void load(), []);

  return (
    <FieldShell
      title="Assigned Projects"
      subtitle="Supervisor-issued projects and sectors"
    >
      <div className="p-5 md:p-8 max-w-5xl mx-auto">
        <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-[#EFF0EA] animate-pulse" />
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-[#C65C52] text-sm">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 px-4 py-2 bg-[#5F7F52] text-white rounded-lg text-xs"
              >
                Retry
              </button>
            </div>
          ) : items.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {items.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/field/assignments/${assignment.id}`}
                  className="border border-[#D4D8D0] rounded-xl p-5 hover:border-[#5F7F52]/50"
                >
                  <div className="flex justify-between gap-4">
                    <Briefcase className="w-5 h-5 text-[#5F7F52]" />
                    <span className="text-[8px] uppercase font-mono">
                      {assignment.status}
                    </span>
                  </div>
                  <h2 className="font-bold mt-4">
                    {assignment.project?.name ??
                      'Assigned restoration project'}
                  </h2>
                  <p className="text-xs text-[#6C756D] mt-1">
                    {assignment.sector?.name ??
                      'Project-wide assignment'}
                  </p>
                  <div className="mt-5 flex justify-between text-[9px] font-mono text-[#6C756D]">
                    <span>{assignment.tasks.length} tasks</span>
                    <ChevronRight className="w-4 h-4 text-[#5F7F52]" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <Briefcase className="w-8 h-8 mx-auto text-[#6C756D]/40" />
              <h2 className="font-bold mt-3">
                No projects assigned
              </h2>
              <p className="text-sm text-[#6C756D] mt-1">
                You cannot select or self-assign land. Projects
                appear here after supervisor assignment.
              </p>
            </div>
          )}
        </section>
      </div>
    </FieldShell>
  );
}
