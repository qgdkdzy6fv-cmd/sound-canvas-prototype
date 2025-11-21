import { Mic, MicOff, Trash2, Save, Image, Moon, Sun } from 'lucide-react';

interface ControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
  onGallery: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  fadeEnabled: boolean;
  onFadeEnabledChange: (value: boolean) => void;
  fadeDuration: number;
  onFadeDurationChange: (value: number) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Controls({
  isRecording,
  onToggleRecording,
  onClear,
  onSave,
  onExport,
  onGallery,
  sensitivity,
  onSensitivityChange,
  opacity,
  onOpacityChange,
  fadeEnabled,
  onFadeEnabledChange,
  fadeDuration,
  onFadeDurationChange,
  isDark,
  onToggleTheme
}: ControlsProps) {
  return (
    <div className={`rounded-2xl shadow-xl p-6 ${
      isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Controls</h2>
        <button
          onClick={onToggleTheme}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            isDark ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${
            isDark ? 'translate-x-7' : 'translate-x-0'
          }`}>
            {isDark ? <Moon className="w-3 h-3 text-blue-600" /> : <Sun className="w-3 h-3 text-yellow-500" />}
          </div>
        </button>
      </div>

      <div className="space-y-4">
        <button
          onClick={onToggleRecording}
          className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-3 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/30'
          }`}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              Sensitivity: {Math.round(sensitivity * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={sensitivity}
              onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Fade Away</label>
              <button
                onClick={() => onFadeEnabledChange(!fadeEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  fadeEnabled ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  fadeEnabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {fadeEnabled && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium mb-2">
                  Fade Duration: {fadeDuration}s
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={fadeDuration}
                  onChange={(e) => onFadeDurationChange(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1s</span>
                  <span>10s</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClear}
            className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={onSave}
            className={`py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>

        <button
          onClick={onExport}
          className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all flex items-center justify-center gap-2"
        >
          <Image className="w-4 h-4" />
          Export
        </button>

        <button
          onClick={onGallery}
          className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          <Image className="w-4 h-4" />
          Gallery
        </button>
      </div>
    </div>
  );
}
