import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTeams, getGamesForTeam, deleteGame, DEFAULT_TARGET_HANDS, PLAYERS_PER_TEAM, dealerSeatsFromMembers, isTwoHanded, renameGroupAndGames } from '@/lib/game-storage'
import { useGame } from '@/lib/game-context'
import GameSetupOptions from '@/components/GameSetupOptions'
import { Trophy, Play, ArrowLeft, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
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

export default function TeamGamesPage() {
  const { teamKey } = useParams()
  const navigate = useNavigate()
  const { loadGame, startNewTeamGame, startNewIndividualGame } = useGame()
  const [gameToDelete, setGameToDelete] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const [winMode, setWinMode] = useState('points')
  const [targetHands, setTargetHands] = useState(DEFAULT_TARGET_HANDS)
  const [firstDealerIndex, setFirstDealerIndex] = useState(0)
  const [members, setMembers] = useState(() => [])
  const [editingNames, setEditingNames] = useState(false)
  const [draftNames, setDraftNames] = useState([])
  const [draftMembers, setDraftMembers] = useState([])
  const [, setRefresh] = useState(0)

  const decodedKey = teamKey ? decodeURIComponent(teamKey) : ''
  const groups = getTeams()
  const group = groups.find((t) => t.key === decodedKey)
  const [games, setGames] = useState(() => getGamesForTeam(decodedKey))

  const refreshGames = useCallback(() => {
    setGames(getGamesForTeam(decodedKey))
  }, [decodedKey])

  useEffect(() => {
    setGames(getGamesForTeam(decodedKey))
  }, [decodedKey])

  const winCounts = useMemo(
    () => (group ? group.names.map((_, i) => games.filter((g) => g.winner === i).length) : []),
    [games, group]
  )

  if (!group) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">Game not found.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    )
  }

  const gridColsClass = group.names.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
  const twoHanded = isTwoHanded(group)
  const perTeam = twoHanded ? 1 : PLAYERS_PER_TEAM
  const savedMembers = Array.from({ length: group.names.length }, (_, t) =>
    Array.from({ length: perTeam }, (_, p) => group.members?.[t]?.[p] || (twoHanded ? group.names[t] : ''))
  )
  const dealerSeats = group.mode === 'individual'
    ? group.names.map((name, i) => ({ name, teamIndex: i }))
    : dealerSeatsFromMembers(group.names, members.length ? members : savedMembers)

  const handleShowSetup = () => {
    if (group.mode === 'team') {
      setMembers(savedMembers.map((row) => [...row]))
      setFirstDealerIndex(0)
    }
    setShowSetup(true)
  }

  const handleMemberChange = (teamIndex, playerIndex, value) => {
    setMembers((prev) =>
      prev.map((row, t) => (t === teamIndex ? row.map((n, p) => (p === playerIndex ? value : n)) : row))
    )
  }

  const handleStartNew = () => {
    const options = { winMode, targetHands, firstDealerIndex, members, twoHanded }
    const game = group.mode === 'individual'
      ? startNewIndividualGame(group.names, options)
      : startNewTeamGame(group.names, options)
    navigate(`/game/${game.id}`)
  }

  const handleSelectGame = (gameId) => {
    loadGame(gameId)
    navigate(`/game/${gameId}`)
  }

  const handleDeleteGameClick = (e, game) => {
    e.stopPropagation()
    setGameToDelete(game)
  }

  const handleConfirmDeleteGame = () => {
    if (gameToDelete) {
      deleteGame(gameToDelete.id)
      refreshGames()
      setGameToDelete(null)
    }
  }

  const handleCancelDeleteGame = () => {
    setGameToDelete(null)
  }

  const openEditNames = () => {
    setDraftNames([...group.names])
    setDraftMembers(savedMembers.map((row) => [...row]))
    setEditingNames(true)
  }

  const handleSaveNames = () => {
    const trimmed = draftNames.map((n, i) => n.trim() || group.names[i])
    let nextMembers
    if (group.mode === 'individual') {
      nextMembers = undefined
    } else if (twoHanded) {
      nextMembers = trimmed.map((n) => [n])
    } else {
      nextMembers = draftMembers.map((row, t) =>
        row.map((n, p) => n.trim() || savedMembers[t]?.[p] || `${trimmed[t]} ${p + 1}`)
      )
    }
    renameGroupAndGames(decodedKey, { names: trimmed, members: nextMembers })
    setEditingNames(false)
    refreshGames()
    setRefresh((n) => n + 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-0">
      <div className="flex-none space-y-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back to home">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={openEditNames} aria-label="Edit names">
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        <div className={`grid gap-3 !mt-[10px] ${gridColsClass}`}>
          {group.names.map((name, i) => (
            <div key={i} className="rounded-xl p-4 glass border border-white/10 text-center">
              <p className="text-2xl font-bold truncate">{name}</p>
              {group.mode === 'team' && !twoHanded && group.members?.[i] && (
                <p className="text-xs text-white/50 mt-0.5 truncate">{group.members[i].join(' · ')}</p>
              )}
              <p className="text-3xl font-bold text-app-gold mt-1">{winCounts[i]}</p>
            </div>
          ))}
        </div>

        {showSetup ? (
          <div className="space-y-4 rounded-xl glass border border-white/10 p-4">
            {group.mode === 'team' && !twoHanded && (
              <div className="space-y-3">
                {group.names.map((teamName, t) => (
                  <div key={t}>
                    <p className="text-xs font-medium text-app-label mb-1.5">{teamName}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(members[t] || []).map((playerName, p) => (
                        <input
                          key={p}
                          type="text"
                          placeholder={`Player ${p + 1}`}
                          value={playerName}
                          onChange={(e) => handleMemberChange(t, p, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-app-label text-sm"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <GameSetupOptions
              dealerSeats={dealerSeats}
              winMode={winMode}
              setWinMode={setWinMode}
              targetHands={targetHands}
              setTargetHands={setTargetHands}
              firstDealerIndex={firstDealerIndex}
              setFirstDealerIndex={setFirstDealerIndex}
            />
            <Button className="w-full py-6 bg-app-green hover:bg-app-green/90 text-white" onClick={handleStartNew}>
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
            <button
              type="button"
              onClick={() => setShowSetup(false)}
              className="w-full py-3 rounded-xl text-white/70 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button className="w-full py-6 bg-app-green hover:bg-app-green/90 text-white" onClick={handleShowSetup}>
            <Play className="w-4 h-4 mr-2" />
            Start New Game
          </Button>
        )}

        <h3 className="text-app-label text-sm font-medium">
          PREVIOUS GAMES ({games.length})
        </h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {games.length === 0 ? (
          <p className="text-white/70 text-sm">No previous games.</p>
        ) : (
          <ul className="space-y-2 pb-2">
            {games.map((game) => {
              const gameNames = game.mode === 'individual' ? game.players : game.teams
              return (
                <li key={game.id} className="relative group">
                  <button
                    onClick={() => handleSelectGame(game.id)}
                    className="w-full flex items-center justify-between p-4 rounded-lg glass hover:bg-white/10 transition-colors text-left text-white pr-12"
                  >
                    <div className="min-w-0">
                      <p className="font-medium flex flex-wrap gap-x-3 gap-y-0.5">
                        {gameNames.map((name, i) => (
                          <span
                            key={i}
                            className={game.winner === i ? 'text-green-400' : game.winner != null ? 'text-red-400' : ''}
                          >
                            {name} {game.scores[i]}
                          </span>
                        ))}
                      </p>
                      <p className="text-sm text-white/70">
                        {game.rounds?.length || 0} rounds
                        {game.winMode === 'hands'
                          ? ` · Highest after ${game.targetHands || 4}`
                          : ''}
                        {game.startedAt && (
                          <> · {format(new Date(game.startedAt), 'MMM d, yyyy')}</>
                        )}
                      </p>
                    </div>
                    {game.winner != null && (
                      <Trophy className="w-5 h-5 text-app-gold shrink-0" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteGameClick(e, game)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete game"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={!!gameToDelete} onOpenChange={(open) => !open && handleCancelDeleteGame()}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this game?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {gameToDelete && (
                <>
                  Delete game (
                  {(gameToDelete.mode === 'individual' ? gameToDelete.players : gameToDelete.teams)
                    .map((n, i) => `${n} ${gameToDelete.scores[i]}`)
                    .join(' - ')}
                  )
                  {gameToDelete.startedAt && (
                    <> from {format(new Date(gameToDelete.startedAt), 'MMM d, yyyy')}</>
                  )}
                  ? This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDeleteGame}
              className="border border-white/20 bg-transparent text-white hover:bg-white/10 px-4 py-2 rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteGame}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={editingNames} onOpenChange={(open) => !open && setEditingNames(false)}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-6 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit names</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {group.mode === 'individual' || twoHanded
                ? 'Change player names for this group.'
                : 'Change team and player names for this group.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            {draftNames.map((name, i) => (
              <div key={i} className="space-y-2">
                <label className="text-xs font-medium text-app-label block">
                  {group.mode === 'individual' || twoHanded ? `PLAYER ${i + 1}` : `TEAM ${i + 1}`}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setDraftNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))}
                  className="w-full px-3 py-2 rounded-lg glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-app-label"
                />
                {group.mode === 'team' && !twoHanded && draftMembers[i] && (
                  <div className="grid grid-cols-2 gap-2">
                    {draftMembers[i].map((playerName, p) => (
                      <input
                        key={p}
                        type="text"
                        placeholder={`Player ${p + 1}`}
                        value={playerName}
                        onChange={(e) =>
                          setDraftMembers((prev) =>
                            prev.map((row, t) =>
                              t === i ? row.map((n, pi) => (pi === p ? e.target.value : n)) : row
                            )
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-app-label text-sm"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setEditingNames(false)}
              className="border border-white/20 bg-transparent text-white hover:bg-white/10 px-4 py-2 rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveNames}
              className="bg-app-green hover:bg-app-green/90 text-white px-4 py-2 rounded-md"
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
