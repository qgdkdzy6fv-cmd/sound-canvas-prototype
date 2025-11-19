import { Mic, AlertCircle } from 'lucide-react';

interface PermissionDialogProps {
  onRequestPermission: () => void;
  onCancel: () => void;
  isDark: boolean;
}

export function PermissionDialog({ onRequestPermission, onCancel, isDark }: PermissionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      } p-6`}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-blue-500" />
          </div>

          <h2 className="text-2xl font-bold mb-3">Microphone Access Required</h2>

          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Sound Canvas needs access to your microphone to capture audio and transform it into visual art.
          </p>

          <div className={`w-full p-4 rounded-lg mb-6 ${
            isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex gap-3 text-left">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div className="text-sm">
                <p className={`font-medium mb-1 ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  Your privacy is protected
                </p>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Audio is processed locally in your browser. No recordings are stored or transmitted.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onRequestPermission}
              className="flex-1 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-all flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Allow Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
