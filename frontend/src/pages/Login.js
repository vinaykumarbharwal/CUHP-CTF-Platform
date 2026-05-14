import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import bgImage from '../assets/images/bg.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailLocked, setEmailLocked] = useState(true);
  const [passwordLocked, setPasswordLocked] = useState(true);
  const [showForceLogin, setShowForceLogin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleForceLogin = async () => {
    setIsSubmitting(true);
    const success = await login(email.trim(), password.trim(), true);
    setIsSubmitting(false);
    if (success === true) {
      navigate('/dashboard');
    } else {
      setShowForceLogin(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      toast.error('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(trimmedEmail, trimmedPassword);
    setIsSubmitting(false);
    if (result === true) {
      navigate('/dashboard');
    } else if (result === 'requiresForceLogin') {
      setShowForceLogin(true);
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
              <span className="tracking-[0.28em]">CUHP</span>{' '}<span className="text-cyber-green tracking-[0.28em]">CTF</span>
            </h2>
            <p className="mt-2 text-sm text-white/50 font-mono text-center uppercase">Sign in to start competing</p>
          </div>

          {showForceLogin ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
                <p className="text-red-400 font-mono text-sm mb-6">
                  You are already logged in on another device. Forcing a login will disconnect the other session.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowForceLogin(false)}
                    className="flex-1 py-3 text-xs border border-white/20 rounded text-white/70 hover:text-white hover:border-white/40 transition-colors uppercase tracking-widest font-black"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleForceLogin}
                    disabled={isSubmitting}
                    className="flex-1 py-3 text-xs bg-red-500/20 text-red-500 border border-red-500/50 rounded hover:bg-red-500 hover:text-white transition-colors uppercase tracking-widest font-black disabled:opacity-50"
                  >
                    {isSubmitting ? 'Forcing...' : 'Force Login'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-xs font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">
                Email address
              </label>
                <input
                  type="email"
                  name="login_identifier"
                  required
                  readOnly={emailLocked}
                  onFocus={() => setEmailLocked(false)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
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
                name="account_passcode"
                required
                readOnly={passwordLocked}
                onFocus={() => setPasswordLocked(false)}
                autoComplete="off"
                className="cyber-input w-full font-mono text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button type="submit" disabled={isSubmitting} className="cyber-button w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          )}

          <div className="mt-8 text-center border-t border-white/10 pt-6">
            {/* <p className="text-sm text-white/40">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyber-green hover:text-cyber-blue font-bold uppercase tracking-tighter transition-colors">
                Register
              </Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
