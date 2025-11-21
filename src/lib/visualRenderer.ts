import { SoundMapping } from './storage';
import { AudioFeatures } from './audioProcessor';

export interface RenderOptions {
  globalOpacity: number;
  sensitivity: number;
  fadeEnabled: boolean;
  fadeDuration: number;
}

interface AnimatedShape {
  type: 'geometric' | 'brush' | 'organic';
  mapping: SoundMapping;
  x: number;
  y: number;
  baseSize: number;
  baseOpacity: number;
  startTime: number;
  duration: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  scaleSpeed: number;
  vx: number;
  vy: number;
  growthRate: number;
  opacityPhase: number;
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
  startTime: number;
  duration: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  maxScale: number;
}

export class VisualRenderer {
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animatedShapes: AnimatedShape[] = [];
  private animationTime = 0;
  private lastFrameTime = 0;
  private currentOptions: RenderOptions = {
    globalOpacity: 0.7,
    sensitivity: 1,
    fadeEnabled: false,
    fadeDuration: 3000
  };

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.lastFrameTime = performance.now();
  }

  render(
    mapping: SoundMapping,
    audioFeatures: AudioFeatures,
    options: RenderOptions
  ): void {
    this.currentOptions = options;
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    this.animationTime += deltaTime;

    const amplitudeScaled = audioFeatures.amplitude * options.sensitivity;
    const threshold = 0.02;

    if (amplitudeScaled < threshold) {
      this.updateAnimatedElements(now);
      return;
    }

    const x = Math.random() * this.ctx.canvas.width;
    const y = Math.random() * this.ctx.canvas.height;

    const size = Math.max(mapping.sizeBase * (1 + amplitudeScaled * 3), 40);
    const opacity = 0.8;

    switch (mapping.visualType) {
      case 'geometric':
        this.createAnimatedShape('geometric', mapping, x, y, size, opacity);
        break;
      case 'particle':
        this.createAnimatedParticles(mapping, x, y, size, opacity, amplitudeScaled, now);
        break;
      case 'brush':
        this.createAnimatedShape('brush', mapping, x, y, size, opacity);
        break;
      case 'organic':
        this.createAnimatedShape('organic', mapping, x, y, size, opacity);
        break;
    }

    this.updateAnimatedElements(now);
  }

  private randomDuration(): number {
    return 1000 + Math.random() * 2000;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private createAnimatedShape(
    type: 'geometric' | 'brush' | 'organic',
    mapping: SoundMapping,
    x: number,
    y: number,
    size: number,
    opacity: number
  ): void {
    const duration = this.randomDuration();
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 40;

    const shape: AnimatedShape = {
      type,
      mapping,
      x,
      y,
      baseSize: size,
      baseOpacity: opacity,
      startTime: performance.now(),
      duration,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
      scale: 1.2,
      scaleSpeed: 0.5 + Math.random() * 1,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      growthRate: 0.3 + Math.random() * 0.7,
      opacityPhase: Math.random() * Math.PI * 2
    };

    console.log('AnimatedShape created:', shape);
    this.animatedShapes.push(shape);
    console.log('Total animated shapes:', this.animatedShapes.length);
  }

  private createAnimatedParticles(
    mapping: SoundMapping,
    x: number,
    y: number,
    size: number,
    opacity: number,
    amplitude: number,
    now: number
  ): void {
    const count = Math.floor(5 + amplitude * 15);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const distance = size * (0.5 + Math.random() * 0.5);
      const speed = 50 + Math.random() * 100;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;

      const particle: Particle = {
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size * 0.2,
        color: i % 2 === 0 ? mapping.colorPrimary : mapping.colorSecondary,
        life: 1,
        decay: 0.015,
        startTime: now,
        duration: this.randomDuration(),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 4,
        scale: 0.5,
        maxScale: 1 + Math.random() * 1.5
      };

      this.particles.push(particle);
    }
  }

  private updateAnimatedElements(now: number): void {
    this.updateAnimatedShapes(now);
    this.updateParticles(now);
  }

  private updateAnimatedShapes(now: number): void {
    for (let i = this.animatedShapes.length - 1; i >= 0; i--) {
      const shape = this.animatedShapes[i];
      const elapsed = now - shape.startTime;

      if (this.currentOptions.fadeEnabled) {
        const fadeStartTime = this.currentOptions.fadeDuration;
        const fadeDuration = 1500;

        if (elapsed > fadeStartTime + fadeDuration) {
          this.animatedShapes.splice(i, 1);
          continue;
        }

        const animProgress = Math.min(elapsed / 1000, 1);
        const easedProgress = this.easeInOutCubic(animProgress);

        shape.x += shape.vx * (1 / 60);
        shape.y += shape.vy * (1 / 60);
        shape.rotation += shape.rotationSpeed * (1 / 60);
        shape.scale = 0.5 + easedProgress * shape.scaleSpeed;

        let currentOpacity = shape.baseOpacity;

        if (elapsed > fadeStartTime) {
          const fadeProgress = (elapsed - fadeStartTime) / fadeDuration;
          currentOpacity = shape.baseOpacity * (1 - fadeProgress);
        }

        const currentSize = shape.baseSize * shape.scale;
        this.renderShape(shape, currentSize, currentOpacity);
      } else {
        const progress = Math.min(elapsed / shape.duration, 1);

        if (progress >= 1) {
          const easedProgress = 1;
          shape.scale = 0.5 + easedProgress * shape.scaleSpeed;
          const currentSize = shape.baseSize * shape.scale;
          const currentOpacity = shape.baseOpacity;

          this.renderShape(shape, currentSize, currentOpacity);
        } else {
          const easedProgress = this.easeInOutCubic(progress);

          shape.x += shape.vx * (1 / 60);
          shape.y += shape.vy * (1 / 60);
          shape.rotation += shape.rotationSpeed * (1 / 60);
          shape.scale = 0.5 + easedProgress * shape.scaleSpeed;

          const opacityMod = Math.sin(this.animationTime * 2 + shape.opacityPhase) * 0.2 + 0.8;
          const currentOpacity = shape.baseOpacity * (1 - progress * 0.3) * opacityMod;
          const currentSize = shape.baseSize * shape.scale;

          this.renderShape(shape, currentSize, currentOpacity);
        }
      }
    }
  }

  private renderShape(shape: AnimatedShape, size: number, opacity: number): void {
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.translate(shape.x, shape.y);
    this.ctx.rotate(shape.rotation);

    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, shape.mapping.colorPrimary);
    gradient.addColorStop(1, shape.mapping.colorSecondary);
    this.ctx.fillStyle = gradient;

    switch (shape.type) {
      case 'geometric':
        this.drawGeometricShape(shape.mapping.shapeType, size);
        break;
      case 'brush':
        this.drawBrushShape(shape.mapping.shapeType, size, 0, 0);
        break;
      case 'organic':
        this.drawOrganicShape(shape.mapping.shapeType, 0, 0, size);
        break;
    }

    this.ctx.restore();
  }

  private drawGeometricShape(shapeType: string, size: number): void {
    this.ctx.beginPath();
    switch (shapeType) {
      case 'circle':
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        break;
      case 'square':
        this.ctx.rect(-size, -size, size * 2, size * 2);
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
    this.ctx.fill();
  }

  private drawBrushShape(shapeType: string, size: number, x: number, y: number): void {
    this.ctx.globalAlpha *= 0.6;

    switch (shapeType) {
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
        for (let i = 0; i < 8; i++) {
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
        this.ctx.strokeStyle = this.ctx.fillStyle as string;
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
  }

  private drawOrganicShape(shapeType: string, x: number, y: number, size: number): void {
    this.ctx.beginPath();

    switch (shapeType) {
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
  }

  private updateParticles(now: number): void {
    this.ctx.save();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const elapsed = now - p.startTime;

      if (this.currentOptions.fadeEnabled) {
        const fadeStartTime = this.currentOptions.fadeDuration;
        const fadeDuration = 1500;

        if (elapsed > fadeStartTime + fadeDuration) {
          this.particles.splice(i, 1);
          continue;
        }

        const animProgress = Math.min(elapsed / 1000, 1);
        const easedProgress = this.easeOutQuad(animProgress);

        p.x += p.vx * (1 / 60);
        p.y += p.vy * (1 / 60);
        p.rotation += p.rotationSpeed * (1 / 60);
        p.scale = 0.5 + easedProgress * (p.maxScale - 0.5);

        let currentOpacity = 1;
        if (elapsed > fadeStartTime) {
          const fadeProgress = (elapsed - fadeStartTime) / fadeDuration;
          currentOpacity = 1 - fadeProgress;
        }

        this.ctx.save();
        this.ctx.globalAlpha = currentOpacity;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * p.scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else {
        const progress = Math.min(elapsed / p.duration, 1);

        if (progress >= 1) {
          const easedProgress = 1;
          p.scale = 0.5 + easedProgress * (p.maxScale - 0.5);

          this.ctx.save();
          this.ctx.globalAlpha = 1;
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(p.rotation);
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size * p.scale, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        } else {
          const easedProgress = this.easeOutQuad(progress);

          p.x += p.vx * (1 / 60);
          p.y += p.vy * (1 / 60);
          p.rotation += p.rotationSpeed * (1 / 60);
          p.scale = 0.5 + easedProgress * (p.maxScale - 0.5);
          p.life = 1 - progress;

          this.ctx.save();
          this.ctx.globalAlpha = p.life;
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(p.rotation);
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size * p.scale, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }
    }

    this.ctx.restore();
  }

  private drawPolygon(sides: number, size: number): void {
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
  }

  private drawStar(size: number): void {
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
  }

  private drawBlob(x: number, y: number, size: number): void {
    const points = 8;
    this.ctx.moveTo(x + size, y);

    for (let i = 0; i <= points; i++) {
      const angle = (Math.PI * 2 * i) / points;
      const variance = 0.7 + Math.sin(this.animationTime * 2 + i) * 0.3;
      const radius = size * variance;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      const nextAngle = (Math.PI * 2 * (i + 1)) / points;
      const nextRadius = size * (0.7 + Math.sin(this.animationTime * 2 + i + 1) * 0.3);
      const cpx = x + Math.cos(angle + Math.PI / points) * ((radius + nextRadius) / 2);
      const cpy = y + Math.sin(angle + Math.PI / points) * ((radius + nextRadius) / 2);

      this.ctx.quadraticCurveTo(cpx, cpy, px, py);
    }
  }

  private drawWave(x: number, y: number, size: number): void {
    this.ctx.moveTo(x - size, y);
    for (let i = 0; i <= 20; i++) {
      const px = x - size + (i / 20) * size * 2;
      const py = y + Math.sin(i * 0.5 + this.animationTime * 3) * size * 0.5;
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
      const angle = (Math.PI / 4) * Math.sin(i * 0.5 + this.animationTime * 2);
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
      const angle = t * Math.PI * 4 + this.animationTime * 2;
      const radius = size * (1 - t);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      this.ctx.lineTo(px, py);
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.particles = [];
    this.animatedShapes = [];
  }

  getImageData(): string {
    return this.ctx.canvas.toDataURL('image/png');
  }
}
