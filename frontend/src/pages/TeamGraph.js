import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Loader2, Activity, Users, ShieldCheck } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('en-US');

function TeamGraph() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamInsights();
  }, []);

  const fetchTeamInsights = async () => {
    try {
      const response = await api.get('/teams/my/team');
      setTeam(response.data);
    } catch (error) {
      toast.error(error.response?.status === 404 ? 'Join a team to view progress insights' : 'Failed to load team insights');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-96">
          <Loader2 className="h-12 w-12 text-cyber-blue animate-spin mb-4" />
          <p className="text-cyber-blue font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Insights...</p>
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="py-8">
          <div className="cyber-card p-12 text-center max-w-2xl mx-auto border-dashed border-yellow-400/30">
            <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-tighter mb-4">No Team Detected</h2>
            <p className="text-white/60 font-mono text-sm">Join a team to access progress insights and performance analytics.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 space-y-8">
        <div className="cyber-card p-6 border-l-4 border-cyber-blue">
          <div className="flex items-center space-x-3 mb-2">
             <Activity className="text-cyber-blue h-6 w-6" />
             <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Team Progress <span className="text-cyber-blue">Insights</span></h1>
          </div>
          <p className="text-white/50 font-mono text-xs uppercase tracking-widest">Performance summary and member contribution for {team.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="cyber-card p-6 group">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-cyber-green transition-colors">Total Score</p>
            <p className="mt-2 text-4xl font-black text-cyber-green tracking-tighter">{numberFormatter.format(team.totalScore || 0)} <span className="text-xs uppercase">pts</span></p>
          </div>
          <div className="cyber-card p-6 group">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-cyber-blue transition-colors">Solved Challenges</p>
            <p className="mt-2 text-4xl font-black text-cyber-blue tracking-tighter">{numberFormatter.format(team.solvedChallenges?.length || 0)} <span className="text-xs uppercase">solved</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="cyber-glass p-6 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-2 mb-6">
               <Users className="text-cyber-blue h-5 w-5" />
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Member Contribution</h2>
            </div>
            
            {(team.unattributedSubmissionStats?.points || 0) > 0 && (
              <div className="mb-4 p-3 rounded bg-yellow-400/5 border border-yellow-400/20 text-[10px] font-mono text-yellow-400/80 uppercase">
                Legacy unattributed points: {team.unattributedSubmissionStats.points} ({team.unattributedSubmissionStats.submissions} solves before per-user tracking)
              </div>
            )}

            <div className="space-y-3">
              {(team.memberSubmissionStats || []).map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="font-black text-white uppercase tracking-tight text-sm">{member.username}</p>
                    <p className="text-[10px] font-mono text-white/40 mt-1 uppercase">
                      {member.submissions} successful submissions | {numberFormatter.format(member.contributionPercent || 0)}% contribution
                    </p>
                  </div>
                  <p className="text-lg font-black text-cyber-green tracking-tighter">{numberFormatter.format(member.points)} pts</p>
                </div>
              ))}
            </div>
          </div>

          <div className="cyber-glass p-6 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-2 mb-6">
               <ShieldCheck className="text-cyber-green h-5 w-5" />
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Recent Solves</h2>
            </div>
            
            {team.solvedChallenges?.length ? (
              <div className="space-y-3">
                {[...team.solvedChallenges]
                  .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
                  .slice(0, 6)
                  .map((item) => (
                    <div key={item.challengeId?._id || item.solvedAt} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-lg group hover:border-cyber-green/30 transition-colors">
                      <p className="font-black text-white/80 uppercase text-xs truncate group-hover:text-white transition-colors">{item.challengeId?.title || 'Unknown Asset'}</p>
                      <p className="text-[10px] font-mono text-white/30 shrink-0 ml-4 group-hover:text-cyber-green transition-colors italic">
                        {item.solvedAt ? format(new Date(item.solvedAt), 'yyyy.MM.dd') : 'No Date'}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-xl">
                 <p className="text-white/20 font-black uppercase text-xs italic">No activity logs recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TeamGraph;
