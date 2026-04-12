export const CHALLENGE_CATEGORIES = {
  WEB: 'Web',
  CRYPTO: 'Crypto',
  BINARY: 'Binary',
  OSINT: 'OSINT',
  MISC: 'Misc'
};

export const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  EXPERT: 'Expert'
};

export const DIFFICULTY_COLORS = {
  [DIFFICULTY_LEVELS.EASY]: 'text-green-600 bg-green-100',
  [DIFFICULTY_LEVELS.MEDIUM]: 'text-yellow-600 bg-yellow-100',
  [DIFFICULTY_LEVELS.HARD]: 'text-orange-600 bg-orange-100',
  [DIFFICULTY_LEVELS.EXPERT]: 'text-red-600 bg-red-100'
};

export const FLAG_REGEX = /^CUHP\{[A-Za-z0-9_\-]+\}$/;

export const TEAM_SIZE_LIMIT = 2;

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register'
  },
  TEAMS: {
    CREATE: '/teams/create',
    JOIN: '/teams/join',
    MY_TEAM: '/teams/my/team',
    GET_TEAM: '/teams/:id'
  },
  CHALLENGES: {
    GET_ALL: '/challenges',
    GET_ONE: '/challenges/:id'
  },
  SUBMIT: '/submit',
  LEADERBOARD: '/leaderboard',
  GRAPH: {
    MY_TEAM: '/graph/my-team',
    TEAM: '/graph/team/:teamId'
  }
};
