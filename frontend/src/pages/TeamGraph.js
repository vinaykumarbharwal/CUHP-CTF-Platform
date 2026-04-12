import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Loader2, Activity, Users, ShieldCheck, Target } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('en-US');

const CHART_COLORS = {
  successful: '#00ff41', // Matrix Green
  failed: '#ff003c',     // Cyber Red
  total: '#00f3ff'       // Cyber Blue
};

function TeamGraph() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/teams/my/team');
      setTeam(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Join a team to view progress insights');
      } else {
        toast.error('Failed to load performance data');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSummaryData = () => {
    if (!team?.teamSubmissionStats) return [];
    return [
      { name: 'Successful', value: team.teamSubmissionStats.successfulSubmissions || 0, color: CHART_COLORS.successful },
      { name: 'Failed', value: team.teamSubmissionStats.failedSubmissions || 0, color: CHART_COLORS.failed }
    ];
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

  const summaryData = getSummaryData();
  const successRate = team.teamSubmissionStats?.successRatePercent || 0;

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

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="cyber-card p-6 group">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-cyber-green transition-colors">Total Score</p>
            <p className="mt-2 text-4xl font-black text-cyber-green tracking-tighter">{numberFormatter.format(team.totalScore || 0)} <span className="text-xs uppercase">pts</span></p>
          </div>
          <div className="cyber-card p-6 group">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-cyber-blue transition-colors">Solved Challenges</p>
            <p className="mt-2 text-4xl font-black text-cyber-blue tracking-tighter">{numberFormatter.format(team.solvedChallenges?.length || 0)} <span className="text-xs uppercase">solved</span></p>
          </div>
          <div className="cyber-card p-6 group">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-cyber-blue transition-colors">Total Attempts</p>
            <p className="mt-2 text-4xl font-black text-white/90 tracking-tighter">{numberFormatter.format(team.teamSubmissionStats?.totalAttempts || 0)}</p>
          </div>
          <div className="cyber-card p-6 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-green/5 blur-3xl rounded-full tracking-tighter"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-cyber-green transition-colors">Success Rate</p>
            <p className="mt-2 text-4xl font-black text-cyber-green tracking-tighter">{numberFormatter.format(successRate)}%</p>
            <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyber-green shadow-[0_0_10px_#00ff41]" style={{ width: `${successRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Submission Summary Doughnut */}
        <div className="cyber-glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center space-x-2 mb-8">
             <Target className="text-cyber-blue h-5 w-5" />
             <h2 className="text-xl font-black text-white uppercase tracking-tight">Submission Summary</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summaryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    {summaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 5px ${entry.color})` }} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Total</span>
                <span className="text-2xl font-black text-white">{team.teamSubmissionStats?.totalAttempts || 0}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.successful, boxShadow: `0 0 10px ${CHART_COLORS.successful}` }}></div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white/40 uppercase tracking-widest">Successful</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{team.teamSubmissionStats?.successfulSubmissions || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.failed, boxShadow: `0 0 10px ${CHART_COLORS.failed}` }}></div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-white/40 uppercase tracking-widest">Failed</p>
                  <p className="text-2xl font-black text-white tracking-tighter">{team.teamSubmissionStats?.failedSubmissions || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Member Contribution */}
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

            <div className="space-y-4">
              {(team.memberSubmissionStats || []).map((member) => (
                <div key={member.userId} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-black text-white uppercase tracking-tight text-base group-hover:text-cyber-blue transition-colors">{member.username}</p>
                    <p className="text-xl font-black text-cyber-green tracking-tighter">{numberFormatter.format(member.points)} PTS</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-3">
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Impact</p>
                      <p className="text-xs font-black text-white/80">{numberFormatter.format(member.contributionPercent || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Success</p>
                      <p className="text-xs font-black text-cyber-blue">{member.submissions} solved</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Attempts</p>
                      <p className="text-xs font-black text-white/50">{member.totalSubmissions || 0} total / {member.incorrectSubmissions || 0} incorrect</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Solves */}
          <div className="cyber-glass p-6 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-2 mb-6">
               <ShieldCheck className="text-cyber-green h-5 w-5" />
               <h2 className="text-xl font-black text-white uppercase tracking-tight">Recent System Breaks</h2>
            </div>
            
            {team.solvedChallenges?.length ? (
              <div className="space-y-3">
                {[...team.solvedChallenges]
                  .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
                  .slice(0, 8)
                  .map((item) => (
                    <div key={item.challengeId?._id || item.solvedAt} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-lg group hover:border-cyber-green/30 transition-colors">
                      <div className="flex items-center space-x-3 truncate">
                         <div className="w-1.5 h-1.5 bg-cyber-green rounded-full shadow-[0_0_5px_#00ff41]"></div>
                         <p className="font-black text-white/80 uppercase text-xs truncate group-hover:text-white transition-colors">{item.challengeId?.title || 'Unknown Asset'}</p>
                      </div>
                      <p className="text-[10px] font-mono text-white/30 shrink-0 ml-4 group-hover:text-cyber-green transition-colors italic">
                        {item.solvedAt ? format(new Date(item.solvedAt), 'yyyy.MM.dd HH:mm') : 'No Date'}
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
