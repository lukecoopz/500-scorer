import { Trophy, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { RoundBidDisplay, suitIcons } from '@/lib/suit-icons'

export default function GameResultsModal({ game, onClose }) {
  const isIndividual = game.mode === 'individual'
  const names = isIndividual ? game.players : game.teams
  const scores = game.scores
  const winnerName = game.winner != null ? names[game.winner] : null
  const gridColsClass = names.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <Dialog.Root open={game.winner != null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0d1117]/85" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md max-h-[90vh] translate-x-[-50%] translate-y-[-50%] rounded-xl glass-strong border-white/10 p-6 shadow-lg text-white flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-app-gold" />
              <Dialog.Title className="text-xl font-bold">{winnerName} Won</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </Dialog.Close>
          </div>

          <div className={`grid gap-4 mb-6 shrink-0 ${gridColsClass}`}>
            {names.map((name, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 border text-center ${
                  i === game.winner ? 'border-app-gold/80 bg-app-gold/10' : 'border-white/10 glass'
                }`}
              >
                <p className="text-sm text-white/70 truncate">{name}</p>
                <p className="text-2xl font-bold">{scores[i]}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col min-h-0 flex-1">
            <h4 className="text-app-label text-sm font-medium mb-3 shrink-0">
              ROUNDS ({game.rounds?.length || 0})
            </h4>
            <ul className="space-y-2 overflow-y-auto min-h-0 pr-1 -mr-1">
              {game.rounds?.reduce(
                (acc, r, i) => {
                  const totals = names.map((_, ni) => (acc.running[ni] || 0) + (r.pts?.[ni] ?? 0))
                  const callerName = names[r.callerIndex]
                  const partnerName = isIndividual && r.partnerIndex != null ? names[r.partnerIndex] : null
                  acc.items.push(
                    <li
                      key={i}
                      className="flex justify-between items-center p-3 rounded-lg glass gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-white block">
                          R{i + 1} {callerName}{partnerName ? ` & ${partnerName}` : ''}
                          {r.calledAceSuit && <> (<span className="inline-flex items-center align-middle">{suitIcons[r.calledAceSuit]}</span> ace)</>}
                          {' '}· <RoundBidDisplay tricks={r.tricks} suit={r.suit} />
                        </span>
                        <span className="text-xs text-white/60 mt-0.5 block">
                          {names.map((n, ni) => `${n}: ${totals[ni]}`).join(' · ')}
                        </span>
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
                    </li>
                  )
                  acc.running = totals
                  return acc
                },
                { items: [], running: names.map(() => 0) }
              ).items}
            </ul>
          </div>

          <Button className="w-full mt-6 bg-app-green hover:bg-app-green/90 text-white shrink-0" onClick={onClose}>
            Done
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
