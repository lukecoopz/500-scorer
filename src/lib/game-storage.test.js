import { beforeEach, describe, expect, it } from 'vitest'
import {
  canConvertToTeams,
  canConvertToTwoHanded,
  convertGameToTeams,
  convertGameToTwoHanded,
  getCurrentDealer,
  getGameById,
  getGamesForTeam,
  getTeamConversionDefaults,
  isTwoHanded,
  renameGroupAndGames,
  saveGame,
} from './game-storage'

const GAMES_KEY = '500-scorer-games'
const TEAMS_KEY = '500-scorer-teams'

beforeEach(() => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
})

function teamGame(overrides = {}) {
  return {
    id: 'g1',
    mode: 'team',
    twoHanded: false,
    teamKey: 'Blues::Reds',
    teams: ['Reds', 'Blues'],
    members: [
      ['Alice', 'Bob'],
      ['Cara', 'Dan'],
    ],
    scores: [240, -60],
    rounds: [
      { callerIndex: 0, suit: 'Hearts', tricks: 7, bidValue: 200, callerTricksWon: 8, bidMade: true, pts: [200, 20], dealerName: 'Alice' },
      { callerIndex: 1, suit: 'Spades', tricks: 6, bidValue: 40, callerTricksWon: 4, bidMade: false, pts: [40, -40], dealerName: 'Cara' },
      { callerIndex: 1, suit: 'NT', tricks: 8, bidValue: 320, callerTricksWon: 5, bidMade: false, pts: [0, -320], dealerName: 'Bob' },
    ],
    currentRound: null,
    winner: null,
    startedAt: 1700000000000,
    winMode: 'points',
    firstDealerIndex: 0,
    ...overrides,
  }
}

describe('existing stored games', () => {
  it('loads a current-shape game exactly as saved', () => {
    const game = teamGame()
    localStorage.setItem(GAMES_KEY, JSON.stringify([game]))
    expect(getGameById('g1')).toEqual(game)
  })

  it('still upgrades pre-multiplayer games (team1/team2) and they remain convertible', () => {
    const legacy = {
      id: 'old',
      teamKey: 'A::B',
      team1: 'A',
      team2: 'B',
      score1: 100,
      score2: 50,
      winner: null,
      rounds: [{ caller: 'B', suit: 'Hearts', tricks: 6, pts1: 40, pts2: 100 }],
    }
    localStorage.setItem(GAMES_KEY, JSON.stringify([legacy]))
    const loaded = getGameById('old')
    expect(loaded.teams).toEqual(['A', 'B'])
    expect(loaded.rounds[0].pts).toEqual([40, 100])
    expect(canConvertToTwoHanded(loaded)).toBe(true)

    const converted = convertGameToTwoHanded(loaded)
    expect(converted.scores).toEqual([100, 50])
    expect(converted.rounds).toEqual(loaded.rounds)
    expect(converted.team1).toBe('A')
    expect(converted.score1).toBe(100)
  })
})

describe('team -> 2 player', () => {
  it('keeps rounds, scores, winner and dates identical; each team becomes a player', () => {
    const game = teamGame({ winner: 0, endedAt: 1700000999999 })
    const out = convertGameToTwoHanded(game)

    expect(out.rounds).toEqual(game.rounds)
    expect(out.scores).toEqual(game.scores)
    expect(out.winner).toBe(0)
    expect(out.id).toBe(game.id)
    expect(out.teamKey).toBe(game.teamKey)
    expect(out.startedAt).toBe(game.startedAt)
    expect(out.endedAt).toBe(game.endedAt)
    expect(out.mode).toBe('team')
    expect(out.twoHanded).toBe(true)
    expect(out.teams).toEqual(['Reds', 'Blues'])
    expect(out.members).toEqual([['Reds'], ['Blues']])
    expect(isTwoHanded(out)).toBe(true)
  })

  it('lets the user pick player names and falls back to team names when blank', () => {
    const out = convertGameToTwoHanded(teamGame(), ['  Alice ', ''])
    expect(out.teams).toEqual(['Alice', 'Blues'])
    expect(out.members).toEqual([['Alice'], ['Blues']])
  })

  it('records the previous teams/members and does not mutate its input', () => {
    const game = teamGame()
    const before = JSON.parse(JSON.stringify(game))
    const out = convertGameToTwoHanded(game)
    expect(game).toEqual(before)
    expect(out.modeHistory).toHaveLength(1)
    expect(out.modeHistory[0]).toMatchObject({
      from: 'teams',
      teams: ['Reds', 'Blues'],
      members: [['Alice', 'Bob'], ['Cara', 'Dan']],
    })
  })

  it('keeps an in-progress bid', () => {
    const game = teamGame({ currentRound: { callerIndex: 1, suit: 'Clubs', tricks: 7, bidValue: 160 } })
    expect(convertGameToTwoHanded(game).currentRound).toEqual(game.currentRound)
  })

  it('keeps the same side dealing the next hand', () => {
    for (const firstDealerIndex of [0, 1, 2, 3]) {
      const game = teamGame({ firstDealerIndex })
      const out = convertGameToTwoHanded(game)
      expect(getCurrentDealer(out).teamIndex).toBe(getCurrentDealer(game).teamIndex)
    }
  })

  it('refuses games it cannot map one-to-one', () => {
    const threeTeams = teamGame({
      teams: ['A', 'B', 'C'],
      scores: [0, 0, 0],
      members: [['a', 'a2'], ['b', 'b2'], ['c', 'c2']],
    })
    const individual = { id: 'i', mode: 'individual', players: ['a', 'b', 'c'], scores: [0, 0, 0], rounds: [] }
    expect(canConvertToTwoHanded(threeTeams)).toBe(false)
    expect(canConvertToTwoHanded(individual)).toBe(false)
    expect(() => convertGameToTwoHanded(threeTeams)).toThrow()
    expect(() => convertGameToTwoHanded(individual)).toThrow()
    expect(() => convertGameToTwoHanded(convertGameToTwoHanded(teamGame()))).toThrow()
  })
})

describe('2 player -> team', () => {
  it('round-trips back to the original teams, members and dealer', () => {
    const game = teamGame({ firstDealerIndex: 3 })
    const twoHanded = convertGameToTwoHanded(game)
    expect(canConvertToTeams(twoHanded)).toBe(true)

    const back = convertGameToTeams(twoHanded)
    expect(back.teams).toEqual(['Reds', 'Blues'])
    expect(back.members).toEqual(game.members)
    expect(back.firstDealerIndex).toBe(3)
    expect(back.twoHanded).toBe(false)
    expect(back.rounds).toEqual(game.rounds)
    expect(back.scores).toEqual(game.scores)
    expect(back.modeHistory).toHaveLength(2)
  })

  it('prefills team names from the current player names, so renames made in 2 player mode are kept', () => {
    const twoHanded = convertGameToTwoHanded(teamGame())
    const renamed = { ...twoHanded, teams: ['Alice', 'Blues'], members: [['Alice'], ['Blues']] }

    const defaults = getTeamConversionDefaults(renamed)
    expect(defaults.teams).toEqual(['Alice', 'Blues'])
    expect(defaults.members).toEqual([['Alice', 'Bob'], ['Cara', 'Dan']])

    const back = convertGameToTeams(renamed)
    expect(back.teams).toEqual(['Alice', 'Blues'])
    expect(back.members).toEqual([['Alice', 'Bob'], ['Cara', 'Dan']])
    expect(back.rounds).toEqual(renamed.rounds)
  })

  it('stays editable: explicit names and members override the prefill', () => {
    const twoHanded = convertGameToTwoHanded(teamGame())
    const back = convertGameToTeams(twoHanded, {
      teams: ['Rubies', ''],
      members: [['Ann', 'Ben'], ['', 'Dee']],
    })
    expect(back.teams).toEqual(['Rubies', 'Blues'])
    expect(back.members).toEqual([['Ann', 'Ben'], ['Cara', 'Dee']])
  })

  it('caps modeHistory and always keeps the latest snapshot of each kind', () => {
    let game = teamGame()
    for (let i = 0; i < 30; i++) {
      game = canConvertToTwoHanded(game) ? convertGameToTwoHanded(game) : convertGameToTeams(game)
    }
    expect(game.modeHistory.length).toBeLessThanOrEqual(10)
    expect(game.modeHistory.map((h) => h.from).includes('teams')).toBe(true)
    expect(game.modeHistory.map((h) => h.from).includes('twoHanded')).toBe(true)
    expect(game.rounds).toEqual(teamGame().rounds)
    expect(game.scores).toEqual(teamGame().scores)
    expect(game.members).toEqual(teamGame().members)
  })

  it('round-trips a legacy game that had no members', () => {
    const { members: _members, twoHanded: _twoHanded, ...legacy } = teamGame()
    const back = convertGameToTeams(convertGameToTwoHanded(legacy))
    expect(back.rounds).toEqual(legacy.rounds)
    expect(back.teams).toEqual(legacy.teams)
    expect(back.members).toEqual([['Reds 1', 'Reds 2'], ['Blues 1', 'Blues 2']])
  })

  it('converts a game that was created two-handed, using defaults or user input', () => {
    const created = teamGame({
      twoHanded: true,
      teams: ['Sam', 'Jo'],
      members: [['Sam'], ['Jo']],
    })
    const defaulted = convertGameToTeams(created)
    expect(defaulted.teams).toEqual(['Sam', 'Jo'])
    expect(defaulted.members).toEqual([['Sam 1', 'Sam 2'], ['Jo 1', 'Jo 2']])

    const custom = convertGameToTeams(created, {
      teams: ['Sam & co', 'Jo & co'],
      members: [['Sam', 'Pat'], ['Jo', '']],
    })
    expect(custom.teams).toEqual(['Sam & co', 'Jo & co'])
    expect(custom.members).toEqual([['Sam', 'Pat'], ['Jo', 'Jo 2']])
    expect(custom.rounds).toEqual(created.rounds)
  })
})

describe('persistence', () => {
  it('saving a converted game leaves every other stored game untouched', () => {
    const other = teamGame({ id: 'g2', teamKey: 'X::Y', teams: ['X', 'Y'] })
    const individual = { id: 'g3', mode: 'individual', teamKey: 'p', players: ['a', 'b', 'c'], scores: [0, 0, 0], rounds: [] }
    const target = teamGame()
    localStorage.setItem(GAMES_KEY, JSON.stringify([other, target, individual]))
    const rawOther = JSON.stringify(other)

    saveGame(convertGameToTwoHanded(getGameById('g1')))

    const stored = JSON.parse(localStorage.getItem(GAMES_KEY))
    expect(stored).toHaveLength(3)
    expect(JSON.stringify(stored.find((g) => g.id === 'g2'))).toBe(rawOther)
    expect(stored.find((g) => g.id === 'g3')).toEqual(individual)
    expect(stored.find((g) => g.id === 'g1').twoHanded).toBe(true)
  })

  it('renaming a group does not collapse team games sharing a group with a converted game', () => {
    const teamKey = 'Blues::Reds'
    const converted = convertGameToTwoHanded(teamGame({ id: 'a' }))
    const untouched = teamGame({ id: 'b', startedAt: 1 })
    localStorage.setItem(GAMES_KEY, JSON.stringify([converted, untouched]))
    localStorage.setItem(
      TEAMS_KEY,
      JSON.stringify([{ key: teamKey, names: ['Reds', 'Blues'], mode: 'team', twoHanded: true, members: [['Reds'], ['Blues']] }])
    )

    renameGroupAndGames(teamKey, { names: ['Rubies', 'Sapphires'], members: [['Rubies'], ['Sapphires']] })

    const games = getGamesForTeam(teamKey)
    const a = games.find((g) => g.id === 'a')
    const b = games.find((g) => g.id === 'b')
    expect(a.members).toEqual([['Rubies'], ['Sapphires']])
    expect(b.teams).toEqual(['Rubies', 'Sapphires'])
    expect(b.members).toEqual([['Alice', 'Bob'], ['Cara', 'Dan']])
    expect(isTwoHanded(b)).toBe(false)
    expect(b.rounds).toEqual(untouched.rounds)
  })
})
