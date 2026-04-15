const CTF_RELEASE_DATE = new Date('2026-05-08T10:00:00+05:30');

function getReleaseTimestamp() {
  return CTF_RELEASE_DATE.getTime();
}

function hasChallengesUnlocked(now = Date.now()) {
  return now >= getReleaseTimestamp();
}

function getSecondsUntilChallengesUnlock(now = Date.now()) {
  const diffMs = getReleaseTimestamp() - now;
  if (diffMs <= 0) {
    return 0;
  }
  return Math.ceil(diffMs / 1000);
}

module.exports = {
  CTF_RELEASE_DATE,
  hasChallengesUnlocked,
  getSecondsUntilChallengesUnlock
};
