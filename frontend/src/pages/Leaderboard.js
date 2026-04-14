import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import AllTeamsProgressChart from '../components/Graph/AllTeamsProgressChart';
import api from '../services/api';
import useAutoRefresh from '../hooks/useAutoRefresh';

const COMPETITION_END_TIME = new Date('2026-04-13T03:02:00').getTime();

function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [graphSeries, setGraphSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLive = Date.now() < COMPETITION_END_TIME;

  async function fetchLeaderboard() {
    try {
      const [leaderboardResponse, graphResponse] = await Promise.all([
        api.get('/leaderboard'),
        api.get('/graph/all-teams')
      ]);
      setTeams(leaderboardResponse.data);
      setGraphSeries(Array.isArray(graphResponse.data) ? graphResponse.data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useAutoRefresh(fetchLeaderboard, { intervalMs: 30000, enabled: isLive || loading });

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.5)]" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />;
      default: return <span className="text-white/50 font-black font-mono">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-96">
          <Loader2 className="h-12 w-12 text-cyber-green animate-spin mb-4" />
          <p className="text-cyber-green font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Leaderboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="h-1 bg-cyber-green w-12 rounded-full shadow-[0_0_10px_rgba(0,255,65,0.5)]"></div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Leaderboard
          </h1>
        </div>

        <div className="cyber-card p-6 mb-10 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-cyber-blue">Score Progress</h2>
            <div className="flex items-center space-x-2">
               {isLive ? (
                 <>
                   <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse"></div>
                   <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live Update</span>
                 </>
               ) : (
                 <>
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Final Results</span>
                 </>
               )}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-4 border border-white/5">
            <AllTeamsProgressChart series={graphSeries} />
          </div>
        </div>

        <div className="cyber-glass rounded-xl overflow-hidden border border-white/10 shadow-2xl">
          <table className="min-w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-green uppercase tracking-[0.2em]">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-green uppercase tracking-[0.2em]">Team Name</th>
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-green uppercase tracking-[0.2em]">Score</th>
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-green uppercase tracking-[0.2em]">Solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">{getRankIcon(team.rank)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/graph?teamId=${team.id}`} className="block group/link">
                      <div className="text-sm font-black text-white uppercase group-hover/link:text-cyber-green transition-colors flex items-center">
                        {team.name}
                        <div className="ml-2 w-1 h-1 rounded-full bg-cyber-green opacity-0 group-hover/link:opacity-100 transition-opacity shadow-[0_0_5px_#00ff41]"></div>
                      </div>
                    </Link>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xl font-black text-cyber-blue tracking-tighter">{team.totalScore}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-black text-white/50">{team.solvedCount} solves</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

export default Leaderboard;
