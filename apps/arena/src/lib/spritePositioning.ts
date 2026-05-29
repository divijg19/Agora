/**
 * Sprite Positioning Constants
 * Centralized values for setup silhouettes, transitions, and combat sprites
 */

// Setup Screen Silhouette Values
export const SETUP_HEIGHT_VH = 80;
export const SETUP_X_OFFSET_SELECTED = 250; // magnitude (left: -250, right: +250)
export const SETUP_X_OFFSET_IDLE = 50; // magnitude (left: -50, right: +50)
export const SETUP_Y_OFFSET_ECONOMIST_PERCENT = 4;

// Combat Screen Values
export const COMBAT_HEIGHT_PX = 288; // h-72 in pixels
export const COMBAT_Y_OFFSET_DESKTOP_VH = 35; // translate-y-[35vh]
export const COMBAT_Y_OFFSET_MOBILE_CLASS = "translate-y-full";
export const COMBAT_ECONOMIST_Y_OFFSET_PERCENT = 4;

// Sprite Transition Bridge Values
export const TRANSITION_DURATION_MS = 600;
export const TRANSITION_INITIAL_X_OFFSET = 300;
export const TRANSITION_INITIAL_Y_VIEWPORT = "20vh";
export const TRANSITION_INITIAL_SCALE = 2.5;
export const TRANSITION_FINAL_SCALE = 1;

/**
 * Calculate the pixel value equivalent of 35vh (combat Y offset on desktop)
 * @param viewportHeight - The height of the browser viewport in pixels
 * @returns The pixel value representing 35% of the viewport height
 */
export function calculateCombatYPixels(viewportHeight: number): number {
  return Math.round(viewportHeight * (COMBAT_Y_OFFSET_DESKTOP_VH / 100));
}

/**
 * Get the Y offset percentage for a fighter
 * @param fighterId - The fighter's ID
 * @returns "4%" for economist, "0%" for others
 */
export function getEconomistYOffset(fighterId: string): string {
  return fighterId === "economist"
    ? `${SETUP_Y_OFFSET_ECONOMIST_PERCENT}%`
    : "0%";
}
