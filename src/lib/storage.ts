export interface SoundMapping {
  id: string;
  soundSignature: string;
  frequencyRange: string;
  visualType: 'geometric' | 'particle' | 'brush' | 'organic';
  colorPrimary: string;
  colorSecondary: string;
  shapeType: string;
  sizeBase: number;
  opacityBase: number;
  animationStyle: string;
  createdAt: string;
}

export interface Artwork {
  id: string;
  title: string;
  canvasData: string;
  soundMappingsUsed: string[];
  durationSeconds: number;
  width: number;
  height: number;
  createdAt: string;
}

const SOUND_MAPPINGS_KEY = 'soundVisual_mappings';
const ARTWORKS_KEY = 'soundVisual_artworks';

export const StorageService = {
  getSoundMapping(signature: string): SoundMapping | null {
    const mappings = this.getAllSoundMappings();
    return mappings.find(m => m.soundSignature === signature) || null;
  },

  getAllSoundMappings(): SoundMapping[] {
    const data = localStorage.getItem(SOUND_MAPPINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveSoundMapping(mapping: SoundMapping): void {
    const mappings = this.getAllSoundMappings();
    const existingIndex = mappings.findIndex(m => m.soundSignature === mapping.soundSignature);

    if (existingIndex >= 0) {
      mappings[existingIndex] = mapping;
    } else {
      mappings.push(mapping);
    }

    localStorage.setItem(SOUND_MAPPINGS_KEY, JSON.stringify(mappings));
  },

  saveArtwork(artwork: Artwork): void {
    const artworks = this.getAllArtworks();
    artworks.push(artwork);
    localStorage.setItem(ARTWORKS_KEY, JSON.stringify(artworks));
  },

  getAllArtworks(): Artwork[] {
    const data = localStorage.getItem(ARTWORKS_KEY);
    return data ? JSON.parse(data) : [];
  },

  deleteArtwork(id: string): void {
    const artworks = this.getAllArtworks().filter(a => a.id !== id);
    localStorage.setItem(ARTWORKS_KEY, JSON.stringify(artworks));
  },

  clearAllMappings(): void {
    localStorage.removeItem(SOUND_MAPPINGS_KEY);
  }
};
