import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 glass-strong">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🃏</span>
          <div>
            <span className="font-bold text-lg">500</span>
            <span className="text-white/70 text-sm block -mt-0.5">SCORE KEEPER</span>
          </div>
        </Link>
        <Link
          to="/?new=1"
          className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
          New Game
        </Link>
      </header>
      <main className="px-4 pt-2 pb-4 max-w-lg mx-auto">{children}</main>
    </div>
  )
}
