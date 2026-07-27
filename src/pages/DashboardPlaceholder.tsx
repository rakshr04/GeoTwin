import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GeotwinLogo } from '../components/shared/GeotwinLogo';
import { logoutUser } from '../utils/auth';
import { 
  LayoutDashboard, 
  Briefcase, 
  MapPin, 
  Camera, 
  CheckSquare, 
  FileCheck, 
  Bell, 
  Bot, 
  Navigation as NavIcon, 
  RefreshCw, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  Compass,
  FileText,
  LogOut,
  ChevronRight,
  X
} from 'lucide-react';

// Types & Mock Data
interface Task {
  id: string;
  title: string;
  project: string;
  due: string;
  status: 'pending' | 'delayed' | 'completed' | 'review';
}

interface Project {
  id: string;
  name: string;
  district: string;
  area: string;
  phase: string;
  progress: number;
  nextAction: string;
}

interface Activity {
  id: string;
  type: string;
  desc: string;
  time: string;
}

interface AlertItem {
  id: string;
  type: 'request' | 'delayed' | 'condition' | 'sync';
  msg: string;
}

export const DashboardPlaceholder: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Simulated skeletal loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Realistic mock dataset
  const todayTasks: Task[] = [
    { id: '1', title: 'Upload field evidence', project: 'Vikarabad Restoration Site', due: 'Today, 5:00 PM', status: 'pending' },
    { id: '2', title: 'Visit restoration site', project: 'Ananthagiri Wetland Reserve', due: 'Today, 3:00 PM', status: 'completed' },
    { id: '3', title: 'Update implementation progress', project: 'Nallamala Forest Zone B', due: 'Today, 6:00 PM', status: 'review' },
    { id: '4', title: 'Submit verification package', project: 'Vikarabad Restoration Site', due: 'Delayed', status: 'delayed' },
  ];

  const assignedProjects: Project[] = [
    { id: '1', name: 'Vikarabad Restoration Site', district: 'Vikarabad', area: '142 Acres', phase: 'Supervisor Review', progress: 45, nextAction: 'Upload eastern slope evidence' },
    { id: '2', name: 'Ananthagiri Wetland Reserve', district: 'Vikarabad', area: '85 Acres', phase: 'Field Evidence', progress: 28, nextAction: 'Perform water salinity scan' },
    { id: '3', name: 'Nallamala Forest Zone B', district: 'NagarKurnool', area: '310 Acres', phase: 'Implementation', progress: 72, nextAction: 'Verify drone sapling count' },
  ];

  const workflowSteps = [
    { name: 'Land Selection', completed: true },
    { name: 'Field Evidence', completed: true },
    { name: 'Supervisor Review', completed: false, active: true },
    { name: 'Approved Plan', completed: false },
    { name: 'Implementation', completed: false },
    { name: 'Verification', completed: false },
  ];

  const recentActivity: Activity[] = [
    { id: '1', type: 'upload', desc: 'Evidence uploaded for Vikarabad Restoration Site', time: '10 mins ago' },
    { id: '2', type: 'request', desc: 'Supervisor requested another photo of Sector B', time: '1 hour ago' },
    { id: '3', type: 'approve', desc: 'Restoration plan approved for Nallamala Forest', time: 'Yesterday' },
    { id: '4', type: 'submit', desc: 'Verification package submitted for reserve', time: '2 days ago' },
  ];

  const activeAlerts: AlertItem[] = [
    { id: '1', type: 'request', msg: 'Evidence requested for Vikarabad site by supervisor' },
    { id: '2', type: 'delayed', msg: 'Verification task delayed for Nallamala Zone B' },
  ];

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Sidebar Links Configuration
  const sidebarLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Assigned Projects', icon: Briefcase },
    { id: 'land', label: 'Land Selection', icon: MapPin },
    { id: 'evidence', label: 'Evidence Collection', icon: Camera },
    { id: 'tasks', label: 'Implementation Tasks', icon: CheckSquare },
    { id: 'verification', label: 'Verification', icon: FileCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2 },
    { id: 'assistant', label: 'AI Field Assistant', icon: Bot },
  ];

  // Render skeleton loading screens matching the softer contrast palette
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#E8E9E2] text-[#252B26] flex flex-col md:flex-row font-sans">
        {/* Skeleton Sidebar (Warm Dark Green-Brown #243028) */}
        <aside className="w-64 bg-[#243028] border-r border-[#D4D8D0]/10 p-6 hidden md:flex flex-col justify-between">
          <div className="space-y-8">
            <div className="w-32 h-8 bg-[#344638] rounded-lg animate-pulse" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-10 bg-[#344638]/60 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="w-full h-12 bg-[#344638]/60 rounded-lg animate-pulse" />
        </aside>

        {/* Skeleton Main Panel (Soft Light Green #FBFAEF) */}
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 border-b border-[#D4D8D0] bg-[#FBFAEF] px-6 flex justify-between items-center">
            <div className="w-48 h-6 bg-[#EFF0EA] rounded-lg animate-pulse" />
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#EFF0EA] rounded-full animate-pulse" />
              <div className="w-24 h-8 bg-[#EFF0EA] rounded-lg animate-pulse" />
            </div>
          </header>
          <div className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
            <div className="w-full h-36 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="w-full h-80 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
                <div className="w-full h-64 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="w-full h-44 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
                <div className="w-full h-60 bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8E9E2] text-[#252B26] flex flex-col md:flex-row font-sans selection:bg-[#5F7F52]/20 relative overflow-hidden transition-all duration-300">
      
      {/* ----------------- Side Bar (Desktop Only - Warmer #243028) ----------------- */}
      <aside className="w-64 bg-[#243028] border-r border-[#D4D8D0]/10 p-6 hidden md:flex flex-col justify-between shrink-0 z-20 shadow-sm">
        <div className="space-y-8">
          <div className="flex items-center space-x-2 pl-2">
            <GeotwinLogo size={36} iconOnly={true} />
            <span className="font-sans font-bold text-sm tracking-wide uppercase text-[#D7DED5]">
              GeoTwin
            </span>
          </div>

          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    if (link.id === 'notifications') setNotificationsOpen(!notificationsOpen);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-[#344638] text-white border-l-2 border-[#5F7F52]' 
                      : 'text-[#A9B3A8] hover:bg-[#344638]/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="bg-[#5F7F52]/30 text-[#D7DED5] border border-[#D4D8D0]/10 text-[9px] px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card / Exit Button */}
        <div className="border-t border-[#D4D8D0]/10 pt-4 mt-6 flex flex-col space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#344638] border border-[#D4D8D0]/10 flex items-center justify-center font-bold text-[#D7DED5]">
              FO
            </div>
            <div>
              <h5 className="text-[11px] font-semibold text-[#D7DED5]">Officer S. Reddy</h5>
              <span className="text-[8px] font-mono text-[#A9B3A8] uppercase tracking-wider">Field Division B</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2 text-xs font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-500/5 rounded-lg tracking-wide transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ----------------- Top Header Section (Soft Light Green #FBFAEF) ----------------- */}
      <main className="flex-1 flex flex-col min-h-screen z-10 pb-20 md:pb-8">
        <header className="h-16 border-b border-[#D4D8D0] bg-[#FBFAEF]/90 backdrop-blur-md px-6 flex justify-between items-center sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center space-x-3">
            {/* Logo for mobile */}
            <div className="md:hidden flex items-center space-x-2 mr-2">
              <GeotwinLogo size={28} iconOnly={true} />
              <span className="font-sans font-bold text-xs tracking-wider text-[#252B26]">GT</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-[#252B26] tracking-wide">Good morning, Field Officer</h1>
              <p className="text-[9px] font-mono text-[#6C756D] tracking-wider">Logged into Indian Forestry Division B</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* GPS Location readout (clean data blue) */}
            <div className="flex items-center space-x-2 bg-[#EFF0EA] border border-[#D4D8D0] px-3 py-1.5 rounded-lg text-[9px] font-mono text-[#6F9FC6] font-semibold">
              <NavIcon className="w-3 h-3 animate-pulse" />
              <span className="hidden lg:inline">Vikarabad Sector B //</span>
              <span>17.33° N, 77.90° E</span>
            </div>

            {/* Sync Status Button (clean data blue) */}
            <div className="flex items-center space-x-2 bg-[#EFF0EA] border border-[#D4D8D0] px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-[#6F9FC6] font-semibold">
              <RefreshCw className="w-3 h-3 text-[#6F9FC6] animate-[spin_6s_linear_infinite]" />
              <span className="hidden sm:inline">Synced</span>
            </div>

            {/* Notification trigger */}
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 bg-[#FBFAEF] border border-[#D4D8D0] rounded-lg text-[#6C756D] hover:text-[#252B26] hover:border-[#5F7F52]/50 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#5F7F52]" />
            </button>
          </div>
        </header>

        {/* ----------------- Main Content Wrapper ----------------- */}
        <div className="p-5 md:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full animate-fade-in">
          
          {/* Notifications Drawer (Overlay panel) */}
          {notificationsOpen && (
            <div className="bg-[#FBFAEF] border border-[#D4D8D0] p-4 rounded-xl shadow-md space-y-3 relative z-40 transition-all duration-300 animate-fade-in">
              <div className="flex justify-between items-center border-b border-[#D4D8D0] pb-2">
                <h4 className="font-sans text-xs text-[#5F7F52] uppercase tracking-wider font-bold">Unresolved Sync Logs</h4>
                <button onClick={() => setNotificationsOpen(false)} className="text-[#6C756D]/70 hover:text-[#252B26] cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[#6C756D]">1. Evidence approval request pending for Sector C.</p>
                <p className="text-xs text-[#6C756D]">2. Salinity telemetry synced to server successfully.</p>
              </div>
            </div>
          )}

          {/* 1. Primary Action Card (Soft Light Green Card with green border accent) */}
          <section className="w-full bg-[#FBFAEF] border-l-4 border-l-[#5F7F52] border border-[#D4D8D0] p-5 md:p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-300">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 bg-[#EFF0EA] border border-[#D4D8D0] px-2 py-0.5 rounded-md w-fit">
                <Clock className="w-3 h-3 text-[#5F7F52]" />
                <span className="font-mono text-[9px] text-[#5F7F52] uppercase tracking-wider font-bold">Priority Action</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-[#252B26]">Upload Eastern Slope Evidence</h2>
              <p className="text-xs text-[#6C756D] flex items-center gap-1.5">
                <span className="font-semibold text-[#5F7F52]">Vikarabad Restoration Site</span>
                <span>• Due Today, 5:00 PM</span>
              </p>
            </div>
            <button className="bg-[#5F7F52] hover:bg-[#90A982] text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-lg shadow-[0_2px_4px_rgba(95,127,82,0.15)] hover:shadow-[0_4px_10px_rgba(95,127,82,0.25)] transition-all duration-300 flex items-center space-x-2 cursor-pointer self-start md:self-auto">
              <span>Open Task</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>

          {/* 2. Three-Column Grid / Stacked Mobile Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left and Middle Columns (lg:col-span-2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Today's Tasks Card Section */}
              <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm tracking-wide text-[#252B26]">Today's Operations</h3>
                  <span className="font-mono text-[10px] text-[#6C756D]/75">4 Tasks</span>
                </div>

                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-[#FBFAEF] border border-[#D4D8D0] p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-[#90A982]/50 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all duration-200 group"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#252B26] group-hover:text-[#5F7F52] transition-colors">{task.title}</h4>
                        <p className="text-[10px] text-[#6C756D]">{task.project}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className="font-mono text-[9px] text-[#6C756D] block">{task.due}</span>
                          <span className={`text-[8.5px] font-semibold px-2 py-0.5 rounded-md ${
                            task.status === 'completed' 
                              ? 'bg-[#EAF3E7] text-[#5F7F52]' 
                              : task.status === 'delayed' 
                                ? 'bg-[#FDF1F0] text-[#C65C52]' 
                                : task.status === 'review'
                                  ? 'bg-[#EEF5FC] text-[#6F9FC6]'
                                  : 'bg-[#FAF2E8] text-[#C89442]'
                          }`}>
                            {task.status === 'completed' && 'Completed'}
                            {task.status === 'delayed' && 'Delayed'}
                            {task.status === 'pending' && 'Pending'}
                            {task.status === 'review' && 'In Review'}
                          </span>
                        </div>
                        <button className="bg-[#FBFAEF] hover:bg-[#5F7F52] text-[#6C756D] hover:text-white border border-[#D4D8D0] hover:border-[#5F7F52] p-2 rounded-lg transition-all duration-200 cursor-pointer">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Projects Card Section */}
              <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm tracking-wide text-[#252B26]">Assigned Sectors</h3>
                  <span className="font-mono text-[10px] text-[#6C756D]/75">3 Sectors</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className="bg-[#FBFAEF] border border-[#D4D8D0] p-4 rounded-xl space-y-4 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#90A982]/30 transition-all duration-300"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#252B26]">{project.name}</h4>
                        <div className="flex items-center justify-between text-[9px] font-mono text-[#6C756D]">
                          <span>{project.district}</span>
                          <span>{project.area}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-mono">
                          <span className="text-[#6C756D]">Ecosystem Restoration</span>
                          <span className="text-[#5F7F52] font-semibold">{project.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EFF0EA] border border-[#D4D8D0]/60 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#5F7F52] rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="border-t border-[#D4D8D0]/50 pt-3 flex items-center justify-between text-[9px]">
                        <div>
                          <span className="text-[#6C756D]/60 block uppercase tracking-wider font-mono">Current Phase</span>
                          <span className="text-[#252B26] font-semibold">{project.phase}</span>
                        </div>
                        <button className="text-[#5F7F52] hover:text-[#90A982] font-bold uppercase tracking-wider font-mono cursor-pointer flex items-center gap-0.5">
                          <span>Detail</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column (lg:col-span-1) */}
            <div className="space-y-6">

              {/* Quick Actions Panel */}
              <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-sm tracking-wide text-[#252B26] mb-4">Quick Operations</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button className="flex flex-col items-center justify-center p-3.5 bg-[#FBFAEF] border border-[#D4D8D0] rounded-xl text-center hover:border-[#5F7F52]/20 hover:bg-[#EAF3E7]/50 transition-all duration-200 group cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <Camera className="w-5 h-5 text-[#5F7F52] group-hover:scale-105 transition-transform mb-2" />
                    <span className="text-[10px] font-bold text-[#252B26] tracking-wide uppercase">Capture Evidence</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3.5 bg-[#FBFAEF] border border-[#D4D8D0] rounded-xl text-center hover:border-[#5F7F52]/20 hover:bg-[#EAF3E7]/50 transition-all duration-200 group cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <Compass className="w-5 h-5 text-[#5F7F52] group-hover:scale-105 transition-transform mb-2" />
                    <span className="text-[10px] font-bold text-[#252B26] tracking-wide uppercase">Open Map</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3.5 bg-[#FBFAEF] border border-[#D4D8D0] rounded-xl text-center hover:border-[#5F7F52]/20 hover:bg-[#EAF3E7]/50 transition-all duration-200 group cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <AlertTriangle className="w-5 h-5 text-[#5F7F52] group-hover:scale-105 transition-transform mb-2" />
                    <span className="text-[10px] font-bold text-[#252B26] tracking-wide uppercase">Report Change</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3.5 bg-[#FBFAEF] border border-[#D4D8D0] rounded-xl text-center hover:border-[#5F7F52]/20 hover:bg-[#EAF3E7]/50 transition-all duration-200 group cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                    <Bot className="w-5 h-5 text-[#5F7F52] group-hover:scale-105 transition-transform mb-2" />
                    <span className="text-[10px] font-bold text-[#252B26] tracking-wide uppercase">Ask AI</span>
                  </button>
                </div>
              </div>
              
              {/* Project Workflow Progress step tracker */}
              <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <h3 className="font-semibold text-sm tracking-wide text-[#252B26] mb-4">Operations Workflow</h3>
                <div className="relative pl-6 space-y-4 border-l border-[#D4D8D0]">
                  {workflowSteps.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-3">
                      {/* Node Bullet */}
                      <span className={`absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                        step.completed 
                          ? 'bg-[#5F7F52] border-[#5F7F52] text-white' 
                          : step.active 
                            ? 'bg-[#FBFAEF] border-[#6F9FC6] text-[#6F9FC6] animate-pulse' 
                            : 'bg-[#EFF0EA] border-[#D4D8D0] text-[#6C756D]/40'
                      }`}>
                        {step.completed && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        {step.active && <span className="w-1.5 h-1.5 rounded-full bg-[#6F9FC6]" />}
                      </span>

                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-bold ${
                          step.completed 
                            ? 'text-[#252B26]' 
                            : step.active 
                              ? 'text-[#6F9FC6]' 
                              : 'text-[#6C756D]/50'
                        }`}>
                          {step.name}
                        </h4>
                        {step.active && (
                          <span className="inline-block text-[8px] font-mono text-[#6F9FC6] uppercase tracking-wider font-semibold">Active Phase</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts & Critical Conditions */}
              {activeAlerts.length > 0 && (
                <div className="bg-[#FDF1F0] border border-[#C65C52]/30 rounded-2xl p-5 md:p-6 shadow-sm space-y-3">
                  <h3 className="font-semibold text-sm tracking-wide text-[#C65C52] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#C65C52]" />
                    <span>Critical Alerts</span>
                  </h3>
                  <div className="space-y-2">
                    {activeAlerts.map((alert) => (
                      <div key={alert.id} className="text-xs text-[#C65C52] bg-[#FBFAEF]/70 border border-[#C65C52]/20 p-2.5 rounded-lg leading-relaxed shadow-sm">
                        {alert.msg}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity List */}
              <div className="bg-[#FBFAEF] border border-[#D4D8D0] rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-sm tracking-wide text-[#252B26]">Operations Log</h3>
                  <span className="font-mono text-[9px] text-[#6C756D]/50 uppercase tracking-wider">Recent</span>
                </div>

                <div className="space-y-3.5">
                  {recentActivity.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 border-b border-[#D4D8D0]/50 pb-3 last:border-b-0 last:pb-0">
                      <div className="w-6 h-6 rounded-full bg-[#EFF0EA] border border-[#D4D8D0] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-[#6C756D]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-[#252B26] leading-snug">{act.desc}</p>
                        <span className="font-mono text-[8px] text-[#6C756D] block uppercase tracking-wider">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* ----------------- Bottom Tab Navigation (Mobile Only) ----------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#243028]/95 backdrop-blur-lg border-t border-[#D4D8D0]/10 px-6 flex justify-between items-center z-40 shadow-lg">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-white' : 'text-[#A9B3A8]/60'
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Dashboard</span>
        </button>

        <button 
          onClick={() => setActiveTab('projects')} 
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === 'projects' ? 'text-white' : 'text-[#A9B3A8]/60'
          }`}
        >
          <Briefcase className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Projects</span>
        </button>

        {/* Center Floating Action Button (FAB) for Evidence Capture */}
        <div className="relative -top-5">
          <button className="w-14 h-14 bg-gradient-to-r from-[#5F7F52] to-[#90A982] text-white rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(95,127,82,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-[#243028] cursor-pointer z-50">
            <Camera className="w-6 h-6" />
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('tasks')} 
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === 'tasks' ? 'text-white' : 'text-[#A9B3A8]/60'
          }`}
        >
          <CheckSquare className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">Tasks</span>
        </button>

        <button 
          onClick={() => setActiveTab('assistant')} 
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer ${
            activeTab === 'assistant' ? 'text-white' : 'text-[#A9B3A8]/60'
          }`}
        >
          <Bot className="w-4.5 h-4.5" />
          <span className="text-[9px] font-mono uppercase tracking-wider">AI</span>
        </button>
      </nav>

      <style>{`
        /* Stagger fade entrance on load */
        .animate-fade-in {
          animation: fadeEntrance 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeEntrance {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPlaceholder;
