import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as Slider from '@radix-ui/react-slider'
import { Trophy, ArrowLeft, Trash2, Check, Spade, Club, Diamond, Heart } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { getBidValue, computeRoundResult, TRICK_OPTIONS } from '@/lib/game-storage'
import { RoundBidDisplay } from '@/lib/suit-icons'
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
  NT: <span className="inline-flex items-center justify-center w-5 h-5 text-app-gold font-medium">NT</span>,
  M: <span className="inline-flex items-center justify-center w-5 h-5 text-app-purple font-medium">M</span>,
  OM: <span className="inline-flex items-center justify-center w-5 h-5 text-app-purple font-medium">OM</span>,
}

const CALL_SUITS = ['Spades', 'Clubs', 'Diamonds', 'Hearts', 'NT']

export default function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { currentGame, loadGame, updateGame, setBid, confirmRound, deleteRound } = useGame()
  const [roundToDelete, setRoundToDelete] = useState(null)

  const [caller, setCaller] = useState(null)
  const [suit, setSuit] = useState(null)
  const [tricks, setTricks] = useState(null)
  const [tricksWon, setTricksWon] = useState(null)

  useEffect(() => {
    if (gameId && (!currentGame || currentGame.id !== gameId)) {
      loadGame(gameId)
    }
  }, [gameId, currentGame?.id, loadGame])

  // Once a bid is confirmed (currentRound persisted), default the tricks-won slider
  const hadRoundRef = useRef(false)
  useEffect(() => {
    const hasRound = !!currentGame?.currentRound
    if (hasRound && !hadRoundRef.current) {
      const r = currentGame.currentRound
      const misere = r.suit === 'M' || r.suit === 'OM'
      setTricksWon(misere ? 0 : r.tricks)
    }
    hadRoundRef.current = hasRound
  }, [currentGame?.currentRound])

  if (!currentGame || currentGame.id !== gameId) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-app-border border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const isLeader1 = currentGame.score1 >= currentGame.score2 && currentGame.score1 > 0
  const isLeader2 = currentGame.score2 > currentGame.score1

  const round = currentGame.currentRound
  const isRecordingTricks = !!round

  const isBidExpanded = caller != null
  const isMisere = suit === 'M' || suit === 'OM'
  const bidValue = suit ? getBidValue(suit, tricks) : 0
  const isBidComplete = caller != null && suit != null && (isMisere || tricks != null)
  const selectedValue = isBidComplete ? bidValue : null

  const isMisereRound = round && (round.suit === 'M' || round.suit === 'OM')
  const roundResult = round && tricksWon != null
    ? computeRoundResult(currentGame, round.caller, round.suit, round.tricks, tricksWon)
    : null

  // Only once tricks are being recorded (bid confirmed via Next) do we collapse to one card.
  // Before that, both teams stay visible so the caller can still be changed.
  const callLocked = isRecordingTricks
  const activeCallerNum = isRecordingTricks
    ? (round.caller === currentGame.team1 ? 1 : 2)
    : caller

  const handleSelectCaller = (newCaller) => {
    setCaller(newCaller)
  }

  const renderCallerCard = (teamNum) => {
    const teamName = teamNum === 1 ? currentGame.team1 : currentGame.team2
    const isThisCaller = isRecordingTricks ? round.caller === teamName : caller === teamNum
    const showValue = isRecordingTricks ? isThisCaller : caller === teamNum && isBidComplete
    const displaySuit = isRecordingTricks ? round.suit : suit
    const displayTricks = isRecordingTricks ? round.tricks : tricks
    const displayValue = isRecordingTricks ? round.bidValue : bidValue
    const displayMisere = isRecordingTricks ? isMisereRound : isMisere

    return (
      <button
        key={teamNum}
        type="button"
        onClick={() => (isRecordingTricks ? handleEditBid() : handleSelectCaller(teamNum))}
        className={`rounded-xl py-1.5 px-3 border-2 text-left transition-colors ${
          isThisCaller ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10 glass hover:bg-white/5'
        }`}
      >
        <span className="text-sm font-medium text-white uppercase">{teamName}</span>
        <span className={`flex items-center gap-1 text-xs text-app-gold font-medium mt-0.5 ${showValue ? '' : 'invisible'}`}>
          {showValue ? (
            <>{!displayMisere && displayTricks}{suitIcons[displaySuit]} · {displayValue}</>
          ) : (
            ' '
          )}
        </span>
      </button>
    )
  }

  const handleNext = () => {
    if (!isBidComplete) return
    setBid(caller, suit, isMisere ? 0 : tricks)
  }

  const handleEditBid = () => {
    if (!round) return
    setCaller(round.caller === currentGame.team1 ? 1 : 2)
    setSuit(round.suit)
    setTricks(round.suit === 'M' || round.suit === 'OM' ? null : round.tricks)
    updateGame({ currentRound: null })
  }

  const handleConfirmRoundTricks = () => {
    if (tricksWon == null) return
    confirmRound(tricksWon)
    setCaller(null)
    setSuit(null)
    setTricks(null)
    setTricksWon(null)
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

  const rounds = currentGame.rounds || []
  const roundsReversed = [...rounds].reverse()
  const runningTotals = []
  let run1 = 0
  let run2 = 0
  for (const r of rounds) {
    run1 += r.pts1 ?? 0
    run2 += r.pts2 ?? 0
    runningTotals.push({ run1, run2 })
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-0">
        {/* Fixed top: back button, score cards, Who's Calling */}
        <div className="flex-none space-y-2">
          <div className="mb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/teams/${encodeURIComponent(currentGame.teamKey)}/games`)}
              aria-label="Back to games list"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-xl p-2.5 border-2 glass text-center ${
              isLeader1 ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10'
            }`}
          >
            <div className="flex justify-center items-center gap-1.5">
              <span className="text-xs text-white/70 uppercase">{currentGame.team1}</span>
              {isLeader1 && <Trophy className="w-4 h-4 text-app-gold shrink-0" />}
            </div>
            <p className="text-2xl font-bold mt-0.5">{currentGame.score1}</p>
            <p className={`text-[11px] leading-tight mt-0.5 min-h-[2.1em] flex flex-wrap items-center justify-center ${
              isRecordingTricks && roundResult
                ? (roundResult.pts1 > 0 ? 'text-green-400' : roundResult.pts1 < 0 ? 'text-destructive' : 'text-white/60')
                : ''
            } ${!((isRecordingTricks && roundResult) || (caller === 1 && bidValue > 0)) ? 'invisible' : ''}`}>
              {isRecordingTricks && roundResult ? (
                `(${currentGame.score1 + roundResult.pts1})`
              ) : caller === 1 && bidValue > 0 ? (
                <>
                  <span className="text-green-400">{currentGame.score1 + bidValue} made</span>
                  <span className="text-white/40">&nbsp;/&nbsp;</span>
                  <span className="text-destructive">{currentGame.score1 - bidValue} lost</span>
                </>
              ) : (
                ' '
              )}
            </p>
          </div>
          <div
            className={`rounded-xl p-2.5 border-2 glass text-center ${
              isLeader2 ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10'
            }`}
          >
            <div className="flex justify-center items-center gap-1.5">
              <span className="text-xs text-white/70 uppercase">{currentGame.team2}</span>
              {isLeader2 && <Trophy className="w-4 h-4 text-app-gold shrink-0" />}
            </div>
            <p className="text-2xl font-bold mt-0.5">{currentGame.score2}</p>
            <p className={`text-[11px] leading-tight mt-0.5 min-h-[2.1em] flex flex-wrap items-center justify-center ${
              isRecordingTricks && roundResult
                ? (roundResult.pts2 > 0 ? 'text-green-400' : roundResult.pts2 < 0 ? 'text-destructive' : 'text-white/60')
                : ''
            } ${!((isRecordingTricks && roundResult) || (caller === 2 && bidValue > 0)) ? 'invisible' : ''}`}>
              {isRecordingTricks && roundResult ? (
                `(${currentGame.score2 + roundResult.pts2})`
              ) : caller === 2 && bidValue > 0 ? (
                <>
                  <span className="text-green-400">{currentGame.score2 + bidValue} made</span>
                  <span className="text-white/40">&nbsp;/&nbsp;</span>
                  <span className="text-destructive">{currentGame.score2 - bidValue} lost</span>
                </>
              ) : (
                ' '
              )}
            </p>
          </div>
        </div>

        {!currentGame.winner && (
          <div>
            <h3 className="text-app-label text-xs font-medium mb-1">WHO'S CALLING?</h3>
            <div className={callLocked ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2'}>
              {callLocked ? renderCallerCard(activeCallerNum) : (
                <>
                  {renderCallerCard(1)}
                  {renderCallerCard(2)}
                </>
              )}
            </div>

            {isRecordingTricks ? (
              /* Record tricks - replaces the call grid once a bid is confirmed */
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-app-label text-xs font-medium">
                    {isMisereRound ? 'TRICKS WON BY CALLER (0 = bid made)' : 'TRICKS WON BY CALLER'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleEditBid}
                    className="text-xs text-white/60 hover:text-white underline underline-offset-2"
                  >
                    Change bid
                  </button>
                </div>
                <div className="px-1">
                  <Slider.Root
                    className="relative flex items-center w-full h-8 touch-none"
                    value={[tricksWon ?? 0]}
                    onValueChange={([v]) => setTricksWon(v)}
                    min={0}
                    max={10}
                    step={1}
                  >
                    <Slider.Track className="relative h-1.5 flex-1 rounded-full bg-white/10">
                      <Slider.Range className="absolute h-full rounded-full bg-white" />
                    </Slider.Track>
                    <Slider.Thumb className="block w-6 h-6 rounded-full bg-white shadow-md border border-app-border focus:outline-none focus:ring-2 focus:ring-app-label cursor-grab active:cursor-grabbing" />
                  </Slider.Root>
                  <div className="flex justify-between mt-0.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setTricksWon(n)}
                        className={`flex items-center justify-center w-6 h-6 text-xs rounded-full transition-colors
                          ${n === tricksWon ? 'bg-white/20 font-bold text-white' : 'text-white/70'}
                          ${!isMisereRound && n === round.tricks ? 'text-app-gold font-medium' : ''}
                        `}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {roundResult && (
                  <p className={`text-sm font-medium ${roundResult.bidMade ? 'text-app-label' : 'text-destructive'}`}>
                    {roundResult.bidMade ? 'Bid Made!' : 'Bid Lost'}
                  </p>
                )}

                <Button
                  className="w-full py-4 rounded-xl bg-app-gold hover:bg-app-gold/90 text-app-on-accent"
                  onClick={handleConfirmRoundTricks}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirm Round
                </Button>
              </div>
            ) : (
              /* Expanded bid form - appears when a team is selected */
              isBidExpanded && (
                <div className="mt-3 space-y-2">
                  {/* Call: suit x tricks grid, plus Misere / Open Misere */}
                  <div>
                    <h4 className="text-app-label text-xs font-medium mb-1.5">CALL</h4>
                    <div className="grid grid-cols-5 gap-1">
                      {TRICK_OPTIONS.map((t) =>
                        CALL_SUITS.map((s) => {
                          const cellValue = getBidValue(s, t)
                          const isSelected = suit === s && tricks === t
                          const isLower = selectedValue != null && cellValue < selectedValue
                          return (
                            <button
                              key={`${s}-${t}`}
                              type="button"
                              onClick={() => { setSuit(s); setTricks(t) }}
                              className={`rounded-md flex flex-col items-center justify-center py-1 border transition-colors ${
                                isSelected
                                  ? 'bg-app-selected border-app-selected text-foreground'
                                  : 'glass border-white/10 hover:bg-white/5'
                              } ${isLower ? 'opacity-30 grayscale' : ''}`}
                            >
                              <span className="flex items-center gap-0.5 text-xs font-semibold">
                                {t}{suitIcons[s]}
                              </span>
                              <span className="text-[9px] text-white/50 leading-tight">{cellValue}</span>
                            </button>
                          )
                        })
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {['M', 'OM'].map((s) => {
                        const cellValue = getBidValue(s)
                        const isSelected = suit === s
                        const isLower = selectedValue != null && cellValue < selectedValue
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { setSuit(s); setTricks(null) }}
                            className={`rounded-md flex items-center justify-between px-2.5 py-1.5 border transition-colors ${
                              isSelected
                                ? 'bg-app-selected border-app-selected text-foreground'
                                : 'glass border-white/10 hover:bg-white/5'
                            } ${isLower ? 'opacity-30 grayscale' : ''}`}
                          >
                            <span className="text-xs font-medium">{s === 'M' ? 'Misère' : 'Open Misère'}</span>
                            <span className="text-[11px] text-white/50">{cellValue}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Button
                    className="w-full py-4 rounded-xl bg-app-green hover:bg-app-green/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleNext}
                    disabled={!isBidComplete}
                  >
                    Next: Record Tricks{bidValue > 0 ? ` (${bidValue})` : ''}
                  </Button>
                </div>
              )
            )}
          </div>
        )}
        </div>

        {/* Round History - scrollable, most recent first */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden mt-2">
          <h3 className="text-app-label text-xs font-medium mb-1.5 shrink-0">
            ROUND HISTORY ({rounds.length})
          </h3>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {rounds.length ? (
              <ul className="space-y-2 pb-2">
                {roundsReversed.map((r, revIdx) => {
                  const i = rounds.length - 1 - revIdx
                  const { run1, run2 } = runningTotals[i] || { run1: 0, run2: 0 }
                  const caller1 = r.caller === currentGame.team1
                  const caller2 = r.caller === currentGame.team2
                  const pts1Color = r.pts1 < 0
                    ? 'text-red-400'
                    : caller1
                      ? 'text-green-400'
                      : 'text-white/50'
                  const pts2Color = r.pts2 < 0
                    ? 'text-red-400'
                    : caller2
                      ? 'text-green-400'
                      : 'text-white/50'
                  return (
                    <li
                      key={i}
                      className="flex justify-between items-center p-3 rounded-lg glass gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white block">
                          R{i + 1} {r.caller} called <RoundBidDisplay tricks={r.tricks} suit={r.suit} />
                        </span>
                        <span className="text-xs text-white/60 mt-0.5">
                          {currentGame.team1}: {run1} · {currentGame.team2}: {run2}
                        </span>
                      </div>
                      <span className="flex gap-2 text-sm shrink-0">
                        <span className={pts1Color}>
                          {r.pts1 >= 0 ? '+' : ''}{r.pts1}
                        </span>
                        <span className={pts2Color}>
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
                })}
              </ul>
            ) : (
              <p className="text-white/70 text-sm py-2">No rounds yet.</p>
            )}
          </div>
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
