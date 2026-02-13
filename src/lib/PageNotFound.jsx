import { Link } from 'react-router-dom'

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 text-white">
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-white/70 mb-4">The page you're looking for doesn't exist.</p>
      <Link to="/" className="text-app-label underline">
        Return to Start
      </Link>
    </div>
  )
}
