import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';
import { Trophy, LogOut } from 'lucide-react';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useAuth } from '../contexts/AuthContext';
import {
  getChallengesReleaseDate,
  getTimeUntilChallengesUnlock,
  hasChallengesUnlocked
} from '../utils/constants';

const playWrongAttemptAudio = () => {
  const wrongAttemptAudio = new Audio('/audio.mp3');
  wrongAttemptAudio.currentTime = 0;
  wrongAttemptAudio.play().catch(() => {
    // Ignore playback errors (e.g., missing file or blocked autoplay).
  });
};

const playCorrectFlagAudio = () => {
  const correctFlagAudio = new Audio('/correct.mp3');
  correctFlagAudio.currentTime = 0;
  correctFlagAudio.play().catch(() => {
    // Ignore playback errors (e.g., missing file or blocked autoplay).
  });
};

function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flag, setFlag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeCooldowns, setChallengeCooldowns] = useState({});
  const [challengeFetchBlockedUntil, setChallengeFetchBlockedUntil] = useState(0);
  const [category, setCategory] = useState('All');
  const [solveFilter, setSolveFilter] = useState('Unsolved');
  const [showSolvedByList, setShowSolvedByList] = useState(false);
  const [team, setTeam] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [releaseMessage, setReleaseMessage] = useState('Challenges are not visible yet.');
  const isAdmin = user?.role === 'admin';

  const challengesUnlocked = hasChallengesUnlocked(nowMs) || isAdmin;
  const countdown = getTimeUntilChallengesUnlock(nowMs);
  const releaseDateText = getChallengesReleaseDate().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchChallenges = async () => {
    if (!challengesUnlocked) {
      setChallenges([]);
      return;
    }

    if (challengeFetchBlockedUntil > Date.now()) {
      return;
    }

    try {
      const response = await api.get('/challenges');
      setChallenges(response.data);
      if (releaseMessage !== 'Challenges are not visible yet.') {
        setReleaseMessage('Challenges are not visible yet.');
      }
    } catch (error) {
      if (error?.response?.status === 403) {
        const apiMessage = error?.response?.data?.error;
        if (apiMessage) {
          setReleaseMessage(apiMessage);
        }
        setChallenges([]);
        return;
      }

      const retryAfterHeader = Number(error?.response?.headers?.['retry-after'] || 0);
      const retryAfterSeconds = Number(error?.response?.data?.retryAfterSeconds || 0);
      const effectiveRetry = Math.max(retryAfterHeader, retryAfterSeconds);
      if (error?.response?.status === 429 && effectiveRetry > 0) {
        setChallengeFetchBlockedUntil(Date.now() + effectiveRetry * 1000);
      }

      const errorData = error?.response?.data;
      const errorMessage =
        typeof errorData === 'string'
          ? errorData
          : errorData?.error || errorData?.message || 'Failed to load challenges';
      toast.error(errorMessage);
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

  const refreshPageData = async () => {
    await Promise.all([fetchTeam(), challengesUnlocked ? fetchChallenges() : Promise.resolve()]);
  };

  useAutoRefresh(refreshPageData, { intervalMs: 30000, runOnFocus: false });

  const submitFlag = async () => {
    if (!selectedChallenge?._id || isSubmitting) {
      return;
    }

    const challengeId = selectedChallenge._id;
    const cooldownUntil = challengeCooldowns[challengeId] || 0;
    if (cooldownUntil > Date.now()) {
      const waitSeconds = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
      toast.error(`Too many attempts on this challenge. Try again in ${waitSeconds}s.`);
      return;
    }

    const trimmedFlag = flag.trim();
    if (!trimmedFlag) {
      toast.error('Please enter a flag before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/submit', {
        challengeId,
        flag: trimmedFlag
      });
      playCorrectFlagAudio();
      toast.success(`Correct! +${response.data.points} points`);
      setChallengeCooldowns((prev) => {
        const next = { ...prev };
        delete next[challengeId];
        return next;
      });
      setSelectedChallenge(null);
      setShowSolvedByList(false);
      setFlag('');
      refreshPageData();
    } catch (error) {
      const errorData = error?.response?.data;
      const retryAfterSeconds = Number(errorData?.retryAfterSeconds || 0);
      if (error?.response?.status === 429 && retryAfterSeconds > 0) {
        setChallengeCooldowns((prev) => ({
          ...prev,
          [challengeId]: Date.now() + retryAfterSeconds * 1000
        }));
      }

      const errorMessage =
        typeof errorData === 'string'
          ? errorData
          : errorData?.error || errorData?.message || 'Incorrect flag';

      if (error?.response?.status === 400) {
        playWrongAttemptAudio();
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
  const isSelectedChallengeCoolingDown =
    !!selectedChallenge?._id && (challengeCooldowns[selectedChallenge._id] || 0) > Date.now();

  const selectedChallengeImageLabel = useMemo(() => {
    if (!selectedChallenge?.description) {
      return '';
    }

    const bracketMatch = selectedChallenge.description.match(/\[.*?:\s*([^\]]+)\]/i);
    if (bracketMatch?.[1]) {
      return bracketMatch[1].trim();
    }

    const fallbackTitle = (selectedChallenge.title || 'challenge_image')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return `${fallbackTitle || 'challenge_image'}.jpg`;
  }, [selectedChallenge]);

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
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic">
            Challenges
          </h1>
        </div>

        {/* Sample Challenge - Always Shown First */}
        {challengesUnlocked && sampleChallenge && (
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

        {!challengesUnlocked ? (
          <div className="cyber-card p-8 border-cyber-blue/30 max-w-3xl mx-auto text-center">
            <p className="text-cyber-blue text-[10px] font-black uppercase tracking-[0.25em] mb-4">
              Challenges Locked
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <CountdownBox label="Days" value={countdown.days} />
              <CountdownBox label="Hours" value={countdown.hours} />
              <CountdownBox label="Minutes" value={countdown.minutes} />
              <CountdownBox label="Seconds" value={countdown.seconds} />
            </div>
            <p className="text-white/70 font-mono text-xs uppercase tracking-wide mb-2">
              {releaseMessage}
            </p>
            <p className="text-white/50 font-mono text-xs uppercase tracking-wide">
              {isAdmin ? (
                <span className="text-cyber-green font-black">Admin preview mode enabled. You can view and test challenges before release.</span>
              ) : (
                <>Challenge access starts on <span className="text-cyber-green font-black">{releaseDateText}</span>.</>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Categories */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-6 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full sm:w-auto px-3 sm:px-6 py-2 rounded font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 border-2 ${
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
            <div className="grid grid-cols-2 sm:flex gap-3 mb-10">
              {['Solved', 'Unsolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSolveFilter(status)}
                  className={`w-full sm:w-auto px-3 sm:px-6 py-2 rounded font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 border-2 ${
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
          </>
        )}
      </div>

      {/* Challenge Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="cyber-glass max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 rounded-2xl shadow-[0_0_100px_rgba(0,240,255,0.1)] border-cyber-blue/30 relative">
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

              {selectedChallenge.image && (
                <div className="mb-6">
                  <a
                    href={selectedChallenge.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-blue hover:text-cyber-green transition-colors text-[10px] font-black uppercase tracking-[0.2em] break-all"
                  >
                    {selectedChallengeImageLabel}
                  </a>
                </div>
              )}

              <div className="text-white/70 font-mono text-sm leading-relaxed mb-6 bg-white/5 p-4 rounded border border-white/5">
                {selectedChallenge.description.split(/\[(.*?)\]/).map((part, i) => {
                  if (i % 2 === 1) {
                    return (
                      <a
                        key={i}
                        href={selectedChallenge.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-blue hover:text-cyber-green transition-colors underline"
                      >
                        {part}
                      </a>
                    );
                  }
                  return part;
                })}
              </div>

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
                      disabled={isSubmitting || isSelectedChallengeCoolingDown}
                      className="cyber-input w-full font-mono border-cyber-blue/30 focus:border-cyber-blue"
                    />
                  </div>
                  {isSelectedChallengeCoolingDown && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
                      Too many attempts on this challenge. Please try a little later.
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button onClick={() => {
                      setSelectedChallenge(null);
                      setShowSolvedByList(false);
                    }} className="w-full sm:flex-1 px-4 py-3 text-xs font-black uppercase text-white/50 hover:text-white transition-colors">Cancel</button>
                    <button
                      onClick={submitFlag}
                      disabled={isSubmitting || isSelectedChallengeCoolingDown}
                      className="cyber-button w-full sm:flex-[2] py-3 text-sm border-cyber-blue text-cyber-blue hover:bg-cyber-blue hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
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

const CountdownBox = ({ label, value }) => (
  <div className="rounded-lg border border-cyber-blue/20 bg-black/30 px-4 py-3 text-center">
    <p className="text-2xl font-black text-cyber-green font-bytebounce">{String(value).padStart(2, '0')}</p>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</p>
  </div>
);

export default Challenges;
