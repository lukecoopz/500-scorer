import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, User, ArrowRight, ArrowLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import {
  getTeams,
  getGamesForTeam,
  deleteGroup,
  TEAM_COUNTS,
  MIN_INDIVIDUAL_PLAYERS,
  MAX_INDIVIDUAL_PLAYERS,
  DEFAULT_INDIVIDUAL_PLAYERS,
} from '@/lib/game-storage'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

export default function StartPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { startNewTeamGame, startNewIndividualGame } = useGame()
  const [gameType, setGameType] = useState(null) // 'team' | 'individual'
  const [names, setNames] = useState(['', ''])
  const [groupToDelete, setGroupToDelete] = useState(null)
  const [, setRefresh] = useState(0)

  const showNewGameForm = searchParams.get('new') === '1'
  const groups = showNewGameForm ? [] : getTeams()

  const resetForm = () => {
    setGameType(null)
    setNames(['', ''])
  }

  const handleCancelNewGame = () => {
    setSearchParams({})
    resetForm()
  }

  const handleSelectType = (type) => {
    setGameType(type)
    setNames(type === 'team' ? ['', ''] : Array.from({ length: DEFAULT_INDIVIDUAL_PLAYERS }, () => ''))
  }

  const handleTeamCountChange = (teamCount) => {
    setNames((prev) => Array.from({ length: teamCount }, (_, i) => prev[i] || ''))
  }

  const handleIndividualCountChange = (delta) => {
    setNames((prev) => {
      const nextLen = Math.min(MAX_INDIVIDUAL_PLAYERS, Math.max(MIN_INDIVIDUAL_PLAYERS, prev.length + delta))
      return Array.from({ length: nextLen }, (_, i) => prev[i] || '')
    })
  }

  const handleNameChange = (index, value) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  const handleStart = (e) => {
    e.preventDefault()
    if (gameType === 'team') {
      const teamNames = names.map((n, i) => n.trim() || `Team ${i + 1}`)
      const game = startNewTeamGame(teamNames)
      navigate(`/game/${game.id}`)
    } else {
      const playerNames = names.map((n, i) => n.trim() || `Player ${i + 1}`)
      const game = startNewIndividualGame(playerNames)
      navigate(`/game/${game.id}`)
    }
  }

  const handleGroupClick = (group) => {
    navigate(`/teams/${encodeURIComponent(group.key)}/games`)
  }

  const handleDeleteGroupClick = (e, group) => {
    e.stopPropagation()
    setGroupToDelete(group)
  }

  const handleConfirmDeleteGroup = () => {
    if (groupToDelete) {
      deleteGroup(groupToDelete.key)
      setGroupToDelete(null)
      setRefresh((r) => r + 1)
    }
  }

  const handleCancelDeleteGroup = () => {
    setGroupToDelete(null)
  }

  // New game form
  if (showNewGameForm) {
    // Step 1: pick game type
    if (!gameType) {
      return (
        <div className="flex flex-col items-center pt-8">
          <div className="w-full max-w-sm space-y-3">
            <h2 className="text-center text-lg font-semibold text-white mb-3">New Game</h2>
            <button
              type="button"
              onClick={() => handleSelectType('team')}
              className="w-full flex items-center gap-4 p-5 rounded-xl glass border border-white/10 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg glass flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white/70" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Team Game</p>
                <p className="text-sm text-white/70">2 or 3 teams, solo or in pairs</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectType('individual')}
              className="w-full flex items-center gap-4 p-5 rounded-xl glass border border-white/10 hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg glass flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-white/70" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Individual Game</p>
                <p className="text-sm text-white/70">3+ players, call a partner each hand</p>
              </div>
            </button>
            <button
              type="button"
              onClick={handleCancelNewGame}
              className="w-full py-4 rounded-xl glass border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    // Step 2: player count (team only) + name inputs
    const labelPrefix = gameType === 'team' ? 'TEAM' : 'PLAYER'
    return (
      <div className="flex flex-col items-center pt-8">
        <form onSubmit={handleStart} className="w-full max-w-sm space-y-6">
          <button
            type="button"
            onClick={() => setGameType(null)}
            className="flex items-center gap-1 text-sm text-white/60 hover:text-white -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {gameType === 'team' && (
            <div>
              <label className="text-sm font-medium text-app-label block mb-2">TEAMS</label>
              <div className="grid grid-cols-2 gap-2">
                {TEAM_COUNTS.map((teamCount) => (
                  <button
                    key={teamCount}
                    type="button"
                    onClick={() => handleTeamCountChange(teamCount)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      names.length === teamCount
                        ? 'bg-app-selected border-app-selected text-foreground'
                        : 'glass border-white/10 hover:bg-white/5 text-white'
                    }`}
                  >
                    {teamCount}
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameType === 'individual' && (
            <div>
              <label className="text-sm font-medium text-app-label block mb-2">PLAYERS</label>
              <div className="flex items-center justify-center gap-5 py-1">
                <button
                  type="button"
                  onClick={() => handleIndividualCountChange(-1)}
                  disabled={names.length <= MIN_INDIVIDUAL_PLAYERS}
                  className="w-10 h-10 rounded-lg glass border border-white/10 text-white text-lg font-medium hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Fewer players"
                >
                  −
                </button>
                <span className="text-xl font-bold text-white w-6 text-center">{names.length}</span>
                <button
                  type="button"
                  onClick={() => handleIndividualCountChange(1)}
                  disabled={names.length >= MAX_INDIVIDUAL_PLAYERS}
                  className="w-10 h-10 rounded-lg glass border border-white/10 text-white text-lg font-medium hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="More players"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {names.map((name, i) => (
            <div key={i}>
              <label className="text-sm font-medium text-app-label block mb-2">
                {labelPrefix} {i + 1}
              </label>
              <div className="relative">
                {gameType === 'team' ? (
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                )}
                <input
                  type="text"
                  placeholder={gameType === 'team' ? 'Enter team name...' : 'Enter player name...'}
                  value={name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-app-label"
                />
              </div>
            </div>
          ))}

          <Button
            type="submit"
            className="w-full py-6 rounded-xl glass-strong hover:bg-white/15 text-white border border-white/10"
            size="lg"
          >
            Start Game
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <button
            type="button"
            onClick={handleCancelNewGame}
            className="w-full py-4 rounded-xl glass border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    )
  }

  // Home view: title + image; if groups exist, list them below (only list scrolls)
  const hasGroups = groups.length > 0
  return (
    <>
      <div
        className={`flex flex-col items-center ${hasGroups ? 'h-[calc(100vh-5.5rem)] min-h-0 pt-8' : 'min-h-[calc(100vh-8rem)] justify-center'}`}
      >
        <button
          type="button"
          onClick={() => setSearchParams({ new: '1' })}
          className={`text-center rounded-xl transition-colors hover:bg-white/5 active:bg-white/10 p-4 -m-4 ${hasGroups ? 'mb-6 shrink-0' : 'mb-10'}`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl glass flex items-center justify-center text-3xl">
            🃏
          </div>
          <h1 className="text-4xl font-bold">500</h1>
          <p className="text-white/70 text-lg">Score Keeper</p>
        </button>

        {hasGroups && (
          <div className="flex-1 min-h-0 flex flex-col w-full max-w-sm overflow-hidden">
            <p className="text-app-label text-sm font-medium mb-3 shrink-0">EXISTING GAMES</p>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ul className="space-y-2 pb-2">
                {groups.map((group) => {
                  const games = getGamesForTeam(group.key)
                  const winCounts = group.names.map((_, i) => games.filter((g) => g.winner === i).length)
                  const joiner = group.mode === 'individual' ? ', ' : ' vs '
                  return (
                    <li key={group.key} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleGroupClick(group)}
                        className="w-full flex items-center justify-between p-4 rounded-lg glass hover:bg-white/10 transition-colors text-left text-white pr-12"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg glass flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <p className="text-lg font-bold">{group.names.join(joiner)}</p>
                            <p className="text-sm text-white/70 mt-0.5">
                              {group.names.map((n, i) => (
                                <span key={n}>
                                  {i > 0 && ' · '}
                                  {n}: <span className="text-app-gold font-medium">{winCounts[i]}</span>
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/70 shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGroupClick(e, group)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label={`Delete ${group.names.join(joiner)}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && handleCancelDeleteGroup()}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete game?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Delete {groupToDelete ? groupToDelete.names.join(groupToDelete.mode === 'individual' ? ', ' : ' vs ') : ''}? This will also remove all game history for this group. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDeleteGroup}
              className="border border-white/20 bg-transparent text-white hover:bg-white/10 px-4 py-2 rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteGroup}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
