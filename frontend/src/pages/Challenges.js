import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';
import { Trophy, Flag, LogOut } from 'lucide-react';

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

  return (
    <Layout>
      <div className="py-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="h-1 bg-cyber-blue w-12 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Challenges
          </h1>
        </div>

        {/* Categories */}
        <div className="flex space-x-3 mb-10 overflow-x-auto pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-6 py-2 rounded font-black uppercase tracking-widest text-xs transition-all duration-300 border-2 ${
                category === cat 
                  ? 'bg-cyber-blue border-cyber-blue text-black shadow-[0_0_20px_rgba(0,240,255,0.4)]' 
                  : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredChallenges.map((challenge) => (
            <div
              key={challenge._id}
              className={`cyber-card p-6 cursor-pointer group flex flex-col justify-between ${
                isSolved(challenge._id) ? 'border-cyber-green/50 opacity-60' : 'border-cyber-blue/20'
              }`}
              onClick={() => setSelectedChallenge(challenge)}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{challenge.category}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                    challenge.difficulty === 'Easy' ? 'text-cyber-green border-cyber-green/30 bg-cyber-green/5' :
                    challenge.difficulty === 'Medium' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5' :
                    challenge.difficulty === 'Hard' ? 'text-orange-500 border-orange-500/30 bg-orange-500/5' :
                    'text-red-500 border-red-500/30 bg-red-500/5'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-cyber-blue transition-colors">
                  {challenge.title}
                </h3>
              </div>
              
              <div className="mt-6 flex items-end justify-between">
                <div>
                   <p className="text-2xl font-black text-cyber-blue leading-none">{challenge.points}</p>
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Points</p>
                </div>
                <div className="text-right">
                  {isSolved(challenge._id) ? (
                    <div className="flex items-center text-cyber-green text-[10px] font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-cyber-green rounded-full mr-2 animate-pulse"></div>
                      Solved
                    </div>
                  ) : (
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                       Solves: {challenge.solvedCount || 0}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenge Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="cyber-glass max-w-lg w-full p-8 rounded-2xl shadow-[0_0_100px_rgba(0,240,255,0.1)] border-cyber-blue/30 relative">
            <button 
              onClick={() => setSelectedChallenge(null)}
              className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
            >
              <LogOut className="h-6 w-6 rotate-180" />
            </button>

            <div className="mb-8">
              <span className="text-xs font-black text-cyber-blue uppercase tracking-[0.3em] mb-2 block">{selectedChallenge.category}</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{selectedChallenge.title}</h2>
              <div className="h-0.5 w-16 bg-cyber-blue mb-6"></div>
              <p className="text-white/70 font-mono text-sm leading-relaxed mb-6 bg-white/5 p-4 rounded border border-white/5">
                {selectedChallenge.description}
              </p>
              
              {selectedChallenge.hint && (
                <div className="flex items-start space-x-3 p-3 rounded bg-yellow-400/5 border border-yellow-400/20 mb-6">
                  <div className="text-yellow-400 mt-0.5 italic font-black text-xs uppercase tracking-widest shrink-0">Hint:</div>
                  <p className="text-yellow-400/80 text-xs italic">{selectedChallenge.hint}</p>
                </div>
              )}

              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest bg-black/30 p-2 rounded inline-block">
                Solved by teams: {selectedChallenge.solvedByTeams?.length || 0}
              </div>
            </div>

            <div className="space-y-6">
              {isSelectedChallengeSolved ? (
                <div className="bg-cyber-green/10 border border-cyber-green/30 p-4 rounded-lg flex items-center space-x-3">
                   <Trophy className="text-cyber-green h-5 w-5" />
                   <span className="text-cyber-green font-black uppercase text-xs tracking-widest">This challenge is already solved by your team.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-[10px] font-black text-cyber-blue uppercase tracking-widest mb-2 ml-1">Flag (CUHP{"{...}"})</label>
                    <input
                      type="text"
                      placeholder="CUHP{flag_here}"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      className="cyber-input w-full font-mono border-cyber-blue/30 focus:border-cyber-blue"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button onClick={() => setSelectedChallenge(null)} className="flex-1 px-4 py-3 text-xs font-black uppercase text-white/50 hover:text-white transition-colors">Cancel</button>
                    <button onClick={submitFlag} className="cyber-button flex-[2] py-3 text-sm border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black">Submit</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Challenges;
