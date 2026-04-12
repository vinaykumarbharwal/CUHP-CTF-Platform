import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email.trim(), password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="cyber-glass max-w-md w-full p-10 rounded-2xl shadow-2xl border border-cyber-green/20 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyber-green/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyber-blue/10 blur-3xl rounded-full"></div>

        <div className="relative">
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-4">
              <Trophy className="h-16 w-16 text-cyber-green" />
              <div className="absolute inset-0 bg-cyber-green/20 blur-xl rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic font-bytebounce">
              CUHP <span className="text-cyber-green">CTF Platform</span>
            </h2>
            <p className="mt-2 text-sm text-white/50 font-mono text-center uppercase">Sign in to start competing</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">
                Email address
              </label>
              <input
                type="email"
                required
                className="cyber-input w-full font-mono text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                className="cyber-input w-full font-mono text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button type="submit" className="cyber-button w-full py-3 text-sm">
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            <p className="text-sm text-white/40">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyber-green hover:text-cyber-blue font-bold uppercase tracking-tighter transition-colors">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
