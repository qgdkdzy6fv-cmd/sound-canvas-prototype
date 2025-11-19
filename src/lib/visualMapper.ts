import { SoundMapping, StorageService } from './storage';
import { AudioFeatures } from './audioProcessor';

const VISUAL_TYPES = ['geometric', 'particle', 'brush', 'organic'] as const;
const SHAPE_TYPES = {
  geometric: ['circle', 'square', 'triangle', 'hexagon', 'star', 'diamond'],
  particle: ['dots', 'sparkles', 'burst', 'trail', 'spiral'],
  brush: ['soft', 'textured', 'splatter', 'calligraphy', 'spray'],
  organic: ['blob', 'wave', 'tentacle', 'fractal', 'flow']
};
const ANIMATION_STYLES = ['pulse', 'rotate', 'expand', 'fade', 'oscillate', 'drift'];

export class VisualMapper {
  private mappingCache: Map<string, SoundMapping> = new Map();

  constructor() {
    this.loadExistingMappings();
  }

  private loadExistingMappings(): void {
    const mappings = StorageService.getAllSoundMappings();
    mappings.forEach(mapping => {
      this.mappingCache.set(mapping.soundSignature, mapping);
    });
  }

  getOrCreateMapping(audioFeatures: AudioFeatures): SoundMapping {
    const { signature } = audioFeatures;

    if (this.mappingCache.has(signature)) {
      return this.mappingCache.get(signature)!;
    }

    const newMapping = this.createMapping(audioFeatures);
    this.mappingCache.set(signature, newMapping);
    StorageService.saveSoundMapping(newMapping);

    return newMapping;
  }

  private createMapping(audioFeatures: AudioFeatures): SoundMapping {
    const seed = this.hashSignature(audioFeatures.signature);
    const rng = this.createSeededRandom(seed);

    const visualType = VISUAL_TYPES[Math.floor(rng() * VISUAL_TYPES.length)];
    const shapeType = SHAPE_TYPES[visualType][Math.floor(rng() * SHAPE_TYPES[visualType].length)];
    const animationStyle = ANIMATION_STYLES[Math.floor(rng() * ANIMATION_STYLES.length)];

    const colorPrimary = this.generateColor(rng, audioFeatures);
    const colorSecondary = this.generateComplementaryColor(colorPrimary, rng);

    const frequencyNorm = Math.min(audioFeatures.frequency / 2000, 1);
    const sizeBase = 10 + (frequencyNorm * 40) + (rng() * 20);
    const opacityBase = 0.5 + (rng() * 0.3);

    return {
      id: crypto.randomUUID(),
      soundSignature: audioFeatures.signature,
      frequencyRange: this.getFrequencyRange(audioFeatures.frequency),
      visualType,
      colorPrimary,
      colorSecondary,
      shapeType,
      sizeBase,
      opacityBase,
      animationStyle,
      createdAt: new Date().toISOString()
    };
  }

  private hashSignature(signature: string): number {
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private createSeededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  private generateColor(rng: () => number, audioFeatures: AudioFeatures): string {
    const { lowFreq, midFreq, highFreq } = audioFeatures;

    const hue = Math.floor(rng() * 360);
    const saturation = 60 + Math.floor(rng() * 40);

    let lightness = 50;
    if (lowFreq > midFreq && lowFreq > highFreq) {
      lightness = 35 + Math.floor(rng() * 25);
    } else if (highFreq > lowFreq && highFreq > midFreq) {
      lightness = 60 + Math.floor(rng() * 25);
    } else {
      lightness = 45 + Math.floor(rng() * 20);
    }

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  private generateComplementaryColor(primaryColor: string, rng: () => number): string {
    const hueMatch = primaryColor.match(/hsl\((\d+)/);
    if (!hueMatch) return primaryColor;

    const primaryHue = parseInt(hueMatch[1]);
    const hueOffset = 150 + Math.floor(rng() * 60);
    const newHue = (primaryHue + hueOffset) % 360;

    const satMatch = primaryColor.match(/hsl\(\d+,\s*(\d+)%/);
    const lightMatch = primaryColor.match(/hsl\(\d+,\s*\d+%,\s*(\d+)%/);

    const saturation = satMatch ? parseInt(satMatch[1]) : 70;
    const lightness = lightMatch ? parseInt(lightMatch[1]) : 50;

    return `hsl(${newHue}, ${saturation}%, ${lightness}%)`;
  }

  private getFrequencyRange(freq: number): string {
    if (freq < 250) return 'sub-bass';
    if (freq < 500) return 'bass';
    if (freq < 2000) return 'midrange';
    if (freq < 6000) return 'upper-mid';
    return 'treble';
  }

  clearCache(): void {
    this.mappingCache.clear();
    StorageService.clearAllMappings();
  }
}
