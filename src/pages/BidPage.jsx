import { useParams, Navigate } from 'react-router-dom'

export default function BidPage() {
  const { gameId } = useParams()

  // Bid entry is now inlined on Game page - redirect direct /bid URLs
  return <Navigate to={`/game/${gameId}`} replace />
}
