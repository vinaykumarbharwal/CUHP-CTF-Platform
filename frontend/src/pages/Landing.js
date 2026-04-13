import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Globe, Shield, Terminal, Zap, ChevronRight, Activity, Cpu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import bgImage from '../assets/images/bg.png';

const Landing = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, teams: 0, challenges: 0, categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback or handle error
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'web': return <Globe className="text-cyber-blue h-8 w-8" />;
      case 'crypto': return <Shield className="text-cyber-accent h-8 w-8" />;
      case 'forensic': return <Terminal className="text-cyber-green h-8 w-8" />;
      case 'binary': return <Cpu className="text-red-500 h-8 w-8" />;
      default: return <Zap className="text-yellow-500 h-8 w-8" />;
    }
  };

  const getCategoryDescription = (category) => {
    switch (category.toLowerCase()) {
      case 'web': return 'Bypass logins, exploit XSS, and SQL injections.';
      case 'crypto': return 'Break ancient ciphers and modern encryption.';
      case 'forensic': return 'Analyze traffic and images for hidden secrets.';
      case 'binary': return 'Exploit memory vulnerabilities and reverse engineering.';
      default: return 'Unique security challenges and puzzle solving.';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-cyber-dark text-white font-sans" style={{ backgroundImage: `linear-gradient(rgba(10, 20, 20, 0.8), rgba(10, 20, 20, 0.8)), url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center space-x-2">
          <Trophy className="text-cyber-green h-8 w-8" />
          <span className="text-2xl font-black italic tracking-tighter uppercase font-bytebounce">
            CUHP <span className="text-cyber-green">CTF</span>
          </span>
        </div>
        <div className="flex items-center space-x-6">
          {user ? (
            <Link to="/dashboard" className="cyber-button text-xs py-2">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-cyber-green transition-colors">
                Login
              </Link>
              <Link to="/register" className="cyber-button text-xs py-2 px-6">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-cyber-green/5 border border-cyber-green/20 text-cyber-green text-[10px] font-black uppercase tracking-[0.2em] mb-6 animate-pulse">
            <Activity className="h-3 w-3 mr-2" /> Live Connection: Established
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none mb-6 font-bytebounce">
            The Cyber <span className="text-cyber-green">Matrix</span> <br />
            Is Online
          </h1>
          <p className="max-w-2xl mx-auto text-white/60 font-mono text-sm md:text-base mb-12 uppercase tracking-wide leading-relaxed">
            Master the art of exploitation at CUHP's premier CTF platform. 
            Real-time challenges, real-world vulnerabilities, and ultimate glory.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to={user ? "/dashboard" : "/register"} className="cyber-button px-10 py-4 text-sm w-full sm:w-auto">
              {user ? "Enter Dashboard" : "Initialize Access"}
            </Link>
            <Link to="/leaderboard" className="cyber-button border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black px-10 py-4 text-sm w-full sm:w-auto overflow-hidden group">
              <span className="relative z-10 flex items-center justify-center">
                System Ranking <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-24 transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}>
          <StatBox label="Active Agents" value={loading ? '...' : `${stats.users}+`} color="cyber-green" />
          <StatBox label="Elite Squads" value={loading ? '...' : stats.teams} color="cyber-blue" />
          <StatBox label="Active Nodes" value={loading ? '...' : stats.challenges} color="cyber-accent" />
          <StatBox label="Status" value="24/7" color="cyber-green" />
        </div>

        {/* Categories Section */}
        <div className="py-20 border-t border-white/5">
          <div className="flex items-center space-x-4 mb-12">
            <div className="h-px bg-cyber-green/30 flex-1"></div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white/40">Challenge Sectors</h2>
            <div className="h-px bg-cyber-green/30 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.categories.length > 0 ? (
              stats.categories.map((cat) => (
                <CategoryCard 
                  key={cat}
                  icon={getCategoryIcon(cat)} 
                  title={cat} 
                  description={getCategoryDescription(cat)}
                />
              ))
            ) : (
              // Fallback if API fails or categories are still loading the description logic
              <>
                <CategoryCard icon={<Globe className="text-cyber-blue h-8 w-8" />} title="Web" description="Analyze and exploit web application vulnerabilities." />
                <CategoryCard icon={<Terminal className="text-cyber-green h-8 w-8" />} title="Forensic" description="Analyze file systems and network traffic." />
                <CategoryCard icon={<Shield className="text-cyber-accent h-8 w-8" />} title="Crypto" description="Crack codes and modern encryption systems." />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-8 md:space-y-0 text-white/30">
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
              <Trophy className="text-cyber-green h-6 w-6" />
              <span className="text-xl font-black uppercase italic font-bytebounce text-white/50">CUHP CTF</span>
            </div>
            <p className="text-[10px] font-mono leading-relaxed uppercase">
              Central University of Himachal Pradesh <br />
              Cyber Security Initiative
            </p>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest">
            Encryption: AES-256 <br />
            System: Nominal
          </div>
          <div className="text-[10px] font-mono uppercase">
            © {new Date().getFullYear()} CUHP. <br />
            Built for the future.
          </div>
        </div>
      </footer>
    </div>
  );
};

const CategoryCard = ({ icon, title, description }) => (
  <div className="cyber-card p-8 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      {icon}
    </div>
    <div className="mb-6 relative z-10">{icon}</div>
    <h3 className="text-xl font-black uppercase italic mb-3 tracking-tighter group-hover:text-cyber-green transition-colors relative z-10">{title}</h3>
    <p className="text-white/40 text-[11px] font-mono leading-relaxed uppercase relative z-10">{description}</p>
  </div>
);

const StatBox = ({ label, value, color }) => (
  <div className="cyber-glass p-6 text-center rounded-xl border border-white/5">
    <div className={`text-4xl font-black font-bytebounce mb-2 uppercase tracking-tighter text-${color}`}>
      {value}
    </div>
    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</div>
  </div>
);

export default Landing;
