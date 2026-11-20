// utils/helpers.js

/* =========================
   RANDOM HELPERS
========================= */

/**
 * Random number between min and max
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

/**
 * Returns true with given probability
 */
export function chance(probability) {
  return Math.random() < probability;
}


/* =========================
   MATH HELPERS
========================= */

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Distance between two points
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}


/* =========================
   COLLISION HELPERS
========================= */

/**
 * Circle vs Circle collision
 */
export function circleCollision(x1, y1, r1, x2, y2, r2) {
  const dist = distance(x1, y1, x2, y2);
  return dist < r1 + r2;
}

/**
 * Circle vs Rectangle collision
 */
export function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {

  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);

  const dx = cx - closestX;
  const dy = cy - closestY;

  return (dx * dx + dy * dy) < radius * radius;
}


/* =========================
   ARRAY HELPERS
========================= */

/**
 * Get random element from array
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Remove item from array
 */
export function removeItem(array, item) {
  const index = array.indexOf(item);
  if (index !== -1) {
    array.splice(index, 1);
  }
}


/* =========================
   CANVAS HELPERS
========================= */

/**
 * Clear canvas
 */
export function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}


/* =========================
   SCREEN HELPERS
========================= */

/**
 * Wrap object horizontally across screen
 */
export function wrapX(object, width, radius) {

  if (object.x < -radius) {
    object.x = width + radius;
  }

  if (object.x > width + radius) {
    object.x = -radius;
  }
}