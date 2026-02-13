import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as Slider from '@radix-ui/react-slider'
import { Check, ArrowLeft } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { Button } from '@/components/ui/button'

export default function RecordTricksPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { currentGame, loadGame, confirmRound } = useGame()

  useEffect(() => {
    if (gameId && (!currentGame || currentGame.id !== gameId)) {
      loadGame(gameId)
    }
  }, [gameId, currentGame?.id, loadGame])

  const round = currentGame?.currentRound
  const isMisere = round?.suit === 'M' || round?.suit === 'OM'
  const bidTricks = round?.tricks ?? 0

  const [tricksWon, setTricksWon] = useState(isMisere ? 0 : bidTricks)

  const bidMade = isMisere
    ? tricksWon === 0
    : tricksWon >= bidTricks

  const defenderTricks = 10 - tricksWon
  const isCallerTeam1 = round?.caller === currentGame?.team1
  let pts1, pts2
  if (isMisere) {
    const callerPts = bidMade ? (round?.bidValue ?? 0) : -(round?.bidValue ?? 0)
    pts1 = isCallerTeam1 ? callerPts : 0
    pts2 = isCallerTeam1 ? 0 : callerPts
  } else {
    let callerPts = bidMade ? (round?.bidValue ?? 0) : -(round?.bidValue ?? 0)
    if (bidMade && (round?.bidValue ?? 0) < 250 && tricksWon === 10) callerPts = 250
    const rawDefenderPts = defenderTricks * 10
    const defenderCurrentScore = isCallerTeam1 ? currentGame.score2 : currentGame.score1
    const defenderPts = Math.min(rawDefenderPts, Math.max(0, 490 - defenderCurrentScore))
    pts1 = isCallerTeam1 ? callerPts : defenderPts
    pts2 = isCallerTeam1 ? defenderPts : callerPts
  }

  const handleConfirm = () => {
    confirmRound(tricksWon)
    navigate(`/game/${gameId}`)
  }

  if (!currentGame?.currentRound) {
    navigate(`/game/${gameId}`)
    return null
  }

  return (
    <div className="space-y-6">
      {/* Back button - return to bid page */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate(`/game/${gameId}`, { state: { editBid: true } })}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Back to bid"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-semibold text-white">{currentGame.team1} vs {currentGame.team2}</h2>
          <p className="text-sm text-white/70">
            {round.caller} · {round.tricks} {round.suit}
          </p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 glass">
          <p className="text-sm text-white/70 uppercase">{currentGame.team1}</p>
          <p className="text-3xl font-bold">{currentGame.score1}</p>
        </div>
        <div className="rounded-xl p-4 glass">
          <p className="text-sm text-white/70 uppercase">{currentGame.team2}</p>
          <p className="text-3xl font-bold">{currentGame.score2}</p>
        </div>
      </div>

      {/* Bid info */}
      <p className="text-sm text-white">
        {round.caller} bid{' '}
        <span className="text-app-gold font-medium">
          {round.tricks} {round.suit}
        </span>
      </p>

      {/* Tricks slider */}
      {(isMisere || !isMisere) && (
        <>
          <h3 className="text-app-label text-sm font-medium">
            {isMisere ? 'TRICKS WON BY CALLER (0 = bid made)' : 'TRICKS WON BY CALLER'}
          </h3>
          <div className="px-2">
            <Slider.Root
              className="relative flex items-center w-full h-8"
              value={[tricksWon]}
              onValueChange={([v]) => setTricksWon(v)}
              min={0}
              max={10}
              step={1}
            >
              <Slider.Track className="relative h-2 flex-1 rounded-full bg-white/10">
                <Slider.Range className="absolute h-full rounded-full bg-white" />
              </Slider.Track>
              <Slider.Thumb className="block w-6 h-6 rounded-full bg-white shadow-md border border-app-border focus:outline-none focus:ring-2 focus:ring-app-label" />
            </Slider.Root>
            <div className="flex justify-between mt-2 text-sm text-white/70">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <span key={n} className={!isMisere && n === bidTricks ? 'text-app-gold font-medium' : ''}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {isMisere && (
        <p className="text-white/70 text-sm">
          Misère: caller must lose all tricks. Select 0 if bid made.
        </p>
      )}

      {/* Outcome */}
      <div className="space-y-2">
        {!isMisere && (
          <p className="text-2xl">
            <span className="text-app-gold font-bold">{tricksWon}</span>
            <span className="text-white/70 ml-1">tricks</span>
          </p>
        )}
        <p className={`text-lg font-medium ${bidMade ? 'text-app-label' : 'text-destructive'}`}>
          {bidMade ? 'Bid Made!' : 'Bid Lost'}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg p-3 glass">
            <p className="text-xs text-white/70 uppercase">{currentGame.team1}</p>
            <p className={`text-lg font-bold ${pts1 >= 0 ? 'text-app-label' : 'text-destructive'}`}>
              {pts1 >= 0 ? '+' : ''}{pts1}
            </p>
          </div>
          <div className="rounded-lg p-3 glass">
            <p className="text-xs text-white/70 uppercase">{currentGame.team2}</p>
            <p className={`text-lg font-bold ${pts2 >= 0 ? 'text-app-label' : 'text-destructive'}`}>
              {pts2 >= 0 ? '+' : ''}{pts2}
            </p>
          </div>
        </div>
      </div>

      <Button
        className="w-full py-6 rounded-xl bg-app-gold hover:bg-app-gold/90 text-app-on-accent"
        onClick={handleConfirm}
      >
        <Check className="w-5 h-5 mr-2" />
        Confirm Round
      </Button>
    </div>
  )
}
