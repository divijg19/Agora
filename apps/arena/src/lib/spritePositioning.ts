/**
 * Sprite Positioning Constants
 * Centralized values for setup silhouettes, transitions, and combat sprites
 */

// Setup Screen Silhouette Values
export const SETUP_HEIGHT_VH = 80;
export const SETUP_X_OFFSET_SELECTED = 250; // magnitude (left: -250, right: +250)
export const SETUP_X_OFFSET_IDLE = 50; // magnitude (left: -50, right: +50)
export const FIGHTER_ECONOMIST_Y_OFFSET_PERCENT = 4;

// Combat Screen Values
export const COMBAT_Y_OFFSET_DESKTOP_VH = 35; // translate-y-[35vh]
export const COMBAT_SPRITE_HEIGHT_PX = 288;

// Sprite Transition Bridge Values
export const TRANSITION_DURATION_MS = 600;
export const TRANSITION_INITIAL_X_OFFSET = 300;
export const TRANSITION_INITIAL_Y_VIEWPORT = "20vh";
export const TRANSITION_INITIAL_SCALE = 2.5;

/**
 * Calculate the combat ground landing point in pixels for a given viewport.
 * This is the shared end target for both the transition bridge and the combat screen.
 */
export function getCombatGroundYPixels(viewportHeight: number): number {
  return calculateCombatYPixels(viewportHeight);
}

/**
 * Calculate the bridge's starting Y position in pixels for a given viewport.
 * This keeps the transition's first frame proportional to the same screen size.
 */
export function getTransitionStartYPixels(viewportHeight: number): number {
  return Math.round(viewportHeight * 0.2);
}

/**
 * Calculate the pixel value equivalent of 35vh (combat Y offset on desktop)
 * @param viewportHeight - The height of the browser viewport in pixels
 * @returns The pixel value representing 35% of the viewport height
 */
export function calculateCombatYPixels(viewportHeight: number): number {
  return Math.round(viewportHeight * (COMBAT_Y_OFFSET_DESKTOP_VH / 100));
}

/**
 * Get the sprite Y offset percentage for a fighter
 * @param fighterId - The fighter's ID
 * @returns "4%" for economist, "0%" for others
 */
export function getFighterYOffset(fighterId: string): string {
  return fighterId === "economist"
    ? `${FIGHTER_ECONOMIST_Y_OFFSET_PERCENT}%`
    : "0%";
}
