import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Flag, LayoutDashboard, BarChart3, LogOut, User } from 'lucide-react';
import { hasChallengesUnlocked } from '../utils/constants';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const showRegisteredTeamsLabel = !hasChallengesUnlocked();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-white">
      <nav className="cyber-glass sticky top-0 z-50 shadow-lg border-b border-cyber-green/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col py-3 gap-3 sm:gap-0 sm:py-0">
            <div className="flex items-center justify-between sm:h-16">
              <div className="flex min-w-0">
              <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="relative">
                  <Trophy className="h-8 w-8 text-cyber-green group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-cyber-green/20 blur-lg rounded-full animate-pulse"></div>
                </div>
                <span className="ml-3 text-lg sm:text-2xl font-black text-white tracking-tighter uppercase italic group-hover:text-cyber-green transition-colors font-bytebounce truncate">CUHP CTF</span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-cyber-green transition-colors border-b-2 border-transparent hover:border-cyber-green">
                  <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
                </Link>
                <Link to="/challenges" className="inline-flex items-center px-1 pt-1 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-cyber-green transition-colors border-b-2 border-transparent hover:border-cyber-green">
                  <Flag className="h-4 w-4 mr-2" />Challenges
                </Link>
                <Link to="/leaderboard" className="inline-flex items-center px-1 pt-1 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-cyber-green transition-colors border-b-2 border-transparent hover:border-cyber-green">
                  <BarChart3 className="h-4 w-4 mr-2" />{showRegisteredTeamsLabel ? 'Registered Teams' : 'Leaderboard'}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-6 shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3 bg-white/5 px-2.5 sm:px-4 py-1.5 rounded-full border border-white/10 min-w-0">
                <div className="w-2 h-2 rounded-full bg-cyber-green animate-ping"></div>
                <User className="h-4 w-4 text-cyber-green" />
                <span className="text-xs sm:text-sm font-mono font-bold truncate max-w-[92px] sm:max-w-none">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="group flex items-center px-2.5 sm:px-4 py-1.5 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded transition-all hover:bg-red-500 hover:text-white whitespace-nowrap"
              >
                <LogOut className="h-3 w-3 sm:mr-2 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">LogOut</span>
              </button>
            </div>
          </div>
            <div className="sm:hidden grid grid-cols-3 gap-2 pb-1">
              <Link to="/dashboard" className="inline-flex justify-center items-center py-2 border border-white/10 rounded text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-cyber-green hover:border-cyber-green/40 transition-colors">
                Dashboard
              </Link>
              <Link to="/challenges" className="inline-flex justify-center items-center py-2 border border-white/10 rounded text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-cyber-green hover:border-cyber-green/40 transition-colors">
                Challenges
              </Link>
              <Link to="/leaderboard" className="inline-flex justify-center items-center py-2 border border-white/10 rounded text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-cyber-green hover:border-cyber-green/40 transition-colors">
                {showRegisteredTeamsLabel ? 'Teams' : 'Leaderboard'}
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;
