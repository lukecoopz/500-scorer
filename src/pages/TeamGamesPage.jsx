import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTeams, getGamesForTeam, deleteGame } from '@/lib/game-storage'
import { useGame } from '@/lib/game-context'
import { Trophy, Play, ArrowLeft, Trash2 } from 'lucide-react'
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
  const { loadGame, startNewGame } = useGame()
  const [gameToDelete, setGameToDelete] = useState(null)

  const decodedKey = teamKey ? decodeURIComponent(teamKey) : ''
  const teams = getTeams()
  const team = teams.find((t) => t.key === decodedKey)
  const [games, setGames] = useState(() => getGamesForTeam(decodedKey))

  const refreshGames = useCallback(() => {
    setGames(getGamesForTeam(decodedKey))
  }, [decodedKey])

  useEffect(() => {
    setGames(getGamesForTeam(decodedKey))
  }, [decodedKey])

  if (!team) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">Team not found.</p>
        <Button className="mt-4" onClick={() => navigate('/teams')}>
          Back to Teams
        </Button>
      </div>
    )
  }

  const handleStartNew = () => {
    const game = startNewGame(team.team1, team.team2)
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

  const { wins1, wins2 } = useMemo(() => {
    const w1 = games.filter((g) => g.winner === 1).length
    const w2 = games.filter((g) => g.winner === 2).length
    return { wins1: w1, wins2: w2 }
  }, [games])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 glass border border-white/10 text-center">
            <p className="text-2xl font-bold truncate">{team.team1}</p>
            <p className="text-3xl font-bold text-app-gold mt-1">{wins1}</p>
          </div>
          <div className="rounded-xl p-4 glass border border-white/10 text-center">
            <p className="text-2xl font-bold truncate">{team.team2}</p>
            <p className="text-3xl font-bold text-app-gold mt-1">{wins2}</p>
          </div>
        </div>
      </div>

      <Button className="w-full py-6 bg-app-green hover:bg-app-green/90 text-white" onClick={handleStartNew}>
        <Play className="w-4 h-4 mr-2" />
        Start New Game
      </Button>

      <h3 className="text-app-label text-sm font-medium">
        PREVIOUS GAMES ({games.length})
      </h3>

      {games.length === 0 ? (
        <p className="text-white/70 text-sm">No previous games.</p>
      ) : (
        <ul className="space-y-2">
          {games.map((game) => (
            <li key={game.id} className="relative group">
              <button
                onClick={() => handleSelectGame(game.id)}
                className="w-full flex items-center justify-between p-4 rounded-lg glass hover:bg-white/10 transition-colors text-left text-white pr-12"
              >
                <div>
                  <p className="font-medium">
                    {game.score1} - {game.score2}
                  </p>
                  <p className="text-sm text-white/70">
                    {game.rounds?.length || 0} rounds
                    {game.startedAt && (
                      <> · {format(new Date(game.startedAt), 'MMM d, yyyy')}</>
                    )}
                  </p>
                </div>
                {game.winner && (
                  <Trophy className="w-5 h-5 text-app-gold shrink-0" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteGameClick(e, game)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label={`Delete game ${game.score1}-${game.score2}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!gameToDelete} onOpenChange={(open) => !open && handleCancelDeleteGame()}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this game?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {gameToDelete && (
                <>
                  Delete game {gameToDelete.score1} - {gameToDelete.score2}
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
    </div>
  )
}
