import { DEFAULT_TARGET_HANDS } from '@/lib/game-storage'

export default function GameSetupOptions({
  dealerSeats,
  winMode,
  setWinMode,
  targetHands,
  setTargetHands,
  firstDealerIndex,
  setFirstDealerIndex,
}) {
  return (
    <>
      <div>
        <label className="text-sm font-medium text-app-label block mb-2">SCORING</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWinMode('points')}
            className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
              winMode === 'points'
                ? 'bg-app-selected border-app-selected text-foreground'
                : 'glass border-white/10 hover:bg-white/5 text-white'
            }`}
          >
            Play to 500
          </button>
          <button
            type="button"
            onClick={() => setWinMode('hands')}
            className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
              winMode === 'hands'
                ? 'bg-app-selected border-app-selected text-foreground'
                : 'glass border-white/10 hover:bg-white/5 text-white'
            }`}
          >
            Highest after X
          </button>
        </div>
        {winMode === 'hands' && (
          <div className="mt-3">
            <label className="text-sm font-medium text-app-label block mb-2">HANDS</label>
            <div className="flex items-center justify-center gap-5 py-1">
              <button
                type="button"
                onClick={() => setTargetHands((n) => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-lg glass border border-white/10 text-white text-lg font-medium hover:bg-white/5"
                aria-label="Fewer hands"
              >
                −
              </button>
              <span className="text-xl font-bold text-white w-6 text-center">{targetHands}</span>
              <button
                type="button"
                onClick={() => setTargetHands((n) => Math.min(20, n + 1))}
                className="w-10 h-10 rounded-lg glass border border-white/10 text-white text-lg font-medium hover:bg-white/5"
                aria-label="More hands"
              >
                +
              </button>
            </div>
            <p className="text-xs text-white/50 text-center mt-1">
              Highest score after {targetHands || DEFAULT_TARGET_HANDS} hands wins
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-app-label block mb-2">WHO DEALS FIRST?</label>
        <div className={`grid gap-2 ${dealerSeats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {dealerSeats.map((seat, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setFirstDealerIndex(i)}
              className={`py-2 px-2 rounded-lg border text-sm font-medium truncate transition-colors ${
                firstDealerIndex === i
                  ? 'bg-app-selected border-app-selected text-foreground'
                  : 'glass border-white/10 hover:bg-white/5 text-white'
              }`}
            >
              {seat.name}
              {seat.teamName ? (
                <span className="block text-[10px] font-normal opacity-70 truncate">{seat.teamName}</span>
              ) : null}
            </button>
          ))}
        </div>
        {dealerSeats.length > 2 && (
          <p className="text-xs text-white/50 mt-2">
            Deal then rotates clockwise to the next person (usually the other team).
          </p>
        )}
      </div>
    </>
  )
}
