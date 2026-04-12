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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Trophy className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">CUHP CTF</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-900"><LayoutDashboard className="h-4 w-4 mr-1" />Dashboard</Link>
                <Link to="/challenges" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-900"><Flag className="h-4 w-4 mr-1" />Challenges</Link>
                <Link to="/leaderboard" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-900"><BarChart3 className="h-4 w-4 mr-1" />Leaderboard</Link>
                <Link to="/graph" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-900">Progress</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

export default Layout;
