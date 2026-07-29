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
    <div className="flex items-center gap-3 p-3 border border-[#D4D8D0] rounded-xl">
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${
          task.priority === 'CRITICAL'
            ? 'bg-[#C65C52]'
            : task.priority === 'HIGH'
              ? 'bg-[#C89442]'
              : 'bg-[#5F7F52]'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate">
          {task.title}
        </p>
        <p className="text-[9px] font-mono text-[#6C756D] truncate">
          {task.projectName ?? 'Assigned operation'} ·{' '}
          {formatDate(task.dueAt)}
        </p>
      </div>
      <Link
        to={`/field/tasks/${task.id}`}
        aria-label={`Open ${task.title}`}
        className="p-2 text-[#5F7F52] hover:bg-[#EAF3E7] rounded-lg"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="h-36 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
        <div className="h-80 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
      </div>
    </div>
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
    >
      <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D4D8D0] bg-[#FBFAEF] text-[10px] font-bold uppercase text-[#6C756D] disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {!hasAssignments ? (
          <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-8 md:p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EFF0EA] flex items-center justify-center">
              <Compass className="w-7 h-7 text-[#5F7F52]" />
            </div>
            <h2 className="mt-5 text-xl font-bold">
              No field assignments have been issued yet.
            </h2>
            <p className="mt-2 text-sm text-[#6C756D] max-w-xl mx-auto">
              Projects, sectors and tasks will appear here after a
              supervising officer assigns work to you.
            </p>
            <Link
              to="/field/notifications"
              className="inline-flex mt-6 text-xs font-bold text-[#5F7F52]"
            >
              Check notifications
            </Link>
          </section>
        ) : (
          <>
            <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-[#5F7F52]">
                  Priority Action
                </p>
                <h2 className="mt-1 text-lg font-bold">
                  {data.priorityAction?.title ??
                    'No incomplete tasks'}
                </h2>
                <p className="text-xs text-[#6C756D] mt-1">
                  {data.priorityAction
                    ? `${data.priorityAction.projectName ?? 'Assigned project'} · ${data.priorityAction.priority} priority`
                    : 'All currently assigned tasks are complete.'}
                </p>
              </div>
              {data.priorityAction ? (
                <Link
                  to={`/field/tasks/${data.priorityAction.id}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#5F7F52] hover:bg-[#90A982] text-white text-xs font-bold uppercase tracking-widest"
                >
                  Open Task
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : null}
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Active assignments', data.summary.activeAssignments],
                ['Pending tasks', data.summary.pendingTasks],
                ['Overdue tasks', data.summary.overdueTasks],
                ['Completed tasks', data.summary.completedTasks],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-xl p-4"
                >
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-[9px] font-mono uppercase text-[#6C756D]">
                    {label}
                  </p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm">
                      Today&apos;s Operations
                    </h3>
                    <Link
                      to="/field/tasks"
                      className="text-[9px] font-mono uppercase text-[#5F7F52]"
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
                    <p className="text-xs text-[#6C756D] py-8 text-center">
                      No tasks are due or newly assigned today.
                    </p>
                  )}
                </section>

                <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-sm">
                      Assigned Sectors
                    </h3>
                    <span className="text-[9px] font-mono text-[#6C756D]">
                      {data.assignedSectors.length} sectors
                    </span>
                  </div>
                  {data.assignedSectors.length ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {data.assignedSectors.map((sector) => (
                        <article
                          key={sector.id}
                          className="border border-[#D4D8D0] rounded-xl p-4"
                        >
                          <h4 className="text-xs font-bold">
                            {sector.name}
                          </h4>
                          <p className="text-[9px] font-mono text-[#6C756D] mt-1">
                            {sector.projectName} ·{' '}
                            {sector.areaHectares.toFixed(2)} ha
                          </p>
                          <div className="mt-4">
                            <div className="flex justify-between text-[9px]">
                              <span>Task completion</span>
                              <span>{sector.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-[#EFF0EA] rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-[#5F7F52]"
                                style={{
                                  width: `${sector.progress}%`,
                                }}
                              />
                            </div>
                          </div>
                          <Link
                            to={`/field/map?sector=${sector.id}`}
                            className="mt-4 inline-flex items-center text-[9px] font-bold uppercase text-[#5F7F52]"
                          >
                            Details
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C756D] py-8 text-center">
                      No land sector is attached to your active
                      assignments.
                    </p>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
                  <h3 className="font-semibold text-sm mb-4">
                    Quick Operations
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      to="/field/map"
                      className="p-3 border border-[#D4D8D0] rounded-xl text-center hover:bg-[#EAF3E7]"
                    >
                      <Compass className="w-5 h-5 text-[#5F7F52] mx-auto mb-2" />
                      <span className="text-[8px] font-bold uppercase">
                        Open Map
                      </span>
                    </Link>
                    <Link
                      to="/field/report-change"
                      className="p-3 border border-[#D4D8D0] rounded-xl text-center hover:bg-[#EAF3E7]"
                    >
                      <AlertTriangle className="w-5 h-5 text-[#5F7F52] mx-auto mb-2" />
                      <span className="text-[8px] font-bold uppercase">
                        Report Change
                      </span>
                    </Link>
                    <button
                      type="button"
                      disabled
                      title="AI Field Assistant is coming soon."
                      className="p-3 border border-[#D4D8D0] rounded-xl text-center opacity-50 cursor-not-allowed"
                    >
                      <Bot className="w-5 h-5 text-[#5F7F52] mx-auto mb-2" />
                      <span className="text-[8px] font-bold uppercase">
                        Ask AI · Soon
                      </span>
                    </button>
                  </div>
                </section>

                <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
                  <h3 className="font-semibold text-sm mb-4">
                    Operations Workflow
                  </h3>
                  {data.workflow.stages.length ? (
                    <div className="space-y-4 border-l border-[#D4D8D0] pl-5">
                      {data.workflow.stages.map((stage) => (
                        <div key={stage.name} className="relative">
                          <span
                            className={`absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full ${
                              stage.status === 'COMPLETED'
                                ? 'bg-[#5F7F52]'
                                : 'bg-[#6F9FC6]'
                            }`}
                          />
                          <p className="text-xs font-semibold">
                            {stage.name}
                          </p>
                          {stage.totalTasks !== undefined ? (
                            <p className="text-[9px] text-[#6C756D]">
                              {stage.completedTasks}/
                              {stage.totalTasks} tasks complete
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6C756D]">
                      No active workflow.
                    </p>
                  )}
                </section>

                {data.criticalAlerts.length ? (
                  <section className="bg-[#FDF1F0] border border-[#C65C52]/30 rounded-2xl p-5">
                    <h3 className="font-semibold text-sm text-[#C65C52] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
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
                          className="block text-xs text-[#C65C52] bg-white/60 border border-[#C65C52]/20 p-2.5 rounded-lg"
                        >
                          {alert.message}
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6">
                  <h3 className="font-semibold text-sm mb-4">
                    Operations Log
                  </h3>
                  {data.recentActivity.length ? (
                    <div className="space-y-3">
                      {data.recentActivity.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 border-b border-[#D4D8D0]/60 pb-3 last:border-0"
                        >
                          <FileText className="w-4 h-4 text-[#6C756D] shrink-0" />
                          <div>
                            <p className="text-xs">{item.message}</p>
                            <p className="text-[8px] font-mono text-[#6C756D] mt-1">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[#6C756D] flex items-center gap-2">
                      <Clock className="w-4 h-4" />
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
