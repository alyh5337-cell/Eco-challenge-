/**
 * Eco Challenge v2.1 - Retro Pixel-Art Particle Confetti Engine
 * Generates authentic 8-bit/16-bit arcade particle explosions with chunky pixel shapes,
 * stepped sprite axis flips, pixel borders, and vibrant 90s retro palettes.
 */

interface PixelParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  borderColor: string;
  type: 'pixel_cube' | 'pixel_coin' | 'pixel_leaf' | 'pixel_star' | 'pixel_diamond';
  flipAngle: number;
  flipSpeed: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  life: number;
  maxLife: number;
}

const RETRO_PIXEL_PALETTE = [
  { fill: '#2BD97F', border: '#064e3b' }, // Eco Emerald
  { fill: '#FFD43F', border: '#78350f' }, // Retro Arcade Gold
  { fill: '#FFB443', border: '#7c2d12' }, // Neon Amber
  { fill: '#00F0FF', border: '#0e7490' }, // Cyber Cyan
  { fill: '#FF5A5F', border: '#881337' }, // Pixel Coral Ruby
  { fill: '#A7F3D0', border: '#065f46' }, // Mint Spark
  { fill: '#EC4899', border: '#831843' }, // Electric Magenta
  { fill: '#FFFFFF', border: '#1e293b' }, // Shimmer White
];

let activeCanvas: HTMLCanvasElement | null = null;
let animationFrameId: number | null = null;
let particles: PixelParticle[] = [];

function createPixelParticle(originX: number, originY: number): PixelParticle {
  const palette = RETRO_PIXEL_PALETTE[Math.floor(Math.random() * RETRO_PIXEL_PALETTE.length)];
  const angle = (Math.random() * Math.PI) + Math.PI; // Erupt upward
  const speed = 7 + Math.random() * 14;

  const types: ('pixel_cube' | 'pixel_coin' | 'pixel_leaf' | 'pixel_star' | 'pixel_diamond')[] = [
    'pixel_cube',
    'pixel_cube',
    'pixel_coin',
    'pixel_leaf',
    'pixel_star',
    'pixel_diamond',
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  // Size snapped to retro pixel multiples (8, 10, 12, 14, 16px)
  const sizes = [10, 12, 14, 16];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const maxLife = 90 + Math.floor(Math.random() * 45);

  return {
    x: originX,
    y: originY,
    vx: Math.cos(angle) * (speed * 0.9) + (Math.random() - 0.5) * 6,
    vy: Math.sin(angle) * speed,
    size,
    color: palette.fill,
    borderColor: palette.border,
    type,
    flipAngle: Math.random() * Math.PI * 2,
    flipSpeed: 0.08 + Math.random() * 0.12,
    rotation: Math.floor(Math.random() * 4) * (Math.PI / 2), // 90-degree stepped angles
    rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.04),
    opacity: 1,
    life: maxLife,
    maxLife,
  };
}

function drawPixelArtShape(ctx: CanvasRenderingContext2D, p: PixelParticle): void {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Stepped 2D sprite horizontal flipping to simulate retro 90s tile spinning
  const scaleX = Math.cos(p.flipAngle);
  ctx.scale(scaleX, 1);
  ctx.rotate(p.rotation);

  ctx.globalAlpha = p.opacity;

  const half = p.size / 2;
  const pSize = Math.max(3, Math.floor(p.size / 4)); // Single virtual pixel size

  if (p.type === 'pixel_cube') {
    // 8-bit Pixel Square with chunky border & highlight pixel
    ctx.fillStyle = p.borderColor;
    ctx.fillRect(-half, -half, p.size, p.size);

    ctx.fillStyle = p.color;
    ctx.fillRect(-half + 2, -half + 2, p.size - 4, p.size - 4);

    // Inner top-left highlight pixel
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-half + 2, -half + 2, pSize, pSize);
  } else if (p.type === 'pixel_coin') {
    // Retro 8-bit Arcade Coin (stepped circle)
    ctx.fillStyle = p.borderColor;
    ctx.fillRect(-half + pSize, -half, p.size - pSize * 2, p.size);
    ctx.fillRect(-half, -half + pSize, p.size, p.size - pSize * 2);

    ctx.fillStyle = p.color;
    ctx.fillRect(-half + pSize, -half + 2, p.size - pSize * 2, p.size - 4);
    ctx.fillRect(-half + 2, -half + pSize, p.size - 4, p.size - pSize * 2);

    // Center pixel coin symbol
    ctx.fillStyle = p.borderColor;
    ctx.fillRect(-pSize / 2, -pSize, pSize, pSize * 2);
  } else if (p.type === 'pixel_leaf') {
    // 8-bit Green Leaf
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-half + pSize, -half, p.size - pSize, p.size - pSize);

    ctx.fillStyle = '#2BD97F';
    ctx.fillRect(-half + pSize + 2, -half + 2, p.size - pSize - 4, p.size - pSize - 4);

    ctx.fillStyle = '#A7F3D0';
    ctx.fillRect(-half + pSize + 2, -half + 2, pSize, pSize);
  } else if (p.type === 'pixel_star') {
    // 8-bit Pixel Cross / Sparkle
    ctx.fillStyle = p.borderColor;
    ctx.fillRect(-half, -pSize, p.size, pSize * 2);
    ctx.fillRect(-pSize, -half, pSize * 2, p.size);

    ctx.fillStyle = p.color;
    ctx.fillRect(-half + 2, -pSize + 1, p.size - 4, pSize * 2 - 2);
    ctx.fillRect(-pSize + 1, -half + 2, pSize * 2 - 2, p.size - 4);

    // Center white gleam
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-pSize / 2, -pSize / 2, pSize, pSize);
  } else {
    // Pixel Diamond
    ctx.fillStyle = p.borderColor;
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(half, 0);
    ctx.lineTo(0, half);
    ctx.lineTo(-half, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -half + 3);
    ctx.lineTo(half - 3, 0);
    ctx.lineTo(0, half - 3);
    ctx.lineTo(-half + 3, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function updateAndRender(): void {
  if (!activeCanvas) return;
  const ctx = activeCanvas.getContext('2d');
  if (!ctx) return;

  // Clear with crisp transparent background
  ctx.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
  ctx.imageSmoothingEnabled = false;

  const gravity = 0.32;
  const drag = 0.985;

  particles.forEach((p) => {
    p.vx *= drag;
    p.vy = p.vy * drag + gravity;
    p.x += p.vx;
    p.y += p.vy;

    p.flipAngle += p.flipSpeed;
    p.rotation += p.rotationSpeed;
    p.life -= 1;

    // Fade out during last 20% of life
    if (p.life < p.maxLife * 0.25) {
      p.opacity = p.life / (p.maxLife * 0.25);
    }

    drawPixelArtShape(ctx, p);
  });

  // Filter dead particles
  particles = particles.filter((p) => p.life > 0 && p.y < (activeCanvas?.height || 2000) + 50);

  if (particles.length > 0) {
    animationFrameId = requestAnimationFrame(updateAndRender);
  } else {
    cleanupCanvas();
  }
}

function cleanupCanvas(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (activeCanvas && activeCanvas.parentNode) {
    activeCanvas.parentNode.removeChild(activeCanvas);
    activeCanvas = null;
  }
  particles = [];
}

/**
 * Triggers a full-screen retro pixel-art particle explosion.
 * Can be fired from a specific target coordinate or centers on the screen.
 */
export function fireRetroPixelConfetti(originX?: number, originY?: number): void {
  if (typeof window === 'undefined') return;

  // Ensure canvas setup
  if (!activeCanvas) {
    activeCanvas = document.createElement('canvas');
    activeCanvas.id = 'retro-pixel-confetti-canvas';
    activeCanvas.style.position = 'fixed';
    activeCanvas.style.inset = '0';
    activeCanvas.style.width = '100vw';
    activeCanvas.style.height = '100vh';
    activeCanvas.style.pointerEvents = 'none';
    activeCanvas.style.zIndex = '9999';
    activeCanvas.style.imageRendering = 'pixelated';
    document.body.appendChild(activeCanvas);
  }

  const dpr = window.devicePixelRatio || 1;
  activeCanvas.width = window.innerWidth * dpr;
  activeCanvas.height = window.innerHeight * dpr;

  const ctx = activeCanvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
  }

  const posX = originX ?? window.innerWidth * 0.5;
  const posY = originY ?? window.innerHeight * 0.55;

  // Generate 85-110 chunky retro pixel particles
  const particleCount = 95;
  for (let i = 0; i < particleCount; i++) {
    particles.push(createPixelParticle(posX, posY));
  }

  // Also spawn slight secondary left & right mini-fountains
  for (let i = 0; i < 25; i++) {
    particles.push(createPixelParticle(posX - 40, posY + 20));
    particles.push(createPixelParticle(posX + 40, posY + 20));
  }

  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(updateAndRender);
  }
}

export default fireRetroPixelConfetti;
