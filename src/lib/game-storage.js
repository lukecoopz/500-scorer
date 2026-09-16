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
  DM: { doubleMisere: 350 },
  OM: { openMisere: 500 },
  DOM: { doubleOpenMisere: 1000 },
}

export const SUITS = ['Spades', 'Clubs', 'Diamonds', 'Hearts', 'NT', 'M', 'DM', 'OM', 'DOM']
export const MISERE_SUITS = ['M', 'DM', 'OM', 'DOM']
export const TRICK_OPTIONS = [6, 7, 8, 9, 10]
export const TEAM_COUNTS = [2, 3]
export const MIN_INDIVIDUAL_PLAYERS = 3
export const MAX_INDIVIDUAL_PLAYERS = 8
export const DEFAULT_INDIVIDUAL_PLAYERS = 5
export const DEFAULT_TARGET_HANDS = 4
export const PLAYERS_PER_TEAM = 2

export function isMisereSuit(suit) {
  return MISERE_SUITS.includes(suit)
}

/** Plain / open misère: caller plays alone. Double variants keep the partner. */
export function isSoloMisereSuit(suit) {
  return suit === 'M' || suit === 'OM'
}

export function getBidValue(suit, tricks) {
  if (suit === 'M') return 250
  if (suit === 'DM') return 350
  if (suit === 'OM') return 500
  if (suit === 'DOM') return 1000
  return BID_VALUES[suit]?.[tricks] ?? 0
}

/**
 * Clockwise seat order so deal passes to the next person, usually the opposite team.
 * Two teams of two sit T1a, T2a, T1b, T2b around the table.
 */
export function getDealerSeats(game) {
  if (!game) return []
  if (game.mode === 'individual') {
    return (game.players || []).map((name, i) => ({ name, teamIndex: i, memberIndex: 0 }))
  }
  const members = game.members
  if (!members?.length) {
    return (game.teams || []).map((name, i) => ({ name, teamIndex: i, memberIndex: 0 }))
  }
  const seats = []
  const maxP = Math.max(0, ...members.map((m) => m?.length || 0))
  for (let p = 0; p < maxP; p++) {
    for (let t = 0; t < members.length; t++) {
      const name = members[t]?.[p]
      if (name) seats.push({ name, teamIndex: t, memberIndex: p })
    }
  }
  return seats
}

export function dealerSeatsFromMembers(teamNames, members) {
  const teamCount = teamNames.length
  const perTeam = Math.max(1, ...(members || []).map((m) => m?.length || 0), 0) || PLAYERS_PER_TEAM
  const seats = []
  for (let p = 0; p < perTeam; p++) {
    for (let t = 0; t < teamCount; t++) {
      const teamName = teamNames[t] || `Team ${t + 1}`
      const name = members?.[t]?.[p]?.trim() || (perTeam === 1 ? teamName : `${teamName} ${p + 1}`)
      seats.push({ name, teamIndex: t, teamName: perTeam === 1 ? undefined : teamName })
    }
  }
  return seats
}

export function isTwoHanded(gameOrGroup) {
  if (!gameOrGroup) return false
  if (gameOrGroup.twoHanded) return true
  const members = gameOrGroup.members
  return (
    gameOrGroup.mode === 'team' &&
    Array.isArray(members) &&
    members.length > 0 &&
    members.every((row) => (row?.length || 0) === 1)
  )
}

export function getCurrentDealer(game) {
  const seats = getDealerSeats(game)
  if (!seats.length || game.firstDealerIndex == null) return null
  const idx = (game.firstDealerIndex + (game.rounds?.length || 0)) % seats.length
  const next = seats[(idx + 1) % seats.length]
  return { ...seats[idx], seatIndex: idx, nextName: next?.name }
}

export function getDealerNameForRound(game, roundIndex) {
  const stored = game?.rounds?.[roundIndex]?.dealerName
  if (stored) return stored
  const seats = getDealerSeats(game)
  if (!seats.length) return null
  const start = game.firstDealerIndex ?? 0
  return seats[(start + roundIndex) % seats.length]?.name ?? null
}

/** Highest unique score after the target number of hands; keep playing on a tie. */
export function determineWinner(scores, winMode = 'points', roundsPlayed = 0, targetHands = DEFAULT_TARGET_HANDS) {
  if (winMode === 'hands') {
    if (roundsPlayed < targetHands) return null
    const max = Math.max(...scores)
    const leaders = scores.flatMap((s, i) => (s === max ? [i] : []))
    return leaders.length === 1 ? leaders[0] : null
  }
  const winnerIndex = scores.findIndex((s) => s >= 500)
  return winnerIndex === -1 ? null : winnerIndex
}

function defenderCap(game) {
  return game.winMode === 'hands' ? Infinity : 490
}

/** Generalized N-team scoring. `game.scores` holds each team's current (pre-round) score. */
export function computeTeamRoundResult(game, callerIndex, suit, tricks, tricksWon) {
  const isMisere = isMisereSuit(suit)
  const bidValue = getBidValue(suit, tricks)
  const bidMade = isMisere ? tricksWon === 0 : tricksWon >= tricks
  const teamCount = game.scores.length
  const pts = new Array(teamCount).fill(0)
  const cap = defenderCap(game)

  let callerPts = bidValue
  if (bidMade && !isMisere && bidValue < 250 && tricksWon === 10) callerPts = 250
  pts[callerIndex] = bidMade ? callerPts : -bidValue

  // Defender points capped at 490 each: cannot win by creeping (must bid to reach 500).
  // Normally each other team scores for tricks *they* win. In any misère the calling side
  // is trying to take none, so defenders score 10 for every trick that side wins instead.
  const rawDefenderPts = (isMisere ? tricksWon : 10 - tricksWon) * 10
  for (let i = 0; i < teamCount; i++) {
    if (i === callerIndex) continue
    pts[i] = Number.isFinite(cap) ? Math.min(rawDefenderPts, Math.max(0, cap - game.scores[i])) : rawDefenderPts
  }

  return { bidMade, bidValue, pts }
}

/**
 * Individual (call-a-partner) scoring. For suit/NT bids, the caller and their called partner
 * both score the full bid value (or lose it, together) as if they were a 2-person team, and
 * everyone else defends as a group: whoever actually won the trick doesn't matter, they all
 * score the same 10-points-per-defending-trick, capped at 490 using whichever of them is
 * lowest so they stay in lockstep. Misère/Open Misère is a solo bid - caller plays alone, no
 * partner. Double Misère / Double Open Misère keep the called partner, like a suit bid; the
 * pair must not take a single trick. Defending is reversed for all misère: everyone else
 * scores 10 points for every trick the calling side wins.
 */
export function computeIndividualRoundResult(game, callerIndex, partnerIndex, suit, tricks, tricksWon) {
  const isMisere = isMisereSuit(suit)
  const isSoloMisere = isSoloMisereSuit(suit)
  const bidValue = getBidValue(suit, tricks)
  const bidMade = isMisere ? tricksWon === 0 : tricksWon >= tricks
  const playerCount = game.scores.length
  const pts = new Array(playerCount).fill(0)
  const cap = defenderCap(game)

  let callerPts = bidValue
  if (bidMade && !isMisere && bidValue < 250 && tricksWon === 10) callerPts = 250
  const finalCallerPts = bidMade ? callerPts : -bidValue
  pts[callerIndex] = finalCallerPts
  if (!isSoloMisere) pts[partnerIndex] = finalCallerPts

  const otherIndices = []
  for (let i = 0; i < playerCount; i++) {
    if (i !== callerIndex && i !== partnerIndex) otherIndices.push(i)
  }
  const rawGroupPts = (isMisere ? tricksWon : 10 - tricksWon) * 10
  const minOtherScore = Math.min(...otherIndices.map((i) => game.scores[i]))
  const groupPts = Number.isFinite(cap)
    ? Math.min(rawGroupPts, Math.max(0, cap - minOtherScore))
    : rawGroupPts
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

export function addGroup(names, mode, members, extra = {}) {
  const key = normalizeGroupKey(names)
  const raw = localStorage.getItem(STORAGE_KEYS.TEAMS)
  const all = raw ? JSON.parse(raw) : []
  const trimmedNames = names.map((n) => n.trim())
  const idx = all.findIndex((t) => t.key === key)
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      ...(members ? { members } : {}),
      ...extra,
    }
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(all))
    return
  }
  all.push({
    key,
    names: trimmedNames,
    mode,
    ...(members ? { members } : {}),
    ...extra,
    createdAt: Date.now(),
  })
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(all))
}

export function updateGroupDisplay(teamKey, { names, members }) {
  const raw = localStorage.getItem(STORAGE_KEYS.TEAMS)
  const all = raw ? JSON.parse(raw) : []
  const idx = all.findIndex((t) => t.key === teamKey)
  if (idx < 0) return
  if (names) {
    all[idx].names = names.map((n, i) => n.trim() || all[idx].names?.[i] || `Team ${i + 1}`)
  }
  if (members) all[idx].members = members
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(all))
}

export function renameGroupAndGames(teamKey, { names, members }) {
  updateGroupDisplay(teamKey, { names, members })
  const trimmed = names.map((n, i) => n.trim() || `Team ${i + 1}`)
  const raw = localStorage.getItem(STORAGE_KEYS.GAMES)
  const all = raw ? JSON.parse(raw) : []
  const next = all.map((g) => {
    if (g.teamKey !== teamKey) return g
    if (g.mode === 'individual') return { ...g, players: trimmed }
    return { ...g, teams: trimmed, ...(members ? { members } : {}) }
  })
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(next))
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
function gameOptions(options = {}) {
  const winMode = options.winMode === 'hands' ? 'hands' : 'points'
  return {
    winMode,
    targetHands: winMode === 'hands' ? Math.max(1, Number(options.targetHands) || DEFAULT_TARGET_HANDS) : undefined,
    firstDealerIndex: options.firstDealerIndex ?? 0,
  }
}

/** Team game: 2, 4, or 6 players as fixed partners (teamNames.length teams of 2, or 2 solo teams). */
export function createTeamGame(teamNames, options = {}) {
  const names = teamNames.map((n, i) => n.trim() || (options.twoHanded ? `Player ${i + 1}` : `Team ${i + 1}`))
  const twoHanded = !!options.twoHanded
  const perTeam = twoHanded ? 1 : PLAYERS_PER_TEAM
  const members = Array.from({ length: names.length }, (_, t) =>
    Array.from({ length: perTeam }, (_, p) => {
      const raw = options.members?.[t]?.[p]?.trim()
      if (twoHanded) return raw || names[t]
      return raw || `${names[t]} ${p + 1}`
    })
  )
  const key = normalizeGroupKey(names)
  addGroup(names, 'team', members, { twoHanded })
  const game = {
    id: crypto.randomUUID(),
    mode: 'team',
    twoHanded,
    teamKey: key,
    teams: names,
    members,
    scores: names.map(() => 0),
    rounds: [],
    currentRound: null,
    winner: null,
    startedAt: Date.now(),
    ...gameOptions(options),
  }
  saveGame(game)
  return game
}

/** Individual game: 5 players, no fixed partners - caller calls an ace for a partner each hand. */
export function createIndividualGame(playerNames, options = {}) {
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
    ...gameOptions(options),
  }
  saveGame(game)
  return game
}
