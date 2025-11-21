import { useEffect, useRef, useState } from 'react';
import { AudioProcessor } from './lib/audioProcessor';
import { VisualMapper } from './lib/visualMapper';
import { VisualRenderer } from './lib/visualRenderer';
import { StorageService, Artwork } from './lib/storage';
import { ExportUtils } from './lib/exportUtils';
import { AudioDeviceManager } from './lib/audioDeviceManager';
import { Controls } from './components/Controls';
import { ExportDialog, ExportOptions } from './components/ExportDialog';
import { Gallery } from './components/Gallery';
import { PermissionDialog } from './components/PermissionDialog';
import { AudioDeviceDisplay } from './components/AudioDeviceDisplay';
import { AudioSensitivityIndicator } from './components/AudioSensitivityIndicator';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { Palette } from 'lucide-react';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const visualMapperRef = useRef<VisualMapper | null>(null);
  const visualRendererRef = useRef<VisualRenderer | null>(null);
  const deviceManagerRef = useRef<AudioDeviceManager | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);

  const [isRecording, setIsRecording] = useState(false);
  const [sensitivity, setSensitivity] = useState(1);
  const [opacity, setOpacity] = useState(0.7);
  const [isDark, setIsDark] = useState(true);
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(3);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [showFadeConfirmation, setShowFadeConfirmation] = useState(false);
  const [pendingFadeState, setPendingFadeState] = useState<boolean | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const updateSize = () => {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      };

      updateSize();
      window.addEventListener('resize', updateSize);

      visualRendererRef.current = new VisualRenderer(canvas);
      visualMapperRef.current = new VisualMapper();

      deviceManagerRef.current = new AudioDeviceManager();
      deviceManagerRef.current.initialize().catch(err => {
        console.error('Failed to initialize device manager:', err);
      });

      requestMicrophonePermission();

      return () => {
        window.removeEventListener('resize', updateSize);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioProcessorRef.current) {
          audioProcessorRef.current.stop();
        }
      };
    }
  }, []);

  const requestMicrophonePermission = async () => {
    if (hasPermission) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setShowPermissionDialog(true);
    }
  };

  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false);
    setHasPermission(true);
    await startRecording();

    if (deviceManagerRef.current) {
      await deviceManagerRef.current.refreshDevices();
    }
  };

  const handlePermissionCancelled = () => {
    setShowPermissionDialog(false);
  };

  const startRecording = async () => {
    try {
      setError(null);
      audioProcessorRef.current = new AudioProcessor();
      await audioProcessorRef.current.initialize();
      startTimeRef.current = Date.now();
      isRecordingRef.current = true;
      setIsRecording(true);
      animate();
    } catch (err) {
      setError('Unable to access microphone. Please grant permission and try again.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (audioProcessorRef.current) {
      audioProcessorRef.current.stop();
      audioProcessorRef.current = null;
    }

    if (!fadeEnabled || !visualRendererRef.current?.hasActiveElements()) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };

  const animate = () => {
    if (!visualRendererRef.current || !visualMapperRef.current) {
      return;
    }

    const hasAudio = audioProcessorRef.current && isRecordingRef.current;
    const hasActiveElements = visualRendererRef.current.hasActiveElements();

    if (hasAudio) {
      const audioFeatures = audioProcessorRef.current.getAudioFeatures();

      if (audioFeatures) {
        const mapping = visualMapperRef.current.getOrCreateMapping(audioFeatures);

        visualRendererRef.current.render(mapping, audioFeatures, {
          globalOpacity: opacity,
          sensitivity,
          fadeEnabled,
          fadeDuration: fadeDuration * 1000
        });
      }
    } else if (fadeEnabled && hasActiveElements) {
      const dummyAudioFeatures = {
        amplitude: 0,
        frequency: 0,
        isSilent: true
      };
      const dummyMapping = {
        id: '',
        soundPattern: '',
        visualType: 'geometric' as const,
        colorPrimary: '#000000',
        colorSecondary: '#000000',
        movement: 'float' as const,
        sizeBase: 0,
        shapeType: 'circle' as const
      };

      visualRendererRef.current.render(dummyMapping, dummyAudioFeatures, {
        globalOpacity: opacity,
        sensitivity,
        fadeEnabled,
        fadeDuration: fadeDuration * 1000
      });
    }

    if (isRecordingRef.current || (fadeEnabled && hasActiveElements)) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  const handleClear = () => {
    if (visualRendererRef.current) {
      visualRendererRef.current.clear();
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;

    const artwork: Artwork = {
      id: crypto.randomUUID(),
      title: `Artwork ${new Date().toLocaleDateString()}`,
      canvasData: canvasRef.current.toDataURL('image/png'),
      soundMappingsUsed: [],
      durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
      width: canvasRef.current.width,
      height: canvasRef.current.height,
      createdAt: new Date().toISOString()
    };

    StorageService.saveArtwork(artwork);
    alert('Artwork saved to gallery!');
  };

  const handleExport = async (options: ExportOptions) => {
    if (!canvasRef.current) return;

    try {
      await ExportUtils.exportCanvas(canvasRef.current, options);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export artwork. Please try again.');
    }
  };

  const handleLoadArtwork = (artwork: Artwork) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
    };
    img.src = artwork.canvasData;
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else if (hasPermission) {
      startRecording();
    } else {
      setShowPermissionDialog(true);
    }
  };

  const handleFadeToggle = (newValue: boolean) => {
    setPendingFadeState(newValue);
    setShowFadeConfirmation(true);
  };

  const confirmFadeToggle = () => {
    if (pendingFadeState !== null) {
      if (isRecording) {
        stopRecording();
      }
      handleClear();
      setFadeEnabled(pendingFadeState);
    }
    setShowFadeConfirmation(false);
    setPendingFadeState(null);
  };

  const cancelFadeToggle = () => {
    setShowFadeConfirmation(false);
    setPendingFadeState(null);
  };

  return (
    <div className={`w-full h-full transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-6 h-full flex flex-col">
        <header className={`mb-6 transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Sound Canvas</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Transform sound into visual art
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-hidden">
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden shadow-2xl min-h-0">
            <canvas
              ref={canvasRef}
              className={`w-full h-full ${
                isDark ? 'bg-black' : 'bg-white'
              }`}
            />
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`text-center px-6 py-8 rounded-2xl ${
                  isDark ? 'bg-gray-800/80' : 'bg-white/80'
                } backdrop-blur-sm`}>
                  <Palette className={`w-16 h-16 mx-auto mb-4 ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                  <p className={`text-xl font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Start recording to create art
                  </p>
                  <p className={`text-sm mt-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Make sounds and watch them transform into visuals
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 overflow-y-auto overflow-x-hidden min-h-0">
            <div className="space-y-4 pb-4">
              <Controls
                isRecording={isRecording}
                onToggleRecording={toggleRecording}
                onClear={handleClear}
                onSave={handleSave}
                onExport={() => setShowExportDialog(true)}
                onGallery={() => setShowGallery(true)}
                sensitivity={sensitivity}
                onSensitivityChange={setSensitivity}
                opacity={opacity}
                onOpacityChange={setOpacity}
                fadeEnabled={fadeEnabled}
                onFadeEnabledChange={handleFadeToggle}
                fadeDuration={fadeDuration}
                onFadeDurationChange={setFadeDuration}
                isDark={isDark}
                onToggleTheme={() => setIsDark(!isDark)}
              />
              <AudioSensitivityIndicator
                isActive={isRecording}
                sensitivity={sensitivity}
                isDark={isDark}
              />
              {deviceManagerRef.current && (
                <AudioDeviceDisplay
                  deviceManager={deviceManagerRef.current}
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showExportDialog && (
        <ExportDialog
          onClose={() => setShowExportDialog(false)}
          onExport={handleExport}
          isDark={isDark}
        />
      )}

      {showGallery && (
        <Gallery
          onClose={() => setShowGallery(false)}
          isDark={isDark}
          onLoadArtwork={handleLoadArtwork}
        />
      )}

      {showPermissionDialog && (
        <PermissionDialog
          onRequestPermission={handlePermissionGranted}
          onCancel={handlePermissionCancelled}
          isDark={isDark}
        />
      )}

      <ConfirmationDialog
        isOpen={showFadeConfirmation}
        title="Fade Away Toggle"
        message={pendingFadeState ? "When enabling fade away, the current canvas will be cleared and you will need to press start recording again." : "When disabling fade away, the current canvas will be cleared and you will need to press start recording again."}
        onConfirm={confirmFadeToggle}
        onCancel={cancelFadeToggle}
      />
    </div>
  );
}

export default App;
