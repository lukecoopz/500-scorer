import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Info } from 'lucide-react'
import RulesModal from '@/components/RulesModal'

export default function Layout({ children }) {
  const [rulesOpen, setRulesOpen] = useState(false)

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="p-1.5 -m-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Show rules"
          >
            <Info className="w-5 h-5" />
          </button>
          <Link
            to="/?new=1"
            className="p-1.5 -m-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="New game"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </header>
      <main className="px-4 pt-2 pb-4 max-w-lg mx-auto">{children}</main>
      <RulesModal open={rulesOpen} onOpenChange={setRulesOpen} />
    </div>
  )
}
