import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, ChevronLeft } from 'lucide-react';
import bgImage from '../assets/images/bg.png';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    const success = await register(cleanUsername, cleanEmail, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-cyber-dark relative overflow-hidden" style={{ backgroundImage: `linear-gradient(rgba(10, 20, 20, 0.8), rgba(10, 20, 20, 0.8)), url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      
      <div className="cyber-glass max-w-md w-full p-10 rounded-2xl shadow-2xl border border-cyber-green/20 relative overflow-hidden animate-in fade-in zoom-in duration-500">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyber-green/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyber-blue/10 blur-3xl rounded-full"></div>

        <div className="relative">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-cyber-green transition-colors mb-8 group">
            <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <Trophy className="h-16 w-16 text-cyber-green" />
              <div className="absolute inset-0 bg-cyber-green/20 blur-xl rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic font-bytebounce text-center">
              Create <span className="text-cyber-green">Account</span>
            </h2>
            <p className="mt-2 text-sm text-white/50 font-mono text-center uppercase tracking-widest">Join the competition</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-1 ml-1">
                Username
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                className="cyber-input w-full font-mono text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-1 ml-1">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="off"
                className="cyber-input w-full font-mono text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-1 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="cyber-input w-full font-mono text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-1 ml-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="cyber-input w-full font-mono text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <button type="submit" className="cyber-button w-full py-3 text-sm">
                Register
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-sm text-white/40">
              Already have an account?{' '}
              <Link to="/login" className="text-cyber-green hover:text-cyber-blue font-bold uppercase tracking-tighter transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
