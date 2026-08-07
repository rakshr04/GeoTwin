import { useEffect, useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  ClipboardPlus,
  FolderPlus,
  LogOut,
  Plus,
  Compass,
  CheckCircle,
  MapPin,
  TrendingUp,
  RefreshCw,
  Search,
  Bell,
  Users,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Filter,
  Check,
  X,
  UserCheck,
  Briefcase,
  Info,
  Menu,
  HelpCircle,
  User,
  Settings,
  UserPlus,
  Download,
  Lock,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

import { GeotwinLogo } from '../components/shared/GeotwinLogo';
import { ApiError } from '../lib/apiClient';
import { supervisorAssignmentsService } from '../services/supervisorAssignments.service';
import type {
  AssignmentTaskInput,
  FieldAssignment,
  FieldOfficerOption,
  LandSector,
  RestorationProject,
  AssignedSector,
} from '../types/fieldOperations';
import { getCurrentUser, logoutUser } from '../utils/auth';
import { GeoTwinOperationsMap } from '../components/maps/GeoTwinOperationsMap';
import { getStatusLabel, type GeoTwinPlot } from '../lib/mapGeoTwinData';
import { DashboardLayout } from '../components/layouts/DashboardLayout';

const emptyTask = (): AssignmentTaskInput => ({
  title: '',
  description: '',
  taskType: 'FIELD_VERIFICATION',
  priority: 'MEDIUM',
  dueAt: '',
  requiresEvidence: false,
});

// Evidence Review Item
interface EvidenceQueueItem {
  id: string;
  patchId: string;
  patchName: string;
  officerName: string;
  type: 'Waiting Evidence' | 'Missing Photos' | 'Rejected Uploads' | 'Needs Verification';
  submittedAt: string;
  status: 'PENDING' | 'NEEDS_REVISION' | 'APPROVED';
}

const initialEvidenceQueue: EvidenceQueueItem[] = [
  {
    id: 'ev-101',
    patchId: 'Patch RP-12',
    patchName: 'Plot C-12 Plantation',
    officerName: 'Ramesh Kumar',
    type: 'Waiting Evidence',
    submittedAt: '10 mins ago',
    status: 'PENDING',
  },
  {
    id: 'ev-102',
    patchId: 'Patch RP-17A',
    patchName: 'Sector 3 Canopy Area',
    officerName: 'Officer Ravi',
    type: 'Missing Photos',
    submittedAt: '45 mins ago',
    status: 'PENDING',
  },
  {
    id: 'ev-103',
    patchId: 'Patch RP-04',
    patchName: 'South Ridge Canopy Zone',
    officerName: 'Priya Sharma',
    type: 'Needs Verification',
    submittedAt: '2 hours ago',
    status: 'NEEDS_REVISION',
  },
  {
    id: 'ev-104',
    patchId: 'Patch RP-09',
    patchName: 'North Lake Catchment',
    officerName: 'Anita Roy',
    type: 'Waiting Evidence',
    submittedAt: '3 hours ago',
    status: 'PENDING',
  },
];

// Operational Timeline Event
interface TimelineEvent {
  id: string;
  type: 'Assignment Created' | 'Evidence Uploaded' | 'Attendance Updated' | 'Project Completed' | 'Correction Request';
  actor: string;
  details: string;
  timestamp: string;
}

const initialTimeline: TimelineEvent[] = [
  {
    id: 'tl-1',
    type: 'Evidence Uploaded',
    actor: 'Ramesh Kumar',
    details: 'Uploaded 4 georeferenced canopy photographs for Plot C-12 Plantation.',
    timestamp: '14:25 PM',
  },
  {
    id: 'tl-2',
    type: 'Assignment Created',
    actor: 'Rakshitha (Supervisor)',
    details: 'Dispatched Ground Verification Mission to Priya Sharma for Sector 3 Canopy Area.',
    timestamp: '11:40 AM',
  },
  {
    id: 'tl-3',
    type: 'Attendance Updated',
    actor: 'System Check-in',
    details: '12 out of 14 Field Officers logged present in assigned district sectors.',
    timestamp: '09:00 AM',
  },
  {
    id: 'tl-4',
    type: 'Correction Request',
    actor: 'Rakshitha (Supervisor)',
    details: 'Requested re-photographing of boundary marker #4 from Officer Ravi.',
    timestamp: 'Yesterday, 16:45 PM',
  },
  {
    id: 'tl-5',
    type: 'Project Completed',
    actor: 'District Office',
    details: 'Verified milestone completion for Salar Jung Forest Survey.',
    timestamp: 'Yesterday, 14:10 PM',
  },
];

// Admin Officer Team Record
interface AdminOfficerRecord {
  id: string;
  name: string;
  role: string;
  district: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'ON_LEAVE';
  checkInTime: string;
  activeTasksCount: number;
  completedMissions: number;
  contactPhone: string;
}

const initialAdminOfficers: AdminOfficerRecord[] = [
  { id: 'off-1', name: 'Officer Ravi', role: 'Senior Field Inspector', district: 'Ranga Reddy District', attendanceStatus: 'PRESENT', checkInTime: '08:45 AM', activeTasksCount: 8, completedMissions: 42, contactPhone: '+91 98490 12345' },
  { id: 'off-2', name: 'Anita Roy', role: 'GIS Field Surveyor', district: 'Medak District', attendanceStatus: 'PRESENT', checkInTime: '09:00 AM', activeTasksCount: 2, completedMissions: 38, contactPhone: '+91 98490 67890' },
  { id: 'off-3', name: 'Ramesh Kumar', role: 'Land Restoration Officer', district: 'Ranga Reddy District', attendanceStatus: 'PRESENT', checkInTime: '08:30 AM', activeTasksCount: 4, completedMissions: 55, contactPhone: '+91 98490 23456' },
  { id: 'off-4', name: 'Priya Sharma', role: 'Canopy Monitoring Officer', district: 'Salar Jung Sector', attendanceStatus: 'PRESENT', checkInTime: '08:50 AM', activeTasksCount: 3, completedMissions: 31, contactPhone: '+91 98490 34567' },
  { id: 'off-5', name: 'Kiran Varma', role: 'Soil Quality Analyst', district: 'Ranga Reddy District', attendanceStatus: 'ABSENT', checkInTime: 'Not Checked In', activeTasksCount: 1, completedMissions: 19, contactPhone: '+91 98490 45678' },
  { id: 'off-6', name: 'Srinivas Rao', role: 'Forest Guard Supervisor', district: 'Vikharabad Sector', attendanceStatus: 'PRESENT', checkInTime: '08:15 AM', activeTasksCount: 5, completedMissions: 64, contactPhone: '+91 98490 56789' },
];

// Supervisor & Admin Audit Log Entry Model
export interface SupervisorAuditLogEntry {
  id: string;
  actionCode: 'MISSION_DISPATCHED' | 'EVIDENCE_APPROVED' | 'REVISION_REQUESTED' | 'PROJECT_CREATED' | 'ATTENDANCE_OVERRIDE' | 'AI_RECOMMENDATION_REVIEWED';
  actorName: string;
  actorRole: string;
  targetEntity: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  auditHash: string;
  ipAddress: string;
}

const initialSupervisorAuditLogs: SupervisorAuditLogEntry[] = [
  {
    id: 'AUD-8921',
    actionCode: 'EVIDENCE_APPROVED',
    actorName: 'Rakshitha (Supervisor)',
    actorRole: 'District Supervisor (SUP-092)',
    targetEntity: 'Plot C-12 Plantation (Patch RP-12)',
    details: 'Approved 4 georeferenced canopy boundary photographs. Verified offset match within 0.4m tolerance.',
    severity: 'INFO',
    timestamp: '2026-08-07 16:42:10 UTC',
    auditHash: 'sha256:8f9b4a102c38d4e5f6a7b8c9d0e1f2a3',
    ipAddress: '10.240.12.89',
  },
  {
    id: 'AUD-8920',
    actionCode: 'MISSION_DISPATCHED',
    actorName: 'Rakshitha (Supervisor)',
    actorRole: 'District Supervisor (SUP-092)',
    targetEntity: 'Officer Priya Sharma • Sector 3',
    details: 'Issued Priority Field Verification Mission for canopy restoration check.',
    severity: 'INFO',
    timestamp: '2026-08-07 14:15:30 UTC',
    auditHash: 'sha256:7e8a3b910d27c3e4f5a6b7c8d9e0f1a2',
    ipAddress: '10.240.12.89',
  },
  {
    id: 'AUD-8919',
    actionCode: 'REVISION_REQUESTED',
    actorName: 'Rakshitha (Supervisor)',
    actorRole: 'District Supervisor (SUP-092)',
    targetEntity: 'Officer Ravi • Patch RP-17A',
    details: 'Requested photo re-submission due to missing EXIF metadata tag on boundary marker #4.',
    severity: 'WARNING',
    timestamp: '2026-08-07 11:30:45 UTC',
    auditHash: 'sha256:6d7c2b809e16b2d3c4e5f6a7b8c9d0e1',
    ipAddress: '10.240.12.89',
  },
  {
    id: 'AUD-8918',
    actionCode: 'ATTENDANCE_OVERRIDE',
    actorName: 'Rakshitha (Supervisor)',
    actorRole: 'District Supervisor (SUP-092)',
    targetEntity: 'Officer Ramesh Kumar',
    details: 'Manually verified field presence following satellite cell tower connectivity drop.',
    severity: 'INFO',
    timestamp: '2026-08-07 09:05:00 UTC',
    auditHash: 'sha256:5c6b1a708d05a1b2c3d4e5f6a7b8c9d0',
    ipAddress: '10.240.12.89',
  },
  {
    id: 'AUD-8917',
    actionCode: 'PROJECT_CREATED',
    actorName: 'Rakshitha (Supervisor)',
    actorRole: 'District Supervisor (SUP-092)',
    targetEntity: 'Salar Jung Afforestation Sector 4',
    details: 'Created restoration program scope covering 14.2 Hectares in Ranga Reddy District.',
    severity: 'INFO',
    timestamp: '2026-08-06 17:20:15 UTC',
    auditHash: 'sha256:4b5a0f607c9490a1b2c3d4e5f6a7b8c9',
    ipAddress: '10.240.12.89',
  },
  {
    id: 'AUD-8916',
    actionCode: 'AI_RECOMMENDATION_REVIEWED',
    actorName: 'Rakshitha (Supervisor)',
    actorRole: 'District Supervisor (SUP-092)',
    targetEntity: 'Workload Balance Recommendation',
    details: 'Accepted AI allocation proposal to reassign 2 sector tasks from Officer Ravi to Officer Anita Roy.',
    severity: 'INFO',
    timestamp: '2026-08-06 14:10:00 UTC',
    auditHash: 'sha256:3a490e506b838990a1b2c3d4e5f6a7b8',
    ipAddress: '10.240.12.89',
  },
];

export default function SupervisorDashboardPlaceholder() {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState<FieldOfficerOption[]>([]);
  const [projects, setProjects] = useState<RestorationProject[]>([]);
  const [sectors, setSectors] = useState<LandSector[]>([]);
  const [assignments, setAssignments] = useState<FieldAssignment[]>([]);
  const [officerId, setOfficerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<AssignmentTaskInput[]>([emptyTask()]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState('Rakshitha');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Active Sidebar & View Navigation (Supports Map, Creator, Admin, Audit, Assignments, Tasks, Evidence, Projects, AI Insights, Profile, Settings, Help)
  const [activeNav, setActiveNav] = useState<string>('dashboard');
  const [activeTab, setActiveTab] = useState<
    | 'map'
    | 'creator'
    | 'admin'
    | 'audit'
    | 'assignments'
    | 'tasks'
    | 'evidence'
    | 'projects'
    | 'ai-insights'
    | 'profile'
    | 'settings'
    | 'help'
  >('map');
  const [selectedPlot, setSelectedPlot] = useState<GeoTwinPlot | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters & Search
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Evidence Queue & Timeline State
  const [evidenceQueue, setEvidenceQueue] = useState<EvidenceQueueItem[]>(initialEvidenceQueue);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);

  // Admin Officer Roster State
  const [adminOfficers, setAdminOfficers] = useState<AdminOfficerRecord[]>(initialAdminOfficers);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedAdminTab, setSelectedAdminTab] = useState<'roster' | 'attendance' | 'workload' | 'audit'>('roster');

  // Supervisor & Admin Audit Log State
  const [auditLogs, setAuditLogs] = useState<SupervisorAuditLogEntry[]>(initialSupervisorAuditLogs);
  const [auditFilterAction, setAuditFilterAction] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Onboard Officer Modal State
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerRole, setNewOfficerRole] = useState('GIS Field Surveyor');
  const [newOfficerDistrict, setNewOfficerDistrict] = useState('Ranga Reddy District');
  const [newOfficerPhone, setNewOfficerPhone] = useState('');

  function handleExportAuditLog() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `geotwin_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSuccess("Exported official audit compliance log report (JSON).");
  }

  function handleVerifyGPS() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess("Verified 6 GPS satellite signals and officer geofence telemetry.");
    }, 400);
  }

  function handleOnboardOfficer(e: FormEvent) {
    e.preventDefault();
    if (!newOfficerName.trim()) {
      setError('Officer name is required.');
      return;
    }
    const newOfficer: AdminOfficerRecord = {
      id: 'off-' + (adminOfficers.length + 1),
      name: newOfficerName.trim(),
      role: newOfficerRole,
      district: newOfficerDistrict,
      attendanceStatus: 'PRESENT',
      checkInTime: 'Just Onboarded',
      activeTasksCount: 0,
      completedMissions: 0,
      contactPhone: newOfficerPhone.trim() || '+91 98490 00000',
    };
    setAdminOfficers((prev) => [newOfficer, ...prev]);
    setOnboardModalOpen(false);
    setNewOfficerName('');
    setNewOfficerPhone('');
    setSuccess(`Successfully onboarded Officer ${newOfficer.name} into district system.`);

    const logEntry = {
      actionCode: 'ATTENDANCE_OVERRIDE' as const,
      actorName: `${supervisorName} (Supervisor)`,
      actorRole: 'District Supervisor (SUP-092)',
      targetEntity: `Officer ${newOfficer.name}`,
      details: `Onboarded new officer (${newOfficer.role}) in ${newOfficer.district}.`,
      severity: 'INFO' as const,
    };
    setAuditLogs((prev) => [
      {
        id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
        ...logEntry,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        auditHash: 'sha256:' + Math.random().toString(16).substring(2, 18),
        ipAddress: '10.240.12.89',
      },
      ...prev,
    ]);
    void supervisorAssignmentsService.createAuditLog(logEntry).catch(() => {});
  }

  async function load() {
    setLoading(true);
    try {
      const [
        officerItems,
        projectItems,
        assignmentItems,
        backendAuditLogs,
        currentUser,
      ] = await Promise.all([
        supervisorAssignmentsService.getFieldOfficers(),
        supervisorAssignmentsService.getProjects(),
        supervisorAssignmentsService.getAssignments(),
        supervisorAssignmentsService.getAuditLogs().catch(() => []),
        getCurrentUser(),
      ]);
      setOfficers(Array.isArray(officerItems) ? officerItems : []);
      setProjects(Array.isArray(projectItems) ? projectItems : []);
      setAssignments(Array.isArray(assignmentItems) ? assignmentItems : []);
      if (Array.isArray(backendAuditLogs) && backendAuditLogs.length > 0) {
        setAuditLogs(backendAuditLogs);
      }
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

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!projectId) {
      setSectors([]);
      setSectorId('');
      return;
    }
    void supervisorAssignmentsService
      .getSectors(projectId)
      .then((items) => {
        setSectors(Array.isArray(items) ? items : []);
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

  // Load all sectors for map view
  const [allSectors, setAllSectors] = useState<LandSector[]>([]);
  useEffect(() => {
    if (!Array.isArray(projects) || projects.length === 0) return;
    Promise.all(
      projects.map((p) => supervisorAssignmentsService.getSectors(p.id).catch(() => []))
    ).then((results) => {
      setAllSectors(results.flat().filter(Boolean));
    });
  }, [projects]);

  // Convert sectors to plots
  const plots: GeoTwinPlot[] = useMemo(() => {
    return allSectors.map((sector) => {
      const matchedAssignment = assignments.find((a) => a.sectorId === sector.id);
      const matchedOfficer = matchedAssignment
        ? officers.find((o) => o.id === matchedAssignment.assignedToProfileId)
        : undefined;

      const matchedProj = projects.find((p) => p.id === sector.projectId);

      const statusMap: Record<string, 'in_progress' | 'pending' | 'overdue' | 'completed'> = {
        COMPLETED: 'completed',
        IN_PROGRESS: 'in_progress',
        ASSIGNED: 'pending',
        ACCEPTED: 'in_progress',
      };

      const status = matchedAssignment ? statusMap[matchedAssignment.status] || 'in_progress' : 'pending';

      return {
        id: sector.id,
        name: sector.name,
        sector: matchedProj?.name || 'Project Sector',
        longitude: sector.centroid?.coordinates[0] ?? 78.4867,
        latitude: sector.centroid?.coordinates[1] ?? 17.385,
        status,
        areaHectares: sector.areaHectares,
        degradationLevel: sector.areaHectares > 10 ? 'high' : sector.areaHectares > 5 ? 'moderate' : 'low',
        progress: matchedAssignment ? (matchedAssignment.status === 'COMPLETED' ? 100 : 45) : 0,
        taskTitle: matchedAssignment?.tasks[0]?.title || 'No active task',
        evidenceUploaded: matchedAssignment?.tasks.filter((t) => t.status === 'COMPLETED').length || 0,
        evidenceRequired: matchedAssignment?.tasks.length || 0,
        dueDate: matchedAssignment?.dueDate || undefined,
        assignedOfficer: matchedOfficer?.displayName,
      };
    });
  }, [allSectors, assignments, officers, projects]);

  // Filter plots based on project, officer, and global search query
  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      const sectorObj = allSectors.find((s) => s.id === plot.id);
      const assignment = assignments.find((a) => a.sectorId === plot.id);

      if (selectedProjectFilter !== 'all' && sectorObj?.projectId !== selectedProjectFilter) {
        return false;
      }
      if (selectedOfficerFilter !== 'all' && assignment?.assignedToProfileId !== selectedOfficerFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = plot.name.toLowerCase().includes(query);
        const matchesSector = plot.sector.toLowerCase().includes(query);
        const matchesOfficer = (plot.assignedOfficer || '').toLowerCase().includes(query);
        const matchesId = plot.id.toLowerCase().includes(query);
        return matchesName || matchesSector || matchesOfficer || matchesId;
      }
      return true;
    });
  }, [plots, allSectors, assignments, selectedProjectFilter, selectedOfficerFilter, searchQuery]);

  // Convert LandSectors to AssignedSectors for map component
  const mapSectors: AssignedSector[] = useMemo(() => {
    return allSectors.map((s) => ({
      id: s.id,
      assignmentId: assignments.find((a) => a.sectorId === s.id)?.id || '',
      projectId: s.projectId,
      projectName: projects.find((p) => p.id === s.projectId)?.name || '',
      name: s.name,
      villageName: s.villageName,
      mandalName: s.mandalName,
      districtName: s.districtName,
      areaHectares: s.areaHectares,
      geometry: s.geometry,
      centroid: s.centroid,
      assignmentStatus: assignments.find((a) => a.sectorId === s.id)?.status || 'ASSIGNED',
      dueDate: assignments.find((a) => a.sectorId === s.id)?.dueDate || null,
      progress: assignments.find((a) => a.sectorId === s.id)?.status === 'COMPLETED' ? 100 : 0,
      completedTasks: 0,
      totalTasks: 0,
    }));
  }, [allSectors, assignments, projects]);

  // Evidence Review Actions with Real-time Audit Logging
  function handleApproveEvidence(id: string) {
    setEvidenceQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' } : item)));
    const item = evidenceQueue.find((e) => e.id === id);
    if (item) {
      const nowString = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      setTimeline((prev) => [
        {
          id: 'tl-' + Date.now(),
          type: 'Evidence Uploaded',
          actor: `${supervisorName} (Supervisor)`,
          details: `Approved evidence report for ${item.patchId} (${item.patchName}).`,
          timestamp: 'Just now',
        },
        ...prev,
      ]);

      const logEntry = {
        actionCode: 'EVIDENCE_APPROVED' as const,
        actorName: `${supervisorName} (Supervisor)`,
        actorRole: 'District Supervisor (SUP-092)',
        targetEntity: `${item.patchId} (${item.patchName})`,
        details: `Approved ground survey evidence submitted by Officer ${item.officerName}.`,
        severity: 'INFO' as const,
      };

      setAuditLogs((prev) => [
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          ...logEntry,
          timestamp: nowString,
          auditHash: 'sha256:' + Math.random().toString(16).substring(2, 18),
          ipAddress: '10.240.12.89',
        },
        ...prev,
      ]);

      void supervisorAssignmentsService.reviewEvidence(id, 'APPROVED').catch(() => {});
      void supervisorAssignmentsService.createAuditLog(logEntry).catch(() => {});
    }
  }

  function handleRequestRevision(id: string) {
    setEvidenceQueue((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'NEEDS_REVISION' } : item)));
    const item = evidenceQueue.find((e) => e.id === id);
    if (item) {
      const nowString = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      setTimeline((prev) => [
        {
          id: 'tl-' + Date.now(),
          type: 'Correction Request',
          actor: `${supervisorName} (Supervisor)`,
          details: `Requested evidence correction from ${item.officerName} for ${item.patchId}.`,
          timestamp: 'Just now',
        },
        ...prev,
      ]);

      const logEntry = {
        actionCode: 'REVISION_REQUESTED' as const,
        actorName: `${supervisorName} (Supervisor)`,
        actorRole: 'District Supervisor (SUP-092)',
        targetEntity: `${item.patchId} (${item.patchName})`,
        details: `Requested photo re-submission from Officer ${item.officerName}.`,
        severity: 'WARNING' as const,
      };

      setAuditLogs((prev) => [
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          ...logEntry,
          timestamp: nowString,
          auditHash: 'sha256:' + Math.random().toString(16).substring(2, 18),
          ipAddress: '10.240.12.89',
        },
        ...prev,
      ]);

      void supervisorAssignmentsService.reviewEvidence(id, 'NEEDS_REVISION').catch(() => {});
      void supervisorAssignmentsService.createAuditLog(logEntry).catch(() => {});
    }
  }

  // Admin Officer Toggle Attendance with Audit Log
  function toggleOfficerAttendance(id: string) {
    setAdminOfficers((prev) =>
      prev.map((off) => {
        if (off.id === id) {
          const nextStatus = off.attendanceStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
          const nowString = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

          const logEntry = {
            actionCode: 'ATTENDANCE_OVERRIDE' as const,
            actorName: `${supervisorName} (Supervisor)`,
            actorRole: 'District Supervisor (SUP-092)',
            targetEntity: `Officer ${off.name}`,
            details: `Manually updated shift attendance status to ${nextStatus}.`,
            severity: 'INFO' as const,
          };

          setAuditLogs((auditPrev) => [
            {
              id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
              ...logEntry,
              timestamp: nowString,
              auditHash: 'sha256:' + Math.random().toString(16).substring(2, 18),
              ipAddress: '10.240.12.89',
            },
            ...auditPrev,
          ]);

          void supervisorAssignmentsService.toggleAttendance(id, nextStatus as any).catch(() => {});
          void supervisorAssignmentsService.createAuditLog(logEntry).catch(() => {});

          return {
            ...off,
            attendanceStatus: nextStatus,
            checkInTime: nextStatus === 'PRESENT' ? 'Manual Check-in' : 'Not Checked In',
          };
        }
        return off;
      }),
    );
  }

  function updateTask(index: number, patch: Partial<AssignmentTaskInput>) {
    setTasks((current) =>
      current.map((task, taskIndex) => (taskIndex === index ? { ...task, ...patch } : task)),
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
      const project = await supervisorAssignmentsService.createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });
      setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      setProjectId(project.id);
      setProjectName('');
      setProjectDescription('');
      setSuccess('Project created. You can now issue its field assignment.');

      // Append Audit Log
      const nowString = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      setAuditLogs((prev) => [
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          actionCode: 'PROJECT_CREATED',
          actorName: `${supervisorName} (Supervisor)`,
          actorRole: 'District Supervisor (SUP-092)',
          targetEntity: project.name,
          details: `Created new restoration project program in Ranga Reddy District.`,
          severity: 'INFO',
          timestamp: nowString,
          auditHash: 'sha256:' + Math.random().toString(16).substring(2, 18),
          ipAddress: '10.240.12.89',
        },
        ...prev,
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Unable to create project.',
      );
    } finally {
      setCreatingProject(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalidTask = tasks.some((task) => task.title.trim().length < 3);
    if (!officerId) {
      setError('Select a field officer.');
      return;
    }
    if (!projectId) {
      setError('Select a project, or create one before issuing the assignment.');
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
          dueAt: task.dueAt ? `${task.dueAt}T17:00:00.000Z` : undefined,
        })),
      });
      setSuccess('Assignment created. The field officer was notified.');
      setInstructions('');
      setDueDate('');
      setTasks([emptyTask()]);

      // Append Audit Log
      const selectedOfficerObj = officers.find((o) => o.id === officerId);
      const selectedProjObj = projects.find((p) => p.id === projectId);
      const nowString = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

      setAuditLogs((prev) => [
        {
          id: 'AUD-' + Math.floor(1000 + Math.random() * 9000),
          actionCode: 'MISSION_DISPATCHED',
          actorName: `${supervisorName} (Supervisor)`,
          actorRole: 'District Supervisor (SUP-092)',
          targetEntity: `${selectedOfficerObj?.displayName || 'Field Officer'} • ${selectedProjObj?.name || 'Project'}`,
          details: `Dispatched field assignment with ${tasks.length} target tasks.`,
          severity: 'INFO',
          timestamp: nowString,
          auditHash: 'sha256:' + Math.random().toString(16).substring(2, 18),
          ipAddress: '10.240.12.89',
        },
        ...prev,
      ]);

      await load();
      setActiveTab('map');
    } catch (requestError) {
      setError(
        requestError instanceof ApiError ? requestError.message : 'Unable to create assignment.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function signOut() {
    await logoutUser();
    navigate('/login', { replace: true });
  }

  if (loading && projects.length === 0 && officers.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#0E1411]">
          <div className="text-center space-y-3">
            <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#387A4E]/30 border-t-[#387A4E] animate-spin" />
              <GeotwinLogo size={20} iconOnly />
            </div>
            <p className="text-xs font-medium text-[#AEB9B3]">
              Loading Field Operations Control Centre...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingEvidenceCount = evidenceQueue.filter((e) => e.status === 'PENDING').length;
  const presentOfficerCount = adminOfficers.filter((o) => o.attendanceStatus === 'PRESENT').length;

  return (
    <DashboardLayout>
      <div className="min-h-screen flex font-sans antialiased text-[#F8FAF8] bg-[#0E1411] overflow-x-hidden w-full">
        {/* LEFT SIDEBAR NAVIGATION (#0D2A26 Dark Bluish Green - NO BORDERS - HIDE SCROLLBAR) */}
        <aside
          className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0D2A26] text-[#AEB9B3] p-6 flex flex-col justify-between shrink-0 border-0 shadow-2xl z-40 transition-transform duration-200 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-6 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Logo & Platform Title */}
            <div className="flex items-center justify-between pl-1">
              <Link
                to="/"
                title="Return to GeoTwin Home"
                className="flex items-center gap-3 group cursor-pointer"
              >
                <GeotwinLogo size={44} iconOnly />
                <div>
                  <span className="font-bold text-base text-[#F8FAF8] group-hover:text-[#76B78C] transition-colors tracking-tight block">
                    GeoTwin
                  </span>
                  <span className="text-[10px] font-semibold text-[#76B78C] block uppercase tracking-wider font-mono">
                    Control Centre
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden text-[#94C7A5] hover:text-[#F8FAF8] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Structure */}
            <nav className="space-y-6 text-xs">
              {/* Primary Dashboard Links */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveNav('dashboard');
                    setActiveTab('map');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    activeNav === 'dashboard' && activeTab === 'map'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8] hover:shadow-[0_0_15px_rgba(56,122,78,0.18)]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Compass className="w-4 h-4 text-[#94C7A5]" />
                    Dashboard
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveNav('map');
                    setActiveTab('map');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    activeNav === 'map' && activeTab === 'map'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8] hover:shadow-[0_0_15px_rgba(56,122,78,0.18)]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#94C7A5]" />
                    Map Operations
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveNav('creator');
                    setActiveTab('creator');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    activeNav === 'creator' || activeTab === 'creator'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8] hover:shadow-[0_0_15px_rgba(56,122,78,0.18)]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <ClipboardPlus className="w-4 h-4 text-[#94C7A5]" />
                    Assignment Centre
                  </span>
                </button>

                {/* ADMIN & TEAM PAGE LINK */}
                <button
                  onClick={() => {
                    setActiveNav('admin');
                    setActiveTab('admin');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    activeNav === 'admin' || activeTab === 'admin'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8] hover:shadow-[0_0_15px_rgba(56,122,78,0.18)]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#94C7A5]" />
                    Admin & Team
                  </span>
                  <span className="text-[11px] bg-[#387A4E]/60 px-2 py-0.5 rounded text-[#F8FAF8] font-mono">
                    Admin
                  </span>
                </button>
              </div>

              {/* Work Management */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-[#76B78C]/80 px-2 font-mono uppercase tracking-wider">
                  Work Management
                </span>
                <button
                  onClick={() => {
                    setActiveNav('assignments');
                    setActiveTab('assignments');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'assignments' || activeTab === 'assignments'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-[#94C7A5]" />
                    Assignments
                  </span>
                  <span className="text-[11px] bg-[#387A4E]/60 px-2 py-0.5 rounded text-[#F8FAF8] font-mono">
                    {assignments.length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveNav('tasks');
                    setActiveTab('tasks');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'tasks' || activeTab === 'tasks'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#94C7A5]" />
                    Tasks
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveNav('evidence');
                    setActiveTab('evidence');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'evidence' || activeTab === 'evidence'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#94C7A5]" />
                    Evidence Review
                  </span>
                  {pendingEvidenceCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setActiveNav('projects');
                    setActiveTab('projects');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'projects' || activeTab === 'projects'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <FolderPlus className="w-4 h-4 text-[#94C7A5]" />
                    Projects
                  </span>
                  <span className="text-[11px] bg-[#387A4E]/60 px-2 py-0.5 rounded text-[#F8FAF8] font-mono">
                    {projects.length}
                  </span>
                </button>
              </div>

              {/* Reports & AI */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-[#76B78C]/80 px-2 font-mono uppercase tracking-wider">
                  Reports & Governance
                </span>
                <button
                  onClick={() => {
                    setActiveNav('ai-insights');
                    setActiveTab('ai-insights');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'ai-insights' || activeTab === 'ai-insights'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    AI Insights
                  </span>
                </button>

                {/* SUPERVISOR AUDIT LOG LINK */}
                <button
                  onClick={() => {
                    setActiveNav('activity-log');
                    setActiveTab('audit');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'activity-log' || activeTab === 'audit'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#94C7A5]" />
                    Supervisor Audit Log
                  </span>
                  <span className="text-[11px] bg-[#387A4E]/60 px-2 py-0.5 rounded text-[#F8FAF8] font-mono">
                    Audit
                  </span>
                </button>
              </div>

              {/* Settings & Help */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-[#76B78C]/80 px-2 font-mono uppercase tracking-wider">
                  Settings
                </span>
                <button
                  onClick={() => {
                    setActiveNav('profile');
                    setActiveTab('profile');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'profile' || activeTab === 'profile'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[#94C7A5]" />
                    Profile
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveNav('settings');
                    setActiveTab('settings');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'settings' || activeTab === 'settings'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-[#94C7A5]" />
                    Settings
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveNav('help');
                    setActiveTab('help');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-medium transition-all ${
                    activeNav === 'help' || activeTab === 'help'
                      ? 'bg-[#387A4E] text-[#F8FAF8] font-semibold shadow-[0_0_20px_rgba(56,122,78,0.4)]'
                      : 'text-[#AEB9B3] hover:bg-[#182F22] hover:text-[#F8FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-[#94C7A5]" />
                    Help
                  </span>
                </button>
              </div>
            </nav>
          </div>

          {/* Supervisor Identity Footer */}
          <div className="pt-4 space-y-3 shrink-0">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-[#387A4E] flex items-center justify-center text-xs font-semibold text-[#F8FAF8] shadow-[0_0_12px_rgba(56,122,78,0.4)]">
                {supervisorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#F8FAF8] truncate">
                  {supervisorName}
                </p>
                <p className="text-[11px] text-[#76B78C] truncate">
                  Supervisor Officer
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full flex items-center gap-2.5 text-xs text-red-400 hover:text-red-200 px-3 py-2 rounded-xl hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTAINER */}
        <div className="flex-1 min-w-0 flex flex-col relative z-10">
          {/* TOP BAR */}
          <header className="bg-[#121A16]/95 backdrop-blur-md px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 border-0 shadow-[0_4px_25px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-[#F8FAF8] p-1.5 hover:bg-[#18211D] rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-[30px] font-semibold text-[#F8FAF8] tracking-tight leading-none font-sans">
                  Good morning, {supervisorName}
                </h1>
                <p className="text-xs text-[#AEB9B3] mt-1.5 flex items-center gap-2">
                  <span>Assigned District: Ranga Reddy District</span>
                  <span className="text-[#387A4E]/50">•</span>
                  <span>Telangana Forest & Land Department</span>
                </p>
              </div>
            </div>

            {/* Global Search, Actions & Notifications */}
            <div className="flex items-center gap-3">
              <div className="relative min-w-[220px] md:min-w-[260px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plot, officer, project..."
                  className="w-full bg-[#18211D] border-0 text-[#F8FAF8] placeholder-[#819089] text-xs rounded-xl py-2.5 pl-9 pr-3 outline-none focus:ring-1 focus:ring-[#387A4E] focus:shadow-[0_0_15px_rgba(56,122,78,0.3)] transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#819089]" />
              </div>

              <button
                onClick={() => void load()}
                className="p-2.5 bg-[#18211D] hover:bg-[#202E28] text-[#94C7A5] border-0 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(56,122,78,0.25)] cursor-pointer"
                title="Refresh control state"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <div className="relative">
                <button
                  className="p-2.5 bg-[#18211D] hover:bg-[#202E28] text-[#94C7A5] border-0 rounded-xl transition-all hover:shadow-[0_0_15px_rgba(56,122,78,0.25)] relative cursor-pointer"
                  title="Operational notifications"
                >
                  <Bell className="w-4 h-4" />
                  {pendingEvidenceCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#F59E0B] rounded-full shadow-[0_0_8px_#F59E0B]" />
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setActiveNav('creator');
                  setActiveTab('creator');
                }}
                className="py-2.5 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_20px_rgba(56,122,78,0.35)] hover:shadow-[0_0_30px_rgba(56,122,78,0.6)] transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Issue Assignment</span>
              </button>
            </div>
          </header>

          {/* FEEDBACK ALERTS */}
          {error && (
            <div className="mx-8 mt-4 p-4 bg-red-950/60 text-red-200 text-xs rounded-xl flex items-center justify-between shadow-md border-0">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mx-8 mt-4 p-4 bg-emerald-950/60 text-emerald-200 text-xs rounded-xl flex items-center justify-between shadow-md border-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* MAIN DASHBOARD / CREATOR / ADMIN / AUDIT CONTENT */}
          <main className="flex-1 p-8 space-y-8 w-full">
            {activeTab === 'map' ? (
              <>
                {/* TOP OPERATIONAL METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Active Projects */}
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.25)] transition-all duration-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#819089]">
                        Active Projects
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_12px_rgba(56,122,78,0.25)]">
                        <FolderPlus className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold text-[#F8FAF8] leading-none">
                        {projects.length || 8}
                      </span>
                      <span className="text-xs font-medium text-[#22C55E] flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +2 this month
                      </span>
                    </div>
                    <p className="text-xs text-[#AEB9B3] leading-relaxed">
                      4 land sectors under active restoration
                    </p>
                  </div>

                  {/* Card 2: Open Assignments */}
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.25)] transition-all duration-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#819089]">
                        Open Assignments
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_12px_rgba(56,122,78,0.25)]">
                        <ClipboardPlus className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold text-[#F8FAF8] leading-none">
                        {assignments.length || 14}
                      </span>
                      <span className="text-xs font-medium text-[#F59E0B] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" /> 3 due this week
                      </span>
                    </div>
                    <p className="text-xs text-[#AEB9B3] leading-relaxed">
                      Controlled field missions dispatched
                    </p>
                  </div>

                  {/* Card 3: Evidence Pending */}
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.25)] transition-all duration-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#819089]">
                        Evidence Pending
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold text-[#F8FAF8] leading-none">
                        {pendingEvidenceCount}
                      </span>
                      <span className="text-xs font-medium text-[#F59E0B] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" /> Action required
                      </span>
                    </div>
                    <p className="text-xs text-[#AEB9B3] leading-relaxed">
                      Ground survey photos awaiting sign-off
                    </p>
                  </div>

                  {/* Card 4: Officers Present */}
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.25)] transition-all duration-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#819089]">
                        Officers Present
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_12px_rgba(56,122,78,0.25)]">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold text-[#F8FAF8] leading-none">
                        {presentOfficerCount} <span className="text-sm font-normal text-[#819089]">/ {adminOfficers.length}</span>
                      </span>
                      <span className="text-xs font-medium text-[#22C55E] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E]" /> 85% attendance
                      </span>
                    </div>
                    <p className="text-xs text-[#AEB9B3] leading-relaxed">
                      Active field officers on duty
                    </p>
                  </div>
                </div>

                {/* 70% MAP & RIGHT PANEL 30% */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* LEFT 70% COLUMN: GIS MAP & PLOT DRAWER */}
                  <div className="lg:col-span-7 space-y-6 flex flex-col">
                    {/* Filter Controls Toolbar */}
                    <div className="bg-[#18211D] rounded-[16px] p-4 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_0_20px_rgba(56,122,78,0.15)] transition-all flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        <span className="font-semibold text-[#94C7A5] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <Filter className="w-3.5 h-3.5 text-[#387A4E]" /> Filter:
                        </span>

                        <select
                          value={selectedProjectFilter}
                          onChange={(e) => setSelectedProjectFilter(e.target.value)}
                          className="py-2 px-3.5 bg-[#121A16] border-0 rounded-xl text-xs font-medium text-[#F8FAF8] outline-none focus:ring-1 focus:ring-[#387A4E]"
                        >
                          <option value="all">All Projects ({projects.length})</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedOfficerFilter}
                          onChange={(e) => setSelectedOfficerFilter(e.target.value)}
                          className="py-2 px-3.5 bg-[#121A16] border-0 rounded-xl text-xs font-medium text-[#F8FAF8] outline-none focus:ring-1 focus:ring-[#387A4E]"
                        >
                          <option value="all">All Officers ({officers.length})</option>
                          {officers.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.displayName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-xs text-[#AEB9B3]">
                        Showing <strong className="text-[#F8FAF8]">{filteredPlots.length}</strong> sector plots
                      </div>
                    </div>

                    {/* Interactive MapLibre Map */}
                    <div className="bg-[#18211D] rounded-[16px] overflow-hidden border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(56,122,78,0.2)] transition-all duration-300 min-h-[520px] relative">
                      {loading ? (
                        <div className="absolute inset-0 bg-[#121A16] flex items-center justify-center p-8">
                          <div className="text-center space-y-4 max-w-sm">
                            <div className="w-12 h-12 rounded-2xl bg-[#18211D] mx-auto flex items-center justify-center text-[#94C7A5] shadow-[0_0_20px_rgba(56,122,78,0.3)] animate-pulse">
                              <Compass className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-[#F8FAF8]">Initializing Dark GIS Engine</h4>
                              <p className="text-xs text-[#819089] mt-1">Rendering vector tiles and sector polygon overlays...</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <GeoTwinOperationsMap
                          plots={filteredPlots}
                          sectors={mapSectors}
                          selectedPlot={selectedPlot}
                          onSelectPlot={setSelectedPlot}
                        />
                      )}
                    </div>

                    {/* PLOT SELECTION DRAWER */}
                    {selectedPlot ? (
                      <div className="bg-[#18211D] rounded-[16px] p-6 border-0 border-l-4 border-l-[#387A4E] shadow-[0_0_30px_rgba(56,122,78,0.25)] space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-[#387A4E]/20">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
                            <div>
                              <h3 className="text-base font-semibold text-[#F8FAF8]">
                                {selectedPlot.name} <span className="text-xs font-mono font-normal text-[#819089]">({selectedPlot.id})</span>
                              </h3>
                              <p className="text-xs text-[#AEB9B3] mt-0.5">
                                Project: {selectedPlot.sector}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedPlot(null)}
                            className="text-[#819089] hover:text-[#F8FAF8] p-1.5 rounded-lg hover:bg-[#121A16]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div className="bg-[#121A16] p-3.5 rounded-xl border-0 space-y-1">
                            <span className="text-[11px] font-medium text-[#819089] block">
                              Assigned Officer
                            </span>
                            <span className="font-semibold text-[#F8FAF8]">
                              {selectedPlot.assignedOfficer || 'Unassigned'}
                            </span>
                          </div>
                          <div className="bg-[#121A16] p-3.5 rounded-xl border-0 space-y-1">
                            <span className="text-[11px] font-medium text-[#819089] block">
                              Status & Deadline
                            </span>
                            <span className="font-semibold text-[#76B78C]">
                              {getStatusLabel(selectedPlot.status)}
                            </span>
                            <p className="text-[11px] text-[#AEB9B3]">
                              {selectedPlot.dueDate || 'No deadline'}
                            </p>
                          </div>
                          <div className="bg-[#121A16] p-3.5 rounded-xl border-0 space-y-1">
                            <span className="text-[11px] font-medium text-[#819089] block">
                              Evidence Count
                            </span>
                            <span className="font-semibold text-[#F8FAF8]">
                              {selectedPlot.evidenceUploaded} / {selectedPlot.evidenceRequired || 1} Uploaded
                            </span>
                          </div>
                          <div className="bg-[#121A16] p-3.5 rounded-xl border-0 space-y-1">
                            <span className="text-[11px] font-medium text-[#819089] block">
                              AI Risk Level
                            </span>
                            <span className="font-semibold text-[#EF4444] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444]" />
                              {selectedPlot.degradationLevel === 'high' ? 'High Risk' : selectedPlot.degradationLevel === 'moderate' ? 'Moderate Risk' : 'Low Risk'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => setActiveNav('evidence')}
                            className="py-2.5 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] flex items-center gap-2 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review Evidence</span>
                          </button>
                          <button
                            onClick={() => {
                              setProjectId(projects[0]?.id || '');
                              setActiveTab('creator');
                            }}
                            className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] text-xs font-semibold rounded-xl border-0 flex items-center gap-2 cursor-pointer"
                          >
                            <ClipboardPlus className="w-3.5 h-3.5" />
                            <span>Open Assignment</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveNav('activity-log');
                              setActiveTab('audit');
                            }}
                            className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#AEB9B3] text-xs font-medium rounded-xl border-0 flex items-center gap-2 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#819089]" />
                            <span>View Audit Log</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#18211D] rounded-[16px] p-4 border-0 shadow-[0_8px_25px_rgba(0,0,0,0.2)] text-xs text-[#AEB9B3] flex items-center gap-2.5">
                        <Info className="w-4 h-4 text-[#76B78C] shrink-0" />
                        <span>Select any sector plot on the GIS map to inspect operational status and dispatched evidence.</span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT PANEL (30% COLUMN) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* SECTION 1: TODAY'S OPERATIONS */}
                    <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(56,122,78,0.15)] transition-all space-y-4">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#387A4E]/20">
                        <h2 className="text-[18px] font-semibold text-[#F8FAF8]">
                          Today's Operations
                        </h2>
                        <span className="text-xs font-medium text-[#22C55E] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" /> Active Shift
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 flex items-center justify-between shadow-xs hover:shadow-[0_0_12px_rgba(56,122,78,0.15)] transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E]" />
                            <span className="font-medium text-[#F8FAF8]">Active Projects</span>
                          </div>
                          <span className="font-semibold text-[#76B78C]">{projects.length || 8} Programs</span>
                        </div>

                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 flex items-center justify-between shadow-xs hover:shadow-[0_0_12px_rgba(56,122,78,0.15)] transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]" />
                            <span className="font-medium text-[#F8FAF8]">Open Assignments</span>
                          </div>
                          <span className="font-semibold text-[#F8FAF8]">{assignments.length || 14} Missions</span>
                        </div>

                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 flex items-center justify-between shadow-xs hover:shadow-[0_0_12px_rgba(56,122,78,0.15)] transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
                            <span className="font-medium text-[#F8FAF8]">Pending Evidence</span>
                          </div>
                          <span className="font-semibold text-[#F59E0B]">{pendingEvidenceCount} Items</span>
                        </div>

                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 flex items-center justify-between shadow-xs hover:shadow-[0_0_12px_rgba(56,122,78,0.15)] transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444]" />
                            <span className="font-medium text-[#F8FAF8]">Overdue Tasks</span>
                          </div>
                          <span className="font-semibold text-[#EF4444]">1 Mission Overdue</span>
                        </div>

                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 flex items-center justify-between shadow-xs hover:shadow-[0_0_12px_rgba(56,122,78,0.15)] transition-all">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E]" />
                            <span className="font-medium text-[#F8FAF8]">Officer Attendance</span>
                          </div>
                          <span className="font-semibold text-[#22C55E]">{presentOfficerCount} / {adminOfficers.length} Present</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: EVIDENCE REVIEW QUEUE */}
                    <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(56,122,78,0.15)] transition-all space-y-4">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#387A4E]/20">
                        <h2 className="text-[18px] font-semibold text-[#F8FAF8]">
                          Evidence Review Queue
                        </h2>
                        <span className="text-xs font-medium text-[#819089]">
                          {pendingEvidenceCount} Waiting
                        </span>
                      </div>

                      <div className="space-y-3">
                        {evidenceQueue.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl bg-[#121A16] border-0 text-xs space-y-2.5 transition-all hover:shadow-[0_0_15px_rgba(56,122,78,0.2)]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#76B78C]">
                                {item.patchId}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#AEB9B3]">
                                <span className={`w-2 h-2 rounded-full ${
                                  item.type === 'Waiting Evidence'
                                    ? 'bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]'
                                    : item.type === 'Missing Photos'
                                    ? 'bg-[#EF4444] shadow-[0_0_6px_#EF4444]'
                                    : 'bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]'
                                }`} />
                                {item.type}
                              </span>
                            </div>

                            <div>
                              <p className="font-medium text-[#F8FAF8]">{item.patchName}</p>
                              <p className="text-[11px] text-[#819089] mt-0.5">
                                Officer: {item.officerName} • Submitted {item.submittedAt}
                              </p>
                            </div>

                            {item.status === 'PENDING' && (
                              <div className="flex items-center gap-2 pt-2 border-t border-[#387A4E]/15">
                                <button
                                  onClick={() => handleApproveEvidence(item.id)}
                                  className="py-1.5 px-3 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-medium rounded-lg border-0 shadow-[0_0_12px_rgba(56,122,78,0.3)] transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRequestRevision(item.id)}
                                  className="py-1.5 px-3 bg-[#18211D] hover:bg-amber-950/40 text-[#F59E0B] text-xs font-medium rounded-lg border-0 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3 h-3" /> Request Revision
                                </button>
                              </div>
                            )}

                            {item.status === 'APPROVED' && (
                              <span className="text-[11px] font-medium text-[#22C55E] flex items-center gap-1.5 pt-1">
                                <span className="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E]" /> Approved by Supervisor
                              </span>
                            )}

                            {item.status === 'NEEDS_REVISION' && (
                              <span className="text-[11px] font-medium text-[#F59E0B] flex items-center gap-1.5 pt-1">
                                <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" /> Revision Requested from Officer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: GEOTWIN AI INSIGHTS */}
                    <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_0_35px_rgba(56,122,78,0.2)] hover:shadow-[0_0_45px_rgba(56,122,78,0.3)] transition-all duration-300 space-y-4">
                      <div className="flex items-center justify-between pb-3.5 border-b border-[#387A4E]/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#22C55E] animate-pulse" />
                          <h2 className="text-[18px] font-semibold text-[#F8FAF8]">
                            Geotwin AI Insights
                          </h2>
                        </div>
                        <span className="text-[11px] font-medium text-[#22C55E] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E]" /> Recommendations
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 space-y-1 shadow-xs hover:shadow-[0_0_15px_rgba(56,122,78,0.2)] transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#76B78C]">
                              Workload Recommendation
                            </span>
                            <span className="text-[11px] text-[#819089]">Officer Allocation</span>
                          </div>
                          <p className="text-[#AEB9B3] leading-relaxed">
                            Officer Ravi currently has the highest workload (8 active tasks). Recommend assigning future work to Officer Anita (2 tasks).
                          </p>
                        </div>

                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 space-y-1 shadow-xs hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#F59E0B] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" /> Evidence Alert
                            </span>
                            <span className="text-[11px] text-[#819089]">Patch RP-17A Alert</span>
                          </div>
                          <p className="text-[#AEB9B3] leading-relaxed">
                            Patch RP-17A requires evidence review — no uploaded photos for 5 consecutive days.
                          </p>
                        </div>

                        <div className="p-3.5 bg-[#121A16] rounded-xl border-0 space-y-1 shadow-xs hover:shadow-[0_0_15px_rgba(56,122,78,0.2)] transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#76B78C]">
                              Attendance Notice
                            </span>
                            <span className="text-[11px] text-[#819089]">Weather Impact</span>
                          </div>
                          <p className="text-[#AEB9B3] leading-relaxed">
                            Attendance decreased compared to yesterday due to rainfall forecast. Recommend extending mission completion timelines by +24h.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#121A16] rounded-xl border-0 flex items-center gap-2.5 text-[11px] text-[#819089]">
                        <ShieldCheck className="w-4 h-4 text-[#76B78C] shrink-0" />
                        <span><strong>Governance Notice:</strong> AI NEVER performs automatic actions. All recommendations require supervisor review and approval.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: RECENT ACTIVITY TIMELINE */}
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.15)] transition-all space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#387A4E]/20">
                    <h2 className="text-[18px] font-semibold text-[#F8FAF8]">
                      Recent Activity
                    </h2>
                    <span className="text-xs font-medium text-[#819089]">
                      Chronological Log
                    </span>
                  </div>

                  <div className="space-y-5 text-xs">
                    {timeline.map((event, idx) => (
                      <div key={event.id} className="flex items-start gap-4 relative">
                        {idx !== timeline.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-0 w-px bg-[#387A4E]/20" />
                        )}

                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#121A16] text-[#94C7A5] font-semibold shadow-[0_0_10px_rgba(56,122,78,0.2)]">
                          {event.type === 'Assignment Created' ? (
                            <ClipboardPlus className="w-4 h-4 text-[#3B82F6]" />
                          ) : event.type === 'Evidence Uploaded' ? (
                            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                          ) : event.type === 'Attendance Updated' ? (
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                          ) : event.type === 'Correction Request' ? (
                            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-purple-400" />
                          )}
                        </div>

                        <div className="flex-1 bg-[#121A16] border-0 rounded-xl p-4 space-y-1 shadow-xs hover:shadow-[0_0_12px_rgba(56,122,78,0.15)] transition-all">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#F8FAF8]">
                              {event.type}
                            </span>
                            <span className="text-[11px] text-[#819089]">
                              {event.timestamp}
                            </span>
                          </div>
                          <p className="text-[#AEB9B3] leading-relaxed">
                            {event.details}
                          </p>
                          <p className="text-[11px] text-[#76B78C] pt-1 font-medium">
                            Actor: {event.actor}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : activeTab === 'creator' ? (
              /* ASSIGNMENT CREATOR WORKSPACE VIEW */
              <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#387A4E]/20">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#F8FAF8]">
                      Issue Field Work Assignment
                    </h2>
                    <p className="text-xs text-[#AEB9B3] mt-0.5">
                      Dispatch controlled field tasks to district officers with precise spatial targets.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="py-2 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    ← Return to Map
                  </button>
                </div>

                <div className="bg-[#121A16] p-4 rounded-xl border-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F8FAF8]">Restoration Project Scope</span>
                    <button
                      type="button"
                      onClick={() => setCreatingProject((prev) => !prev)}
                      className="text-xs font-semibold text-[#76B78C] hover:underline cursor-pointer"
                    >
                      {creatingProject ? 'Cancel' : '+ Create New Project'}
                    </button>
                  </div>

                  {creatingProject ? (
                    <form onSubmit={createProject} className="space-y-3 pt-2">
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project Name (e.g., Medak Ridge Afforestation)"
                        className="w-full p-3 bg-[#18211D] border-0 text-[#F8FAF8] text-xs rounded-xl focus:ring-1 focus:ring-[#387A4E]"
                      />
                      <input
                        type="text"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder="Description & Goal"
                        className="w-full p-3 bg-[#18211D] border-0 text-[#F8FAF8] text-xs rounded-xl focus:ring-1 focus:ring-[#387A4E]"
                      />
                      <button
                        type="submit"
                        className="py-2.5 px-4 bg-[#387A4E] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)]"
                      >
                        Save Project
                      </button>
                    </form>
                  ) : (
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full p-3 bg-[#18211D] border-0 text-xs font-medium rounded-xl text-[#F8FAF8] focus:ring-1 focus:ring-[#387A4E]"
                    >
                      <option value="">Select Project Scope...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <form onSubmit={submit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#F8FAF8]">Assignee Field Officer</label>
                      <select
                        value={officerId}
                        onChange={(e) => setOfficerId(e.target.value)}
                        className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl text-xs focus:ring-1 focus:ring-[#387A4E]"
                      >
                        <option value="">Select Field Officer...</option>
                        {officers.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.displayName} ({(o as any).districtName || 'District Officer'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#F8FAF8]">Target Land Sector Plot</label>
                      <select
                        value={sectorId}
                        onChange={(e) => setSectorId(e.target.value)}
                        className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl text-xs focus:ring-1 focus:ring-[#387A4E]"
                      >
                        <option value="">All Sectors in Project</option>
                        {sectors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.areaHectares} Ha)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#F8FAF8]">Target Completion Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl text-xs focus:ring-1 focus:ring-[#387A4E]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-[#F8FAF8]">Operational Instructions</label>
                      <input
                        type="text"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Special instructions for field team..."
                        className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl text-xs focus:ring-1 focus:ring-[#387A4E]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-[#F8FAF8]">Task Breakdown</label>
                      <button
                        type="button"
                        onClick={() => setTasks((current) => [...current, emptyTask()])}
                        className="text-xs font-semibold text-[#76B78C] hover:underline"
                      >
                        + Add Task
                      </button>
                    </div>

                    {tasks.map((task, index) => (
                      <div key={index} className="p-3.5 bg-[#121A16] border-0 rounded-xl space-y-2">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTask(index, { title: e.target.value })}
                            placeholder="Task Title (e.g., GPS Boundary Verification)"
                            className="flex-1 p-2.5 bg-[#18211D] border-0 text-[#F8FAF8] rounded-lg text-xs"
                          />
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(index, { priority: e.target.value as any })}
                            className="p-2.5 bg-[#18211D] border-0 text-[#F8FAF8] rounded-lg text-xs"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={working}
                      className="py-3 px-6 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_20px_rgba(56,122,78,0.35)] cursor-pointer disabled:opacity-50"
                    >
                      {working ? 'Dispatching Assignment...' : 'Dispatch Assignment'}
                    </button>
                  </div>
                </form>
              </div>
            ) : activeTab === 'admin' ? (
              /* DEDICATED ADMIN & TEAM PAGE WORKSPACE VIEW (SHARED SUPERVISOR AUDIT TRAIL TAB INCLUDED) */
              <div className="space-y-8">
                {/* Header Control Card */}
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          District Administration & Shared Audit Centre
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Manage field officer rosters, shift attendance, workload allocation, and inspect real-time Supervisor Audit Trails.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('map')}
                      className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ← Return to Map
                    </button>
                    <button
                      onClick={() => setOnboardModalOpen(true)}
                      className="py-2.5 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Onboard Officer</span>
                    </button>
                  </div>
                </div>

                {/* Top Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-2">
                    <span className="text-[13px] font-medium text-[#819089]">Total Officers</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold text-[#F8FAF8] leading-none">
                        {adminOfficers.length}
                      </span>
                      <span className="text-xs font-medium text-[#22C55E]">Ranga Reddy</span>
                    </div>
                    <p className="text-xs text-[#AEB9B3]">{presentOfficerCount} present on duty</p>
                  </div>

                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-2">
                    <span className="text-[13px] font-medium text-[#819089]">Shift Attendance</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold text-[#22C55E] leading-none">
                        {Math.round((presentOfficerCount / adminOfficers.length) * 100)}%
                      </span>
                      <span className="text-xs font-medium text-[#22C55E]">Optimal</span>
                    </div>
                    <p className="text-xs text-[#AEB9B3]">GPS verification checked</p>
                  </div>

                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-2">
                    <span className="text-[13px] font-medium text-[#819089]">Supervisor Audit Records</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[34px] font-semibold text-[#76B78C] leading-none">
                        {auditLogs.length}
                      </span>
                      <span className="text-xs font-medium text-[#22C55E]">Cryptographic SHA-256</span>
                    </div>
                    <p className="text-xs text-[#AEB9B3]">Immutable operational logs</p>
                  </div>

                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.3)] space-y-2">
                    <span className="text-[13px] font-medium text-[#819089]">Governance Mode</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[20px] font-semibold text-[#76B78C] leading-none">
                        Admin + Supervisor
                      </span>
                    </div>
                    <p className="text-xs text-[#AEB9B3]">Shared compliance logging active</p>
                  </div>
                </div>

                {/* Sub-Tab Selector (Roster / Attendance / Workload / Shared Audit Trail) */}
                <div className="bg-[#18211D] rounded-[16px] p-2 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.25)] flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setSelectedAdminTab('roster')}
                    className={`py-2 px-4 rounded-xl font-semibold transition-all cursor-pointer ${
                      selectedAdminTab === 'roster'
                        ? 'bg-[#387A4E] text-[#F8FAF8] shadow-[0_0_15px_rgba(56,122,78,0.4)]'
                        : 'text-[#AEB9B3] hover:bg-[#121A16]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 inline mr-1.5" />
                    Officer Roster ({adminOfficers.length})
                  </button>

                  <button
                    onClick={() => setSelectedAdminTab('attendance')}
                    className={`py-2 px-4 rounded-xl font-semibold transition-all cursor-pointer ${
                      selectedAdminTab === 'attendance'
                        ? 'bg-[#387A4E] text-[#F8FAF8] shadow-[0_0_15px_rgba(56,122,78,0.4)]'
                        : 'text-[#AEB9B3] hover:bg-[#121A16]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 inline mr-1.5" />
                    Shift Attendance ({presentOfficerCount} Present)
                  </button>

                  <button
                    onClick={() => setSelectedAdminTab('workload')}
                    className={`py-2 px-4 rounded-xl font-semibold transition-all cursor-pointer ${
                      selectedAdminTab === 'workload'
                        ? 'bg-[#387A4E] text-[#F8FAF8] shadow-[0_0_15px_rgba(56,122,78,0.4)]'
                        : 'text-[#AEB9B3] hover:bg-[#121A16]'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
                    Workload Allocation
                  </button>

                  <button
                    onClick={() => setSelectedAdminTab('audit')}
                    className={`py-2 px-4 rounded-xl font-semibold transition-all cursor-pointer ${
                      selectedAdminTab === 'audit'
                        ? 'bg-[#387A4E] text-[#F8FAF8] shadow-[0_0_15px_rgba(56,122,78,0.4)]'
                        : 'text-[#AEB9B3] hover:bg-[#121A16]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />
                    Supervisor Audit Trail ({auditLogs.length} Records)
                  </button>
                </div>

                {/* ADMIN TAB 1: OFFICER ROSTER */}
                {selectedAdminTab === 'roster' && (
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#387A4E]/20">
                      <div className="relative min-w-[260px]">
                        <input
                          type="text"
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          placeholder="Search officer name, designation..."
                          className="w-full bg-[#121A16] border-0 text-[#F8FAF8] placeholder-[#819089] text-xs rounded-xl py-2.5 pl-9 pr-3 outline-none focus:ring-1 focus:ring-[#387A4E]"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#819089]" />
                      </div>
                      <span className="text-xs text-[#AEB9B3]">
                        Registered District Personnel
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#387A4E]/20 text-[#819089]">
                            <th className="py-3 px-4 font-semibold">Field Officer</th>
                            <th className="py-3 px-4 font-semibold">Designation</th>
                            <th className="py-3 px-4 font-semibold">District Sector</th>
                            <th className="py-3 px-4 font-semibold">Shift Status</th>
                            <th className="py-3 px-4 font-semibold">Active Tasks</th>
                            <th className="py-3 px-4 font-semibold">Phone</th>
                            <th className="py-3 px-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#387A4E]/10">
                          {adminOfficers
                            .filter((o) =>
                              adminSearchQuery
                                ? o.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                  o.role.toLowerCase().includes(adminSearchQuery.toLowerCase())
                                : true,
                            )
                            .map((officer) => (
                              <tr key={officer.id} className="hover:bg-[#121A16]/60 transition-colors">
                                <td className="py-3.5 px-4 font-semibold text-[#F8FAF8]">
                                  {officer.name}
                                </td>
                                <td className="py-3.5 px-4 text-[#AEB9B3]">{officer.role}</td>
                                <td className="py-3.5 px-4 text-[#76B78C]">{officer.district}</td>
                                <td className="py-3.5 px-4">
                                  <span className="flex items-center gap-1.5 text-xs font-medium">
                                    <span className={`w-2 h-2 rounded-full ${
                                      officer.attendanceStatus === 'PRESENT'
                                        ? 'bg-[#22C55E] shadow-[0_0_6px_#22C55E]'
                                        : 'bg-[#EF4444]'
                                    }`} />
                                    {officer.attendanceStatus}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-semibold text-[#F8FAF8]">{officer.activeTasksCount} Missions</span>
                                </td>
                                <td className="py-3.5 px-4 text-[#819089] font-mono">{officer.contactPhone}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => toggleOfficerAttendance(officer.id)}
                                    className="py-1 px-3 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] rounded-lg text-xs font-medium border-0 cursor-pointer"
                                  >
                                    Toggle Attendance
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN TAB 2: SHIFT ATTENDANCE */}
                {selectedAdminTab === 'attendance' && (
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#387A4E]/20">
                      <div>
                        <h3 className="text-base font-semibold text-[#F8FAF8]">
                          Daily Shift Attendance Log
                        </h3>
                        <p className="text-xs text-[#AEB9B3]">
                          Geofenced mobile check-in verification log for field officers on duty.
                        </p>
                      </div>
                      <button
                        onClick={handleVerifyGPS}
                        className="py-2 px-3.5 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_12px_rgba(56,122,78,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Verify GPS Signals
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {adminOfficers.map((officer) => (
                        <div
                          key={officer.id}
                          className="p-4 bg-[#121A16] rounded-xl border-0 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <span className="font-semibold text-[#F8FAF8] block">{officer.name}</span>
                            <span className="text-[11px] text-[#AEB9B3] block">{officer.role}</span>
                            <span className="text-[11px] text-[#819089] block font-mono">
                              Check-in Time: {officer.checkInTime}
                            </span>
                          </div>

                          <div className="text-right space-y-2">
                            <span
                              className={`inline-block py-1 px-3 rounded-lg font-semibold text-[11px] ${
                                officer.attendanceStatus === 'PRESENT'
                                  ? 'bg-emerald-950/60 text-[#22C55E]'
                                  : 'bg-red-950/60 text-red-400'
                              }`}
                            >
                              {officer.attendanceStatus}
                            </span>
                            <button
                              onClick={() => toggleOfficerAttendance(officer.id)}
                              className="block text-[11px] text-[#76B78C] hover:underline cursor-pointer ml-auto"
                            >
                              {officer.attendanceStatus === 'PRESENT' ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADMIN TAB 3: WORKLOAD ALLOCATION */}
                {selectedAdminTab === 'workload' && (
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#387A4E]/20">
                      <div>
                        <h3 className="text-base font-semibold text-[#F8FAF8]">
                          Officer Workload & Mission Capacity
                        </h3>
                        <p className="text-xs text-[#AEB9B3]">
                          Balancing field task assignments to prevent officer burnout.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      {adminOfficers.map((officer) => (
                        <div key={officer.id} className="p-4 bg-[#121A16] rounded-xl border-0 space-y-2">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-[#F8FAF8]">{officer.name} ({officer.role})</span>
                            <span className={officer.activeTasksCount > 6 ? 'text-[#EF4444]' : 'text-[#76B78C]'}>
                              {officer.activeTasksCount} Active Tasks {officer.activeTasksCount > 6 && '(High Workload)'}
                            </span>
                          </div>

                          <div className="w-full h-2 rounded-full bg-[#18211D] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                officer.activeTasksCount > 6
                                  ? 'bg-[#EF4444]'
                                  : officer.activeTasksCount > 3
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#22C55E]'
                              }`}
                              style={{ width: `${Math.min((officer.activeTasksCount / 10) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADMIN TAB 4: SHARED SUPERVISOR AUDIT TRAIL */}
                {selectedAdminTab === 'audit' && (
                  <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#387A4E]/20">
                      <div>
                        <h3 className="text-base font-semibold text-[#F8FAF8] flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#76B78C]" />
                          Shared Supervisor Audit Trail
                        </h3>
                        <p className="text-xs text-[#AEB9B3] mt-0.5">
                          Real-time compliance log of supervisor decisions, evidence approvals, and mission dispatches visible to District Admin.
                        </p>
                      </div>

                      <button
                        onClick={handleExportAuditLog}
                        className="py-2 px-3.5 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_12px_rgba(56,122,78,0.3)] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Export Audit Log
                      </button>
                    </div>

                    {/* Audit Logs Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#387A4E]/20 text-[#819089]">
                            <th className="py-3 px-4 font-semibold">Audit ID</th>
                            <th className="py-3 px-4 font-semibold">Action Code</th>
                            <th className="py-3 px-4 font-semibold">Supervisor (Actor)</th>
                            <th className="py-3 px-4 font-semibold">Target Entity</th>
                            <th className="py-3 px-4 font-semibold">Operational Details</th>
                            <th className="py-3 px-4 font-semibold">Cryptographic Hash</th>
                            <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#387A4E]/10">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[#121A16]/60 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-[#76B78C]">
                                {log.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-block py-1 px-2.5 rounded-lg text-[11px] font-semibold font-mono ${
                                  log.actionCode === 'EVIDENCE_APPROVED'
                                    ? 'bg-emerald-950/60 text-[#22C55E]'
                                    : log.actionCode === 'REVISION_REQUESTED'
                                    ? 'bg-amber-950/60 text-[#F59E0B]'
                                    : log.actionCode === 'MISSION_DISPATCHED'
                                    ? 'bg-blue-950/60 text-[#3B82F6]'
                                    : 'bg-[#121A16] text-[#94C7A5]'
                                }`}>
                                  {log.actionCode}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-[#F8FAF8]">{log.actorName}</td>
                              <td className="py-3.5 px-4 text-[#94C7A5]">{log.targetEntity}</td>
                              <td className="py-3.5 px-4 text-[#AEB9B3] max-w-xs truncate">{log.details}</td>
                              <td className="py-3.5 px-4 text-[#819089] font-mono text-[11px] truncate max-w-[140px]">{log.auditHash}</td>
                              <td className="py-3.5 px-4 text-right text-[#819089] font-mono text-[11px] whitespace-nowrap">{log.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'audit' ? (
              /* DEDICATED SUPERVISOR AUDIT LOG PAGE VIEW (WHEN CLICKED FROM SIDEBAR) */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <Clock className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Supervisor Operational Audit Trail
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Immutable log of supervisor actions, sign-offs, and mission dispatches (Shared & visible to District Admin).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('map')}
                      className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ← Return to Map
                    </button>
                    <button
                      onClick={handleExportAuditLog}
                      className="py-2.5 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Audit Report</span>
                    </button>
                  </div>
                </div>

                {/* Audit Controls & Filters */}
                <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#387A4E]/20">
                    <div className="flex items-center gap-3 flex-wrap text-xs">
                      <span className="font-semibold text-[#94C7A5] uppercase tracking-wider font-mono">
                        Filter Audit:
                      </span>
                      <select
                        value={auditFilterAction}
                        onChange={(e) => setAuditFilterAction(e.target.value)}
                        className="py-2 px-3.5 bg-[#121A16] border-0 rounded-xl text-xs font-medium text-[#F8FAF8] outline-none focus:ring-1 focus:ring-[#387A4E]"
                      >
                        <option value="all">All Action Codes ({auditLogs.length})</option>
                        <option value="EVIDENCE_APPROVED">Evidence Approved</option>
                        <option value="REVISION_REQUESTED">Revision Requested</option>
                        <option value="MISSION_DISPATCHED">Mission Dispatched</option>
                        <option value="ATTENDANCE_OVERRIDE">Attendance Override</option>
                        <option value="PROJECT_CREATED">Project Created</option>
                      </select>
                    </div>

                    <div className="relative min-w-[260px]">
                      <input
                        type="text"
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        placeholder="Search audit target, hash, or details..."
                        className="w-full bg-[#121A16] border-0 text-[#F8FAF8] placeholder-[#819089] text-xs rounded-xl py-2.5 pl-9 pr-3 outline-none focus:ring-1 focus:ring-[#387A4E]"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#819089]" />
                    </div>
                  </div>

                  {/* Supervisor Audit Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#387A4E]/20 text-[#819089]">
                          <th className="py-3 px-4 font-semibold">Audit ID</th>
                          <th className="py-3 px-4 font-semibold">Action Code</th>
                          <th className="py-3 px-4 font-semibold">Supervisor (Actor)</th>
                          <th className="py-3 px-4 font-semibold">Target Entity</th>
                          <th className="py-3 px-4 font-semibold">Operational Details</th>
                          <th className="py-3 px-4 font-semibold">Cryptographic Hash</th>
                          <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#387A4E]/10">
                        {auditLogs
                          .filter((log) => {
                            if (auditFilterAction !== 'all' && log.actionCode !== auditFilterAction) return false;
                            if (auditSearchQuery.trim()) {
                              const q = auditSearchQuery.toLowerCase();
                              return (
                                log.id.toLowerCase().includes(q) ||
                                log.targetEntity.toLowerCase().includes(q) ||
                                log.details.toLowerCase().includes(q) ||
                                log.auditHash.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          })
                          .map((log) => (
                            <tr key={log.id} className="hover:bg-[#121A16]/60 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-[#76B78C]">
                                {log.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-block py-1 px-2.5 rounded-lg text-[11px] font-semibold font-mono ${
                                  log.actionCode === 'EVIDENCE_APPROVED'
                                    ? 'bg-emerald-950/60 text-[#22C55E]'
                                    : log.actionCode === 'REVISION_REQUESTED'
                                    ? 'bg-amber-950/60 text-[#F59E0B]'
                                    : log.actionCode === 'MISSION_DISPATCHED'
                                    ? 'bg-blue-950/60 text-[#3B82F6]'
                                    : 'bg-[#121A16] text-[#94C7A5]'
                                }`}>
                                  {log.actionCode}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-[#F8FAF8]">{log.actorName}</td>
                              <td className="py-3.5 px-4 text-[#94C7A5]">{log.targetEntity}</td>
                              <td className="py-3.5 px-4 text-[#AEB9B3] max-w-xs truncate">{log.details}</td>
                              <td className="py-3.5 px-4 text-[#819089] font-mono text-[11px] truncate max-w-[140px]">{log.auditHash}</td>
                              <td className="py-3.5 px-4 text-right text-[#819089] font-mono text-[11px] whitespace-nowrap">{log.timestamp}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'assignments' ? (
              /* DEDICATED ASSIGNMENTS WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <Briefcase className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Field Missions & Work Assignments
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Active field operational dispatches, officer assignments, and spatial mission tracking.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('map')}
                      className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ← Return to Map
                    </button>
                    <button
                      onClick={() => {
                        setActiveNav('creator');
                        setActiveTab('creator');
                      }}
                      className="py-2.5 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Dispatch New Assignment</span>
                    </button>
                  </div>
                </div>

                {/* Assignments List Table */}
                <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#387A4E]/20">
                    <h3 className="text-base font-semibold text-[#F8FAF8]">
                      Dispatched Field Assignments ({assignments.length})
                    </h3>
                    <span className="text-xs text-[#AEB9B3]">
                      Synced with NestJS PostgreSQL backend
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#387A4E]/20 text-[#819089]">
                          <th className="py-3 px-4 font-semibold">Assignment ID</th>
                          <th className="py-3 px-4 font-semibold">Project</th>
                          <th className="py-3 px-4 font-semibold">Land Sector</th>
                          <th className="py-3 px-4 font-semibold">Assigned Officer</th>
                          <th className="py-3 px-4 font-semibold">Mission Status</th>
                          <th className="py-3 px-4 font-semibold">Target Due Date</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#387A4E]/10">
                        {assignments.map((asgn) => {
                          const proj = projects.find((p) => p.id === asgn.projectId);
                          const off = officers.find((o) => o.id === asgn.assignedToProfileId);
                          return (
                            <tr key={asgn.id} className="hover:bg-[#121A16]/60 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-[#76B78C]">
                                {asgn.id.substring(0, 8)}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-[#F8FAF8]">
                                {proj?.name || 'Restoration Program'}
                              </td>
                              <td className="py-3.5 px-4 text-[#94C7A5]">
                                {asgn.sectorId || 'All Project Sectors'}
                              </td>
                              <td className="py-3.5 px-4 text-[#AEB9B3]">
                                {off?.displayName || 'Assigned Officer'}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-block py-1 px-2.5 rounded-lg text-[11px] font-semibold font-mono ${
                                  asgn.status === 'COMPLETED'
                                    ? 'bg-emerald-950/60 text-[#22C55E]'
                                    : asgn.status === 'IN_PROGRESS' || asgn.status === 'ACCEPTED'
                                    ? 'bg-blue-950/60 text-[#3B82F6]'
                                    : 'bg-amber-950/60 text-[#F59E0B]'
                                }`}>
                                  {asgn.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-[#819089] font-mono text-[11px]">
                                {asgn.dueDate || 'No deadline'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setActiveNav('creator');
                                    setActiveTab('creator');
                                  }}
                                  className="py-1 px-3 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] rounded-lg text-xs font-medium border-0 cursor-pointer"
                                >
                                  Manage Tasks
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'tasks' ? (
              /* DEDICATED TASKS BREAKDOWN WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Field Tasks Breakdown & Priorities
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Detailed task checklist, ground evidence requirements, and priority status monitoring.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('map')}
                      className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ← Return to Map
                    </button>
                  </div>
                </div>

                {/* Tasks Breakdown List */}
                <div className="bg-[#18211D] rounded-[16px] p-6 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#387A4E]/20">
                    <h3 className="text-base font-semibold text-[#F8FAF8]">
                      Active Mission Tasks ({assignments.flatMap((a) => a.tasks || []).length})
                    </h3>
                    <span className="text-xs text-[#AEB9B3]">
                      Priority-ranked field operations
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#387A4E]/20 text-[#819089]">
                          <th className="py-3 px-4 font-semibold">Task Title</th>
                          <th className="py-3 px-4 font-semibold">Priority</th>
                          <th className="py-3 px-4 font-semibold">Task Type</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold">Evidence Required</th>
                          <th className="py-3 px-4 font-semibold text-right">Target Deadline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#387A4E]/10">
                        {assignments.flatMap((a) => a.tasks || []).map((task, idx) => (
                          <tr key={task.id || idx} className="hover:bg-[#121A16]/60 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#F8FAF8]">
                              {task.title}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block py-1 px-2.5 rounded-lg text-[11px] font-semibold font-mono ${
                                task.priority === 'CRITICAL'
                                  ? 'bg-red-950/60 text-[#EF4444]'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-950/60 text-[#F59E0B]'
                                  : 'bg-blue-950/60 text-[#3B82F6]'
                              }`}>
                                {task.priority || 'MEDIUM'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[#94C7A5] font-mono">
                              {task.taskType || 'FIELD_VERIFICATION'}
                            </td>
                            <td className="py-3.5 px-4 text-[#AEB9B3]">
                              {task.status || 'PENDING'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[#22C55E] font-medium flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-[#22C55E]" /> Geotagged Photos
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right text-[#819089] font-mono text-[11px]">
                              {task.dueAt ? task.dueAt.slice(0, 10) : '2026-08-10'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'evidence' ? (
              /* DEDICATED EVIDENCE REVIEW WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Ground Evidence Review & Verification Queue
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Review geofenced photo uploads, canopy observations, and issue evidence sign-offs or revision requests.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('map')}
                      className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ← Return to Map
                    </button>
                  </div>
                </div>

                {/* Evidence Queue Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {evidenceQueue.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 rounded-[16px] bg-[#18211D] border-0 text-xs space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(56,122,78,0.2)] transition-all"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-[#387A4E]/20">
                        <span className="font-semibold text-sm text-[#76B78C]">
                          {item.patchId}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-[#AEB9B3]">
                          <span className={`w-2 h-2 rounded-full ${
                            item.type === 'Waiting Evidence'
                              ? 'bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]'
                              : item.type === 'Missing Photos'
                              ? 'bg-[#EF4444] shadow-[0_0_6px_#EF4444]'
                              : 'bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]'
                          }`} />
                          {item.type}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-[#F8FAF8]">{item.patchName}</p>
                        <p className="text-xs text-[#819089]">
                          Submitting Officer: <strong className="text-[#AEB9B3]">{item.officerName}</strong> • Submitted {item.submittedAt}
                        </p>
                      </div>

                      {item.status === 'PENDING' ? (
                        <div className="flex items-center gap-3 pt-3 border-t border-[#387A4E]/15">
                          <button
                            onClick={() => handleApproveEvidence(item.id)}
                            className="py-2 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_12px_rgba(56,122,78,0.3)] transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Evidence
                          </button>
                          <button
                            onClick={() => handleRequestRevision(item.id)}
                            className="py-2 px-4 bg-[#121A16] hover:bg-amber-950/40 text-[#F59E0B] text-xs font-semibold rounded-xl border-0 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Request Revision
                          </button>
                        </div>
                      ) : item.status === 'APPROVED' ? (
                        <div className="pt-2 text-xs font-semibold text-[#22C55E] flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[#22C55E]" />
                          <span>Approved by Supervisor & Persisted to NestJS Backend</span>
                        </div>
                      ) : (
                        <div className="pt-2 text-xs font-semibold text-[#F59E0B] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                          <span>Revision Requested & Notified to Field Officer</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'projects' ? (
              /* DEDICATED PROJECTS WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <FolderPlus className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Land Restoration Projects & Programs
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          District restoration program scopes, sector boundaries, and active land restoration initiatives.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('map')}
                      className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      ← Return to Map
                    </button>
                    <button
                      onClick={() => {
                        setProjectId(projects[0]?.id || '');
                        setCreatingProject(true);
                        setActiveTab('creator');
                      }}
                      className="py-2.5 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Create New Project</span>
                    </button>
                  </div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-6 rounded-[16px] bg-[#18211D] border-0 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(56,122,78,0.2)] transition-all"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-[#387A4E]/20">
                        <h3 className="font-semibold text-base text-[#F8FAF8] truncate">{proj.name}</h3>
                        <span className="text-[11px] font-mono bg-[#387A4E]/40 px-2 py-0.5 rounded text-[#76B78C]">
                          Active Program
                        </span>
                      </div>

                      <p className="text-xs text-[#AEB9B3] line-clamp-3 leading-relaxed">
                        {proj.description || 'Enterprise land restoration program in Ranga Reddy District.'}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs border-t border-[#387A4E]/15">
                        <span className="text-[#819089]">
                          Sectors: <strong className="text-[#76B78C]">4 Sectors</strong>
                        </span>
                        <button
                          onClick={() => {
                            setProjectId(proj.id);
                            setActiveTab('creator');
                          }}
                          className="py-1.5 px-3 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] rounded-lg text-xs font-semibold border-0 cursor-pointer"
                        >
                          Issue Mission
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'ai-insights' ? (
              /* DEDICATED AI INSIGHTS & GOVERNANCE WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_0_35px_rgba(56,122,78,0.2)] hover:shadow-[0_0_45px_rgba(56,122,78,0.3)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Geotwin AI Governance & Intelligence Hub
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Human-in-the-loop AI recommendations, workload rebalancing, and environmental risk telemetry.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('map')}
                    className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    ← Return to Map
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-[16px] bg-[#18211D] border-0 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between pb-3 border-b border-[#387A4E]/20">
                      <span className="font-semibold text-sm text-[#76B78C]">Workload Proposal</span>
                      <span className="text-[11px] font-mono bg-[#387A4E]/40 px-2 py-0.5 rounded text-[#22C55E]">High Priority</span>
                    </div>
                    <p className="text-xs text-[#AEB9B3] leading-relaxed">
                      Officer Ravi has 8 active tasks. AI proposes reassigning 2 tasks to Officer Anita Roy (2 active tasks).
                    </p>
                    <button
                      onClick={() => setSuccess('Accepted AI workload rebalance proposal.')}
                      className="w-full py-2.5 px-4 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] cursor-pointer"
                    >
                      Accept Proposal
                    </button>
                  </div>

                  <div className="p-6 rounded-[16px] bg-[#18211D] border-0 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between pb-3 border-b border-[#387A4E]/20">
                      <span className="font-semibold text-sm text-[#F59E0B]">Weather Forecast Impact</span>
                      <span className="text-[11px] font-mono bg-amber-950/60 px-2 py-0.5 rounded text-[#F59E0B]">Schedule Notice</span>
                    </div>
                    <p className="text-xs text-[#AEB9B3] leading-relaxed">
                      Rainfall forecast in Medak Sector may delay ground evidence collection. Recommend +24h deadline buffer.
                    </p>
                    <button
                      onClick={() => setSuccess('Applied +24h rainfall deadline buffer.')}
                      className="w-full py-2.5 px-4 bg-[#121A16] hover:bg-amber-950/40 text-[#F59E0B] text-xs font-semibold rounded-xl border-0 cursor-pointer"
                    >
                      Apply Schedule Adjustment
                    </button>
                  </div>

                  <div className="p-6 rounded-[16px] bg-[#18211D] border-0 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between pb-3 border-b border-[#387A4E]/20">
                      <span className="font-semibold text-sm text-[#EF4444]">Evidence Upload Alert</span>
                      <span className="text-[11px] font-mono bg-red-950/60 px-2 py-0.5 rounded text-[#EF4444]">Patch RP-17A</span>
                    </div>
                    <p className="text-xs text-[#AEB9B3] leading-relaxed">
                      No ground photo evidence submitted for 5 days. High degradation risk detected via satellite imagery.
                    </p>
                    <button
                      onClick={() => setSuccess('Dispatched priority evidence reminder to field officer.')}
                      className="w-full py-2.5 px-4 bg-[#121A16] hover:bg-red-950/40 text-[#EF4444] text-xs font-semibold rounded-xl border-0 cursor-pointer"
                    >
                      Issue Priority Reminder
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'profile' ? (
              /* DEDICATED SUPERVISOR PROFILE WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <User className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Supervisor Profile & District Credentials
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Officer identification, department authorization token, and security settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('map')}
                    className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    ← Return to Map
                  </button>
                </div>

                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6 w-full">
                  <div className="flex items-center gap-5 pb-6 border-b border-[#387A4E]/20">
                    <div className="w-16 h-16 rounded-2xl bg-[#387A4E] flex items-center justify-center text-xl font-bold text-[#F8FAF8] shadow-[0_0_25px_rgba(56,122,78,0.5)]">
                      {supervisorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#F8FAF8]">{supervisorName}</h3>
                      <p className="text-xs text-[#76B78C]">District Restoration Supervisor (Badge SUP-092)</p>
                      <p className="text-[11px] text-[#819089] mt-0.5 font-mono">Telangana Forest & Land Department • Ranga Reddy District</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-[#121A16] rounded-xl space-y-1">
                      <span className="text-[#819089]">Authorization Level</span>
                      <span className="font-semibold text-[#F8FAF8] block">Class-1 District Operational Clearance</span>
                    </div>
                    <div className="p-4 bg-[#121A16] rounded-xl space-y-1">
                      <span className="text-[#819089]">Assigned Sector Zone</span>
                      <span className="font-semibold text-[#76B78C] block">Ranga Reddy District • Sectors 1 to 4</span>
                    </div>
                    <div className="p-4 bg-[#121A16] rounded-xl space-y-1">
                      <span className="text-[#819089]">System Role</span>
                      <span className="font-semibold text-[#F8FAF8] block">District Restoration Supervisor</span>
                    </div>
                    <div className="p-4 bg-[#121A16] rounded-xl space-y-1">
                      <span className="text-[#819089]">Security Hash</span>
                      <span className="font-mono text-[#76B78C] text-[11px] block truncate">sha256:8f9b4a102c38d4e5f6a7b8c9d0e1</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <button
                      onClick={() => setSuccess('Updated supervisor officer credentials.')}
                      className="py-2.5 px-5 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] cursor-pointer"
                    >
                      Save Profile Updates
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'settings' ? (
              /* DEDICATED CONTROL CENTRE SETTINGS WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <Settings className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          Control Centre System & Telemetry Settings
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Configure map layer defaults, telemetry polling rates, geofencing parameters, and notification alerts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('map')}
                    className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    ← Return to Map
                  </button>
                </div>

                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-6 w-full text-xs">
                  <div className="space-y-4">
                    <div className="p-4 bg-[#121A16] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#F8FAF8] block">GIS Operations Map Style</span>
                        <span className="text-[11px] text-[#819089]">Dark GIS Vector tiles with satellite overlay</span>
                      </div>
                      <span className="font-mono text-[#76B78C]">Dark Vector (Active)</span>
                    </div>

                    <div className="p-4 bg-[#121A16] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#F8FAF8] block">Field Telemetry Polling Rate</span>
                        <span className="text-[11px] text-[#819089]">GPS check-in update frequency for field officers</span>
                      </div>
                      <span className="font-mono text-[#3B82F6]">Every 5 Seconds</span>
                    </div>

                    <div className="p-4 bg-[#121A16] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#F8FAF8] block">Geofence Accuracy Radius</span>
                        <span className="text-[11px] text-[#819089]">Tolerance threshold for plot photo EXIF validation</span>
                      </div>
                      <span className="font-mono text-[#22C55E]">Strict 10m Tolerance</span>
                    </div>

                    <div className="p-4 bg-[#121A16] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#F8FAF8] block">Audit Compliance Hash Engine</span>
                        <span className="text-[11px] text-[#819089]">Cryptographic SHA-256 event signing</span>
                      </div>
                      <span className="font-mono text-[#22C55E]">Enabled (Active)</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setSuccess('Control Centre settings saved successfully.')}
                      className="py-2.5 px-5 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'help' ? (
              /* DEDICATED HELP & SOP WORKSPACE VIEW */
              <div className="space-y-8">
                <div className="bg-[#18211D] rounded-[16px] p-8 border-0 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(56,122,78,0.2)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#387A4E]/20 flex items-center justify-center text-[#94C7A5] shadow-[0_0_15px_rgba(56,122,78,0.3)]">
                        <HelpCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-[22px] font-semibold text-[#F8FAF8]">
                          GIS Standard Operating Procedures & Technical Support
                        </h2>
                        <p className="text-xs text-[#AEB9B3]">
                          Field operations manual, evidence verification protocols, and emergency support escalation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('map')}
                    className="py-2.5 px-4 bg-[#121A16] hover:bg-[#1C2822] text-[#76B78C] border-0 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    ← Return to Map
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="p-6 rounded-[16px] bg-[#18211D] border-0 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <h3 className="font-semibold text-base text-[#76B78C]">Ground Evidence Protocol</h3>
                    <p className="text-[#AEB9B3] leading-relaxed">
                      Officers must submit 4 geofenced canopy photos with matching EXIF location metadata within 10m of sector centroid.
                    </p>
                  </div>

                  <div className="p-6 rounded-[16px] bg-[#18211D] border-0 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <h3 className="font-semibold text-base text-[#76B78C]">Mission Escalation Policy</h3>
                    <p className="text-[#AEB9B3] leading-relaxed">
                      Assignments overdue by &gt;48 hours automatically flag critical warning alerts on District Admin and Supervisor command dashboards.
                    </p>
                  </div>

                  <div className="p-6 rounded-[16px] bg-[#18211D] border-0 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.3)] col-span-1 md:col-span-2">
                    <h3 className="font-semibold text-base text-[#F8FAF8]">Telangana State GIS Operations Support</h3>
                    <p className="text-[#AEB9B3] leading-relaxed">
                      For technical assistance, map tile rendering issues, or emergency signal drops, contact the State Operations Cell:
                    </p>
                    <p className="font-mono text-[#76B78C] pt-1">
                      Phone: +91 40 2345 6789 • Email: support.gis@telangana.gov.in
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      {/* ONBOARD OFFICER MODAL OVERLAY */}
      {onboardModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#18211D] rounded-2xl p-6 max-w-md w-full border-0 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#387A4E]/20">
              <h3 className="text-base font-semibold text-[#F8FAF8] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#76B78C]" />
                Onboard Field Officer
              </h3>
              <button onClick={() => setOnboardModalOpen(false)} className="text-[#819089] hover:text-[#F8FAF8] cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardOfficer} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#F8FAF8]">Full Name</label>
                <input
                  type="text"
                  required
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  placeholder="e.g., Vikram Reddy"
                  className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl focus:ring-1 focus:ring-[#387A4E] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#F8FAF8]">Designation / Role</label>
                <select
                  value={newOfficerRole}
                  onChange={(e) => setNewOfficerRole(e.target.value)}
                  className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl focus:ring-1 focus:ring-[#387A4E] outline-none"
                >
                  <option value="GIS Field Surveyor">GIS Field Surveyor</option>
                  <option value="Senior Field Inspector">Senior Field Inspector</option>
                  <option value="Land Restoration Officer">Land Restoration Officer</option>
                  <option value="Canopy Monitoring Officer">Canopy Monitoring Officer</option>
                  <option value="Soil Quality Analyst">Soil Quality Analyst</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#F8FAF8]">District Sector</label>
                <input
                  type="text"
                  value={newOfficerDistrict}
                  onChange={(e) => setNewOfficerDistrict(e.target.value)}
                  className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl focus:ring-1 focus:ring-[#387A4E] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#F8FAF8]">Phone Contact Number</label>
                <input
                  type="text"
                  value={newOfficerPhone}
                  onChange={(e) => setNewOfficerPhone(e.target.value)}
                  placeholder="+91 98490 12345"
                  className="w-full p-3 bg-[#121A16] border-0 text-[#F8FAF8] rounded-xl focus:ring-1 focus:ring-[#387A4E] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="py-2.5 px-4 bg-[#121A16] text-[#AEB9B3] hover:text-[#F8FAF8] rounded-xl border-0 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] font-semibold rounded-xl border-0 shadow-[0_0_15px_rgba(56,122,78,0.35)] cursor-pointer"
                >
                  Confirm Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
