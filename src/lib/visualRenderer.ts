import { SoundMapping } from './storage';
import { AudioFeatures } from './audioProcessor';

export interface RenderOptions {
  globalOpacity: number;
  sensitivity: number;
}

export class VisualRenderer {
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  render(
    mapping: SoundMapping,
    audioFeatures: AudioFeatures,
    options: RenderOptions
  ): void {
    this.animationTime += 0.05;

    const amplitudeScaled = audioFeatures.amplitude * options.sensitivity;
    if (amplitudeScaled < 0.1) return;

    const x = Math.random() * this.ctx.canvas.width;
    const y = Math.random() * this.ctx.canvas.height;

    const size = mapping.sizeBase * (1 + amplitudeScaled * 2);
    const opacity = Math.min(mapping.opacityBase * options.globalOpacity * amplitudeScaled, 1);

    switch (mapping.visualType) {
      case 'geometric':
        this.renderGeometric(mapping, x, y, size, opacity);
        break;
      case 'particle':
        this.renderParticle(mapping, x, y, size, opacity, amplitudeScaled);
        break;
      case 'brush':
        this.renderBrush(mapping, x, y, size, opacity, amplitudeScaled);
        break;
      case 'organic':
        this.renderOrganic(mapping, x, y, size, opacity);
        break;
    }

    this.updateParticles();
  }

  private renderGeometric(
    mapping: SoundMapping,
    x: number,
    y: number,
    size: number,
    opacity: number
  ): void {
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.translate(x, y);

    if (mapping.animationStyle === 'rotate') {
      this.ctx.rotate(this.animationTime);
    }

    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, mapping.colorPrimary);
    gradient.addColorStop(1, mapping.colorSecondary);
    this.ctx.fillStyle = gradient;

    switch (mapping.shapeType) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case 'square':
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
        break;
      case 'triangle':
        this.drawPolygon(3, size);
        break;
      case 'hexagon':
        this.drawPolygon(6, size);
        break;
      case 'star':
        this.drawStar(size);
        break;
      case 'diamond':
        this.drawPolygon(4, size);
        break;
    }

    this.ctx.restore();
  }

  private renderParticle(
    mapping: SoundMapping,
    x: number,
    y: number,
    size: number,
    opacity: number,
    amplitude: number
  ): void {
    const count = Math.floor(5 + amplitude * 15);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = size * (0.5 + Math.random() * 0.5);
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;

      const particle: Particle = {
        x: px,
        y: py,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        size: size * 0.2,
        color: i % 2 === 0 ? mapping.colorPrimary : mapping.colorSecondary,
        life: 1,
        decay: 0.02
      };

      this.particles.push(particle);
    }
  }

  private renderBrush(
    mapping: SoundMapping,
    x: number,
    y: number,
    size: number,
    opacity: number,
    amplitude: number
  ): void {
    this.ctx.save();
    this.ctx.globalAlpha = opacity * 0.6;

    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
    gradient.addColorStop(0, mapping.colorPrimary);
    gradient.addColorStop(0.5, mapping.colorSecondary);
    gradient.addColorStop(1, 'transparent');

    this.ctx.fillStyle = gradient;

    switch (mapping.shapeType) {
      case 'soft':
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case 'textured':
        for (let i = 0; i < 10; i++) {
          const offsetX = (Math.random() - 0.5) * size;
          const offsetY = (Math.random() - 0.5) * size;
          this.ctx.beginPath();
          this.ctx.arc(x + offsetX, y + offsetY, size * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
      case 'splatter':
        const drops = 5 + Math.floor(amplitude * 10);
        for (let i = 0; i < drops; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * size * 2;
          const dropSize = Math.random() * size * 0.5;
          this.ctx.beginPath();
          this.ctx.arc(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            dropSize,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
        break;
      case 'calligraphy':
        this.ctx.strokeStyle = mapping.colorPrimary;
        this.ctx.lineWidth = size * 0.5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.quadraticCurveTo(x, y - size * 0.5, x + size, y);
        this.ctx.stroke();
        break;
      case 'spray':
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * size;
          const dotSize = Math.random() * 2;
          this.ctx.beginPath();
          this.ctx.arc(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            dotSize,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
        break;
    }

    this.ctx.restore();
  }

  private renderOrganic(
    mapping: SoundMapping,
    x: number,
    y: number,
    size: number,
    opacity: number
  ): void {
    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, mapping.colorPrimary);
    gradient.addColorStop(1, mapping.colorSecondary);
    this.ctx.fillStyle = gradient;

    this.ctx.beginPath();

    switch (mapping.shapeType) {
      case 'blob':
        this.drawBlob(x, y, size);
        break;
      case 'wave':
        this.drawWave(x, y, size);
        break;
      case 'tentacle':
        this.drawTentacle(x, y, size);
        break;
      case 'fractal':
        this.drawFractal(x, y, size, 3);
        break;
      case 'flow':
        this.drawFlow(x, y, size);
        break;
    }

    this.ctx.fill();
    this.ctx.restore();
  }

  private drawPolygon(sides: number, size: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawStar(size: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const radius = i % 2 === 0 ? size : size * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawBlob(x: number, y: number, size: number): void {
    const points = 8;
    this.ctx.moveTo(x + size, y);

    for (let i = 0; i <= points; i++) {
      const angle = (Math.PI * 2 * i) / points;
      const variance = 0.7 + Math.random() * 0.6;
      const radius = size * variance;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      const nextAngle = (Math.PI * 2 * (i + 1)) / points;
      const nextRadius = size * (0.7 + Math.random() * 0.6);
      const cpx = x + Math.cos(angle + Math.PI / points) * ((radius + nextRadius) / 2);
      const cpy = y + Math.sin(angle + Math.PI / points) * ((radius + nextRadius) / 2);

      this.ctx.quadraticCurveTo(cpx, cpy, px, py);
    }
  }

  private drawWave(x: number, y: number, size: number): void {
    this.ctx.moveTo(x - size, y);
    for (let i = 0; i <= 20; i++) {
      const px = x - size + (i / 20) * size * 2;
      const py = y + Math.sin(i * 0.5 + this.animationTime) * size * 0.5;
      this.ctx.lineTo(px, py);
    }
    this.ctx.lineTo(x + size, y + size);
    this.ctx.lineTo(x - size, y + size);
  }

  private drawTentacle(x: number, y: number, size: number): void {
    this.ctx.moveTo(x, y);
    let currentX = x;
    let currentY = y;
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const angle = (Math.PI / 4) * Math.sin(i * 0.5 + this.animationTime);
      const segmentLength = size / segments;
      currentX += Math.cos(angle) * segmentLength;
      currentY += Math.sin(angle) * segmentLength;

      const cpX = currentX + Math.cos(angle + Math.PI / 2) * (size / segments) * 0.5;
      const cpY = currentY + Math.sin(angle + Math.PI / 2) * (size / segments) * 0.5;

      this.ctx.quadraticCurveTo(cpX, cpY, currentX, currentY);
    }
  }

  private drawFractal(x: number, y: number, size: number, depth: number): void {
    if (depth === 0 || size < 2) {
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      return;
    }

    const newSize = size * 0.6;
    const angles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];

    angles.forEach(angle => {
      const nx = x + Math.cos(angle) * size * 0.5;
      const ny = y + Math.sin(angle) * size * 0.5;
      this.drawFractal(nx, ny, newSize, depth - 1);
    });
  }

  private drawFlow(x: number, y: number, size: number): void {
    this.ctx.moveTo(x, y);
    for (let i = 0; i < 50; i++) {
      const t = i / 50;
      const angle = t * Math.PI * 4 + this.animationTime;
      const radius = size * (1 - t);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      this.ctx.lineTo(px, py);
    }
  }

  private updateParticles(): void {
    this.ctx.save();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.particles = [];
  }

  getImageData(): string {
    return this.ctx.canvas.toDataURL('image/png');
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  decay: number;
}
