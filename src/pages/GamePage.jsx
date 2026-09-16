import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as Slider from '@radix-ui/react-slider'
import { Trophy, ArrowLeft, Trash2, Check, Spade, Club, Diamond, Heart, Pencil } from 'lucide-react'
import { useGame } from '@/lib/game-context'
import { getBidValue, computeTeamRoundResult, computeIndividualRoundResult, TRICK_OPTIONS, isMisereSuit, isSoloMisereSuit, getCurrentDealer, getDealerNameForRound, DEFAULT_TARGET_HANDS } from '@/lib/game-storage'
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
  DM: <span className="inline-flex items-center justify-center w-5 h-5 text-app-purple font-medium text-[10px]">DM</span>,
  OM: <span className="inline-flex items-center justify-center w-5 h-5 text-app-purple font-medium">OM</span>,
  DOM: <span className="inline-flex items-center justify-center w-5 h-5 text-app-purple font-medium text-[10px]">DOM</span>,
}

const CALL_SUITS = ['Spades', 'Clubs', 'Diamonds', 'Hearts', 'NT']
const ACE_SUITS = ['Spades', 'Clubs', 'Diamonds', 'Hearts']

function DealerMark() {
  return (
    <span className="text-[10px] font-semibold text-app-gold border border-app-gold/40 rounded px-1 shrink-0">D</span>
  )
}

export default function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { currentGame, loadGame, updateGame, setBid, confirmRound, deleteRound, renameSides } = useGame()
  const [roundToDelete, setRoundToDelete] = useState(null)
  const [editingNames, setEditingNames] = useState(false)
  const [draftNames, setDraftNames] = useState([])
  const [draftMembers, setDraftMembers] = useState([])

  const [caller, setCaller] = useState(null)
  const [suit, setSuit] = useState(null)
  const [tricks, setTricks] = useState(null)
  const [tricksWon, setTricksWon] = useState(null)
  const [partner, setPartner] = useState(null)
  const [calledAceSuit, setCalledAceSuit] = useState(null)

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
      const misere = isMisereSuit(r.suit)
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

  const isIndividual = currentGame.mode === 'individual'
  const names = isIndividual ? currentGame.players : currentGame.teams
  const scores = currentGame.scores
  const gridColsClass = names.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'
  const maxScore = Math.max(...scores)
  const leaderIndex = maxScore > 0 ? scores.indexOf(maxScore) : -1

  const round = currentGame.currentRound
  const isRecordingTricks = !!round

  const isBidExpanded = caller != null
  const isMisere = isMisereSuit(suit)
  const bidValue = suit ? getBidValue(suit, tricks) : 0
  const isBidComplete = caller != null && suit != null && (isMisere || tricks != null)
  const selectedValue = isBidComplete ? bidValue : null

  const isMisereRound = round && isMisereSuit(round.suit)
  const isSoloMisereRound = round && isSoloMisereSuit(round.suit)
  const needsPartner = isIndividual && !isSoloMisereRound
  const canPreviewRound = round && tricksWon != null && (!needsPartner || partner != null)
  const roundResult = canPreviewRound
    ? (isIndividual
        ? computeIndividualRoundResult(currentGame, round.callerIndex, partner, round.suit, round.tricks, tricksWon)
        : computeTeamRoundResult(currentGame, round.callerIndex, round.suit, round.tricks, tricksWon))
    : null

  const isHandsGame = currentGame.winMode === 'hands'
  const targetHands = currentGame.targetHands || DEFAULT_TARGET_HANDS
  const dealer = getCurrentDealer(currentGame)
  const dealerTeamIndex = dealer?.teamIndex

  // Notify when the calling side's bid, if made, would reach 500 and win the game.
  const callerScore = caller != null ? scores[caller] : 0
  const isWinningCall = !isHandsGame && isBidExpanded && bidValue > 0 && callerScore + bidValue >= 500
  const roundCallerScore = round ? scores[round.callerIndex] : 0
  const isWinningRound = !isHandsGame && isRecordingTricks && round.bidValue > 0 && roundCallerScore + round.bidValue >= 500

  // Only once tricks are being recorded (bid confirmed via Next) do we collapse to one card.
  // Before that, all teams/players stay visible so the caller can still be changed.
  const callLocked = isRecordingTricks
  const activeCallerIndex = isRecordingTricks ? round.callerIndex : caller

  const handleSelectCaller = (idx) => {
    if (caller === idx) {
      setCaller(null)
      setSuit(null)
      setTricks(null)
    } else {
      setCaller(idx)
    }
  }

  const openEditNames = () => {
    setDraftNames([...names])
    setDraftMembers((currentGame.members || []).map((row) => [...row]))
    setEditingNames(true)
  }

  const handleSaveNames = () => {
    if (isIndividual) {
      renameSides(draftNames)
    } else if (currentGame.twoHanded) {
      const trimmed = draftNames.map((n, i) => n.trim() || names[i])
      renameSides(trimmed, trimmed.map((n) => [n]))
    } else {
      const cleanedMembers = draftMembers.map((row, t) =>
        row.map((n, p) => n.trim() || currentGame.members?.[t]?.[p] || `${draftNames[t] || names[t]} ${p + 1}`)
      )
      renameSides(draftNames, cleanedMembers)
    }
    setEditingNames(false)
  }

  const renderCallerCard = (idx) => {
    const name = names[idx]
    const isThisCaller = isRecordingTricks ? round.callerIndex === idx : caller === idx
    const showValue = isRecordingTricks ? isThisCaller : caller === idx && isBidComplete
    const displaySuit = isRecordingTricks ? round.suit : suit
    const displayTricks = isRecordingTricks ? round.tricks : tricks
    const displayValue = isRecordingTricks ? round.bidValue : bidValue
    const displayMisere = isRecordingTricks ? isMisereRound : isMisere

    return (
      <button
        key={idx}
        type="button"
        onClick={() => (isRecordingTricks ? handleEditBid() : handleSelectCaller(idx))}
        className={`rounded-xl py-1.5 px-3 border-2 text-left transition-colors ${
          isThisCaller ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10 glass hover:bg-white/5'
        }`}
      >
        <span className="text-sm font-medium text-white uppercase truncate block">{name}</span>
        <span className={`flex items-center gap-1 text-xs text-app-gold font-medium mt-0.5 ${showValue ? '' : 'invisible'}`}>
          {showValue ? (
            <>{!displayMisere && displayTricks}{suitIcons[displaySuit]} · {displayValue}</>
          ) : (
            ' '
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
    setCaller(round.callerIndex)
    setSuit(round.suit)
    setTricks(isMisereSuit(round.suit) ? null : round.tricks)
    setPartner(null)
    setCalledAceSuit(null)
    updateGame({ currentRound: null })
  }

  const handleConfirmRoundTricks = () => {
    if (tricksWon == null) return
    if (needsPartner && partner == null) return
    confirmRound(tricksWon, needsPartner ? partner : undefined, needsPartner ? calledAceSuit : undefined)
    setCaller(null)
    setSuit(null)
    setTricks(null)
    setTricksWon(null)
    setPartner(null)
    setCalledAceSuit(null)
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
  let running = names.map(() => 0)
  for (const r of rounds) {
    running = running.map((s, i) => s + (r.pts?.[i] ?? 0))
    runningTotals.push(running)
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-0">
        {/* Fixed top: back button, score cards, Who's Calling */}
        <div className="flex-none space-y-2">
          <div className="mb-1 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/teams/${encodeURIComponent(currentGame.teamKey)}/games`)}
              aria-label="Back to games list"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={openEditNames} aria-label="Edit names">
              <Pencil className="w-4 h-4" />
            </Button>
          </div>

          {/* Score cards */}
          <div className={`grid gap-3 ${gridColsClass}`}>
            {names.map((name, i) => {
              const score = scores[i]
              const delta = roundResult ? roundResult.pts[i] : null
              const showBidPreview = !isRecordingTricks && caller === i && bidValue > 0
              return (
                <div
                  key={i}
                  className={`rounded-xl p-2.5 border-2 glass text-center ${
                    i === leaderIndex ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10'
                  }`}
                >
                  <div className="flex justify-center items-center gap-1.5">
                    {(isIndividual || currentGame.twoHanded) && i === dealerTeamIndex && <DealerMark />}
                    <span className="text-xs text-white/70 uppercase truncate">{name}</span>
                    {i === leaderIndex && <Trophy className="w-4 h-4 text-app-gold shrink-0" />}
                  </div>
                  {!isIndividual && !currentGame.twoHanded && currentGame.members?.[i]?.length > 1 && (
                    <p className="text-[10px] text-white/45 truncate flex items-center justify-center gap-x-1 flex-wrap">
                      {currentGame.members[i].map((memberName, p) => (
                        <span key={p} className="inline-flex items-center gap-0.5">
                          {p > 0 && <span className="text-white/30">·</span>}
                          {dealer?.teamIndex === i && dealer.memberIndex === p && <DealerMark />}
                          {memberName}
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="text-2xl font-bold mt-0.5">{score}</p>
                  <p className={`text-[11px] leading-tight mt-0.5 min-h-[2.1em] flex flex-wrap items-center justify-center ${
                    delta != null
                      ? (delta > 0 ? 'text-green-400' : delta < 0 ? 'text-destructive' : 'text-white/60')
                      : ''
                  } ${!(delta != null || showBidPreview) ? 'invisible' : ''}`}>
                    {delta != null ? (
                      `(${score + delta})`
                    ) : showBidPreview ? (
                      <>
                        <span className="text-green-400">{score + bidValue} made</span>
                        <span className="text-white/40">&nbsp;/&nbsp;</span>
                        <span className="text-destructive">{score - bidValue} lost</span>
                      </>
                    ) : (
                      ' '
                    )}
                  </p>
                </div>
              )
            })}
          </div>

          {(dealer || isHandsGame) && (
            <p className="text-xs text-white/60 text-center">
              {dealer && (
                <>
                  Dealer: <span className="text-white font-medium">{dealer.name}</span>
                  {dealer.nextName && <> · next {dealer.nextName}</>}
                </>
              )}
              {dealer && isHandsGame && ' · '}
              {isHandsGame && (
                (currentGame.rounds?.length || 0) < targetHands
                  ? <>Highest after {targetHands} · hand {(currentGame.rounds?.length || 0) + 1}</>
                  : <>Tiebreak · Hand {(currentGame.rounds?.length || 0) + 1}</>
              )}
            </p>
          )}

        {!currentGame.winner && (
          <div>
            <h3 className="text-app-label text-xs font-medium mb-1">WHO'S CALLING?</h3>
            <div className={callLocked ? 'grid grid-cols-1' : `grid gap-2 ${gridColsClass}`}>
              {callLocked ? renderCallerCard(activeCallerIndex) : names.map((_, i) => renderCallerCard(i))}
            </div>

            {isRecordingTricks ? (
              /* Record tricks - replaces the call grid once a bid is confirmed */
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-app-label text-xs font-medium">
                    {isMisereRound
                      ? (isSoloMisereRound ? 'TRICKS WON BY CALLER (0 = bid made)' : "TRICKS WON BY CALLING SIDE (0 = bid made)")
                      : isIndividual ? "TRICKS WON BY CALLER'S SIDE" : 'TRICKS WON BY CALLER'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleEditBid}
                    className="text-xs text-white/60 hover:text-white underline underline-offset-2"
                  >
                    Change bid
                  </button>
                </div>
                {isWinningRound && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-app-gold bg-app-gold/10 border border-app-gold/30 rounded-lg px-2.5 py-1.5">
                    <Trophy className="w-3.5 h-3.5 shrink-0" />
                    Bid wins the game if made!
                  </div>
                )}

                {needsPartner && (
                  <div>
                    <h4 className="text-app-label text-xs font-medium mb-1.5">CALLED PARTNER</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {names.map((name, i) => {
                        if (i === round.callerIndex) return null
                        const isSelected = partner === i
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPartner(i)}
                            className={`rounded-lg px-2.5 py-2 border text-sm font-medium transition-colors truncate ${
                              isSelected
                                ? 'bg-app-selected border-app-selected text-foreground'
                                : 'glass border-white/10 hover:bg-white/5 text-white'
                            }`}
                          >
                            {name}
                          </button>
                        )
                      })}
                    </div>

                    <h4 className="text-app-label text-xs font-medium mb-1.5 mt-2">ACE CALLED (OPTIONAL)</h4>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ACE_SUITS.map((s) => {
                        const isSelected = calledAceSuit === s
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setCalledAceSuit(isSelected ? null : s)}
                            className={`rounded-lg py-2 border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-app-selected border-app-selected text-foreground'
                                : 'glass border-white/10 hover:bg-white/5'
                            }`}
                            aria-label={`Ace of ${s}`}
                          >
                            {suitIcons[s]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

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
                  className="w-full py-4 rounded-xl bg-app-gold hover:bg-app-gold/90 text-app-on-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleConfirmRoundTricks}
                  disabled={needsPartner && partner == null}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirm Round
                </Button>
              </div>
            ) : (
              /* Expanded bid form - appears when a team/player is selected */
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
                              onClick={() => {
                                if (isSelected) { setSuit(null); setTricks(null) } else { setSuit(s); setTricks(t) }
                              }}
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
                      {[
                        { s: 'M', label: 'Misère' },
                        { s: 'DM', label: 'Double Misère' },
                        { s: 'OM', label: 'Open Misère' },
                        { s: 'DOM', label: 'Double Open Misère' },
                      ].map(({ s, label }) => {
                        const cellValue = getBidValue(s)
                        const isSelected = suit === s
                        const isLower = selectedValue != null && cellValue < selectedValue
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { setSuit(isSelected ? null : s); setTricks(null) }}
                            className={`rounded-md flex items-center justify-between px-2.5 py-1.5 border transition-colors ${
                              isSelected
                                ? 'bg-app-selected border-app-selected text-foreground'
                                : 'glass border-white/10 hover:bg-white/5'
                            } ${isLower ? 'opacity-30 grayscale' : ''}`}
                          >
                            <span className="text-xs font-medium">{label}</span>
                            <span className="text-[11px] text-white/50">{cellValue}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {isWinningCall && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-app-gold bg-app-gold/10 border border-app-gold/30 rounded-lg px-2.5 py-1.5">
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      Bid wins the game if made!
                    </div>
                  )}

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
                  const totals = runningTotals[i] || names.map(() => 0)
                  const callerName = names[r.callerIndex]
                  const partnerName = isIndividual && r.partnerIndex != null ? names[r.partnerIndex] : null
                  const dealerName = getDealerNameForRound(currentGame, i)
                  return (
                    <li
                      key={i}
                      className="flex justify-between items-center p-3 rounded-lg glass gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white block">
                          R{i + 1} {callerName}{partnerName ? ` & ${partnerName}` : ''}
                          {r.calledAceSuit && <> (<span className="inline-flex items-center align-middle">{suitIcons[r.calledAceSuit]}</span> ace)</>}
                          {' '}called <RoundBidDisplay tricks={r.tricks} suit={r.suit} />
                        </span>
                        <span className="text-xs text-white/60 mt-0.5 block">
                          {names.map((n, ni) => `${n}: ${totals[ni]}`).join(' · ')}
                        </span>
                        {dealerName && (
                          <span className="text-xs text-white/50 mt-0.5 block">Dealer: {dealerName}</span>
                        )}
                      </div>
                      <span className="flex gap-2 text-sm shrink-0 flex-wrap justify-end max-w-[30%]">
                        {names.map((n, ni) => {
                          const pts = r.pts?.[ni] ?? 0
                          const isCaller = ni === r.callerIndex || ni === r.partnerIndex
                          const color = pts < 0 ? 'text-red-400' : isCaller ? 'text-green-400' : 'text-white/50'
                          return (
                            <span key={ni} className={color}>
                              {pts >= 0 ? '+' : ''}{pts}
                            </span>
                          )
                        })}
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

      <AlertDialog open={editingNames} onOpenChange={(open) => !open && setEditingNames(false)}>
        <AlertDialogContent className="glass-strong border-white/10 text-white bg-[#1e2a3b] p-6 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit names</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {isIndividual ? 'Change player names for this game.' : 'Change team and player names for this game.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            {draftNames.map((name, i) => (
              <div key={i} className="space-y-2">
                <label className="text-xs font-medium text-app-label block">
                  {isIndividual || currentGame.twoHanded ? `PLAYER ${i + 1}` : `TEAM ${i + 1}`}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setDraftNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))}
                  className="w-full px-3 py-2 rounded-lg glass text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-app-label"
                />
                {!isIndividual && !currentGame.twoHanded && draftMembers[i] && (
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

      {currentGame.winner != null && (
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
                ? `Remove R${roundToDelete + 1} ${names[currentGame.rounds[roundToDelete].callerIndex]} called ${currentGame.rounds[roundToDelete].tricks} ${currentGame.rounds[roundToDelete].suit}? Scores will be updated.`
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
