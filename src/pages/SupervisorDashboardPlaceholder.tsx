import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GeotwinLogo } from '../components/shared/GeotwinLogo';
import { logoutUser } from '../utils/auth';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Map, 
  LogOut,
  Compass,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';

export const SupervisorDashboardPlaceholder: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#E8E9E2] text-[#252B26] flex flex-col md:flex-row font-sans selection:bg-[#5F7F52]/20">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#243028] border-r border-[#D4D8D0]/10 p-6 hidden md:flex flex-col justify-between shrink-0 z-20 shadow-sm">
        <div className="space-y-8">
          <div className="flex items-center space-x-2 pl-2">
            <GeotwinLogo size={36} iconOnly={true} />
            <span className="font-sans font-bold text-sm tracking-wide uppercase text-[#D7DED5]">
              GeoTwin
            </span>
          </div>

          <nav className="space-y-1">
            <button className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide bg-[#344638] text-white border-l-2 border-[#5F7F52] cursor-pointer">
              <LayoutDashboard className="w-4 h-4" />
              <span>Supervisor panel</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-[#A9B3A8] hover:bg-[#344638]/40 hover:text-white cursor-not-allowed">
              <Users className="w-4 h-4" />
              <span>Officer Telemetry</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-[#A9B3A8] hover:bg-[#344638]/40 hover:text-white cursor-not-allowed">
              <FileCheck className="w-4 h-4" />
              <span>Review Queue</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide text-[#A9B3A8] hover:bg-[#344638]/40 hover:text-white cursor-not-allowed">
              <Map className="w-4 h-4" />
              <span>GIS Layer Manager</span>
            </button>
          </nav>
        </div>

        {/* Profile Card / Exit Button */}
        <div className="border-t border-[#D4D8D0]/10 pt-4 mt-6 flex flex-col space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#344638] border border-[#D4D8D0]/10 flex items-center justify-center font-bold text-[#D7DED5]">
              SV
            </div>
            <div>
              <h5 className="text-[11px] font-semibold text-[#D7DED5]">Director A. Sen</h5>
              <span className="text-[8px] font-mono text-[#A9B3A8] uppercase tracking-wider">Ecosystem Supervisor</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-3.5 py-2 text-xs font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-500/5 rounded-lg tracking-wide transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen z-10 pb-20 md:pb-8">
        <header className="h-16 border-b border-[#D4D8D0] bg-[#FBFAEF]/90 backdrop-blur-md px-6 flex justify-between items-center sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div>
            <h1 className="text-sm font-bold text-[#252B26] tracking-wide">Good morning, Supervisor</h1>
            <p className="text-[9px] font-mono text-[#6C756D] tracking-wider">Ecosystem Restoration & Planning Panel</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[#EFF0EA] border border-[#D4D8D0] px-3 py-1.5 rounded-lg text-[9px] font-mono text-[#6F9FC6] font-semibold">
              <Compass className="w-3 h-3 text-[#6F9FC6]" />
              <span>Supervisor Node GT-01</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 bg-[#FBFAEF] border border-[#D4D8D0] rounded-lg text-[#6C756D] hover:text-red-400 hover:border-red-500/20 cursor-pointer shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-5 md:p-8 space-y-6 flex-1 max-w-4xl mx-auto w-full flex flex-col justify-center">
          
          {/* Main Info Card */}
          <section className="bg-[#FBFAEF] border border-[#D4D8D0] p-8 md:p-12 rounded-3xl shadow-sm text-center space-y-6">
            <div className="flex items-center justify-center mx-auto bg-[#EFF0EA] border border-[#D4D8D0] w-16 h-16 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-[#C89442]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-[#252B26]">Supervisor Dashboard Under Construction</h2>
              <p className="text-sm text-[#6C756D] max-w-md mx-auto leading-relaxed">
                This dashboard will serve ecosystem planning, review of field uploads, and supervisor authorizations. Active data validation workflows are currently running in the background.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center space-x-2 bg-[#EFF0EA] border border-[#D4D8D0] px-3 py-1.5 rounded-lg text-[10px] font-mono text-[#5F7F52] font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Next Release Phase: Review Queue Telemetry</span>
              </div>
              <button 
                onClick={handleSignOut}
                className="bg-[#5F7F52] hover:bg-[#90A982] text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-lg shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>

        </div>
      </main>

    </div>
  );
};

export default SupervisorDashboardPlaceholder;
