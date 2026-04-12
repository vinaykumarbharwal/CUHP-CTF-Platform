import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';

const numberFormatter = new Intl.NumberFormat('en-US');

function TeamGraph() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamInsights();
  }, []);

  const fetchTeamInsights = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/teams/my/team`);
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Team Found</h2>
            <p className="text-yellow-700">Create or join a team to view progress insights.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Team Progress Insights</h1>
          <p className="text-slate-600">Performance summary and member contribution for {team.name}.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{numberFormatter.format(team.totalScore || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Solved Challenges</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{numberFormatter.format(team.solvedChallenges?.length || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Invite Code</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {team.inviteCode || 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Member Contribution</h2>
          {(team.unattributedSubmissionStats?.points || 0) > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Legacy unattributed points: {team.unattributedSubmissionStats.points}
              {' '}({team.unattributedSubmissionStats.submissions} solves before per-user tracking)
            </div>
          )}

          <div className="space-y-2">
            {(team.memberSubmissionStats || []).map((member) => (
              <div key={member.userId} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{member.username}</p>
                  <p className="text-sm text-slate-500">{member.submissions} successful submissions</p>
                </div>
                <p className="text-lg font-bold text-blue-700">{numberFormatter.format(member.points)} pts</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Solves</h2>
          {team.solvedChallenges?.length ? (
            <div className="space-y-2">
              {[...team.solvedChallenges]
                .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt))
                .slice(0, 8)
                .map((item) => (
                  <div key={item.challengeId?._id || item.solvedAt} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <p className="font-medium text-slate-900">{item.challengeId?.title || 'Challenge'}</p>
                    <p className="text-sm text-slate-500">{item.solvedAt ? format(new Date(item.solvedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">No solved challenges yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TeamGraph;
