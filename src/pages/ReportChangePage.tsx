import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { ApiError } from '../lib/apiClient';
import { fieldTasksService } from '../services/fieldTasks.service';
import type { FieldTask } from '../types/fieldOperations';

export default function ReportChangePage() {
  const [searchParams] = useSearchParams();
  const requestedTask = searchParams.get('task') ?? '';
  const [tasks, setTasks] = useState<FieldTask[]>([]);
  const [taskId, setTaskId] = useState(requestedTask);
  const [category, setCategory] = useState('SITE_CONDITION');
  const [notes, setNotes] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void fieldTasksService
      .list()
      .then((items) => {
        const permitted = items.filter((task) =>
          ['PENDING', 'IN_PROGRESS', 'BLOCKED'].includes(
            task.status,
          ),
        );
        setTasks(permitted);
        if (!requestedTask && permitted.length === 1) {
          setTaskId(permitted[0].id);
        }
      })
      .catch((requestError) =>
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Unable to load assigned tasks.',
        ),
      );
  }, [requestedTask]);

  const selected = useMemo(
    () => tasks.find((task) => task.id === taskId),
    [taskId, tasks],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!taskId) {
      setError('Select the assigned task related to this change.');
      return;
    }
    if (notes.trim().length < 3) {
      setError('Describe the field change.');
      return;
    }
    setWorking(true);
    try {
      await fieldTasksService.report(taskId, {
        reportType: 'FIELD_CHANGE',
        changeCategory: category,
        notes: notes.trim(),
      });
      setSuccess(true);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to submit the report.',
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <FieldShell
      title="Report Field Change"
      subtitle="Reports must be linked to one of your assigned tasks"
    >
      <div className="p-5 md:p-8 max-w-2xl mx-auto">
        <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#EAF3E7] flex items-center justify-center text-[#5F7F52]">
                <Send className="w-5 h-5" />
              </div>
              <h2 className="font-bold mt-4">
                Field change reported
              </h2>
              <p className="text-sm text-[#6C756D] mt-1">
                The supervisor was notified and the activity was
                logged.
              </p>
              <Link
                to="/field/dashboard"
                className="inline-block mt-5 text-xs font-bold text-[#5F7F52]"
              >
                Return to dashboard
              </Link>
            </div>
          ) : tasks.length === 0 && !error ? (
            <div className="text-center py-10">
              <h2 className="font-bold">
                No reportable assigned task
              </h2>
              <p className="text-sm text-[#6C756D] mt-2">
                A change report must be submitted from an active
                assigned task.
              </p>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)}>
              {error ? (
                <div className="mb-4 p-3 rounded-lg bg-[#FDF1F0] text-[#C65C52] text-xs">
                  {error}
                </div>
              ) : null}
              <label className="block text-xs font-semibold">
                Assigned task
                <select
                  required
                  value={taskId}
                  onChange={(event) =>
                    setTaskId(event.target.value)
                  }
                  className="mt-2 w-full p-3 rounded-xl border border-[#D4D8D0] bg-white"
                >
                  <option value="">Select task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} — {task.projectName}
                    </option>
                  ))}
                </select>
              </label>
              {selected ? (
                <p className="mt-2 text-[9px] font-mono text-[#6C756D]">
                  Assignment {selected.assignmentId}
                </p>
              ) : null}
              <label className="block text-xs font-semibold mt-5">
                Change category
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="mt-2 w-full p-3 rounded-xl border border-[#D4D8D0] bg-white"
                >
                  <option value="SITE_CONDITION">
                    Site condition
                  </option>
                  <option value="ACCESS">Access issue</option>
                  <option value="BOUNDARY">
                    Boundary discrepancy
                  </option>
                  <option value="SAFETY">Safety concern</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block text-xs font-semibold mt-5">
                Observed change
                <textarea
                  required
                  rows={6}
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Describe what changed, where it was observed, and any immediate impact."
                  className="mt-2 w-full p-3 rounded-xl border border-[#D4D8D0] bg-white outline-none focus:border-[#5F7F52]"
                />
              </label>
              <button
                type="submit"
                disabled={working}
                className="mt-5 w-full flex justify-center items-center gap-2 py-3 bg-[#5F7F52] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {working ? 'Submitting…' : 'Submit Report'}
              </button>
            </form>
          )}
        </section>
      </div>
    </FieldShell>
  );
}
