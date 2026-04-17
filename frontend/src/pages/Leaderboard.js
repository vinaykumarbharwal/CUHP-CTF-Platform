import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Trophy, Medal } from 'lucide-react';
import AllTeamsProgressChart from '../components/Graph/AllTeamsProgressChart';
import api from '../services/api';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useAuth } from '../contexts/AuthContext';
import { hasChallengesUnlocked } from '../utils/constants';
import { LeaderboardSkeleton } from '../components/Skeletons/PageSkeletons';

const COMPETITION_END_TIME = new Date('2026-04-13T03:02:00').getTime();

function Leaderboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [graphSeries, setGraphSeries] = useState([]);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [individualScorers, setIndividualScorers] = useState([]);

  const challengesUnlocked = hasChallengesUnlocked();
  const isAdmin = user?.role === 'admin';
  const showRegisteredTeamsView = !challengesUnlocked && !isAdmin;
  const isLive = Date.now() < COMPETITION_END_TIME;
  const registeredTeamsForAdmin = useMemo(
    () => [...(teams || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [teams]
  );

  async function fetchLeaderboard() {
    try {
      if (showRegisteredTeamsView) {
        const leaderboardResponse = await api.get('/leaderboard');
        const registeredTeams = Array.isArray(leaderboardResponse.data)
          ? leaderboardResponse.data
          : [];

        registeredTeams.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        setTeams(registeredTeams);
        return;
      }

      const [leaderboardResponse, graphResponse, individualScorersResponse] = await Promise.all([
        api.get('/leaderboard'),
        api.get('/graph/all-teams'),
        api.get('/leaderboard/individual/top-scorers')
      ]);
      setTeams(leaderboardResponse.data);
      setGraphSeries(Array.isArray(graphResponse.data) ? graphResponse.data : []);
      setIndividualScorers(Array.isArray(individualScorersResponse.data) ? individualScorersResponse.data : []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useAutoRefresh(fetchLeaderboard, { intervalMs: 30000, enabled: showRegisteredTeamsView || isLive || loading });

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
        <div className="py-8">
          <div className="flex items-center space-x-4 mb-10">
            <div className="h-1 bg-cyber-green w-12 rounded-full shadow-[0_0_10px_rgba(0,255,65,0.5)]"></div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Leaderboard
            </h1>
          </div>
          <LeaderboardSkeleton />
        </div>
      </Layout>
    );
  }

  if (showRegisteredTeamsView) {
    return (
      <Layout>
        <div className="py-8">
          <div className="flex items-center space-x-4 mb-10">
            <div className="h-1 bg-cyber-blue w-12 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Registered Teams
            </h1>
          </div>

          <div className="cyber-card p-8 max-w-2xl">
            <p className="text-cyber-blue text-[10px] font-black uppercase tracking-[0.25em] mb-4">
              Pre-Competition View
            </p>
            <div className="text-5xl font-black text-cyber-green font-bytebounce mb-3">
              {teams.length}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-white/60 font-mono text-xs uppercase tracking-wide mb-3">
                Click any team to view members.
              </p>

              {teams.length === 0 ? (
                <p className="text-white/40 font-mono text-xs uppercase tracking-wide">
                  No registered teams found.
                </p>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => {
                    const isExpanded = expandedTeamId === String(team.id);
                    const memberNames = (team.members || [])
                      .map((member) => member?.username)
                      .filter(Boolean);

                    return (
                      <div key={team.id} className="rounded-lg border border-white/10 bg-black/20">
                        <button
                          type="button"
                          onClick={() => setExpandedTeamId(isExpanded ? null : String(team.id))}
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-black uppercase tracking-wide text-white">
                            {team.name}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-cyber-blue">
                            {isExpanded ? 'Hide Members' : 'Show Members'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-white/10">
                            {memberNames.length ? (
                              <ul className="pt-3 space-y-1">
                                {memberNames.map((name) => (
                                  <li key={`${team.id}-${name}`} className="text-xs font-mono uppercase tracking-wide text-white/70">
                                    {name}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="pt-3 text-xs font-mono uppercase tracking-wide text-white/40">
                                No members available.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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

        <div className="cyber-glass rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-10">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-black uppercase tracking-widest text-cyber-blue flex items-center gap-3">
              <span className="text-lg">👤</span>
              Best Individual Scorers
            </h2>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-blue uppercase tracking-[0.2em]">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-blue uppercase tracking-[0.2em]">Username</th>
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-blue uppercase tracking-[0.2em]">Score</th>
                <th className="px-6 py-4 text-left text-xs font-black text-cyber-blue uppercase tracking-[0.2em]">Solves</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {(individualScorers || []).slice(0, 3).length > 0 ? (
                (individualScorers || []).slice(0, 3).map((person) => (
                  <tr key={person.userId} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {person.rank === 1 ? (
                          <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                        ) : person.rank === 2 ? (
                          <Medal className="w-6 h-6 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.5)]" />
                        ) : person.rank === 3 ? (
                          <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.5)]" />
                        ) : (
                          <span className="text-white/50 font-black">{person.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-white uppercase group-hover:text-cyber-blue transition-colors">
                        {person.username}
                        <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mt-1">
                          {person.teamName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xl font-black text-cyber-green tracking-tighter">{person.totalScore}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-black text-white/50">{person.solvedCount} solves</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-sm font-mono text-white/40 uppercase tracking-wide">
                    No individual scores available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isAdmin && (
          <div className="cyber-card p-8 mb-10">
            <p className="text-cyber-blue text-[10px] font-black uppercase tracking-[0.25em] mb-4">
              Admin View - Registered Teams
            </p>
            <div className="text-5xl font-black text-cyber-green font-bytebounce mb-3">
              {registeredTeamsForAdmin.length}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-white/60 font-mono text-xs uppercase tracking-wide mb-3">
                Click any team to view members.
              </p>

              {registeredTeamsForAdmin.length === 0 ? (
                <p className="text-white/40 font-mono text-xs uppercase tracking-wide">
                  No registered teams found.
                </p>
              ) : (
                <div className="space-y-2">
                  {registeredTeamsForAdmin.map((team) => {
                    const isExpanded = expandedTeamId === String(team.id);
                    const memberNames = (team.members || [])
                      .map((member) => member?.username)
                      .filter(Boolean);

                    return (
                      <div key={`admin-team-${team.id}`} className="rounded-lg border border-white/10 bg-black/20">
                        <button
                          type="button"
                          onClick={() => setExpandedTeamId(isExpanded ? null : String(team.id))}
                          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-black uppercase tracking-wide text-white">
                            {team.name}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-cyber-blue">
                            {isExpanded ? 'Hide Members' : 'Show Members'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-white/10">
                            {memberNames.length ? (
                              <ul className="pt-3 space-y-1">
                                {memberNames.map((name) => (
                                  <li key={`${team.id}-${name}`} className="text-xs font-mono uppercase tracking-wide text-white/70">
                                    {name}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="pt-3 text-xs font-mono uppercase tracking-wide text-white/40">
                                No members available.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

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
