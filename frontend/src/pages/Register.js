import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, ChevronLeft } from 'lucide-react';
import bgImage from '../assets/images/bg.png';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registrationMessage, setRegistrationMessage] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await register(cleanUsername, cleanEmail, password);
    setIsSubmitting(false);
    if (result?.success) {
      setRegisteredEmail(cleanEmail);
      setRegistrationMessage(result.message || 'Registration successful. Please check your email to verify your account. Check SPAM folder if you do not see the email in inbox.');
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

          {registrationMessage ? (
            <div className="space-y-5 border border-cyber-green/30 bg-cyber-green/5 rounded-xl p-5">
              <p className="text-cyber-green font-black uppercase tracking-wider text-sm">Registration successful</p>
              <p className="text-white/70 text-sm font-mono">{registrationMessage}</p>
              <p className="text-white/60 text-xs font-mono break-all">
                Verification link sent to: <span className="text-cyber-green">{registeredEmail}</span>
              </p>
              <Link to="/login" className="cyber-button block w-full py-3 text-sm text-center">
                Go to Login
              </Link>
            </div>
          ) : (
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
                <button type="submit" disabled={isSubmitting} className="cyber-button w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          )}

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
