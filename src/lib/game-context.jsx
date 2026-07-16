import { createContext, useContext, useState, useCallback } from 'react'
import {
  getGameById,
  saveGame,
  createTeamGame,
  createIndividualGame,
  getBidValue,
  computeTeamRoundResult,
  computeIndividualRoundResult,
} from './game-storage'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(null)

  const startNewTeamGame = useCallback((teamNames) => {
    const game = createTeamGame(teamNames)
    setCurrentGame(game)
    return game
  }, [])

  const startNewIndividualGame = useCallback((playerNames) => {
    const game = createIndividualGame(playerNames)
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
    const rounds = [
      ...currentGame.rounds,
      {
        ...currentGame.currentRound,
        ...(currentGame.mode === 'individual' ? { partnerIndex, calledAceSuit } : {}),
        callerTricksWon,
        bidMade,
        pts,
      },
    ]
    const winnerIndex = newScores.findIndex((s) => s >= 500)
    const winner = winnerIndex === -1 ? null : winnerIndex
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
    const winnerIndex = newScores.findIndex((s) => s >= 500)
    const winner = winnerIndex === -1 ? null : winnerIndex
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
