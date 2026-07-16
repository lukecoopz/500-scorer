import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { X, Spade, Club, Diamond, Heart } from 'lucide-react'
import { BID_VALUES, TRICK_OPTIONS } from '@/lib/game-storage'

const SUIT_ORDER = ['Spades', 'Clubs', 'Diamonds', 'Hearts', 'NT']
const suitIcons = {
  Spades: <Spade className="w-3.5 h-3.5" />,
  Clubs: <Club className="w-3.5 h-3.5" />,
  Diamonds: <Diamond className="w-3.5 h-3.5 text-app-pink" />,
  Hearts: <Heart className="w-3.5 h-3.5 text-app-pink" />,
  NT: <span className="text-[11px] font-medium text-app-gold">NT</span>,
}

const tabTriggerClass =
  'flex-1 py-2 text-xs font-medium rounded-lg transition-colors text-white/60 hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white'

export default function RulesModal({ open, onOpenChange }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0d1117]/85 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg flex-col rounded-t-xl border border-b-0 border-white/10 bg-[#1e2a3b] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          style={{ maxHeight: '85vh' }}
        >
          <div className="flex items-center justify-between p-6 pb-3 shrink-0">
            <Dialog.Title className="text-lg font-semibold text-white">500 Rules</Dialog.Title>
            <Dialog.Description className="sr-only">How to bid, score, and win a game of 500.</Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-2 -m-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close rules"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <Tabs.Root defaultValue="2-4" className="flex-1 min-h-0 flex flex-col">
            <Tabs.List className="flex gap-1 mx-6 mb-3 p-1 rounded-lg bg-white/5 shrink-0">
              <Tabs.Trigger value="2-4" className={tabTriggerClass}>Fixed Partners</Tabs.Trigger>
              <Tabs.Trigger value="5" className={tabTriggerClass}>Call a Partner</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content
              value="2-4"
              className="flex-1 min-h-0 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5 text-sm text-white/80"
            >
              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">OBJECTIVE</h3>
                <p>Played with 2 or 3 fixed teams (solo or in pairs) for the whole game. First team to reach 500 points wins. Each round, one team calls (bids) a suit and number of tricks; the other team(s) defend.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">BIDDING</h3>
                <p>The caller bids to win a number of tricks (6–10) in a suit or No Trumps. Higher suits are worth more points, so a bid must beat the previous highest bid.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">BID VALUES</h3>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-white/50 font-normal pb-1 px-1"> </th>
                        {TRICK_OPTIONS.map((t) => (
                          <th key={t} className="text-white/50 font-normal pb-1 px-1">{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SUIT_ORDER.map((s) => (
                        <tr key={s} className="border-t border-white/10">
                          <td className="py-1 px-1 flex items-center gap-1">{suitIcons[s]}</td>
                          {TRICK_OPTIONS.map((t) => (
                            <td key={t} className="text-center py-1 px-1">{BID_VALUES[s][t]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2">If the caller bids under 250 but wins all 10 tricks, they score 250 instead.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">MISÈRE</h3>
                <p><span className="text-app-purple font-medium">Misère</span> (250 pts): caller bids to lose every trick.<br />
                <span className="text-app-purple font-medium">Open Misère</span> (500 pts): same, but the caller's hand is played face-up on the table.</p>
                <p className="mt-1.5">Misère is played solo, even in a team game &mdash; the caller&apos;s partner puts their hand down and sits out the hand entirely.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">SCORING A ROUND</h3>
                <p>If the caller makes their bid (or misère), they score the bid value. If they fail, they lose the bid value instead.</p>
                <p className="mt-1.5">Each other team scores 10 points per trick they win, whether or not the caller's bid succeeds (with 3 teams, the two non-calling teams are scored independently of each other). Defenders can&apos;t win the game by defending &mdash; their points are capped just short of 500, so only a successful call can finish the game.</p>
                <p className="mt-1.5">Misère reverses this: since the caller is trying to win zero tricks, each other team instead scores 10 points for every trick the misère caller ends up winning.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">WINNING</h3>
                <p>The first team to reach 500 points wins immediately.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">GOING OUT THE BACK DOOR</h3>
                <p>If a team's score drops to &minus;500 (from failed bids), they lose immediately &mdash; even if the other team hasn't reached 500 yet.</p>
              </section>
            </Tabs.Content>

            <Tabs.Content
              value="5"
              className="flex-1 min-h-0 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5 text-sm text-white/80"
            >
              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">OBJECTIVE</h3>
                <p>Played with 3 or more players, everyone for themselves &mdash; no fixed partners. Bidding, bid values, and going-out-the-back-door all work exactly as in the team game &mdash; the only difference is how a team is formed each hand.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">CALLING A PARTNER</h3>
                <p>Whoever wins the bidding calls an ace they don&apos;t hold themselves. Whoever holds that ace becomes their partner for the hand &mdash; the partnership isn&apos;t revealed until that ace is played. The caller and their partner are the "team" of two; everyone else defends as a group.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">SCORING</h3>
                <p>If the bid is made, the caller and their partner each score the full bid value. If it&apos;s lost, they each lose the full bid value instead &mdash; same amount as the team game, just credited to two players instead of one team.</p>
                <p className="mt-1.5">Everyone else scores as a group for defending: 10 points per trick the defending side wins, credited to all of them equally regardless of who actually took the trick, capped the same way as the team game so they can&apos;t creep to a win.</p>
              </section>

              <section>
                <h3 className="text-app-label text-xs font-medium mb-1.5">MISÈRE IS SOLO</h3>
                <p>Misère and Open Misère are played alone &mdash; no partner is called, it&apos;s the caller against everyone else. The caller scores (or loses) the bid value by themselves.</p>
                <p className="mt-1.5">Defending is reversed here too: since the caller is trying to win zero tricks, everyone else scores 10 points for every trick the misère caller ends up winning, split equally the same way as normal defending.</p>
              </section>
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
