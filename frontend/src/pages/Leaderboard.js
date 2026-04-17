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
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [graphSeries, setGraphSeries] = useState([]);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [individualScorers, setIndividualScorers] = useState([]);

  const challengesUnlocked = hasChallengesUnlocked();
  const isAdmin = user?.role === 'admin';
  const showRegisteredTeamsView = !challengesUnlocked && !isAdmin;
  const isLive = Date.now() < COMPETITION_END_TIME;
  const registeredTeamsForAdmin = useMemo(
    () => [...(registeredTeams || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [registeredTeams]
  );

  const sortTeamsByName = (items) => [...(items || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const getTeamId = (team) => String(team?.id || team?._id || team?.name || '');

  async function fetchLeaderboard() {
    try {
      if (showRegisteredTeamsView) {
        const registeredTeamsResponse = await api.get('/leaderboard/registered-teams');
        const teamsForRegistrationView = sortTeamsByName(
          Array.isArray(registeredTeamsResponse.data) ? registeredTeamsResponse.data : []
        );

        setRegisteredTeams(teamsForRegistrationView);
        setTeams([]);
        setGraphSeries([]);
        setIndividualScorers([]);
        return;
      }

      const [leaderboardResponse, graphResponse, individualScorersResponse, registeredTeamsResponse] = await Promise.allSettled([
        api.get('/leaderboard'),
        api.get('/graph/all-teams'),
        api.get('/leaderboard/individual/top-scorers'),
        isAdmin ? api.get('/leaderboard/registered-teams') : Promise.resolve({ data: [] })
      ]);

      if (leaderboardResponse.status === 'fulfilled') {
        setTeams(Array.isArray(leaderboardResponse.value.data) ? leaderboardResponse.value.data : []);
      } else {
        setTeams([]);
      }

      if (graphResponse.status === 'fulfilled') {
        setGraphSeries(Array.isArray(graphResponse.value.data) ? graphResponse.value.data : []);
      } else {
        setGraphSeries([]);
      }

      if (individualScorersResponse.status === 'fulfilled') {
        setIndividualScorers(Array.isArray(individualScorersResponse.value.data) ? individualScorersResponse.value.data : []);
      } else {
        setIndividualScorers([]);
      }

      if (registeredTeamsResponse.status === 'fulfilled') {
        const adminRegisteredTeams = sortTeamsByName(
          Array.isArray(registeredTeamsResponse.value.data) ? registeredTeamsResponse.value.data : []
        );
        setRegisteredTeams(adminRegisteredTeams);
      } else {
        setRegisteredTeams([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useAutoRefresh(fetchLeaderboard, { intervalMs: 30000, enabled: showRegisteredTeamsView || isLive || loading });

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="inline-flex min-w-12 items-center justify-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-sm font-black text-yellow-300 shadow-[0_0_14px_rgba(234,179,8,0.25)]">
          <Trophy className="h-4 w-4" />
          <span>1</span>
        </div>
      );
    }

    if (rank === 2) {
      return (
        <div className="inline-flex min-w-12 items-center justify-center gap-2 rounded-full border border-gray-300/40 bg-gray-300/10 px-3 py-1 text-sm font-black text-gray-200 shadow-[0_0_10px_rgba(156,163,175,0.15)]">
          <Medal className="h-4 w-4" />
          <span>2</span>
        </div>
      );
    }

    if (rank === 3) {
      return (
        <div className="inline-flex min-w-12 items-center justify-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm font-black text-amber-300 shadow-[0_0_10px_rgba(180,83,9,0.15)]">
          <Medal className="h-4 w-4" />
          <span>3</span>
        </div>
      );
    }

    return (
      <div className="inline-flex min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-black font-mono text-white/70">
        {rank}
      </div>
    );
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="cyber-card p-8 xl:col-span-1">
              <p className="text-cyber-blue text-[10px] font-black uppercase tracking-[0.25em] mb-4">
                Pre-Competition View
              </p>
              <div className="text-6xl md:text-7xl font-black text-cyber-green font-bytebounce leading-none mb-4">
                {registeredTeams.length}
              </div>
              <p className="text-white/60 font-mono text-xs uppercase tracking-wide">
                Registered Teams
              </p>
            </div>

            <div className="cyber-card p-8 xl:col-span-2 min-h-[60vh]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <p className="text-cyber-blue text-[10px] font-black uppercase tracking-[0.25em]">
                  Team Directory
                </p>
                <p className="text-white/60 font-mono text-[10px] uppercase tracking-wide">
                  Click any team to view members
                </p>
              </div>

              {registeredTeams.length === 0 ? (
                <p className="text-white/40 font-mono text-xs uppercase tracking-wide">
                  No registered teams found.
                </p>
              ) : (
                <div className="space-y-3">
                  {registeredTeams.map((team) => {
                    const teamId = getTeamId(team);
                    const isExpanded = expandedTeamId === teamId;
                    const memberNames = (team.members || [])
                      .map((member) => member?.username)
                      .filter(Boolean);

                    return (
                      <div key={teamId} className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedTeamId(isExpanded ? null : teamId)}
                          className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <span className="text-base md:text-lg font-black uppercase tracking-wide text-white">
                            {team.name}
                          </span>
                          <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-cyber-blue">
                            {isExpanded ? 'Hide Members' : 'Show Members'}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-white/10 bg-black/25">
                            {memberNames.length ? (
                              <ul className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {memberNames.map((name) => (
                                  <li key={`${teamId}-${name}`} className="text-xs font-mono uppercase tracking-wide text-white/70 bg-white/5 border border-white/10 rounded px-3 py-2">
                                    {name}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="pt-4 text-xs font-mono uppercase tracking-wide text-white/40">
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
                      {getRankBadge(person.rank)}
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
          <div id="registered-teams-section" className="cyber-card p-8 mb-10">
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
                    const teamId = getTeamId(team);
                    const isExpanded = expandedTeamId === teamId;
                    const memberNames = (team.members || [])
                      .map((member) => member?.username)
                      .filter(Boolean);

                    return (
                      <div key={`admin-team-${teamId}`} className="rounded-lg border border-white/10 bg-black/20">
                        <button
                          type="button"
                          onClick={() => setExpandedTeamId(isExpanded ? null : teamId)}
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
                                  <li key={`${teamId}-${name}`} className="text-xs font-mono uppercase tracking-wide text-white/70">
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
                    {getRankBadge(team.rank)}
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
