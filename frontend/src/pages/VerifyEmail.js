import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import api from '../services/api';
import bgImage from '../assets/images/bg.png';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const statusTitle =
    status === 'success'
      ? 'Verification Successful'
      : status === 'error'
        ? 'Verification Failed'
        : 'Email Verification';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing from the link.');
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const response = await api.get('/auth/verify-email', {
          params: { token }
        });

        if (cancelled) {
          return;
        }

        setStatus('success');
        setMessage(response.data?.message || 'Email verified successfully. You can now log in.');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setMessage(error?.response?.data?.error || 'Verification failed. Please request a new verification email.');
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cyber-dark relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 20, 20, 0.8), rgba(10, 20, 20, 0.8)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="cyber-glass max-w-md w-full p-10 rounded-2xl shadow-2xl border border-cyber-green/20 relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyber-green/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyber-blue/10 blur-3xl rounded-full"></div>

        <div className="relative text-center">
          <div className="flex justify-center mb-5">
            <div className="relative">
              <Trophy className="h-16 w-16 text-cyber-green" />
              <div className="absolute inset-0 bg-cyber-green/20 blur-xl rounded-full animate-pulse"></div>
            </div>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic font-bytebounce">
            <span className={status === 'success' ? 'text-cyber-green' : status === 'error' ? 'text-red-400' : 'text-white'}>
              {statusTitle}
            </span>
          </h2>

          <p className={`mt-6 text-sm font-mono ${status === 'success' ? 'text-cyber-green' : status === 'error' ? 'text-red-300' : 'text-white/75'}`}>
            {message}
          </p>

          {status === 'loading' && (
            <p className="mt-3 text-xs uppercase tracking-widest text-cyber-green font-black">Please wait...</p>
          )}

          {status !== 'loading' && (
            <div className="mt-8">
              <Link to="/login" className="cyber-button w-full inline-block py-3 text-sm">
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
