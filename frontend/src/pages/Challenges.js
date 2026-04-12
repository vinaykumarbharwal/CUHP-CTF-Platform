import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flag, setFlag] = useState('');
  const [category, setCategory] = useState('All');
  const [team, setTeam] = useState(null);

  useEffect(() => {
    fetchChallenges();
    fetchTeam();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await api.get('/challenges');
      setChallenges(response.data);
    } catch (error) {
      toast.error('Failed to load challenges');
    }
  };

  const fetchTeam = async () => {
    try {
      const response = await api.get('/teams/my/team');
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const submitFlag = async () => {
    try {
      const response = await api.post('/submit', {
        challengeId: selectedChallenge._id,
        flag
      });
      toast.success(`Correct! +${response.data.points} points`);
      setSelectedChallenge(null);
      setFlag('');
      fetchChallenges();
      fetchTeam();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Incorrect flag');
    }
  };

  const isSolved = (challengeId) => {
    return team?.solvedChallenges?.some((sc) => sc.challengeId?._id === challengeId);
  };

  const isSelectedChallengeSolved = selectedChallenge ? isSolved(selectedChallenge._id) : false;

  const categories = ['All', 'Web', 'Crypto', 'Binary', 'OSINT', 'Misc'];
  const filteredChallenges = category === 'All' ? challenges : challenges.filter((c) => c.category === category);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-orange-600 bg-orange-100';
      case 'Expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Challenges</h1>

        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg ${
                category === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <div
              key={challenge._id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-transform hover:scale-105 ${
                isSolved(challenge._id) ? 'opacity-75' : ''
              }`}
              onClick={() => setSelectedChallenge(challenge)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{challenge.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{challenge.category}</p>
              <p className="text-2xl font-bold text-blue-600">{challenge.points} pts</p>
              {isSolved(challenge._id) && <div className="mt-3 text-green-600 text-sm font-medium">Solved</div>}
              <div className="mt-2 text-sm text-gray-600">
                Solved by: <span className="font-medium">{challenge.solvedCount || 0}</span> team(s)
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h2 className="text-xl font-semibold mb-4">{selectedChallenge.title}</h2>
            <p className="text-gray-600 mb-4">{selectedChallenge.description}</p>
            {selectedChallenge.hint && <p className="text-yellow-600 text-sm mb-4">Hint: {selectedChallenge.hint}</p>}
            <div className="mb-3 text-sm text-gray-600">
              Solved by teams:{' '}
              {selectedChallenge.solvedByTeams?.length
                ? selectedChallenge.solvedByTeams.join(', ')
                : 'None yet'}
            </div>

            {isSelectedChallengeSolved ? (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                This challenge is already solved by your team.
              </div>
            ) : (
              <input
                type="text"
                placeholder="Flag (CUHP{...})"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mb-4"
              />
            )}
            <div className="flex justify-end space-x-2">
              <button onClick={() => setSelectedChallenge(null)} className="px-4 py-2 text-gray-600">Cancel</button>
              {!isSelectedChallengeSolved && (
                <button onClick={submitFlag} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Challenges;
