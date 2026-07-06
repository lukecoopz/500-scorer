import { createContext, useContext, useState, useCallback } from 'react'
import {
  getGameById,
  saveGame,
  createNewGame,
  getBidValue,
  computeRoundResult,
} from './game-storage'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(null)

  const startNewGame = useCallback((team1, team2) => {
    const game = createNewGame(team1, team2)
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

  const setBid = useCallback((caller, suit, tricks) => {
    if (!currentGame) return
    const bidValue = getBidValue(suit, tricks)
    const round = {
      caller: caller === 1 ? currentGame.team1 : currentGame.team2,
      suit,
      tricks,
      bidValue,
    }
    updateGame({ currentRound: round })
  }, [currentGame, updateGame])

  const confirmRound = useCallback((callerTricksWon) => {
    if (!currentGame?.currentRound) return
    const { caller, suit, tricks: bidTricks } = currentGame.currentRound
    const { pts1, pts2 } = computeRoundResult(currentGame, caller, suit, bidTricks, callerTricksWon)

    const newScore1 = currentGame.score1 + pts1
    const newScore2 = currentGame.score2 + pts2
    const rounds = [
      ...currentGame.rounds,
      {
        ...currentGame.currentRound,
        callerTricksWon,
        pts1,
        pts2,
      },
    ]
    const winner = newScore1 >= 500 ? 1 : newScore2 >= 500 ? 2 : null
    updateGame({
      score1: newScore1,
      score2: newScore2,
      rounds,
      currentRound: null,
      winner,
      endedAt: winner ? Date.now() : undefined,
    })
  }, [currentGame, updateGame])

  const deleteRound = useCallback((roundIndex) => {
    if (!currentGame?.rounds?.[roundIndex]) return
    const round = currentGame.rounds[roundIndex]
    const newRounds = currentGame.rounds.filter((_, i) => i !== roundIndex)
    const newScore1 = currentGame.score1 - (round.pts1 || 0)
    const newScore2 = currentGame.score2 - (round.pts2 || 0)
    const winner = newScore1 >= 500 ? 1 : newScore2 >= 500 ? 2 : null
    updateGame({
      score1: newScore1,
      score2: newScore2,
      rounds: newRounds,
      winner: winner || undefined,
      endedAt: winner ? currentGame.endedAt : undefined,
    })
  }, [currentGame, updateGame])

  return (
    <GameContext.Provider
      value={{
        currentGame,
        startNewGame,
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
