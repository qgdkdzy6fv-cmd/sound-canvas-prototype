import { useEffect, useState } from 'react';
import { Mic, Speaker, RefreshCw, AlertCircle } from 'lucide-react';
import { AudioDeviceManager, CurrentDevices } from '../lib/audioDeviceManager';

interface AudioDeviceDisplayProps {
  deviceManager: AudioDeviceManager;
  isDark: boolean;
}

export function AudioDeviceDisplay({ deviceManager, isDark }: AudioDeviceDisplayProps) {
  const [devices, setDevices] = useState<CurrentDevices>({ input: null, output: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateDevices = () => {
      setDevices(deviceManager.getCurrentDevices());
    };

    updateDevices();

    const unsubscribe = deviceManager.onDeviceChange((newDevices) => {
      setDevices(newDevices);
      setError(null);
    });

    return unsubscribe;
  }, [deviceManager]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await deviceManager.refreshDevices();
    } catch (err) {
      setError('Failed to refresh devices');
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const truncateId = (id: string) => {
    if (id === 'default') return 'default';
    return id.length > 16 ? `${id.substring(0, 16)}...` : id;
  };

  return (
    <div className={`rounded-xl p-4 ${
      isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold opacity-70">Audio Devices</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Refresh devices"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className={`mb-3 p-2 rounded-lg flex items-center gap-2 text-xs ${
          isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
        }`}>
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mic className="w-3.5 h-3.5 opacity-70" />
            <span className="text-xs font-medium opacity-70">Input</span>
          </div>
          {devices.input ? (
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="font-medium mb-0.5">{devices.input.label}</div>
              <div className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                ID: {truncateId(devices.input.deviceId)}
              </div>
            </div>
          ) : (
            <div className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No input device available
            </div>
          )}
        </div>

        <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-300'} pt-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Speaker className="w-3.5 h-3.5 opacity-70" />
            <span className="text-xs font-medium opacity-70">Output</span>
          </div>
          {devices.output ? (
            <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="font-medium mb-0.5">{devices.output.label}</div>
              <div className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                ID: {truncateId(devices.output.deviceId)}
              </div>
            </div>
          ) : (
            <div className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No output device available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
