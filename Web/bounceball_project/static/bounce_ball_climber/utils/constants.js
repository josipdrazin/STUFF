// utils/constants.js

/* =========================
   PHYSICS
========================= */

export const GRAVITY = 0.6;


/* =========================
   BALL
========================= */

export const BALL_RADIUS = 15;
export const BASE_BOUNCE = 14;

export const BOOST_MULTIPLIER = 1.5;


/* =========================
   PLATFORMS
========================= */

export const PLATFORM_WIDTH = 120;
export const PLATFORM_HEIGHT = 12;
export const PLATFORM_VERTICAL_GAP = 140;

export const MAX_PLATFORMS = 20;


/* =========================
   COLLECTIBLES
========================= */

export const PIE_CHANCE = 0.5;
export const PIE_RADIUS = 10;

export const PIE_SCORE_VALUE = 3;


/* =========================
   ENERGY
========================= */

export const MAX_ENERGY = 100;

export const ENERGY_REGEN_RATE = 1;      // per second
export const ENERGY_BOOST_COST = 30;

export const ENERGY_PLATFORM_REWARD = 5;


/* =========================
   CAMERA
========================= */

export const CAMERA_TRIGGER_RATIO = 1 / 3;
// camera starts scrolling when ball reaches top 1/3 of screen


/* =========================
   WORLD LIMITS
========================= */

export const PLATFORM_CLEANUP_OFFSET = 100;
export const COLLECTIBLE_CLEANUP_OFFSET = 50;

export const GAME_OVER_OFFSET = 200;


/* =========================
   BACKGROUND
========================= */

export const STAR_COUNT = 100;

export const SPACE_HEIGHT = 9000;
export const PLANET_HEIGHT = 15000;


/* =========================
   UI
========================= */

export const UI_FONT = "20px Arial";
export const UI_BIG_FONT = "48px Arial";

export const ENERGY_BAR_WIDTH = 200;
export const ENERGY_BAR_HEIGHT = 16;


/* =========================
   GAME STATES
========================= */

export const GAME_STATE = {
    RUNNING: "running",
    PAUSED: "paused",
    GAMEOVER: "gameover"
};

