import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Trophy, ArrowLeft, Trash2, Spade, Club, Diamond, Heart } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { getBidValue, TRICK_OPTIONS } from '@/lib/game-storage'
import GameResultsModal from '@/components/GameResultsModal'
import { Button } from '@/components/ui/button'
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

const suitIcons = {
  Spades: <Spade className="w-5 h-5" />,
  Clubs: <Club className="w-5 h-5" />,
  Diamonds: <Diamond className="w-5 h-5 text-app-pink" />,
  Hearts: <Heart className="w-5 h-5 text-app-pink" />,
  NT: <span className="text-app-gold font-medium">NT</span>,
  M: <span className="text-app-purple font-medium">M</span>,
  OM: <span className="text-app-purple font-medium">OM</span>,
}

export default function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentGame, loadGame, setBid, deleteRound } = useGame()
  const [roundToDelete, setRoundToDelete] = useState(null)

  const [caller, setCaller] = useState(null)
  const [suit, setSuit] = useState(null)
  const [tricks, setTricks] = useState(null)

  useEffect(() => {
    if (gameId && (!currentGame || currentGame.id !== gameId)) {
      loadGame(gameId)
    }
  }, [gameId, currentGame?.id, loadGame])

  useEffect(() => {
    if (location.state?.editBid && currentGame?.currentRound) {
      const r = currentGame.currentRound
      setCaller(r.caller === currentGame.team1 ? 1 : 2)
      setSuit(r.suit)
      setTricks(r.suit === 'M' || r.suit === 'OM' ? null : r.tricks)
    }
  }, [location.state?.editBid, currentGame?.currentRound, currentGame?.team1])

  if (!currentGame || currentGame.id !== gameId) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-app-border border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const isLeader1 = currentGame.score1 >= currentGame.score2 && currentGame.score1 > 0
  const isLeader2 = currentGame.score2 > currentGame.score1

  const isBidExpanded = caller != null
  const isMisere = suit === 'M' || suit === 'OM'
  const bidValue = suit ? getBidValue(suit, tricks) : 0
  const isBidComplete = caller != null && suit != null && (isMisere || tricks != null)

  const handleSelectCaller = (newCaller) => {
    setCaller(newCaller)
  }

  const handleNext = () => {
    if (!isBidComplete) return
    setBid(caller, suit, isMisere ? 0 : tricks)
    navigate(`/game/${gameId}/tricks`)
  }

  const handleDeleteRound = (e, index) => {
    e.stopPropagation()
    setRoundToDelete(index)
  }

  const handleConfirmDeleteRound = () => {
    if (roundToDelete !== null) {
      deleteRound(roundToDelete)
      setRoundToDelete(null)
    }
  }

  const handleCancelDeleteRound = () => {
    setRoundToDelete(null)
  }

  return (
    <>
      <div className="space-y-[10px]">
        {/* Back button - navigate to team's games list */}
        <div className="m-0">
          <button
            type="button"
            onClick={() => navigate(`/teams/${encodeURIComponent(currentGame.teamKey)}/games`)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Back to games list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`rounded-xl p-4 border-2 glass ${
              isLeader1 ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm text-white/70 uppercase">{currentGame.team1}</span>
              {isLeader1 && <Trophy className="w-5 h-5 text-app-gold" />}
            </div>
            <p className="text-3xl font-bold mt-2">{currentGame.score1}</p>
          </div>
          <div
            className={`rounded-xl p-4 border-2 glass ${
              isLeader2 ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm text-white/70 uppercase">{currentGame.team2}</span>
              {isLeader2 && <Trophy className="w-5 h-5 text-app-gold" />}
            </div>
            <p className="text-3xl font-bold mt-2">{currentGame.score2}</p>
          </div>
        </div>

        {/* Who's Calling - tap team to expand bid form */}
        <div>
          <h3 className="text-app-label text-sm font-medium mb-2">WHO'S CALLING?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectCaller(1)}
              className={`rounded-xl py-2.5 px-3 border-2 text-left transition-colors ${
                caller === 1 ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10 glass hover:bg-white/5'
              }`}
            >
              <span className="text-sm font-medium text-white uppercase">{currentGame.team1}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectCaller(2)}
              className={`rounded-xl py-2.5 px-3 border-2 text-left transition-colors ${
                caller === 2 ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10 glass hover:bg-white/5'
              }`}
            >
              <span className="text-sm font-medium text-white uppercase">{currentGame.team2}</span>
            </button>
          </div>

          {/* Expanded bid form - appears when a team is selected */}
          {isBidExpanded && !currentGame.winner && (
            <div className="mt-4 space-y-4">
              {/* Suit */}
              <div>
                <h4 className="text-app-label text-sm font-medium mb-2">SUIT</h4>
                <div className="grid grid-cols-4 gap-2">
                  {['Spades', 'Clubs', 'Diamonds', 'Hearts'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSuit(s)}
                      className={`rounded-xl flex items-center justify-center py-3 border transition-colors ${
                        suit === s
                          ? 'bg-app-selected border-app-selected text-foreground'
                          : 'glass border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {suitIcons[s]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {['NT', 'M', 'OM'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSuit(s)}
                      className={`rounded-xl flex-1 py-3 border transition-colors flex items-center justify-center ${
                        suit === s
                          ? 'bg-app-selected border-app-selected text-foreground'
                          : 'glass border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {suitIcons[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tricks */}
              {suit && !isMisere && (
                <div>
                  <h4 className="text-app-label text-sm font-medium mb-2">TRICKS BID</h4>
                  <div className="flex gap-2">
                    {TRICK_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTricks(t)}
                        className={`rounded-xl flex-1 py-3 border transition-colors ${
                          tricks === t
                            ? 'bg-app-selected border-app-selected text-foreground font-medium'
                            : 'glass border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bid Value */}
              <div className="rounded-lg glass-strong p-4">
                <p className="text-sm text-app-label mb-1">BID VALUE</p>
                <p className="text-3xl font-bold text-app-gold">{bidValue > 0 ? bidValue : '—'}</p>
              </div>

              <Button
                className="w-full py-6 rounded-xl bg-app-green hover:bg-app-green/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNext}
                disabled={!isBidComplete}
              >
                Next: Record Tricks
              </Button>
            </div>
          )}
        </div>

        {/* Round History */}
        <div>
          <h3 className="text-app-label text-sm font-medium mb-3">
            ROUND HISTORY ({currentGame.rounds?.length || 0})
          </h3>
          {currentGame.rounds?.length ? (
            <ul className="space-y-2">
              {currentGame.rounds.reduce(
                (acc, r, i) => {
                  const prev1 = acc.running1
                  const prev2 = acc.running2
                  const run1 = prev1 + (r.pts1 ?? 0)
                  const run2 = prev2 + (r.pts2 ?? 0)
                  acc.items.push(
                    <li
                      key={i}
                      className="flex justify-between items-center p-3 rounded-lg glass gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white block">
                          R{i + 1} {r.caller} called {r.tricks} {r.suit}
                        </span>
                        <span className="text-xs text-white/60 mt-0.5">
                          {currentGame.team1}: {run1} · {currentGame.team2}: {run2}
                        </span>
                      </div>
                      <span className="flex gap-2 text-sm shrink-0">
                        <span className={r.pts1 >= 0 ? 'text-app-label' : 'text-red-400'}>
                          {r.pts1 >= 0 ? '+' : ''}{r.pts1}
                        </span>
                        <span className={r.pts2 >= 0 ? 'text-white/70' : 'text-red-400'}>
                          {r.pts2 >= 0 ? '+' : ''}{r.pts2}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRound(e, i)}
                        className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        aria-label={`Delete round ${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  )
                  acc.running1 = run1
                  acc.running2 = run2
                  return acc
                },
                { items: [], running1: 0, running2: 0 }
              ).items}
            </ul>
          ) : (
            <p className="text-white/70 text-sm py-2">No rounds yet.</p>
          )}
        </div>
      </div>

      {currentGame.winner && (
        <GameResultsModal
          game={currentGame}
          onClose={() => navigate(`/teams/${encodeURIComponent(currentGame.teamKey)}/games`)}
        />
      )}

      <AlertDialog open={roundToDelete !== null} onOpenChange={(open) => !open && handleCancelDeleteRound()}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this round?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {roundToDelete !== null && currentGame.rounds?.[roundToDelete]
                ? `Remove R${roundToDelete + 1} ${currentGame.rounds[roundToDelete].caller} called ${currentGame.rounds[roundToDelete].tricks} ${currentGame.rounds[roundToDelete].suit}? Scores will be updated.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDeleteRound}
              className="border border-white/20 bg-transparent text-white hover:bg-white/10 px-4 py-2 rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteRound}
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
