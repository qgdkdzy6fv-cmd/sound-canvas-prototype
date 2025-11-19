import { useState } from 'react';
import { X, Download } from 'lucide-react';

interface ExportDialogProps {
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isDark: boolean;
}

export interface ExportOptions {
  colorSpace: 'RGB' | 'CMYK';
  format: 'PNG' | 'JPEG' | 'PDF';
  quality: number;
  filename: string;
}

export function ExportDialog({ onClose, onExport, isDark }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    colorSpace: 'RGB',
    format: 'PNG',
    quality: 95,
    filename: `artwork-${Date.now()}`
  });

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } p-6`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Export Artwork</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Filename</label>
            <input
              type="text"
              value={options.filename}
              onChange={(e) => setOptions({ ...options, filename: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="my-artwork"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Color Space</label>
            <div className="grid grid-cols-2 gap-3">
              {(['RGB', 'CMYK'] as const).map((space) => (
                <button
                  key={space}
                  onClick={() => setOptions({ ...options, colorSpace: space })}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    options.colorSpace === space
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {space}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2 opacity-70">
              {options.colorSpace === 'RGB' ? 'Best for digital use' : 'Best for print'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <div className="grid grid-cols-3 gap-3">
              {(['PNG', 'JPEG', 'PDF'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setOptions({ ...options, format })}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    options.format === format
                      ? isDark
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Quality: {options.quality}%
            </label>
            <input
              type="range"
              min="60"
              max="100"
              value={options.quality}
              onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs opacity-70 mt-1">
              <span>Lower size</span>
              <span>Higher quality</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
