/**
 * Eco Challenge v2.1 - Arcade & Pixel-Art Particle Confetti System
 * High-octane retro pixel explosion and multi-cannon celebration effect
 */

import confetti from 'canvas-confetti';
import { fireRetroPixelConfetti } from './pixelConfetti';

export { fireRetroPixelConfetti };

const ARCADE_ECO_PALETTE = [
  '#2BD97F', // Eco Neon Emerald
  '#FFB443', // Arcade Golden Amber
  '#FFD43F', // Retro Yellow Sun
  '#00F0FF', // Cyber Cyan
  '#A7F3D0', // Mint Glow
  '#EC4899', // Electric Magenta
  '#FFFFFF', // Crisp White Shimmer
];

/**
 * Fires a multi-stage celebratory arcade confetti burst sequence:
 * 1. Retro Pixel-Art Particle Canvas fountain explosion
 * 2. Initial center square confetti pop
 * 3. Left corner cannon
 * 4. Right corner cannon
 * 5. Sparkling micro-gravity rain
 */
export function fireArcadeConfetti(originX?: number, originY?: number): void {
  try {
    // 1. Fire authentic 8-bit / 16-bit retro pixel-art particle explosion
    fireRetroPixelConfetti(originX, originY);

    // 2. Immediate Center Pop with chunky square particles
    confetti({
      particleCount: 80,
      spread: 80,
      origin: {
        x: originX !== undefined ? originX / (window.innerWidth || 1) : 0.5,
        y: originY !== undefined ? originY / (window.innerHeight || 1) : 0.6,
      },
      colors: ARCADE_ECO_PALETTE,
      shapes: ['square'],
      startVelocity: 35,
      gravity: 0.9,
      scalar: 1.15,
      disableForReducedMotion: true,
    });

    // 2. Left Cannon Blast
    setTimeout(() => {
      try {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.75 },
          colors: ARCADE_ECO_PALETTE,
          startVelocity: 45,
          gravity: 1,
          scalar: 0.95,
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback
      }
    }, 150);

    // 3. Right Cannon Blast
    setTimeout(() => {
      try {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.75 },
          colors: ARCADE_ECO_PALETTE,
          startVelocity: 45,
          gravity: 1,
          scalar: 0.95,
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback
      }
    }, 300);

    // 4. Sparkling micro-float particles
    setTimeout(() => {
      try {
        confetti({
          particleCount: 40,
          spread: 110,
          origin: { x: 0.5, y: 0.45 },
          colors: ['#FFD43F', '#2BD97F', '#FFFFFF'],
          startVelocity: 25,
          gravity: 0.75,
          ticks: 200,
          scalar: 1.25,
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback
      }
    }, 450);
  } catch (err) {
    console.warn('Canvas confetti execution skipped:', err);
  }
}

export default fireArcadeConfetti;
