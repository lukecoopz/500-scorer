import { createContext, useContext, useState, useCallback } from 'react'
import {
  getGameById,
  saveGame,
  createNewGame,
  getBidValue,
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
    const { caller, suit, tricks: bidTricks, bidValue } = currentGame.currentRound
    const bidMade = suit === 'M' || suit === 'OM'
      ? callerTricksWon === 0
      : callerTricksWon >= bidTricks

    const isCallerTeam1 = caller === currentGame.team1
    let pts1 = 0
    let pts2 = 0

    if (suit === 'M' || suit === 'OM') {
      if (bidMade) {
        if (isCallerTeam1) pts1 = bidValue
        else pts2 = bidValue
      } else {
        if (isCallerTeam1) pts1 = -bidValue
        else pts2 = -bidValue
      }
    } else {
      const defenderTricks = 10 - callerTricksWon
      const rawDefenderPts = defenderTricks * 10
      // Defender points capped at 490: cannot win by creeping (must bid to reach 500)
      const defenderCurrentScore = isCallerTeam1 ? currentGame.score2 : currentGame.score1
      const defenderPts = Math.min(rawDefenderPts, Math.max(0, 490 - defenderCurrentScore))

      if (bidMade) {
        // Caller gets 250 if bid < 250 and they make all 10 tricks
        let callerPts = bidValue
        if (bidValue < 250 && callerTricksWon === 10) callerPts = 250

        if (isCallerTeam1) {
          pts1 = callerPts
          pts2 = defenderPts
        } else {
          pts2 = callerPts
          pts1 = defenderPts
        }
      } else {
        if (isCallerTeam1) {
          pts1 = -bidValue
          pts2 = defenderPts
        } else {
          pts2 = -bidValue
          pts1 = defenderPts
        }
      }
    }

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

  const clearCurrentRound = useCallback(() => {
    updateGame({ currentRound: null })
  }, [updateGame])

  const resetToWhoCalling = useCallback(() => {
    updateGame({ currentRound: null })
  }, [updateGame])

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
        clearCurrentRound,
        resetToWhoCalling,
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
