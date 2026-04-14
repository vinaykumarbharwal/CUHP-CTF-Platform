import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import useAutoRefresh from '../hooks/useAutoRefresh';

const numberFormatter = new Intl.NumberFormat('en-US');

const CHART_COLORS = {
  successful: '#00ff41', // Matrix Green
  failed: '#ff003c',     // Cyber Red
  total: '#00f3ff'       // Cyber Blue
};

function TeamGraph() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId');
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const endpoint = teamId ? `/teams/${teamId}` : '/teams/my/team';
      const response = await api.get(endpoint);
      setTeam(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error(teamId ? 'Team data not found' : 'Join a team to view progress insights');
      } else {
        toast.error('Failed to load performance data');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(fetchData, { intervalMs: 20000 });

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

  const successRate = team.teamSubmissionStats?.successRatePercent || 0;
  const recentSolvedChallenges = [...(team.solvedChallenges || [])]
    .filter((item) => item?.challengeId?.title)
    .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
    .slice(0, 8);

  const successfulSubmissions = team.teamSubmissionStats?.successfulSubmissions || 0;
  const failedSubmissions = team.teamSubmissionStats?.failedSubmissions || 0;
  const solvePercentageData = [
    { name: 'Solves', value: successfulSubmissions, color: '#67e34e' },
    { name: 'Fails', value: failedSubmissions, color: '#dc3a30' }
  ].filter((item) => item.value > 0);

  const categoryColorMap = {
    Web: '#d946ef',
    Crypto: '#38bdf8',
    Binary: '#f59e0b',
    OSINT: '#22c55e',
    Misc: '#84cc16',
    Forensic: '#ef4444'
  };

  const solvedCategoryCounts = (team.solvedChallenges || []).reduce((acc, solved) => {
    const category = solved?.challengeId?.category;
    if (!category) {
      return acc;
    }
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryBreakdownData = Object.entries(solvedCategoryCounts).map(([name, value]) => ({
    name,
    value,
    color: categoryColorMap[name] || '#a3a3a3'
  }));

  return (
    <Layout>
      <div className="py-8 space-y-8">
        <div className="cyber-card p-6 border-l-4 border-cyber-blue">
          <div className="flex items-center space-x-3 mb-2">
             <Activity className="text-cyber-blue h-6 w-6" />
             <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Team Progress <span className="text-cyber-blue">Insights</span></h1>
          </div>
          <p className="text-white/50 font-mono text-xs uppercase tracking-widest">
            {teamId ? `Competition intelligence report for ${team.name}` : `Performance summary and member contribution for your team: ${team.name}`}
          </p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="cyber-card p-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-cyber-green mb-4">Solve Percentages</h3>
              <div className="h-64 bg-black/30 rounded-lg p-4 border border-white/5">
                {solvePercentageData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 24, bottom: 20, left: 24 }}>
                      <Pie
                        data={solvePercentageData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="52%"
                        innerRadius={50}
                        outerRadius={72}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(2)}%`}
                        labelLine
                      >
                        {solvePercentageData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => Number(value).toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/40 font-mono text-xs uppercase tracking-widest">
                    No submission data available
                  </div>
                )}
              </div>
            </div>

            <div className="cyber-card p-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-cyber-blue mb-4">Category Breakdown</h3>
              <div className="h-64 bg-black/30 rounded-lg p-4 border border-white/5">
                {categoryBreakdownData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={82}
                        label={({ percent, value }) => `${(percent * 100).toFixed(2)}% (${value})`}
                        labelLine
                      >
                        {categoryBreakdownData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => Number(value).toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/40 font-mono text-xs uppercase tracking-widest">
                    No solved category data
                  </div>
                )}
              </div>
              {categoryBreakdownData.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                  {categoryBreakdownData.map((item) => (
                    <div key={item.name} className="flex items-center text-white/70">
                      <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
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
                  <div className="flex items-center mb-3">
                    <p className="font-black text-white uppercase tracking-tight text-base group-hover:text-cyber-blue transition-colors">{member.username}</p>
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
            
            {recentSolvedChallenges.length ? (
              <div className="space-y-3">
                {recentSolvedChallenges
                  .map((item) => (
                    <div key={item.challengeId?._id || item.solvedAt} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-lg group hover:border-cyber-green/30 transition-colors">
                      <div className="flex items-center space-x-3 truncate">
                         <div className="w-1.5 h-1.5 bg-cyber-green rounded-full shadow-[0_0_5px_#00ff41]"></div>
                         <p className="font-black text-white/80 uppercase text-xs truncate group-hover:text-white transition-colors">{item.challengeId.title}</p>
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
