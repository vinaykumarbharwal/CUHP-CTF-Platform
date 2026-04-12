import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';

function Dashboard() {
  const [team, setTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/teams/my/team');
      setTeam(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching team:', error);
      }
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {!team ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to CUHP CTF!</h2>
            <p className="text-gray-600 mb-6">Create or join a team to start competing</p>
            <div className="space-x-4">
              <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Create Team
              </button>
              <button onClick={() => setShowJoinModal(true)} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Join Team
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Team Information</h2>
              <div className="space-y-3">
                <p><strong>Team Name:</strong> {team.name}</p>
                <p><strong>Total Score:</strong> {team.totalScore}</p>
                <p><strong>Solved Challenges:</strong> {team.solvedChallenges?.length || 0}</p>
                <p><strong>Invite Code:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{team.inviteCode}</code></p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Team Members</h2>
              {(team.unattributedSubmissionStats?.points || 0) > 0 && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Legacy unattributed points: {team.unattributedSubmissionStats.points}
                  {' '}({team.unattributedSubmissionStats.submissions} solves before per-user tracking)
                </div>
              )}
              <div className="space-y-2">
                {team.members?.map((member) => (
                  <div key={getMemberData(member).key} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      {getMemberData(member).username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{getMemberData(member).username}</p>
                      <p className="text-sm text-gray-500">{getMemberData(member).email}</p>
                      <p className="text-sm text-blue-700">
                        Submission points: <span className="font-semibold">{getMemberStats(member).points}</span>
                        {' '}({getMemberStats(member).submissions} solves)
                      </p>
                      <p className="text-sm text-gray-600">
                        Attempts: <span className="font-semibold">{getMemberStats(member).totalSubmissions}</span>
                        {' '}| Incorrect: <span className="font-semibold">{getMemberStats(member).incorrectSubmissions}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Create Team</h2>
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={createTeam} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Join Team</h2>
            <input
              type="text"
              placeholder="Invite Code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowJoinModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={joinTeam} className="px-4 py-2 bg-green-600 text-white rounded">Join</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;
