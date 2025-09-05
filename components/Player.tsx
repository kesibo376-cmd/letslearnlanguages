// ... imports stay the same

const Player: React.FC<PlayerProps> = ({ 
  podcast, 
  isPlaying, 
  setIsPlaying, 
  onProgressSave,
  onEnded,
  isPlayerExpanded,
  setIsPlayerExpanded,
  artworkUrl,
  playbackRate,
  onPlaybackRateChange,
  currentTime,
  onCurrentTimeUpdate,
  onDurationFetch,
  layoutMode,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Playback error:", e));
    }
    setIsPlaying(p => !p);
  }, [isPlaying, setIsPlaying]);

  // ... state, effects, handleTouchStart/Move/End etc. stay the same

  // helper for mobile-safe button clicks
  const withTouch = (fn: () => void) => ({
    onClick: fn,
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      fn();
    }
  });

  const PimsleurCircularPlayer = () => {
    const size = 280;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;

    return (
       <div className="flex-grow flex flex-col items-center justify-center text-center gap-8 w-full">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        stroke="var(--brand-surface)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <circle
                        cx={size/2}
                        cy={size/2}
                        r={radius}
                        stroke="var(--brand-primary)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <h3 className="text-4xl font-bold text-brand-text mb-2">
                      {formatTime(podcast.duration - currentTime)}
                    </h3>
                    <button
                      {...withTouch(togglePlayPause)}
                      className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 b-border b-shadow hover:bg-brand-primary-hover transition-transform transform active:scale-95"
                    >
                      {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
                    </button>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-brand-text mt-4 px-4">{podcast.name}</h2>
            
            <div className="flex items-center justify-center gap-2 w-full max-w-sm">
                <button {...withTouch(() => handleSkip(-10))} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                  <RedoIcon size={24} className="backward -scale-x-100"/>
                </button>
                <button {...withTouch(handleCycleSpeed)} className="text-brand-text font-semibold p-3 rounded-md w-24 text-center bg-brand-surface hover:bg-brand-surface-light transition-colors b-border transform hover:scale-105 active:scale-95">
                    {playbackRate}x
                </button>
                <button {...withTouch(() => handleSkip(10))} className="text-brand-text-secondary hover:text-brand-text p-4 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">
                  <RedoIcon size={24} className="forward"/>
                </button>
            </div>
        </div>
    );
  };
  
  const DefaultExpandedPlayer = () => {
    const sharedControls = (
      <div className="flex items-center justify-center gap-2 w-full max-w-sm">
        <button {...withTouch(handleCycleSpeed)} className="text-brand-text font-semibold p-2 rounded-md w-16 text-center bg-brand-surface hover:bg-brand-surface-light transition-colors b-border transform hover:scale-105 active:scale-95">
            {playbackRate}x
        </button>
        <button {...withTouch(() => handleSkip(-5))} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">-5s</button>
        <button {...withTouch(togglePlayPause)} className="bg-brand-primary text-brand-text-on-primary rounded-full p-5 hover:bg-brand-primary-hover transition-transform transform active:scale-95 b-border b-shadow">
          {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
        </button>
        <button {...withTouch(() => handleSkip(5))} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm transform transition-transform hover:scale-110 active:scale-95">+5s</button>
        <div className="w-16" aria-hidden="true" />
      </div>
    );

    // ... progressBar code stays the same

    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 sm:gap-8">
        {/* artwork etc. unchanged */}
        {sharedControls}
      </div>
    );
  };

  return (
    <>
      {/* audio element stays the same */}
      <div className="fixed left-0 right-0 z-20 ...">
        {/* expanded player stays the same */}
        <div className="absolute bottom-0 left-0 right-0 bg-brand-surface-light ...">
          <div className="max-w-4xl mx-auto flex items-center gap-3 p-2 sm:p-3">
            {/* artwork + info unchanged */}
            <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
              <button {...withTouch(() => handleSkip(-10))} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full b-border transform transition-transform active:scale-90" aria-label="Skip backward 10 seconds">
                <RedoIcon size={20} className="backward -scale-x-100" />
              </button>
              <button {...withTouch(togglePlayPause)} className="text-brand-text p-3 rounded-full hover:bg-brand-surface b-border transform transition-transform active:scale-90" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
              <button {...withTouch(() => handleSkip(10))} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full b-border transform transition-transform active:scale-90" aria-label="Skip forward 10 seconds">
                <RedoIcon size={20} className="forward" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;
