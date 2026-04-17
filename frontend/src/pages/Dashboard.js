import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Trophy } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../services/api';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { DashboardSkeleton } from '../components/Skeletons/PageSkeletons';

function Dashboard() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const fetchTeam = async () => {
    try {
      const response = await api.get('/teams/my/team');
      setTeam(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching team:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(fetchTeam, { intervalMs: 15000 });

  const createTeam = async () => {
    try {
      const response = await api.post('/teams/create', {
        name: teamName
      });
      setTeam(response.data.team);
      await fetchTeam();
      setShowCreateModal(false);
      setTeamName('');
      toast.success('Team created successfully!');
      toast.success(`Invite code: ${response.data.inviteCode}`, { duration: 10000 });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create team');
    }
  };

  const joinTeam = async () => {
    try {
      const response = await api.post('/teams/join', {
        inviteCode
      });
      setTeam(response.data.team);
      await fetchTeam();
      setShowJoinModal(false);
      setInviteCode('');
      toast.success('Successfully joined team!');
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'Failed to join team';
      if (status === 403) {
        toast.error('Joining is disabled because the CTF has started');
        return;
      }

      toast.error(message);
    }
  };

  const normalizeId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.$oid) return String(value.$oid);
    return String(value);
  };

  const getMemberData = (member) => {
    if (!member || typeof member !== 'object') {
      return { key: String(member || 'unknown'), username: 'Member', email: '' };
    }

    const username = member.username || 'Member';
    const email = member.email || '';
    const key = member._id || username;

    return { key, username, email };
  };

  const getMemberStats = (member) => {
    const memberId = normalizeId(member?._id);
    if (!memberId) {
      return { points: 0, submissions: 0 };
    }

    const stats = team?.memberSubmissionStats?.find((item) => normalizeId(item.userId) === memberId);
    return {
      points: stats?.points || 0,
      submissions: stats?.submissions || 0,
      totalSubmissions: stats?.totalSubmissions || 0,
      incorrectSubmissions: stats?.incorrectSubmissions || 0
    };
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="h-1 bg-cyber-green w-12 rounded-full"></div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Dashboard
          </h1>
        </div>

        {loading && <DashboardSkeleton />}

        {!loading && !team ? (
          <div className="cyber-card p-12 text-center max-w-2xl mx-auto border-dashed">
            <div className="inline-block p-4 rounded-full bg-cyber-green/10 mb-6">
              <Trophy className="h-12 w-12 text-cyber-green animate-bounce" />
            </div>
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Welcome to CUHP CTF!</h2>
            <p className="text-white/60 mb-10 font-mono text-sm max-w-md mx-auto">
              Create or join a team to start competing
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button onClick={() => setShowCreateModal(true)} className="cyber-button px-10">
                Create Team
              </button>
              <button onClick={() => setShowJoinModal(true)} className="cyber-button px-10 border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                Join Team
              </button>
            </div>
          </div>
        ) : !loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="cyber-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black uppercase tracking-widest text-cyber-green">Team Information</h2>
                  <div className="h-2 w-2 rounded-full bg-cyber-green animate-pulse"></div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Team Name:</span>
                    <span className="text-white font-bold">{team.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Total Score:</span>
                    <span className="text-cyber-green font-bold">{team.totalScore}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Solved Challenges:</span>
                    <span className="text-cyber-blue font-bold">{team.solvedChallenges?.length || 0}</span>
                  </div>
                  <div className="mt-6">
                    <span className="text-xs text-white/30 block mb-2 font-black uppercase">Invite Code:</span>
                    <div className="bg-black/40 border border-cyber-green/20 rounded px-3 py-2 flex items-center justify-between group">
                      <code className="text-cyber-green font-bold">{team.inviteCode}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="cyber-card p-6 min-h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black uppercase tracking-widest text-cyber-blue">Team Members</h2>
                  <span className="text-xs font-mono text-white/40">{team.members?.length} Members</span>
                </div>
                
                {(team.unattributedSubmissionStats?.points || 0) > 0 && (
                  <div className="mb-6 p-3 rounded bg-cyber-blue/5 border border-cyber-blue/20 flex items-center space-x-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue animate-ping"></div>
                    <span className="text-cyber-blue/80 font-mono">
                      Legacy unattributed points: {team.unattributedSubmissionStats.points} ({team.unattributedSubmissionStats.submissions} solves before per-user tracking)
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.members?.map((member) => (
                    <div key={getMemberData(member).key} className="flex items-center space-x-4 p-4 bg-white/5 border border-white/10 rounded-lg group hover:bg-white/10 transition-colors">
                      <div className="relative">
                        <div className="w-12 h-12 bg-cyber-dark-lighter border-2 border-cyber-green/30 rounded-full flex items-center justify-center text-cyber-green font-black text-xl">
                          {getMemberData(member).username.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyber-green border-2 border-cyber-dark rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white truncate uppercase tracking-tight">{getMemberData(member).username}</p>
                        <p className="text-[10px] font-mono text-white/40 truncate mb-1">{getMemberData(member).email}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-black text-cyber-green uppercase">Submission points: {getMemberStats(member).points}</span>
                          <span className="text-[10px] font-black text-cyber-blue uppercase">({getMemberStats(member).submissions} solves)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="cyber-glass max-w-sm w-full p-8 rounded-xl shadow-[0_0_50px_rgba(0,255,65,0.1)] border-cyber-green/30">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center">
              <span className="w-1.5 h-6 bg-cyber-green mr-3"></span>
              Create Team
            </h2>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                createTeam();
              }}
            >
              <div>
                <label className="block text-[10px] font-black text-cyber-green uppercase tracking-widest mb-2 ml-1">Team Name</label>
                <input
                  type="text"
                  placeholder="Team Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="cyber-input w-full font-mono"
                />
              </div>
              <div className="flex space-x-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 text-xs font-black uppercase text-white/50 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="cyber-button flex-[2] py-2 text-xs">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="cyber-glass max-w-sm w-full p-8 rounded-xl shadow-[0_0_50px_rgba(0,240,255,0.1)] border-cyber-blue/30">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center">
              <span className="w-1.5 h-6 bg-cyber-blue mr-3"></span>
              Join Team
            </h2>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                joinTeam();
              }}
            >
              <div>
                <label className="block text-[10px] font-black text-cyber-blue uppercase tracking-widest mb-2 ml-1">Invite Code</label>
                <input
                  type="text"
                  placeholder="Invite Code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="cyber-input w-full font-mono border-cyber-blue/30 focus:border-cyber-blue focus:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                />
              </div>
              <div className="flex space-x-4">
                <button type="button" onClick={() => setShowJoinModal(false)} className="flex-1 px-4 py-2 text-xs font-black uppercase text-white/50 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="cyber-button flex-[2] py-2 text-xs border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;
