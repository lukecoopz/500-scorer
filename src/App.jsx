import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { GameProvider } from '@/lib/game-context'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import Layout from './Layout'
import StartPage from './pages/StartPage'
import ExistingTeamsPage from './pages/ExistingTeamsPage'
import TeamGamesPage from './pages/TeamGamesPage'
import GamePage from './pages/GamePage'
import BidPage from './pages/BidPage'
import RecordTricksPage from './pages/RecordTricksPage'

function App() {
  return (
    <GameProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            <Route path="/" element={<Layout><StartPage /></Layout>} />
            <Route path="/teams" element={<Layout><ExistingTeamsPage /></Layout>} />
            <Route path="/teams/:teamKey/games" element={<Layout><TeamGamesPage /></Layout>} />
            <Route path="/game/:gameId" element={<Layout><GamePage /></Layout>} />
            <Route path="/game/:gameId/bid" element={<Layout><BidPage /></Layout>} />
            <Route path="/game/:gameId/tricks" element={<Layout><RecordTricksPage /></Layout>} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </GameProvider>
  )
}

export default App
