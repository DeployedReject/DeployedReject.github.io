interface RetroIntroProps {
  text: string;
  visibleChars: number;
  pageIndex: number;
  pageCount: number;
  isLightMode?: boolean;
  onAdvance: () => void;
}

/**
 * First-visit introduction rendered directly on the CRT screen.
 * Text is typed character-by-character and the visitor pages forward
 * with ENTER (handled by TVConsoleScene) or by clicking the prompt.
 */
export const RetroIntro: React.FC<RetroIntroProps> = ({
  text,
  visibleChars,
  pageIndex,
  pageCount,
  isLightMode = false,
  onAdvance,
}) => {
  const visibleText = text.slice(0, visibleChars);
  const isTypingDone = visibleChars >= text.length;
  const isLastPage = pageIndex === pageCount - 1;
  const isTitlePage = pageIndex === 0;

  return (
    <div
      className={`w-full h-full flex flex-col justify-between select-none relative overflow-hidden p-4 sm:p-6 md:p-8 ${
        isLightMode ? 'bg-[#e6f0e2] text-[#142918]' : 'bg-[#070c08] text-[#a6e26e]'
      }`}
      style={{
        fontFamily: 'var(--font-crt)',
        imageRendering: 'pixelated',
        background: isLightMode
          ? 'radial-gradient(circle at 50% 45%, #f2f8ef 0%, #e1ede0 68%, #cfe0cd 100%)'
          : 'radial-gradient(circle at 50% 45%, #121f14 0%, #09100a 68%, #040704 100%)',
      }}
    >
      {/* On-screen display bar: intro label + page counter */}
      <div
        className={`border-b-2 pb-2.5 flex items-center justify-between gap-2 shrink-0 ${
          isLightMode ? 'border-[#5c8754]/70' : 'border-[#4b6e32]/80'
        }`}
        style={{ fontFamily: 'var(--font-pixel)' }}
      >
        <span className="text-xs sm:text-sm uppercase tracking-wider">
          First Boot // Introduction
        </span>
        <span className="text-xs sm:text-sm uppercase tracking-wider">
          Page {pageIndex + 1}/{pageCount}
        </span>
      </div>

      {/* Typed page body */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-4 sm:py-6">
        <p
          className={`w-full max-w-4xl whitespace-pre-line ${isLightMode ? '' : 'crt-glow'} ${
            isTitlePage
              ? 'text-center text-2xl sm:text-4xl md:text-[2.75rem] leading-snug'
              : 'text-lg sm:text-2xl md:text-3xl leading-relaxed'
          }`}
          style={{ fontFamily: isTitlePage ? 'var(--font-pixel)' : 'var(--font-crt)' }}
        >
          {visibleText}
          <span
            className={`inline-block w-[0.55em] h-[1em] align-[-0.08em] ${
              isTypingDone ? 'animate-cursorBlink' : ''
            }`}
            style={{ backgroundColor: 'currentColor' }}
          />
        </p>
      </div>

      {/* Page forward prompt (clickable; ENTER is handled by the parent) */}
      <div className="shrink-0 flex items-center justify-end">
        <button
          type="button"
          onClick={onAdvance}
          className={`px-3 py-2 border-2 text-xs sm:text-sm uppercase tracking-wider cursor-pointer transition-all duration-150 ${
            isTypingDone ? 'animate-pulse' : 'opacity-60'
          } ${
            isLightMode
              ? 'bg-[#1c3b22] text-[#f2f8ef] border-[#0f2413] hover:opacity-90'
              : 'bg-[#a6e26e] text-[#0b120c] border-[#d4f7b5] hover:shadow-[0_0_18px_rgba(166,226,110,0.75)]'
          }`}
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          [ Enter ] ▸ {isLastPage ? 'Finish' : 'Page Forward'}
        </button>
      </div>
    </div>
  );
};
