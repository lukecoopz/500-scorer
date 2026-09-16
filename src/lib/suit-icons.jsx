import { Spade, Club, Diamond, Heart } from 'lucide-react'

export const suitIcons = {
  Spades: <Spade className="w-4 h-4 inline-block align-middle" />,
  Clubs: <Club className="w-4 h-4 inline-block align-middle" />,
  Diamonds: <Diamond className="w-4 h-4 inline-block align-middle text-app-pink" />,
  Hearts: <Heart className="w-4 h-4 inline-block align-middle text-app-pink" />,
  NT: <span className="text-app-gold font-medium text-sm">NT</span>,
  M: <span className="text-app-purple font-medium text-sm">M</span>,
  DM: <span className="text-app-purple font-medium text-sm">DM</span>,
  OM: <span className="text-app-purple font-medium text-sm">OM</span>,
  DOM: <span className="text-app-purple font-medium text-sm">DOM</span>,
}

/** Renders the bid part of a round (e.g. "8" + Hearts icon, or "M" for Misère) */
export function RoundBidDisplay({ tricks, suit }) {
  const icon = suitIcons[suit]
  if (!icon) return <>{tricks} {suit}</>
  const isMisere = suit === 'M' || suit === 'DM' || suit === 'OM' || suit === 'DOM'
  return (
    <span className="inline-flex items-center gap-1">
      {!isMisere && <>{tricks} </>}
      {icon}
    </span>
  )
}
