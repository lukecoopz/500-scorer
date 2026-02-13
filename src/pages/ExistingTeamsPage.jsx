import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, Trash2 } from 'lucide-react'
import { getTeams, deleteTeam } from '@/lib/game-storage'
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

export default function ExistingTeamsPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState(() => getTeams())
  const [teamToDelete, setTeamToDelete] = useState(null)

  const refreshTeams = useCallback(() => {
    setTeams(getTeams())
  }, [])

  const handleSelectTeam = (team) => {
    navigate(`/teams/${encodeURIComponent(team.key)}/games`)
  }

  const handleDeleteClick = (e, team) => {
    e.stopPropagation()
    setTeamToDelete(team)
  }

  const handleConfirmDelete = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete.key)
      refreshTeams()
      setTeamToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setTeamToDelete(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-app-label text-sm font-medium">EXISTING TEAMS</h2>
      {teams.length === 0 ? (
        <p className="text-white/70 text-center py-8">
          No teams yet. Start a game to add teams.
        </p>
      ) : (
        <ul className="space-y-2">
          {teams.map((team) => (
            <li key={team.key} className="relative group">
              <button
                onClick={() => handleSelectTeam(team)}
                className="w-full flex items-center justify-between p-4 rounded-lg glass hover:bg-white/10 transition-colors text-left text-white pr-12"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
                    <Users className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <p className="font-medium">{team.team1}</p>
                    <p className="text-sm text-white/70">vs {team.team2}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70 shrink-0" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, team)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label={`Delete ${team.team1} vs ${team.team2}`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Delete {teamToDelete ? `${teamToDelete.team1} vs ${teamToDelete.team2}` : ''}? This will also remove all game history for this team. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDelete}
              className="border border-white/20 bg-transparent text-white hover:bg-white/10 px-4 py-2 rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="w-full py-4 px-4 rounded-xl glass border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
      >
        Back to Start
      </button>
    </div>
  )
}
