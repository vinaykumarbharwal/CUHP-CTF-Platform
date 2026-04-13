import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Flag, LayoutDashboard, BarChart3, LogOut, User } from 'lucide-react';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen text-white">
      <nav className="cyber-glass sticky top-0 z-50 shadow-lg border-b border-cyber-green/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="relative">
                  <Trophy className="h-8 w-8 text-cyber-green group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-cyber-green/20 blur-lg rounded-full animate-pulse"></div>
                </div>
                <span className="ml-3 text-2xl font-black text-white tracking-tighter uppercase italic group-hover:text-cyber-green transition-colors font-bytebounce">CUHP CTF</span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-cyber-green transition-colors border-b-2 border-transparent hover:border-cyber-green">
                  <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
                </Link>
                <Link to="/challenges" className="inline-flex items-center px-1 pt-1 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-cyber-green transition-colors border-b-2 border-transparent hover:border-cyber-green">
                  <Flag className="h-4 w-4 mr-2" />Challenges
                </Link>
                <Link to="/leaderboard" className="inline-flex items-center px-1 pt-1 text-sm font-bold uppercase tracking-widest text-white/70 hover:text-cyber-green transition-colors border-b-2 border-transparent hover:border-cyber-green">
                  <BarChart3 className="h-4 w-4 mr-2" />Leaderboard
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-cyber-green animate-ping"></div>
                <User className="h-4 w-4 text-cyber-green" />
                <span className="text-sm font-mono font-bold">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="group flex items-center px-4 py-1.5 border border-red-500/50 text-xs font-black uppercase tracking-widest rounded transition-all hover:bg-red-500 hover:text-white"
              >
                <LogOut className="h-3 w-3 mr-2 group-hover:rotate-12 transition-transform" />
                LogOut
              </button>
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
