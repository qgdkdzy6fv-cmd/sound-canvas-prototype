import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface AudioSensitivityIndicatorProps {
  isActive: boolean;
  sensitivity: number;
  isDark: boolean;
}

export function AudioSensitivityIndicator({
  isActive,
  sensitivity,
  isDark
}: AudioSensitivityIndicatorProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const smoothedLevelRef = useRef(0);
  const peakDecayRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setAudioLevel(0);
      setPeakLevel(0);
      smoothedLevelRef.current = 0;
      peakDecayRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: Uint8Array;
    let source: MediaStreamAudioSourceNode;

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!isActive) return;

          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;

          const normalizedLevel = Math.min((average / 255) * sensitivity * 2, 1);

          const smoothingFactor = 0.15;
          smoothedLevelRef.current +=
            (normalizedLevel - smoothedLevelRef.current) * smoothingFactor;

          const finalLevel = Math.max(0, Math.min(1, smoothedLevelRef.current));
          setAudioLevel(finalLevel);

          if (finalLevel > peakDecayRef.current) {
            peakDecayRef.current = finalLevel;
            setPeakLevel(finalLevel);
          } else {
            peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.005);
            setPeakLevel(peakDecayRef.current);
          }

          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (error) {
        console.error('Failed to access microphone:', error);
      }
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isActive, sensitivity]);

  const getBarColor = (level: number): string => {
    if (level < 0.3) {
      return isDark ? 'bg-green-500' : 'bg-green-600';
    } else if (level < 0.6) {
      return isDark ? 'bg-yellow-500' : 'bg-yellow-600';
    } else if (level < 0.85) {
      return isDark ? 'bg-orange-500' : 'bg-orange-600';
    } else {
      return isDark ? 'bg-red-500' : 'bg-red-600';
    }
  };

  const getBarGradient = (level: number): string => {
    if (level < 0.3) {
      return 'from-green-400 to-green-600';
    } else if (level < 0.6) {
      return 'from-yellow-400 to-yellow-600';
    } else if (level < 0.85) {
      return 'from-orange-400 to-orange-600';
    } else {
      return 'from-red-400 to-red-600';
    }
  };

  const levelPercentage = Math.round(audioLevel * 100);
  const displayLevel = audioLevel.toFixed(2);

  return (
    <div className={`rounded-xl p-4 ${
      isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Mic className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'} animate-pulse`} />
          ) : (
            <MicOff className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          )}
          <h3 className={`text-sm font-semibold ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Audio Level
          </h3>
        </div>
        <span className={`text-xs font-mono font-semibold ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {levelPercentage}%
        </span>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <div className={`h-2 rounded-full overflow-hidden ${
            isDark ? 'bg-gray-700' : 'bg-gray-300'
          }`}>
            <div
              className={`h-full bg-gradient-to-r ${getBarGradient(audioLevel)} transition-all duration-75 ease-out`}
              style={{
                width: `${levelPercentage}%`,
                boxShadow: isActive && audioLevel > 0.1
                  ? `0 0 10px ${audioLevel > 0.6 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`
                  : 'none'
              }}
            />
          </div>

          {isActive && peakLevel > 0.1 && (
            <div
              className={`absolute top-0 w-0.5 h-2 ${
                isDark ? 'bg-white' : 'bg-gray-900'
              } transition-all duration-100`}
              style={{
                left: `${Math.round(peakLevel * 100)}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {[0, 1, 2, 3, 4].map((index) => {
            const segmentThreshold = (index + 1) * 0.2;
            const isActive = audioLevel >= segmentThreshold;
            return (
              <div
                key={index}
                className={`h-12 rounded transition-all duration-100 ${
                  isActive
                    ? `${getBarColor(segmentThreshold)} opacity-100 scale-y-100`
                    : isDark
                    ? 'bg-gray-700 opacity-30 scale-y-75'
                    : 'bg-gray-300 opacity-40 scale-y-75'
                }`}
                style={{
                  transformOrigin: 'bottom'
                }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] font-medium">
          <span className={isDark ? 'text-green-400' : 'text-green-600'}>Quiet</span>
          <span className={isDark ? 'text-yellow-400' : 'text-yellow-600'}>Medium</span>
          <span className={isDark ? 'text-red-400' : 'text-red-600'}>Loud</span>
        </div>

        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex justify-between items-center">
            <span>Level: {displayLevel}</span>
            <span>Peak: {peakLevel.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
