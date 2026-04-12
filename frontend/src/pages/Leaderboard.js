import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Trophy, Medal } from 'lucide-react';
import AllTeamsProgressChart from '../components/Graph/AllTeamsProgressChart';
import api from '../services/api';

function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [graphSeries, setGraphSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
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
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Leaderboard</h1>

        <div className="rounded-xl border border-slate-700 bg-slate-900 shadow-lg p-4 sm:p-5 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3">Score Progress</h2>
          <AllTeamsProgressChart series={graphSeries} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900 shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Place</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Team</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-700">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><div className="flex items-center">{getRankIcon(team.rank)}</div></td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-blue-300">{team.name}</div></td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap"><div className="text-lg font-semibold text-slate-100">{team.totalScore}</div></td>
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
