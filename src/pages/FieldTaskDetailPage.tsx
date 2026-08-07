import { useCallback, useEffect, useState } from 'react';
import { Camera, Play, Send } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { ApiError } from '../lib/apiClient';
import { fieldTasksService } from '../services/fieldTasks.service';
import type { FieldTask } from '../types/fieldOperations';

export default function FieldTaskDetailPage() {
  const { taskId = '' } = useParams();
  const [task, setTask] = useState<FieldTask | null>(null);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      setTask(await fieldTasksService.get(taskId));
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load task.',
      );
    }
  }, [taskId]);

  useEffect(() => void load(), [load]);

  async function start() {
    setWorking(true);
    try {
      await fieldTasksService.start(taskId);
      setMessage('Task started.');
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to start task.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function submitEvidence() {
    if (description.trim().length < 3) {
      setError('Describe the evidence before submitting.');
      return;
    }
    setWorking(true);
    try {
      const response = (await fieldTasksService.submitEvidence(
        taskId,
        {
          evidenceType: 'FIELD_OBSERVATION',
          description: description.trim(),
          capturedAt: new Date().toISOString(),
        },
      )) as { message?: string };
      setDescription('');
      setMessage(
        response.message ??
          'Evidence metadata submitted successfully.',
      );
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to submit evidence.',
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <FieldShell title="Task Details">
      <div className="p-5 md:p-8 w-full">
        {error ? (
          <div className="mb-4 p-3 rounded-lg bg-[#FDF1F0] text-[#C65C52] text-xs">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-4 p-3 rounded-lg bg-[#EAF3E7] text-[#5F7F52] text-xs">
            {message}
          </div>
        ) : null}
        {!task ? (
          <div className="h-64 bg-[#FBFAEF] rounded-2xl animate-pulse" />
        ) : (
          <div className="space-y-5">
            <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-6">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-[9px] font-mono uppercase text-[#5F7F52]">
                    {task.priority} · {task.status}
                  </p>
                  <h1 className="text-xl font-bold mt-1">
                    {task.title}
                  </h1>
                  <p className="text-xs text-[#6C756D] mt-1">
                    {task.projectName}
                  </p>
                </div>
                {task.status === 'PENDING' ? (
                  <button
                    type="button"
                    onClick={() => void start()}
                    disabled={working}
                    className="self-start flex items-center gap-2 px-4 py-2 bg-[#5F7F52] text-white rounded-lg text-xs font-bold"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start
                  </button>
                ) : null}
              </div>
              <p className="mt-5 text-sm leading-relaxed">
                {task.description ?? 'No additional instructions.'}
              </p>
              <Link
                to={`/field/report-change?task=${task.id}`}
                className="inline-flex items-center gap-2 mt-5 text-xs font-bold text-[#5F7F52]"
              >
                <Send className="w-4 h-4" />
                Report field change
              </Link>
            </section>

            {task.requiresEvidence ? (
              <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-6">
                <h2 className="font-bold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#5F7F52]" />
                  Submit requested evidence
                </h2>
                <p className="text-xs text-[#6C756D] mt-2">
                  This task explicitly requires evidence. File
                  storage is not configured; this saves truthful
                  metadata only.
                </p>
                <label className="block text-xs font-semibold mt-5">
                  Evidence description
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={4}
                    className="mt-2 w-full border border-[#D4D8D0] rounded-xl p-3 bg-white outline-none focus:border-[#5F7F52]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void submitEvidence()}
                  disabled={working}
                  className="mt-3 px-4 py-2.5 bg-[#5F7F52] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Save evidence metadata
                </button>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </FieldShell>
  );
}
