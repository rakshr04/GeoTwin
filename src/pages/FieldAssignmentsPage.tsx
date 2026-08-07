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
      <div className="p-5 md:p-8 w-full text-[#F8FAF8]">
        <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          {loading ? (
            <div className="h-40 rounded-xl bg-[#121A16] animate-pulse" />
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-[#EF4444] text-sm font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 px-4 py-2 bg-[#387A4E] text-[#F8FAF8] rounded-xl text-xs font-semibold hover:bg-[#2E6540] transition-all cursor-pointer shadow-[0_0_12px_rgba(56,122,78,0.3)]"
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
                  className="bg-[#121A16] border-0 rounded-xl p-5 hover:bg-[#1C2822] hover:shadow-[0_0_15px_rgba(56,122,78,0.2)] transition-all"
                >
                  <div className="flex justify-between items-center">
                    <Briefcase className="w-5 h-5 text-emerald-400" />
                    <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#387A4E]/20 text-[#76B78C] font-semibold">
                      {assignment.status}
                    </span>
                  </div>
                  <h2 className="font-semibold text-base mt-4 text-[#F8FAF8]">
                    {assignment.project?.name ??
                      'Assigned restoration project'}
                  </h2>
                  <p className="text-xs text-[#AEB9B3] mt-1">
                    {assignment.sector?.name ??
                      'Project-wide assignment'}
                  </p>
                  <div className="mt-5 flex justify-between items-center text-[10px] font-mono text-[#76B78C]">
                    <span>{assignment.tasks.length} tasks</span>
                    <ChevronRight className="w-4 h-4 text-[#76B78C]" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center">
              <Briefcase className="w-8 h-8 mx-auto text-[#819089]/60" />
              <h2 className="font-semibold text-base mt-3 text-[#F8FAF8]">
                No projects assigned
              </h2>
              <p className="text-xs text-[#AEB9B3] mt-1">
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
