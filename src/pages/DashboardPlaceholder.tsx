import {
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { FieldShell } from '../components/field/FieldShell';
import { useFieldDashboard } from '../hooks/useFieldDashboard';
import type { FieldTask } from '../types/fieldOperations';

function formatDate(value: string | null) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: value.includes('T') ? 'numeric' : undefined,
    minute: value.includes('T') ? '2-digit' : undefined,
  }).format(new Date(value));
}

function TaskRow({ task }: { task: FieldTask }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-[#121A16] border-0 rounded-xl">
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          task.priority === 'CRITICAL'
            ? 'bg-[#EF4444]'
            : task.priority === 'HIGH'
              ? 'bg-[#F59E0B]'
              : 'bg-[#22C55E]'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#F8FAF8] truncate">
          {task.title}
        </p>
        <p className="text-[10px] font-mono text-[#AEB9B3] truncate mt-0.5">
          {task.projectName ?? 'Assigned operation'} ·{' '}
          {formatDate(task.dueAt)}
        </p>
      </div>
      <Link
        to={`/field/tasks/${task.id}`}
        aria-label={`Open ${task.title}`}
        className="p-2 text-[#76B78C] hover:bg-[#18211D] rounded-xl transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <FieldShell title="Field Operations Dashboard">
      <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-32 bg-[#18211D] rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#18211D] rounded-xl" />
          ))}
        </div>
      </div>
    </FieldShell>
  );
}

export default function DashboardPlaceholder() {
  const {
    data,
    loading,
    refreshing,
    error,
    refresh,
    retry,
  } = useFieldDashboard();

  if (loading) {
    return (
      <FieldShell
        title="Field Operations Dashboard"
        subtitle="Loading authorised assignments"
      >
        <DashboardSkeleton />
      </FieldShell>
    );
  }

  if (error || !data) {
    return (
      <FieldShell title="Field Operations Dashboard">
        <div className="p-5 md:p-8 max-w-3xl mx-auto">
          <section className="bg-[#FBFAEF] border border-[#C65C52]/30 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-[#C65C52] mx-auto mb-3" />
            <h2 className="font-bold">Dashboard unavailable</h2>
            <p className="text-sm text-[#6C756D] mt-2">
              {error ?? 'The dashboard could not be loaded.'}
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 px-5 py-2.5 rounded-lg bg-[#5F7F52] text-white text-xs font-bold"
            >
              Retry
            </button>
          </section>
        </div>
      </FieldShell>
    );
  }

  const hasAssignments =
    data.summary.activeAssignments > 0;

  return (
    <FieldShell
      title={`Good morning, ${data.officer.displayName}`}
      subtitle={
        data.officer.districtName
          ? `${data.officer.districtName} · Field Operations`
          : 'Field Operations'
      }
      officerName={data.officer.displayName}
      notificationCount={data.notificationCount}
    >      <div className="p-5 md:p-8 space-y-6 w-full text-[#F8FAF8]">
        {/* Top bar with refresh */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-[#F8FAF8]">GIS Field Operations Workspace</h2>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#18211D] hover:bg-[#202E28] text-[#94C7A5] text-[11px] font-semibold font-mono disabled:opacity-60 transition-all cursor-pointer border-0 shadow-[0_0_12px_rgba(56,122,78,0.2)]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {!hasAssignments ? (
          <section className="bg-[#18211D] rounded-2xl p-8 md:p-12 text-center border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5]">
              <Compass className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-[#F8FAF8]">
              No field assignments have been issued yet.
            </h2>
            <p className="text-xs text-[#AEB9B3] max-w-xl mx-auto">
              Projects, sectors and tasks will appear here after a
              supervising officer assigns work to you.
            </p>
            <Link
              to="/field/notifications"
              className="inline-flex py-2 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl transition-all border-0 shadow-[0_0_12px_rgba(56,122,78,0.3)]"
            >
              Check Notifications
            </Link>
          </section>
        ) : (
          <>
            <section className="bg-[#18211D] border-0 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#76B78C] font-semibold">
                  Priority Action
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#F8FAF8]">
                  {data.priorityAction?.title ??
                    'No incomplete tasks'}
                </h2>
                <p className="text-xs text-[#AEB9B3] mt-1">
                  {data.priorityAction
                    ? `${data.priorityAction.projectName ?? 'Assigned project'} · ${data.priorityAction.priority} priority`
                    : 'All currently assigned tasks are complete.'}
                </p>
              </div>
              {data.priorityAction ? (
                <Link
                  to={`/field/tasks/${data.priorityAction.id}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold uppercase tracking-wider border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] transition-all"
                >
                  Open Task
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : null}
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Active assignments', data.summary.activeAssignments, '#22C55E'],
                ['Pending tasks', data.summary.pendingTasks, '#F59E0B'],
                ['Overdue tasks', data.summary.overdueTasks, '#EF4444'],
                ['Completed tasks', data.summary.completedTasks, '#10B981'],
              ].map(([label, value, color]) => (
                <div
                  key={label as string}
                  className="bg-[#18211D] border-0 rounded-xl p-4 shadow-[0_8px_25px_rgba(0,0,0,0.25)]"
                >
                  <p className="text-2xl font-bold font-mono tracking-tight" style={{ color: color as string }}>{value as number}</p>
                  <p className="text-[10px] font-mono uppercase text-[#AEB9B3] font-semibold mt-1">
                    {label as string}
                  </p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm text-[#F8FAF8]">
                      Today&apos;s Operations
                    </h3>
                    <Link
                      to="/field/tasks"
                      className="text-[10px] font-mono uppercase text-[#76B78C] font-semibold"
                    >
                      View all
                    </Link>
                  </div>
                  {data.todayOperations.length ? (
                    <div className="space-y-2">
                      {data.todayOperations.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#AEB9B3] py-8 text-center">
                      No tasks are due or newly assigned today.
                    </p>
                  )}
                </section>

                <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm text-[#F8FAF8]">
                      Assigned Sectors
                    </h3>
                    <span className="text-[10px] font-mono text-[#76B78C]">
                      {data.assignedSectors.length} sectors
                    </span>
                  </div>
                  {data.assignedSectors.length ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {data.assignedSectors.map((sector) => (
                        <article
                          key={sector.id}
                          className="bg-[#121A16] border-0 rounded-xl p-4 text-xs space-y-3"
                        >
                          <h4 className="font-semibold text-[#F8FAF8]">
                            {sector.name}
                          </h4>
                          <p className="text-[10px] font-mono text-[#AEB9B3]">
                            {sector.projectName} ·{' '}
                            {sector.areaHectares.toFixed(2)} ha
                          </p>
                          <div>
                            <div className="flex justify-between text-[10px] font-semibold text-[#AEB9B3]">
                              <span>Task completion</span>
                              <span className="text-[#22C55E]">{sector.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-[#18211D] rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-[#387A4E] rounded-full"
                                style={{
                                  width: `${sector.progress}%`,
                                }}
                              />
                            </div>
                          </div>
                          <Link
                            to={`/field/map?sector=${sector.id}`}
                            className="inline-flex items-center text-[10px] font-semibold uppercase font-mono text-[#76B78C] hover:text-[#F8FAF8]"
                          >
                            Details
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#AEB9B3] py-8 text-center">
                      No land sector is attached to your active
                      assignments.
                    </p>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                  <h3 className="font-semibold text-sm text-[#F8FAF8] mb-4">
                    Quick Operations
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Link
                      to="/field/map"
                      className="p-3 bg-[#121A16] border-0 rounded-xl text-center hover:bg-[#1C2822] transition-all"
                    >
                      <Compass className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                      <span className="text-[9px] font-semibold font-mono text-[#F8FAF8] uppercase block">
                        Open Map
                      </span>
                    </Link>
                    <Link
                      to="/field/report-change"
                      className="p-3 bg-[#121A16] border-0 rounded-xl text-center hover:bg-[#1C2822] transition-all"
                    >
                      <AlertTriangle className="w-5 h-5 text-[#F59E0B] mx-auto mb-2" />
                      <span className="text-[9px] font-semibold font-mono text-[#F8FAF8] uppercase block">
                        Report Change
                      </span>
                    </Link>
                    <button
                      type="button"
                      disabled
                      title="AI Field Assistant is coming soon."
                      className="p-3 bg-[#121A16] border-0 rounded-xl text-center opacity-40 cursor-not-allowed"
                    >
                      <Bot className="w-5 h-5 text-[#819089] mx-auto mb-2" />
                      <span className="text-[9px] font-semibold font-mono text-[#819089] uppercase block">
                        Ask AI
                      </span>
                    </button>
                  </div>
                </section>

                <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                  <h3 className="font-semibold text-sm text-[#F8FAF8] mb-4">
                    Operations Workflow
                  </h3>
                  {data.workflow.stages.length ? (
                    <div className="space-y-4 border-l border-[#387A4E]/20 pl-5">
                      {data.workflow.stages.map((stage) => (
                        <div key={stage.name} className="relative">
                          <span
                            className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full ${
                              stage.status === 'COMPLETED'
                                ? 'bg-[#22C55E]'
                                : 'bg-[#3B82F6]'
                            }`}
                          />
                          <p className="text-xs font-semibold text-[#F8FAF8]">
                            {stage.name}
                          </p>
                          {stage.totalTasks !== undefined ? (
                            <p className="text-[10px] font-mono text-[#AEB9B3]">
                              {stage.completedTasks}/
                              {stage.totalTasks} tasks complete
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#AEB9B3]">
                      No active workflow.
                    </p>
                  )}
                </section>

                {data.criticalAlerts.length ? (
                  <section className="bg-red-950/60 border-0 rounded-2xl p-5 shadow-lg">
                    <h3 className="font-semibold text-sm text-[#EF4444] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      Critical Alerts
                    </h3>
                    <div className="space-y-2 mt-3">
                      {data.criticalAlerts.map((alert) => (
                        <Link
                          key={alert.id}
                          to={
                            alert.taskId
                              ? `/field/tasks/${alert.taskId}`
                              : `/field/assignments/${alert.assignmentId}`
                          }
                          className="block text-xs text-red-200 bg-[#121A16] border-0 p-3 rounded-xl hover:bg-[#18211D] transition-all"
                        >
                          {alert.message}
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="bg-[#18211D] border-0 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                  <h3 className="font-semibold text-sm text-[#F8FAF8] mb-4">
                    Operations Log
                  </h3>
                  {data.recentActivity.length ? (
                    <div className="space-y-3">
                      {data.recentActivity.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 border-b border-[#387A4E]/15 pb-3 last:border-0"
                        >
                          <FileText className="w-4 h-4 text-[#76B78C] shrink-0" />
                          <div>
                            <p className="text-xs text-[#F8FAF8]">{item.message}</p>
                            <p className="text-[10px] font-mono text-[#819089] mt-1">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[#AEB9B3] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#76B78C]" />
                      No activity recorded yet.
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </FieldShell>
  );
}
