import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  CheckCircle2,
  ClipboardPlus,
  FolderPlus,
  LogOut,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { GeotwinLogo } from '../components/shared/GeotwinLogo';
import { ApiError } from '../lib/apiClient';
import { supervisorAssignmentsService } from '../services/supervisorAssignments.service';
import type {
  AssignmentTaskInput,
  FieldAssignment,
  FieldOfficerOption,
  LandSector,
  RestorationProject,
  TaskPriority,
} from '../types/fieldOperations';
import { getCurrentUser, logoutUser } from '../utils/auth';

const emptyTask = (): AssignmentTaskInput => ({
  title: '',
  description: '',
  taskType: 'FIELD_VERIFICATION',
  priority: 'MEDIUM',
  dueAt: '',
  requiresEvidence: false,
});

export default function SupervisorDashboardPlaceholder() {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState<
    FieldOfficerOption[]
  >([]);
  const [projects, setProjects] = useState<
    RestorationProject[]
  >([]);
  const [sectors, setSectors] = useState<LandSector[]>([]);
  const [assignments, setAssignments] = useState<
    FieldAssignment[]
  >([]);
  const [officerId, setOfficerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<AssignmentTaskInput[]>([
    emptyTask(),
  ]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState(
    'Supervisor Officer',
  );
  const [showProjectCreator, setShowProjectCreator] =
    useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] =
    useState('');
  const [creatingProject, setCreatingProject] =
    useState(false);

  async function load() {
    setLoading(true);
    try {
      const [
        officerItems,
        projectItems,
        assignmentItems,
        currentUser,
      ] =
        await Promise.all([
          supervisorAssignmentsService.getFieldOfficers(),
          supervisorAssignmentsService.getProjects(),
          supervisorAssignmentsService.getAssignments(),
          getCurrentUser(),
        ]);
      setOfficers(officerItems);
      setProjects(projectItems);
      setAssignments(assignmentItems);
      if (currentUser?.name) {
        setSupervisorName(currentUser.name);
      }
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to load supervisor assignment data.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => void load(), []);

  useEffect(() => {
    if (!projectId) {
      setSectors([]);
      setSectorId('');
      return;
    }
    void supervisorAssignmentsService
      .getSectors(projectId)
      .then((items) => {
        setSectors(items);
        setSectorId('');
      })
      .catch((requestError) =>
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Unable to load project sectors.',
        ),
      );
  }, [projectId]);

  function updateTask(
    index: number,
    patch: Partial<AssignmentTaskInput>,
  ) {
    setTasks((current) =>
      current.map((task, taskIndex) =>
        taskIndex === index ? { ...task, ...patch } : task,
      ),
    );
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    if (projectName.trim().length < 3) {
      setError('Project name must contain at least 3 characters.');
      return;
    }
    setCreatingProject(true);
    setError(null);
    setSuccess(null);
    try {
      const project =
        await supervisorAssignmentsService.createProject({
          name: projectName.trim(),
          description:
            projectDescription.trim() || undefined,
        });
      setProjects((current) => [
        project,
        ...current.filter((item) => item.id !== project.id),
      ]);
      setProjectId(project.id);
      setProjectName('');
      setProjectDescription('');
      setShowProjectCreator(false);
      setSuccess(
        'Project created. You can now issue its field assignment.',
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to create project.',
      );
    } finally {
      setCreatingProject(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalidTask = tasks.some(
      (task) => task.title.trim().length < 3,
    );
    if (!officerId) {
      setError('Select a field officer.');
      return;
    }
    if (!projectId) {
      setError(
        'Select a project, or create one before issuing the assignment.',
      );
      return;
    }
    if (invalidTask) {
      setError('Every task needs a title of at least 3 characters.');
      return;
    }
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      await supervisorAssignmentsService.createAssignment({
        projectId,
        sectorId: sectorId || undefined,
        assignedToProfileId: officerId,
        assignmentType: 'FIELD_MISSION',
        dueDate: dueDate || undefined,
        instructions: instructions || undefined,
        tasks: tasks.map((task) => ({
          ...task,
          dueAt: task.dueAt
            ? `${task.dueAt}T17:00:00.000Z`
            : undefined,
        })),
      });
      setSuccess(
        'Assignment created. The field officer was notified.',
      );
      setInstructions('');
      setDueDate('');
      setTasks([emptyTask()]);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Unable to create assignment.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    await logoutUser();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#E8E9E2] text-[#252B26] flex font-sans">
      <aside className="hidden md:flex w-64 bg-[#243028] p-6 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GeotwinLogo size={36} iconOnly />
            <span className="font-bold text-sm uppercase text-[#D7DED5]">
              GeoTwin
            </span>
          </div>
          <div className="mt-8 px-3.5 py-2.5 rounded-lg bg-[#344638] text-white text-xs font-semibold flex items-center gap-3">
            <ClipboardPlus className="w-4 h-4" />
            Assignment Centre
          </div>
        </div>
        <div className="border-t border-[#D4D8D0]/10 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#344638] flex items-center justify-center text-xs font-bold text-[#D7DED5]">
              {supervisorName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#D7DED5] truncate">
                {supervisorName}
              </p>
              <p className="text-[8px] font-mono text-[#A9B3A8] uppercase tracking-wider">
                Supervisor Officer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full flex items-center gap-3 text-xs text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="h-16 bg-[#FBFAEF] border-b border-[#D4D8D0] px-6 flex items-center sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-bold">
              Supervisor Assignment Centre
            </h1>
            <p className="text-[9px] font-mono text-[#6C756D]">
              Issue controlled field work
            </p>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <ClipboardPlus className="w-5 h-5 text-[#5F7F52]" />
              <div>
                <h2 className="font-bold">
                  Create field assignment
                </h2>
                <p className="text-xs text-[#6C756D]">
                  Tasks and notification are created transactionally.
                </p>
              </div>
            </div>
            {error ? (
              <div className="mt-4 p-3 bg-[#FDF1F0] text-[#C65C52] rounded-lg text-xs">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="mt-4 p-3 bg-[#EAF3E7] text-[#5F7F52] rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            ) : null}
            {!loading &&
            (showProjectCreator || projects.length === 0) ? (
              <form
                onSubmit={(event) =>
                  void createProject(event)
                }
                className="mt-5 p-4 border border-[#5F7F52]/30 bg-[#EAF3E7]/40 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-[#5F7F52]" />
                      {projects.length
                        ? 'Create another project'
                        : 'Create your first project'}
                    </h3>
                    <p className="text-[10px] text-[#6C756D] mt-1">
                      An assignment must belong to a supervisor-created
                      project.
                    </p>
                  </div>
                  {projects.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setShowProjectCreator(false)
                      }
                      className="text-[10px] font-bold text-[#6C756D]"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={projectName}
                    onChange={(event) =>
                      setProjectName(event.target.value)
                    }
                    placeholder="Project name"
                    aria-label="Project name"
                    className="p-3 border border-[#D4D8D0] rounded-lg bg-white text-xs"
                  />
                  <input
                    value={projectDescription}
                    onChange={(event) =>
                      setProjectDescription(event.target.value)
                    }
                    placeholder="Short description (optional)"
                    aria-label="Project description"
                    className="p-3 border border-[#D4D8D0] rounded-lg bg-white text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="px-4 py-2.5 bg-[#5F7F52] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  {creatingProject
                    ? 'Creating project…'
                    : 'Create Project'}
                </button>
              </form>
            ) : null}
            {loading ? (
              <div className="mt-6 h-64 bg-[#EFF0EA] rounded-xl animate-pulse" />
            ) : (
              <form
                onSubmit={(event) => void submit(event)}
                className="mt-6 space-y-5"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="text-xs font-semibold">
                    Field officer
                    <select
                      value={officerId}
                      onChange={(event) =>
                        setOfficerId(event.target.value)
                      }
                      className="mt-2 w-full p-3 border border-[#D4D8D0] rounded-xl bg-white"
                    >
                      <option value="">Select officer</option>
                      {officers.map((officer) => (
                        <option
                          key={officer.id}
                          value={officer.id}
                        >
                          {officer.displayName}
                          {officer.email
                            ? ` — ${officer.email}`
                            : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span>Project</span>
                      {projects.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setShowProjectCreator(true)
                          }
                          className="text-[9px] text-[#5F7F52] font-bold"
                        >
                          + New project
                        </button>
                      ) : null}
                    </div>
                    <select
                      value={projectId}
                      onChange={(event) =>
                        setProjectId(event.target.value)
                      }
                      className="mt-2 w-full p-3 border border-[#D4D8D0] rounded-xl bg-white"
                    >
                      <option value="">Select project</option>
                      {projects.map((project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="text-xs font-semibold">
                    Sector
                    <select
                      value={sectorId}
                      onChange={(event) =>
                        setSectorId(event.target.value)
                      }
                      disabled={!projectId}
                      className="mt-2 w-full p-3 border border-[#D4D8D0] rounded-xl bg-white disabled:opacity-50"
                    >
                      <option value="">Project-wide</option>
                      {sectors.map((sector) => (
                        <option
                          key={sector.id}
                          value={sector.id}
                        >
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold">
                    Assignment due date
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(event) =>
                        setDueDate(event.target.value)
                      }
                      className="mt-2 w-full p-3 border border-[#D4D8D0] rounded-xl bg-white"
                    />
                  </label>
                </div>
                <label className="block text-xs font-semibold">
                  Instructions
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={(event) =>
                      setInstructions(event.target.value)
                    }
                    className="mt-2 w-full p-3 border border-[#D4D8D0] rounded-xl bg-white"
                  />
                </label>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase">
                      Tasks
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setTasks((current) => [
                          ...current,
                          emptyTask(),
                        ])
                      }
                      className="text-[10px] font-bold text-[#5F7F52] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add task
                    </button>
                  </div>
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className="p-4 border border-[#D4D8D0] rounded-xl grid md:grid-cols-2 gap-3"
                    >
                      <input
                        placeholder="Task title"
                        value={task.title}
                        onChange={(event) =>
                          updateTask(index, {
                            title: event.target.value,
                          })
                        }
                        className="p-3 border border-[#D4D8D0] rounded-lg text-xs"
                      />
                      <select
                        value={task.priority}
                        onChange={(event) =>
                          updateTask(index, {
                            priority: event.target
                              .value as TaskPriority,
                          })
                        }
                        className="p-3 border border-[#D4D8D0] rounded-lg text-xs"
                      >
                        {[
                          'LOW',
                          'MEDIUM',
                          'HIGH',
                          'CRITICAL',
                        ].map((priority) => (
                          <option
                            key={priority}
                            value={priority}
                          >
                            {priority}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={task.dueAt}
                        onChange={(event) =>
                          updateTask(index, {
                            dueAt: event.target.value,
                          })
                        }
                        className="p-3 border border-[#D4D8D0] rounded-lg text-xs"
                      />
                      <div className="flex justify-between items-center">
                        <label className="text-xs flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.requiresEvidence}
                            onChange={(event) =>
                              updateTask(index, {
                                requiresEvidence:
                                  event.target.checked,
                              })
                            }
                          />
                          Requires evidence
                        </label>
                        {tasks.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setTasks((current) =>
                                current.filter(
                                  (_, itemIndex) =>
                                    itemIndex !== index,
                                ),
                              )
                            }
                            aria-label={`Remove task ${index + 1}`}
                            className="p-2 text-[#C65C52]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={working}
                  className="w-full py-3 bg-[#5F7F52] text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {working
                    ? 'Creating assignment…'
                    : 'Issue Assignment'}
                </button>
                {!officerId ||
                !projectId ||
                tasks.some(
                  (task) => task.title.trim().length < 3,
                ) ? (
                  <p className="text-[10px] text-[#6C756D] text-center">
                    Select an officer and project, then provide a
                    task title to issue the assignment.
                  </p>
                ) : (
                  <p className="text-[10px] text-[#5F7F52] text-center">
                    Ready to issue. The field officer will be
                    notified automatically.
                  </p>
                )}
              </form>
            )}
          </section>

          <aside className="space-y-5">
            <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5">
              <h2 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5F7F52]" />
                Available officers
              </h2>
              <p className="text-2xl font-bold mt-3">
                {officers.length}
              </p>
              <p className="text-[9px] font-mono uppercase text-[#6C756D]">
                active field profiles
              </p>
            </section>
            <section className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5">
              <h2 className="font-bold text-sm">
                Recent assignments
              </h2>
              {assignments.length ? (
                <div className="space-y-3 mt-4">
                  {assignments.slice(0, 6).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border-b border-[#D4D8D0] pb-3 last:border-0"
                    >
                      <p className="text-xs font-semibold">
                        {assignment.project?.name}
                      </p>
                      <p className="text-[8px] font-mono text-[#6C756D] mt-1">
                        {assignment.status} ·{' '}
                        {assignment.tasks.length} tasks
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6C756D] mt-3">
                  No assignments have been issued.
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
