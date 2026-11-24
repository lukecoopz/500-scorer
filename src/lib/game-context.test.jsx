// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { GameProvider, useGame } from './game-context'
import { getTeams, isTwoHanded } from './game-storage'

const GAMES_KEY = '500-scorer-games'
const TEAMS_KEY = '500-scorer-teams'
const KEY = 'Blues::Reds'

const rounds = [
  { callerIndex: 0, suit: 'Hearts', tricks: 7, bidValue: 200, callerTricksWon: 8, bidMade: true, pts: [200, 20], dealerName: 'Alice' },
  { callerIndex: 1, suit: 'NT', tricks: 8, bidValue: 320, callerTricksWon: 5, bidMade: false, pts: [0, -320], dealerName: 'Bob' },
]

function teamGame(overrides = {}) {
  return {
    id: 'g1',
    mode: 'team',
    twoHanded: false,
    teamKey: KEY,
    teams: ['Reds', 'Blues'],
    members: [['Alice', 'Bob'], ['Cara', 'Dan']],
    scores: [200, -300],
    rounds,
    currentRound: null,
    winner: null,
    startedAt: 1700000000000,
    winMode: 'points',
    firstDealerIndex: 0,
    ...overrides,
  }
}

function twoHandedGame(overrides = {}) {
  return teamGame({ twoHanded: true, teams: ['Reds', 'Blues'], members: [['Reds'], ['Blues']], ...overrides })
}

function group(overrides = {}) {
  return {
    key: KEY,
    names: ['Reds', 'Blues'],
    mode: 'team',
    twoHanded: false,
    members: [['Alice', 'Bob'], ['Cara', 'Dan']],
    createdAt: 1700000000000,
    ...overrides,
  }
}

function seed(games, groups) {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
  localStorage.setItem(TEAMS_KEY, JSON.stringify(groups))
}

const storedGames = () => JSON.parse(localStorage.getItem(GAMES_KEY))
const storedGroup = () => JSON.parse(localStorage.getItem(TEAMS_KEY)).find((t) => t.key === KEY)

function setup(gameId = 'g1') {
  const hook = renderHook(() => useGame(), { wrapper: GameProvider })
  act(() => {
    hook.result.current.loadGame(gameId)
  })
  return hook
}

beforeEach(() => {
  localStorage.clear()
})

describe('convertMode', () => {
  it('converts the current game, updates state and persists only that game', () => {
    const other = teamGame({ id: 'g2', startedAt: 5 })
    const rawOther = JSON.stringify(other)
    seed([teamGame(), other], [group()])
    const { result } = setup()

    act(() => {
      result.current.convertMode('twoHanded', { names: ['Alice', ''] })
    })

    expect(result.current.currentGame.twoHanded).toBe(true)
    expect(result.current.currentGame.teams).toEqual(['Alice', 'Blues'])
    expect(result.current.currentGame.rounds).toEqual(rounds)

    const stored = storedGames()
    expect(stored).toHaveLength(2)
    expect(stored.find((g) => g.id === 'g1')).toEqual(result.current.currentGame)
    expect(JSON.stringify(stored.find((g) => g.id === 'g2'))).toBe(rawOther)
    expect(storedGroup()).toEqual(group())
  })

  it('converts back to teams using the current player names and remembered members', () => {
    seed([teamGame()], [group()])
    const { result } = setup()

    act(() => {
      result.current.convertMode('twoHanded', {})
    })
    act(() => {
      result.current.renameSides(['Alice', 'Blues'], [['Alice'], ['Blues']])
    })
    act(() => {
      result.current.convertMode('teams', { teams: ['Alice', 'Blues'], members: [['Alice', 'Bob'], ['Cara', 'Dan']] })
    })

    const game = storedGames()[0]
    expect(isTwoHanded(game)).toBe(false)
    expect(game.teams).toEqual(['Alice', 'Blues'])
    expect(game.members).toEqual([['Alice', 'Bob'], ['Cara', 'Dan']])
    expect(game.rounds).toEqual(rounds)
    expect(game.scores).toEqual([200, -300])
  })

  it('does nothing without a loaded game', () => {
    seed([teamGame()], [group()])
    const before = localStorage.getItem(GAMES_KEY)
    const { result } = renderHook(() => useGame(), { wrapper: GameProvider })
    let out
    act(() => {
      out = result.current.convertMode('twoHanded', {})
    })
    expect(out).toBeNull()
    expect(localStorage.getItem(GAMES_KEY)).toBe(before)
  })

  it('throws and leaves storage untouched for a game that cannot be converted', () => {
    const threeTeams = teamGame({
      teams: ['A', 'B', 'C'],
      members: [['a', 'a2'], ['b', 'b2'], ['c', 'c2']],
      scores: [0, 0, 0],
      rounds: [],
    })
    seed([threeTeams], [group()])
    const before = localStorage.getItem(GAMES_KEY)
    const { result } = setup()

    expect(() =>
      act(() => {
        result.current.convertMode('twoHanded', {})
      })
    ).toThrow()
    expect(localStorage.getItem(GAMES_KEY)).toBe(before)
  })
})

describe('renameSides group shape check (shapeMatchesGroup)', () => {
  it('does not overwrite a team group\'s saved members when renaming a converted 2 player game', () => {
    seed([twoHandedGame()], [group()])
    const { result } = setup()

    act(() => {
      result.current.renameSides(['Al', 'Bo'], [['Al'], ['Bo']])
    })

    expect(storedGroup().members).toEqual([['Alice', 'Bob'], ['Cara', 'Dan']])
    expect(storedGroup().names).toEqual(['Al', 'Bo'])
    expect(storedGames()[0].members).toEqual([['Al'], ['Bo']])
    expect(storedGames()[0].rounds).toEqual(rounds)
  })

  it('does not overwrite a 2 player group\'s saved members when renaming a game converted to teams', () => {
    const converted = teamGame({ teams: ['Reds', 'Blues'], members: [['Alice', 'Bob'], ['Cara', 'Dan']] })
    seed([converted], [group({ twoHanded: true, members: [['Reds'], ['Blues']] })])
    const { result } = setup()

    act(() => {
      result.current.renameSides(['Rubies', 'Sapphires'], [['Ann', 'Ben'], ['Cy', 'Di']])
    })

    expect(storedGroup().members).toEqual([['Reds'], ['Blues']])
    expect(storedGroup().names).toEqual(['Rubies', 'Sapphires'])
    expect(storedGames()[0].members).toEqual([['Ann', 'Ben'], ['Cy', 'Di']])
  })

  it('still updates the group\'s members when the game and group shapes match (team + team)', () => {
    seed([teamGame()], [group()])
    const { result } = setup()

    act(() => {
      result.current.renameSides(['Rubies', 'Sapphires'], [['Ann', 'Ben'], ['Cy', 'Di']])
    })

    expect(storedGroup().members).toEqual([['Ann', 'Ben'], ['Cy', 'Di']])
    expect(storedGroup().names).toEqual(['Rubies', 'Sapphires'])
  })

  it('still updates the group\'s members when the game and group shapes match (2 player + 2 player)', () => {
    seed([twoHandedGame()], [group({ twoHanded: true, members: [['Reds'], ['Blues']] })])
    const { result } = setup()

    act(() => {
      result.current.renameSides(['Al', 'Bo'], [['Al'], ['Bo']])
    })

    expect(storedGroup().members).toEqual([['Al'], ['Bo']])
  })

  it('leaves other games in the group alone', () => {
    const other = teamGame({ id: 'g2', startedAt: 5 })
    seed([twoHandedGame(), other], [group()])
    const rawOther = JSON.stringify(other)
    const { result } = setup()

    act(() => {
      result.current.renameSides(['Al', 'Bo'], [['Al'], ['Bo']])
    })

    expect(JSON.stringify(storedGames().find((g) => g.id === 'g2'))).toBe(rawOther)
    expect(getTeams()).toHaveLength(1)
  })
})
