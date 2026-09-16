import { createContext, useContext, useState, useCallback } from 'react'
import {
  getGameById,
  saveGame,
  createTeamGame,
  createIndividualGame,
  getBidValue,
  computeTeamRoundResult,
  computeIndividualRoundResult,
  getCurrentDealer,
  determineWinner,
  updateGroupDisplay,
} from './game-storage'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(null)

  const startNewTeamGame = useCallback((teamNames, options) => {
    const game = createTeamGame(teamNames, options)
    setCurrentGame(game)
    return game
  }, [])

  const startNewIndividualGame = useCallback((playerNames, options) => {
    const game = createIndividualGame(playerNames, options)
    setCurrentGame(game)
    return game
  }, [])

  const loadGame = useCallback((gameId) => {
    const game = getGameById(gameId)
    setCurrentGame(game)
    return game
  }, [])

  const updateGame = useCallback((updates) => {
    if (!currentGame) return
    const updated = { ...currentGame, ...updates }
    saveGame(updated)
    setCurrentGame(updated)
  }, [currentGame])

  const renameSides = useCallback((names, members) => {
    if (!currentGame) return
    const trimmed = names.map((n, i) => n.trim() || (currentGame.mode === 'individual' ? `Player ${i + 1}` : `Team ${i + 1}`))
    const updates = currentGame.mode === 'individual'
      ? { players: trimmed }
      : { teams: trimmed, ...(members ? { members } : {}) }
    const updated = { ...currentGame, ...updates }
    saveGame(updated)
    setCurrentGame(updated)
    updateGroupDisplay(currentGame.teamKey, {
      names: trimmed,
      members: currentGame.mode === 'individual' ? undefined : (members || currentGame.members),
    })
  }, [currentGame])

  const setBid = useCallback((callerIndex, suit, tricks) => {
    if (!currentGame) return
    const bidValue = getBidValue(suit, tricks)
    const round = { callerIndex, suit, tricks, bidValue }
    updateGame({ currentRound: round })
  }, [currentGame, updateGame])

  const confirmRound = useCallback((callerTricksWon, partnerIndex, calledAceSuit) => {
    if (!currentGame?.currentRound) return
    const { callerIndex, suit, tricks: bidTricks } = currentGame.currentRound
    const { pts, bidMade } = currentGame.mode === 'individual'
      ? computeIndividualRoundResult(currentGame, callerIndex, partnerIndex, suit, bidTricks, callerTricksWon)
      : computeTeamRoundResult(currentGame, callerIndex, suit, bidTricks, callerTricksWon)

    const newScores = currentGame.scores.map((s, i) => s + pts[i])
    const dealer = getCurrentDealer(currentGame)
    const rounds = [
      ...currentGame.rounds,
      {
        ...currentGame.currentRound,
        ...(currentGame.mode === 'individual' ? { partnerIndex, calledAceSuit } : {}),
        callerTricksWon,
        bidMade,
        pts,
        dealerName: dealer?.name,
      },
    ]
    const winner = determineWinner(
      newScores,
      currentGame.winMode,
      rounds.length,
      currentGame.targetHands
    )
    updateGame({
      scores: newScores,
      rounds,
      currentRound: null,
      winner,
      endedAt: winner != null ? Date.now() : undefined,
    })
  }, [currentGame, updateGame])

  const deleteRound = useCallback((roundIndex) => {
    if (!currentGame?.rounds?.[roundIndex]) return
    const round = currentGame.rounds[roundIndex]
    const newRounds = currentGame.rounds.filter((_, i) => i !== roundIndex)
    const newScores = currentGame.scores.map((s, i) => s - (round.pts?.[i] || 0))
    const winner = determineWinner(
      newScores,
      currentGame.winMode,
      newRounds.length,
      currentGame.targetHands
    )
    updateGame({
      scores: newScores,
      rounds: newRounds,
      winner,
      endedAt: winner != null ? currentGame.endedAt : undefined,
    })
  }, [currentGame, updateGame])

  return (
    <GameContext.Provider
      value={{
        currentGame,
        startNewTeamGame,
        startNewIndividualGame,
        loadGame,
        updateGame,
        renameSides,
        setBid,
        confirmRound,
        deleteRound,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
