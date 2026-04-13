import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';
import { Trophy, Flag, LogOut } from 'lucide-react';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flag, setFlag] = useState('');
  const [category, setCategory] = useState('All');
  const [solveFilter, setSolveFilter] = useState('Unsolved');
  const [showSolvedByList, setShowSolvedByList] = useState(false);
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
      setShowSolvedByList(false);
      setFlag('');
      fetchChallenges();
      fetchTeam();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Incorrect flag');
    }
  };

  const solvedChallengeIds = useMemo(() => {
    const solvedList = team?.solvedChallenges || [];
    return new Set(
      solvedList
        .map((sc) => {
          const rawId = sc?.challengeId;
          if (!rawId) {
            return null;
          }
          return typeof rawId === 'string' ? rawId : rawId._id;
        })
        .filter(Boolean)
    );
  }, [team]);

  const isSolved = (challengeId) => solvedChallengeIds.has(challengeId);

  const isSelectedChallengeSolved = selectedChallenge ? isSolved(selectedChallenge._id) : false;

  const categories = ['All', 'Web', 'Crypto', 'Binary', 'OSINT', 'Misc', 'Forensic'];
  
  // Separate sample challenge from others
  const sampleChallenge = useMemo(() => {
    return challenges.find((c) => c.title === 'Sample Challenge (How To Play)');
  }, [challenges]);

  const nonSampleChallenges = useMemo(() => {
    return challenges.filter((c) => c.title !== 'Sample Challenge (How To Play)');
  }, [challenges]);
  
  const finalChallenges = useMemo(() => {
    let result = nonSampleChallenges;

    // Filter by Category
    if (category !== 'All') {
      result = result.filter((c) => c.category?.toLowerCase() === category.toLowerCase());
    }

    // Filter by Solve Status
    result = result.filter((challenge) => {
      if (solveFilter === 'Solved') {
        return isSolved(challenge._id);
      }
      return !isSolved(challenge._id);
    });

    // Sort by Points (High to Low)
    result = [...result].sort((a, b) => b.points - a.points);

    return result;
  }, [nonSampleChallenges, category, solveFilter, solvedChallengeIds]);

  return (
    <Layout>
      <div className="py-8">
        <div className="flex items-center space-x-4 mb-10">
          <div className="h-1 bg-cyber-blue w-12 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Challenges
          </h1>
        </div>

        {/* Sample Challenge - Always Shown First */}
        {sampleChallenge && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            <div
              key={sampleChallenge._id}
              className={`cyber-card p-6 cursor-pointer group flex flex-col justify-between border-2 border-dashed border-cyber-blue/50 bg-cyber-blue/5 shadow-[0_0_24px_rgba(0,240,255,0.2)]`}
              onClick={() => {
                setSelectedChallenge(sampleChallenge);
                setShowSolvedByList(false);
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyber-blue/70">📖 Tutorial</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border text-cyber-green border-cyber-green/30 bg-cyber-green/5`}>
                    Easy
                  </span>
                </div>
                <h3 className={`text-xl font-black uppercase tracking-tight mb-2 transition-colors text-white group-hover:text-cyber-blue`}>
                  {sampleChallenge.title}
                </h3>
              </div>
              
              <div className="mt-6 flex items-end justify-between">
                <div>
                   <p className={`text-2xl font-black leading-none text-cyber-blue`}>{sampleChallenge.points}</p>
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Points</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-cyber-blue uppercase tracking-widest">
                    ⭐ START HERE
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex space-x-3 mb-6 overflow-x-auto pb-4">
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

        {/* Solve Status Filter */}
        <div className="flex space-x-3 mb-10">
          {['Solved', 'Unsolved'].map((status) => (
            <button
              key={status}
              onClick={() => setSolveFilter(status)}
              className={`px-6 py-2 rounded font-black uppercase tracking-widest text-xs transition-all duration-300 border-2 ${
                solveFilter === status
                  ? 'bg-cyber-green border-cyber-green text-black shadow-[0_0_20px_rgba(0,255,65,0.35)]'
                  : 'border-cyber-green/30 text-cyber-green/70 hover:border-cyber-green hover:text-cyber-green'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {finalChallenges.map((challenge) => (
            <div
              key={challenge._id}
              className={`cyber-card p-6 cursor-pointer group flex flex-col justify-between ${
                isSolved(challenge._id)
                  ? 'bg-cyber-green/15 border-cyber-green shadow-[0_0_24px_rgba(0,255,65,0.25)]'
                  : 'border-cyber-blue/20'
              }`}
              onClick={() => {
                setSelectedChallenge(challenge);
                setShowSolvedByList(false);
              }}
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
                <h3 className={`text-xl font-black uppercase tracking-tight mb-2 transition-colors ${
                  isSolved(challenge._id)
                    ? 'text-cyber-green group-hover:text-cyber-green'
                    : 'text-white group-hover:text-cyber-blue'
                }`}>
                  {challenge.title}
                </h3>
              </div>
              
              <div className="mt-6 flex items-end justify-between">
                <div>
                   <p className={`text-2xl font-black leading-none ${
                     isSolved(challenge._id) ? 'text-cyber-green' : 'text-cyber-blue'
                   }`}>{challenge.points}</p>
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
              onClick={() => {
                setSelectedChallenge(null);
                setShowSolvedByList(false);
              }}
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
                <button
                  type="button"
                  onClick={() => setShowSolvedByList((prev) => !prev)}
                  className="hover:text-cyber-green transition-colors"
                >
                  Solved By ({selectedChallenge.solvedByTeams?.length || 0})
                </button>
              </div>

              {showSolvedByList && (
                <div className="mt-3 max-h-40 overflow-y-auto rounded border border-white/10 bg-black/30 p-3">
                  {selectedChallenge.solvedByTeams?.length ? (
                    <ul className="space-y-2">
                      {selectedChallenge.solvedByTeams.map((teamName) => (
                        <li key={teamName} className="text-xs font-mono text-white/80 uppercase tracking-wide">
                          {teamName}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                      No teams have solved this challenge yet.
                    </p>
                  )}
                </div>
              )}
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
                    <button onClick={() => {
                      setSelectedChallenge(null);
                      setShowSolvedByList(false);
                    }} className="flex-1 px-4 py-3 text-xs font-black uppercase text-white/50 hover:text-white transition-colors">Cancel</button>
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
