// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { GameProvider } from '@/lib/game-context'
import GamePage from './GamePage'

const GAMES_KEY = '500-scorer-games'
const TEAMS_KEY = '500-scorer-teams'

const rounds = [
  { callerIndex: 0, suit: 'Hearts', tricks: 7, bidValue: 200, callerTricksWon: 8, bidMade: true, pts: [200, 20], dealerName: 'Alice' },
  { callerIndex: 1, suit: 'NT', tricks: 8, bidValue: 320, callerTricksWon: 5, bidMade: false, pts: [0, -320], dealerName: 'Bob' },
]

function teamGame(overrides = {}) {
  return {
    id: 'g1',
    mode: 'team',
    twoHanded: false,
    teamKey: 'Blues::Reds',
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

function renderGame(games) {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games))
  localStorage.setItem(
    TEAMS_KEY,
    JSON.stringify([
      { key: 'Blues::Reds', names: ['Reds', 'Blues'], mode: 'team', twoHanded: false, members: [['Alice', 'Bob'], ['Cara', 'Dan']] },
    ])
  )
  return render(
    <MemoryRouter initialEntries={['/game/g1']}>
      <GameProvider>
        <Routes>
          <Route path="/game/:gameId" element={<GamePage />} />
        </Routes>
      </GameProvider>
    </MemoryRouter>
  )
}

const stored = () => JSON.parse(localStorage.getItem(GAMES_KEY))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('GamePage change game mode dialog', () => {
  it('asks for confirmation, and cancelling changes nothing', async () => {
    const user = userEvent.setup()
    renderGame([teamGame()])
    const before = localStorage.getItem(GAMES_KEY)

    await user.click(await screen.findByRole('button', { name: 'Change game mode' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Switch to a 2 player game?')).toBeTruthy()
    expect(within(dialog).getByText(/Nothing is deleted/)).toBeTruthy()
    expect(within(dialog).getByText(/Keeps 2 rounds/)).toBeTruthy()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(localStorage.getItem(GAMES_KEY)).toBe(before)
  })

  it('converts to 2 player with a renamed player, then back to teams prefilled with that name and the old members', async () => {
    const user = userEvent.setup()
    renderGame([teamGame()])

    await user.click(await screen.findByRole('button', { name: 'Change game mode' }))
    let dialog = await screen.findByRole('alertdialog')
    const [first, second] = within(dialog).getAllByRole('textbox')
    expect(first.value).toBe('Reds')
    expect(second.value).toBe('Blues')
    await user.clear(first)
    await user.type(first, 'Alice')
    await user.click(within(dialog).getByRole('button', { name: 'Switch mode' }))

    let game = stored()[0]
    expect(game.twoHanded).toBe(true)
    expect(game.teams).toEqual(['Alice', 'Blues'])
    expect(game.members).toEqual([['Alice'], ['Blues']])
    expect(game.rounds).toEqual(rounds)
    expect(game.scores).toEqual([200, -300])
    expect(screen.queryByRole('alertdialog')).toBeNull()

    await user.click(await screen.findByRole('button', { name: 'Change game mode' }))
    dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Switch to a team game?')).toBeTruthy()
    expect(within(dialog).getAllByRole('textbox').map((i) => i.value)).toEqual([
      'Alice', 'Alice', 'Bob', 'Blues', 'Cara', 'Dan',
    ])
    await user.click(within(dialog).getByRole('button', { name: 'Switch mode' }))

    game = stored()[0]
    expect(game.twoHanded).toBe(false)
    expect(game.teams).toEqual(['Alice', 'Blues'])
    expect(game.members).toEqual([['Alice', 'Bob'], ['Cara', 'Dan']])
    expect(game.rounds).toEqual(rounds)
    expect(game.scores).toEqual([200, -300])
    expect(stored()).toHaveLength(1)
  })

  it('does not offer the button for games with three teams or individual games', async () => {
    renderGame([
      teamGame({
        teams: ['A', 'B', 'C'],
        members: [['a', 'a2'], ['b', 'b2'], ['c', 'c2']],
        scores: [0, 0, 0],
        rounds: [],
      }),
    ])
    expect(await screen.findByRole('button', { name: 'Edit names' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Change game mode' })).toBeNull()
  })
})
