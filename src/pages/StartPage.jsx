import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, ArrowRight, ChevronRight, Trash2 } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'
import { getTeams, getGamesForTeam, deleteTeam } from '@/lib/game-storage'
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
  const { startNewGame } = useGame()
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [teamToDelete, setTeamToDelete] = useState(null)
  const [, setRefresh] = useState(0)

  const showNewGameForm = searchParams.get('new') === '1'
  const teams = showNewGameForm ? [] : getTeams()

  const handleStart = (e) => {
    e.preventDefault()
    const t1 = team1.trim() || 'Team 1'
    const t2 = team2.trim() || 'Team 2'
    const game = startNewGame(t1, t2)
    navigate(`/game/${game.id}`)
  }

  const handleTeamClick = (team) => {
    navigate(`/teams/${encodeURIComponent(team.key)}/games`)
  }

  const handleCancelNewGame = () => {
    setSearchParams({})
  }

  const handleDeleteTeamClick = (e, team) => {
    e.stopPropagation()
    setTeamToDelete(team)
  }

  const handleConfirmDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete.key)
      setTeamToDelete(null)
      setRefresh((r) => r + 1)
    }
  }

  const handleCancelDeleteTeam = () => {
    setTeamToDelete(null)
  }

  // New game form: team 1/2 inputs + Start Game (only visible after tapping "New Game")
  if (showNewGameForm) {
    return (
      <div className="flex flex-col items-center pt-8">
        <form onSubmit={handleStart} className="w-full max-w-sm space-y-6">
          <div>
            <label className="text-sm font-medium text-app-label block mb-2">TEAM 1</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Enter team name..."
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-app-label"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-app-label block mb-2">TEAM 2</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Enter team name..."
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-app-label"
              />
            </div>
          </div>

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

  // Home view: title + image; if teams exist, list them below (only list scrolls)
  const hasTeams = teams.length > 0
  return (
    <>
      <div
        className={`flex flex-col items-center ${hasTeams ? 'h-[calc(100vh-5.5rem)] min-h-0 pt-8' : 'min-h-[calc(100vh-8rem)] justify-center'}`}
      >
        <div className={`text-center ${hasTeams ? 'mb-6 shrink-0' : 'mb-10'}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl glass flex items-center justify-center text-3xl">
            🃏
          </div>
          <h1 className="text-4xl font-bold">500</h1>
          <p className="text-white/70 text-lg">Score Keeper</p>
        </div>

        {hasTeams && (
          <div className="flex-1 min-h-0 flex flex-col w-full max-w-sm overflow-hidden">
            <p className="text-app-label text-sm font-medium mb-3 shrink-0">EXISTING TEAMS</p>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ul className="space-y-2 pb-2">
                {teams.map((team) => {
                  const games = getGamesForTeam(team.key)
                  const wins1 = games.filter((g) => g.winner === 1).length
                  const wins2 = games.filter((g) => g.winner === 2).length
                  return (
                    <li key={team.key} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleTeamClick(team)}
                        className="w-full flex items-center justify-between p-4 rounded-lg glass hover:bg-white/10 transition-colors text-left text-white pr-12"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg glass flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-white/70" />
                          </div>
                          <div>
                            <p className="text-lg font-bold">{team.team1} vs {team.team2}</p>
                            <p className="text-sm text-white/70 mt-0.5">
                              {team.team1}: <span className="text-app-gold font-medium">{wins1}</span> wins
                              {' · '}
                              {team.team2}: <span className="text-app-gold font-medium">{wins2}</span> wins
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/70 shrink-0" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTeamClick(e, team)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label={`Delete ${team.team1} vs ${team.team2}`}
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

      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && handleCancelDeleteTeam()}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Delete {teamToDelete ? `${teamToDelete.team1} vs ${teamToDelete.team2}` : ''}? This will also remove all game history for this team. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDeleteTeam}
              className="border border-white/20 bg-transparent text-white hover:bg-white/10 px-4 py-2 rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteTeam}
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
