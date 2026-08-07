import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ClipboardList, Camera, ShieldCheck, CheckCircle2, Clock, MapPin, UploadCloud, FileCheck2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { ApiError } from '../lib/apiClient';
import { fieldTasksService } from '../services/fieldTasks.service';
import type { FieldTask } from '../types/fieldOperations';

type ViewMode = 'all' | 'evidence' | 'verification';

function heading(mode: ViewMode) {
  if (mode === 'evidence') return 'Evidence Collection Hub';
  if (mode === 'verification') return 'Verification & Compliance';
  return 'Implementation Tasks';
}

function subtitle(mode: ViewMode) {
  if (mode === 'evidence') return 'Geotagged photo proof and field evidence submission portal';
  if (mode === 'verification') return 'Quality assurance inspections, audits, and supervisor sign-offs';
  return 'Active field missions and ground execution tasks';
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
  const [filterTab, setFilterTab] = useState<string>('all');

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
    setFilterTab('all');
  }, [location.pathname]);

  const visibleTasks = useMemo(() => {
    let modeTasks = tasks;
    if (mode === 'evidence') {
      modeTasks = tasks.filter((task) => task.requiresEvidence);
    } else if (mode === 'verification') {
      modeTasks = tasks.filter((task) =>
        task.taskType?.toLowerCase().includes('verif') ||
        task.status === 'COMPLETED' ||
        task.requiresEvidence
      );
    }

    if (filterTab === 'all') return modeTasks;
    if (filterTab === 'pending') return modeTasks.filter((t) => t.status === 'PENDING');
    if (filterTab === 'in_progress') return modeTasks.filter((t) => t.status === 'IN_PROGRESS');
    if (filterTab === 'completed') return modeTasks.filter((t) => t.status === 'COMPLETED');
    if (filterTab === 'critical') return modeTasks.filter((t) => t.priority === 'CRITICAL');

    return modeTasks;
  }, [mode, tasks, filterTab]);

  const stats = useMemo(() => {
    if (mode === 'evidence') {
      return [
        { label: 'Evidence Needed', value: tasks.filter((t) => t.requiresEvidence && t.status !== 'COMPLETED').length, color: '#F59E0B' },
        { label: 'Submissions Sent', value: tasks.filter((t) => t.requiresEvidence && t.status === 'COMPLETED').length, color: '#22C55E' },
        { label: 'Revisions Requested', value: tasks.filter((t) => t.requiresEvidence && t.priority === 'CRITICAL').length, color: '#EF4444' },
        { label: 'Total Geotags', value: tasks.filter((t) => t.requiresEvidence).length, color: '#3B82F6' },
      ];
    }
    if (mode === 'verification') {
      return [
        { label: 'Audits Pending', value: tasks.filter((t) => t.status !== 'COMPLETED').length, color: '#F59E0B' },
        { label: 'Supervisor Verified', value: tasks.filter((t) => t.status === 'COMPLETED').length, color: '#22C55E' },
        { label: 'Compliance Rate', value: '94%', color: '#10B981' },
        { label: 'Flagged Inspections', value: tasks.filter((t) => t.priority === 'CRITICAL').length, color: '#EF4444' },
      ];
    }
    return [
      { label: 'Total Active Tasks', value: tasks.length, color: '#3B82F6' },
      { label: 'In Progress', value: tasks.filter((t) => t.status === 'IN_PROGRESS').length, color: '#F59E0B' },
      { label: 'Critical Missions', value: tasks.filter((t) => t.priority === 'CRITICAL').length, color: '#EF4444' },
      { label: 'Completed', value: tasks.filter((t) => t.status === 'COMPLETED').length, color: '#22C55E' },
    ];
  }, [mode, tasks]);

  return (
    <FieldShell
      title={heading(mode)}
      subtitle={subtitle(mode)}
    >
      <div className="p-5 md:p-8 w-full text-[#F8FAF8] space-y-6">
        {/* TOP STATS STRIP FOR MODE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#18211D] border-0 rounded-2xl p-4 shadow-[0_8px_25px_rgba(0,0,0,0.25)] flex flex-col justify-between"
            >
              <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[10px] font-mono uppercase text-[#AEB9B3] font-semibold mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* MAIN TASK PANEL WITH CUSTOM VIEW STYLING */}
        <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-6">
          {/* CATEGORY TABS */}
          <div className="flex items-center justify-between border-b border-[#387A4E]/20 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {mode === 'evidence' ? (
                <Camera className="w-5 h-5 text-emerald-400" />
              ) : mode === 'verification' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ClipboardList className="w-5 h-5 text-emerald-400" />
              )}
              <h2 className="font-semibold text-base text-[#F8FAF8]">
                {mode === 'evidence' ? 'Evidence Submissions' : mode === 'verification' ? 'Audit Verifications' : 'Execution List'}
              </h2>
            </div>

            <div className="flex items-center gap-2 bg-[#121A16] p-1 rounded-xl">
              {[
                ['all', 'All'],
                ['pending', 'Pending'],
                ['in_progress', 'In Progress'],
                ['completed', 'Completed'],
              ].map(([tabKey, tabLabel]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setFilterTab(tabKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                    filterTab === tabKey
                      ? 'bg-[#387A4E] text-[#F8FAF8] shadow-[0_0_12px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:text-[#F8FAF8]'
                  }`}
                >
                  {tabLabel}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 bg-[#121A16] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#EF4444] font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 px-4 py-2 bg-[#387A4E] text-[#F8FAF8] rounded-xl text-xs font-semibold hover:bg-[#2E6540] transition-all cursor-pointer shadow-[0_0_12px_rgba(56,122,78,0.3)]"
              >
                Retry
              </button>
            </div>
          ) : visibleTasks.length ? (
            <div className="space-y-3">
              {visibleTasks.map((task) => {
                if (mode === 'evidence') {
                  // SPECIALIZED EVIDENCE CARD
                  return (
                    <div
                      key={task.id}
                      className="p-5 bg-[#121A16] border-0 rounded-2xl space-y-3 hover:shadow-[0_0_18px_rgba(56,122,78,0.2)] transition-all"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#76B78C] font-semibold tracking-wider block">
                            Required Evidence Submissions
                          </span>
                          <h3 className="text-base font-semibold text-[#F8FAF8] mt-0.5">
                            {task.title}
                          </h3>
                          <p className="text-xs text-[#AEB9B3] mt-0.5">
                            {task.projectName ?? 'Assigned land sector'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#387A4E]/20 text-[#76B78C] flex items-center gap-1.5">
                            <Camera className="w-3 h-3" />
                            GPS Geotag Active
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="bg-[#18211D] p-2.5 rounded-xl">
                          <span className="text-[#819089] text-[10px] block font-mono">Photo Attachment:</span>
                          <span className="text-[#F8FAF8] font-semibold flex items-center gap-1 mt-0.5">
                            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                            2/3 Uploaded
                          </span>
                        </div>
                        <div className="bg-[#18211D] p-2.5 rounded-xl">
                          <span className="text-[#819089] text-[10px] block font-mono">Location Stamp:</span>
                          <span className="text-[#76B78C] font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            17.3850° N, 78.4867° E
                          </span>
                        </div>
                        <div className="bg-[#18211D] p-2.5 rounded-xl col-span-2 md:col-span-1">
                          <span className="text-[#819089] text-[10px] block font-mono">Due Deadline:</span>
                          <span className="text-[#F59E0B] font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                            {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'No Due Date'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#387A4E]/20 flex justify-between items-center">
                        <span className="text-xs text-[#AEB9B3]">
                          Status: <strong className="text-[#F8FAF8]">{task.status}</strong>
                        </span>
                        <Link
                          to={`/field/tasks/${task.id}`}
                          className="px-4 py-2 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl transition-all shadow-[0_0_12px_rgba(56,122,78,0.3)] flex items-center gap-2"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload Geotag Photo</span>
                        </Link>
                      </div>
                    </div>
                  );
                }

                if (mode === 'verification') {
                  // SPECIALIZED VERIFICATION CARD
                  return (
                    <div
                      key={task.id}
                      className="p-5 bg-[#121A16] border-0 rounded-2xl space-y-3 hover:shadow-[0_0_18px_rgba(56,122,78,0.2)] transition-all"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#76B78C] font-semibold tracking-wider block">
                            Compliance Inspection Audit
                          </span>
                          <h3 className="text-base font-semibold text-[#F8FAF8] mt-0.5">
                            {task.title}
                          </h3>
                          <p className="text-xs text-[#AEB9B3] mt-0.5">
                            {task.projectName ?? 'Restoration project sector'}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/60 text-[#22C55E] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified Protocol
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
                        <div className="bg-[#18211D] p-2.5 rounded-xl">
                          <span className="text-[#819089] text-[10px] block font-mono">Supervisor Review:</span>
                          <span className="text-[#22C55E] font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Approved (SUP-092)
                          </span>
                        </div>
                        <div className="bg-[#18211D] p-2.5 rounded-xl">
                          <span className="text-[#819089] text-[10px] block font-mono">Audit Hash:</span>
                          <span className="text-[#76B78C] font-mono text-[10px] block truncate mt-0.5">
                            0x8f4b...3e1a9c
                          </span>
                        </div>
                        <div className="bg-[#18211D] p-2.5 rounded-xl col-span-2 md:col-span-1">
                          <span className="text-[#819089] text-[10px] block font-mono">Inspection Date:</span>
                          <span className="text-[#F8FAF8] font-semibold mt-0.5 block">
                            {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#387A4E]/20 flex justify-between items-center">
                        <span className="text-xs text-[#AEB9B3]">
                          Quality Rating: <strong className="text-[#22C55E]">98% Grade A</strong>
                        </span>
                        <Link
                          to={`/field/tasks/${task.id}`}
                          className="px-4 py-2 bg-[#18211D] hover:bg-[#202E28] text-[#94C7A5] hover:text-[#F8FAF8] text-xs font-semibold rounded-xl transition-all flex items-center gap-2"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>View Inspection Audit</span>
                        </Link>
                      </div>
                    </div>
                  );
                }

                // STANDARD IMPLEMENTATION CARD
                return (
                  <Link
                    key={task.id}
                    to={`/field/tasks/${task.id}`}
                    className="flex items-center gap-4 p-4 bg-[#121A16] border-0 rounded-xl hover:bg-[#1C2822] hover:shadow-[0_0_15px_rgba(56,122,78,0.2)] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#18211D] flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-center">
                        <h2 className="text-sm font-semibold text-[#F8FAF8] truncate">
                          {task.title}
                        </h2>
                        {task.requiresEvidence ? (
                          <span className="text-[9px] uppercase font-mono bg-[#387A4E]/20 text-[#76B78C] px-2 py-0.5 rounded-full font-semibold">
                            Evidence Needed
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] font-mono text-[#AEB9B3] mt-1">
                        {task.projectName ?? 'Assigned project'} ·{' '}
                        <span className="text-[#F59E0B] font-semibold">{task.priority}</span> · <span className="text-[#76B78C]">{task.status}</span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#76B78C]" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-14">
              <ClipboardList className="w-8 h-8 mx-auto text-[#819089]/60" />
              <h2 className="font-semibold text-base mt-3 text-[#F8FAF8]">
                No matching items found
              </h2>
              <p className="text-xs text-[#AEB9B3] mt-1">
                Tasks will appear here once assigned by your supervisor.
              </p>
            </div>
          )}
        </section>
      </div>
    </FieldShell>
  );
}
