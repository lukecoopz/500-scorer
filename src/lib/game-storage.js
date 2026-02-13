const STORAGE_KEYS = {
  TEAMS: '500-scorer-teams',
  GAMES: '500-scorer-games',
}

// 500 scoring table (Australian rules - Pagat)
export const BID_VALUES = {
  Spades: { 6: 40, 7: 140, 8: 240, 9: 340, 10: 440 },
  Clubs: { 6: 60, 7: 160, 8: 260, 9: 360, 10: 460 },
  Diamonds: { 6: 80, 7: 180, 8: 280, 9: 380, 10: 480 },
  Hearts: { 6: 100, 7: 200, 8: 300, 9: 400, 10: 500 },
  NT: { 6: 120, 7: 220, 8: 320, 9: 420, 10: 520 },
  M: { misere: 250 },
  OM: { openMisere: 500 },
}

export const SUITS = ['Spades', 'Clubs', 'Diamonds', 'Hearts', 'NT', 'M', 'OM']
export const TRICK_OPTIONS = [6, 7, 8, 9, 10]

export function getBidValue(suit, tricks) {
  if (suit === 'M') return 250
  if (suit === 'OM') return 500
  return BID_VALUES[suit]?.[tricks] ?? 0
}

function normalizeTeamKey(team1, team2) {
  const names = [team1.trim(), team2.trim()].sort()
  return names.join('::')
}

export function getTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addTeam(team1, team2) {
  const key = normalizeTeamKey(team1, team2)
  const teams = getTeams()
  if (teams.some(t => t.key === key)) return
  teams.push({
    key,
    team1: team1.trim(),
    team2: team2.trim(),
    createdAt: Date.now(),
  })
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams))
}

export function deleteTeam(teamKey) {
  const teams = getTeams().filter(t => t.key !== teamKey)
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams))
  const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
  const all = raw ? JSON.parse(raw) : []
  const remaining = all.filter(g => g.teamKey !== teamKey)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(remaining))
}

export function getGamesForTeam(teamKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
    const all = raw ? JSON.parse(raw) : []
    return all.filter(g => g.teamKey === teamKey).sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
  } catch {
    return []
  }
}

export function getGameById(gameId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
    const all = raw ? JSON.parse(raw) : []
    return all.find(g => g.id === gameId)
  } catch {
    return null
  }
}

export function saveGame(game) {
  const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
  const all = raw ? JSON.parse(raw) : []
  const idx = all.findIndex(g => g.id === game.id)
  if (idx >= 0) all[idx] = game
  else all.push(game)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(all))
}

export function deleteGame(gameId) {
  const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
  const all = raw ? JSON.parse(raw) : []
  const remaining = all.filter(g => g.id !== gameId)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(remaining))
}

export function createNewGame(team1, team2) {
  const key = normalizeTeamKey(team1, team2)
  addTeam(team1, team2)
  const game = {
    id: crypto.randomUUID(),
    teamKey: key,
    team1: team1.trim(),
    team2: team2.trim(),
    score1: 0,
    score2: 0,
    rounds: [],
    currentRound: null,
    startedAt: Date.now(),
  }
  saveGame(game)
  return game
}
