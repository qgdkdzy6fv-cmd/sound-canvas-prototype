import { Artwork, StorageService } from '../lib/storage';
import { Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GalleryProps {
  onClose: () => void;
  isDark: boolean;
  onLoadArtwork: (artwork: Artwork) => void;
}

export function Gallery({ onClose, isDark, onLoadArtwork }: GalleryProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = () => {
    const saved = StorageService.getAllArtworks();
    setArtworks(saved.reverse());
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this artwork?')) {
      StorageService.deleteArtwork(id);
      loadArtworks();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Artwork Gallery</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {artworks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg opacity-60">No saved artworks yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className={`group relative rounded-lg overflow-hidden transition-transform hover:scale-105 cursor-pointer ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                  onClick={() => {
                    onLoadArtwork(artwork);
                    onClose();
                  }}
                >
                  <img
                    src={artwork.canvasData}
                    alt={artwork.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm truncate">
                        {artwork.title}
                      </p>
                      <p className="text-white/70 text-xs">
                        {new Date(artwork.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(artwork.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
