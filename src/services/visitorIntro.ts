/**
 * First-visit CRT introduction helpers.
 *
 * The intro is only shown when the visitor's browser has not stored the
 * `dr_intro_seen` cookie yet. Once they page through the whole intro the
 * cookie is set for a year and the TV boots straight to the normal screen.
 */

export const INTRO_COOKIE_NAME = 'dr_intro_seen';
const INTRO_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export type VisitorOs = 'windows' | 'macos' | 'linux' | 'unknown';

/** True when this browser has already finished the first-visit intro. */
export function hasSeenIntro(): boolean {
  if (typeof document === 'undefined') return true;
  return document.cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${INTRO_COOKIE_NAME}=`));
}

/** Remembers that the visitor finished the intro (cookie valid for 1 year). */
export function markIntroAsSeen(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${INTRO_COOKIE_NAME}=1; max-age=${INTRO_COOKIE_MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
}

/** Best-effort visitor OS detection for the personalized intro page. */
export function detectVisitorOs(): VisitorOs {
  if (typeof navigator === 'undefined') return 'unknown';

  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const signature = [nav.userAgentData?.platform, nav.platform, nav.userAgent]
    .filter(Boolean)
    .join(' ');

  if (/windows|win32|win64|win16/i.test(signature)) return 'windows';
  if (/macintosh|mac os x|macos|iphone|ipad|ipod/i.test(signature)) return 'macos';
  if (/linux|x11|cros|android/i.test(signature)) return 'linux';
  return 'unknown';
}

const OS_INTRO_LINES: Record<VisitorOs, string> = {
  windows: 'Windows, you normie. Enjoy your forced updates.',
  macos:
    "macOS, ugh. I guess you're someone with a job, then. I don't get why all millennials pick it, but good for you. I hate it though.",
  linux: 'Linux, nice, comrade. Open source FTW. I respect you already.',
  unknown:
    "...damn, I can't tell. Okay then, keep your secrets. (This is gonna sound real awkward if it wasn't intentional and my code just failed.)",
};

/** Shared closing beat appended to the OS page. */
const OS_INTRO_CLOSER = " Anyway, I'm still judging you. Lovingly.";

/** The full intro script, one page per array entry. */
export function buildIntroPages(): string[] {
  return [
    "PLEASE README, DON'T JUST SKIP THROUGH IT\n(WORTH EVERY HOUR)",
    "Hey, I'm Vaibhav. I go by DeployedReject on GitHub. I know it sounds kinda edgy, but it's actually a pun on the name of a series I liked at the time. Every other account name of mine is some variation of 'reject' too, so I guess the whole branding just stuck. No regrets.",
    "I made this introduction because apparently people find my website somewhat confusing to navigate. Consider this your mandatory safety briefing. You can mostly point and click your way around, but I highly recommend using the arrow keys on the computer for the FEEL. Trust me, it's a completely different experience.",
    `Now you are using ${OS_INTRO_LINES[detectVisitorOs()]}${OS_INTRO_CLOSER}`,
    "Now the main part: you can exit the computer by hovering over the edge or pressing ESC. People just couldn't figure that out, no matter how many tooltips I put in, hence this whole intro. Alright, that's everything I wanted to say. You're free to go now. Go click around, and remember: edge, or ESC.",
  ];
}
