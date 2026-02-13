import { Trophy, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'

export default function GameResultsModal({ game, onClose }) {
  const winner = game.winner === 1 ? game.team1 : game.team2
  const isTeam1Winner = game.winner === 1

  return (
    <Dialog.Root open={!!game.winner} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0d1117]/85" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl glass-strong border-white/10 p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-app-gold" />
              <Dialog.Title className="text-xl font-bold">{winner} Won</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`rounded-xl p-4 border ${
                isTeam1Winner ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10 glass'
              }`}
            >
              <p className="text-sm text-white/70">{game.team1}</p>
              <p className="text-2xl font-bold">{game.score1}</p>
            </div>
            <div
              className={`rounded-xl p-4 border ${
                !isTeam1Winner ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10 glass'
              }`}
            >
              <p className="text-sm text-white/70">{game.team2}</p>
              <p className="text-2xl font-bold">{game.score2}</p>
            </div>
          </div>

          <div>
            <h4 className="text-app-label text-sm font-medium mb-3">
              ROUNDS ({game.rounds?.length || 0})
            </h4>
            <ul className="space-y-2">
              {game.rounds?.map((r, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center p-2 rounded-lg glass text-sm"
                >
                  <span>R{i + 1} {r.caller} · {r.tricks} {r.suit}</span>
                  <span className="flex gap-2">
                    <span className="text-app-label">+{r.pts1}</span>
                    <span className="text-white/70">+{r.pts2}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Button className="w-full mt-6 bg-app-green hover:bg-app-green/90 text-white" onClick={onClose}>
            Done
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
