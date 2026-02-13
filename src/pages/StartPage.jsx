import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowRight, List } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'

export default function StartPage() {
  const navigate = useNavigate()
  const { startNewGame } = useGame()
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')

  const handleStart = (e) => {
    e.preventDefault()
    const t1 = team1.trim() || 'Team 1'
    const t2 = team2.trim() || 'Team 2'
    const game = startNewGame(t1, t2)
    navigate(`/game/${game.id}`)
  }

  return (
    <div className="flex flex-col items-center pt-8">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl glass flex items-center justify-center text-3xl">
          🃏
        </div>
        <h1 className="text-4xl font-bold">500</h1>
        <p className="text-white/70 text-lg">Score Keeper</p>
      </div>

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
          onClick={() => navigate('/teams')}
          className="w-full py-6 rounded-xl glass border-white/10 text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
        >
          <List className="w-4 h-4" />
          Existing Teams
        </button>
      </form>
    </div>
  )
}
