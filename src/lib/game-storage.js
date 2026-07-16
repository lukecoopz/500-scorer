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
export const TEAM_COUNTS = [2, 3]
export const MIN_INDIVIDUAL_PLAYERS = 3
export const MAX_INDIVIDUAL_PLAYERS = 8
export const DEFAULT_INDIVIDUAL_PLAYERS = 5

export function getBidValue(suit, tricks) {
  if (suit === 'M') return 250
  if (suit === 'OM') return 500
  return BID_VALUES[suit]?.[tricks] ?? 0
}

/** Generalized N-team scoring. `game.scores` holds each team's current (pre-round) score. */
export function computeTeamRoundResult(game, callerIndex, suit, tricks, tricksWon) {
  const isMisere = suit === 'M' || suit === 'OM'
  const bidValue = getBidValue(suit, tricks)
  const bidMade = isMisere ? tricksWon === 0 : tricksWon >= tricks
  const teamCount = game.scores.length
  const pts = new Array(teamCount).fill(0)

  let callerPts = bidValue
  if (bidMade && !isMisere && bidValue < 250 && tricksWon === 10) callerPts = 250
  pts[callerIndex] = bidMade ? callerPts : -bidValue

  // Defender points capped at 490 each: cannot win by creeping (must bid to reach 500).
  // Normally each other team scores for tricks *they* win. In Misère it's reversed: the
  // caller plays alone (their partner sits out), so every other team scores for tricks
  // the misère caller ends up winning, since the caller is trying to win none.
  const rawDefenderPts = (isMisere ? tricksWon : 10 - tricksWon) * 10
  for (let i = 0; i < teamCount; i++) {
    if (i === callerIndex) continue
    pts[i] = Math.min(rawDefenderPts, Math.max(0, 490 - game.scores[i]))
  }

  return { bidMade, bidValue, pts }
}

/**
 * Individual (call-a-partner) scoring. For suit/NT bids, the caller and their called partner
 * both score the full bid value (or lose it, together) as if they were a 2-person team, and
 * everyone else defends as a group: whoever actually won the trick doesn't matter, they all
 * score the same 10-points-per-defending-trick, capped at 490 using whichever of them is
 * lowest so they stay in lockstep. Misère/Open Misère is a solo bid - caller plays alone, no
 * partner, and it's reversed: everyone else scores 10 points for every trick the misère
 * caller ends up winning, since the caller is trying to win none.
 */
export function computeIndividualRoundResult(game, callerIndex, partnerIndex, suit, tricks, tricksWon) {
  const isMisere = suit === 'M' || suit === 'OM'
  const bidValue = getBidValue(suit, tricks)
  const bidMade = isMisere ? tricksWon === 0 : tricksWon >= tricks
  const playerCount = game.scores.length
  const pts = new Array(playerCount).fill(0)

  let callerPts = bidValue
  if (bidMade && !isMisere && bidValue < 250 && tricksWon === 10) callerPts = 250
  const finalCallerPts = bidMade ? callerPts : -bidValue
  pts[callerIndex] = finalCallerPts
  if (!isMisere) pts[partnerIndex] = finalCallerPts

  const otherIndices = []
  for (let i = 0; i < playerCount; i++) {
    if (i !== callerIndex && i !== partnerIndex) otherIndices.push(i)
  }
  const rawGroupPts = (isMisere ? tricksWon : 10 - tricksWon) * 10
  const minOtherScore = Math.min(...otherIndices.map((i) => game.scores[i]))
  const groupPts = Math.min(rawGroupPts, Math.max(0, 490 - minOtherScore))
  for (const i of otherIndices) pts[i] = groupPts

  return { bidMade, bidValue, pts }
}

function normalizeGroupKey(names) {
  return names.map((n) => n.trim()).sort().join('::')
}

/** Upgrades a legacy (pre-multiplayer) 2-team game record to the generalized shape. No-op for current-shape games. */
function normalizeGame(game) {
  if (!game || game.mode) return game
  return {
    ...game,
    mode: 'team',
    teams: [game.team1, game.team2],
    scores: [game.score1 ?? 0, game.score2 ?? 0],
    rounds: (game.rounds || []).map((r) => ({
      ...r,
      callerIndex: r.caller === game.team2 ? 1 : 0,
      pts: [r.pts1 ?? 0, r.pts2 ?? 0],
    })),
    currentRound: game.currentRound
      ? { ...game.currentRound, callerIndex: game.currentRound.caller === game.team2 ? 1 : 0 }
      : null,
    winner: game.winner === 1 ? 0 : game.winner === 2 ? 1 : null,
  }
}

export function getTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS)
    const all = raw ? JSON.parse(raw) : []
    return all.map((t) => ({
      ...t,
      names: t.names || [t.team1, t.team2],
      mode: t.mode || 'team',
    }))
  } catch {
    return []
  }
}

export function addGroup(names, mode) {
  const key = normalizeGroupKey(names)
  const raw = localStorage.getItem(STORAGE_KEYS.TEAMS)
  const all = raw ? JSON.parse(raw) : []
  if (all.some((t) => t.key === key)) return
  all.push({ key, names: names.map((n) => n.trim()), mode, createdAt: Date.now() })
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(all))
}

export function deleteGroup(teamKey) {
  const teams = getTeams().filter((t) => t.key !== teamKey)
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams))
  const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
  const all = raw ? JSON.parse(raw) : []
  const remaining = all.filter((g) => g.teamKey !== teamKey)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(remaining))
}

export function getGamesForTeam(teamKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
    const all = raw ? JSON.parse(raw) : []
    return all
      .filter((g) => g.teamKey === teamKey)
      .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
      .map(normalizeGame)
  } catch {
    return []
  }
}

export function getGameById(gameId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
    const all = raw ? JSON.parse(raw) : []
    return normalizeGame(all.find((g) => g.id === gameId))
  } catch {
    return null
  }
}

export function saveGame(game) {
  const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
  const all = raw ? JSON.parse(raw) : []
  const idx = all.findIndex((g) => g.id === game.id)
  if (idx >= 0) all[idx] = game
  else all.push(game)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(all))
}

export function deleteGame(gameId) {
  const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
  const all = raw ? JSON.parse(raw) : []
  const remaining = all.filter((g) => g.id !== gameId)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(remaining))
}

/** Team game: 2, 4, or 6 players as fixed partners (teamNames.length teams of 2, or 2 solo teams). */
export function createTeamGame(teamNames) {
  const names = teamNames.map((n, i) => n.trim() || `Team ${i + 1}`)
  const key = normalizeGroupKey(names)
  addGroup(names, 'team')
  const game = {
    id: crypto.randomUUID(),
    mode: 'team',
    teamKey: key,
    teams: names,
    scores: names.map(() => 0),
    rounds: [],
    currentRound: null,
    winner: null,
    startedAt: Date.now(),
  }
  saveGame(game)
  return game
}

/** Individual game: 5 players, no fixed partners - caller calls an ace for a partner each hand. */
export function createIndividualGame(playerNames) {
  const names = playerNames.map((n, i) => n.trim() || `Player ${i + 1}`)
  const key = normalizeGroupKey(names)
  addGroup(names, 'individual')
  const game = {
    id: crypto.randomUUID(),
    mode: 'individual',
    teamKey: key,
    players: names,
    scores: names.map(() => 0),
    rounds: [],
    currentRound: null,
    winner: null,
    startedAt: Date.now(),
  }
  saveGame(game)
  return game
}
