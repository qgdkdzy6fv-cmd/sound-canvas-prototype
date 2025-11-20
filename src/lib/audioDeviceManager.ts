export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId?: string;
}

export interface CurrentDevices {
  input: AudioDeviceInfo | null;
  output: AudioDeviceInfo | null;
}

export class AudioDeviceManager {
  private currentInputDevice: AudioDeviceInfo | null = null;
  private currentOutputDevice: AudioDeviceInfo | null = null;
  private deviceChangeListeners: Array<(devices: CurrentDevices) => void> = [];

  async initialize(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('Media devices API not supported');
    }

    navigator.mediaDevices.addEventListener('devicechange', () => {
      this.refreshDevices();
    });

    await this.refreshDevices();
  }

  async refreshDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputDevices = devices.filter(d => d.kind === 'audioinput');
      const outputDevices = devices.filter(d => d.kind === 'audiooutput');

      if (inputDevices.length > 0) {
        const defaultInput = inputDevices.find(d => d.deviceId === 'default') || inputDevices[0];
        this.currentInputDevice = {
          deviceId: defaultInput.deviceId,
          label: defaultInput.label || 'Default Microphone',
          kind: 'audioinput',
          groupId: defaultInput.groupId
        };
      } else {
        this.currentInputDevice = null;
      }

      if (outputDevices.length > 0) {
        const defaultOutput = outputDevices.find(d => d.deviceId === 'default') || outputDevices[0];
        this.currentOutputDevice = {
          deviceId: defaultOutput.deviceId,
          label: defaultOutput.label || 'Default Speakers',
          kind: 'audiooutput',
          groupId: defaultOutput.groupId
        };
      } else {
        this.currentOutputDevice = null;
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Error refreshing devices:', error);
      this.currentInputDevice = null;
      this.currentOutputDevice = null;
      this.notifyListeners();
    }
  }

  async getAllDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audioinput' || d.kind === 'audiooutput');
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  async getInputDevices(): Promise<AudioDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.substring(0, 8)}`,
          kind: 'audioinput' as const,
          groupId: d.groupId
        }));
    } catch (error) {
      console.error('Error getting input devices:', error);
      return [];
    }
  }

  async getOutputDevices(): Promise<AudioDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || `Speakers ${d.deviceId.substring(0, 8)}`,
          kind: 'audiooutput' as const,
          groupId: d.groupId
        }));
    } catch (error) {
      console.error('Error getting output devices:', error);
      return [];
    }
  }

  getCurrentDevices(): CurrentDevices {
    return {
      input: this.currentInputDevice,
      output: this.currentOutputDevice
    };
  }

  getInputDevice(): AudioDeviceInfo | null {
    return this.currentInputDevice;
  }

  getOutputDevice(): AudioDeviceInfo | null {
    return this.currentOutputDevice;
  }

  onDeviceChange(callback: (devices: CurrentDevices) => void): () => void {
    this.deviceChangeListeners.push(callback);

    return () => {
      this.deviceChangeListeners = this.deviceChangeListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    const devices = this.getCurrentDevices();
    this.deviceChangeListeners.forEach(listener => listener(devices));
  }

  async setInputDevice(deviceId: string): Promise<void> {
    const devices = await this.getInputDevices();
    const device = devices.find(d => d.deviceId === deviceId);

    if (device) {
      this.currentInputDevice = device;
      this.notifyListeners();
    } else {
      throw new Error('Input device not found');
    }
  }

  async setOutputDevice(deviceId: string): Promise<void> {
    const devices = await this.getOutputDevices();
    const device = devices.find(d => d.deviceId === deviceId);

    if (device) {
      this.currentOutputDevice = device;
      this.notifyListeners();
    } else {
      throw new Error('Output device not found');
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      await this.refreshDevices();
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      return false;
    }
  }

  formatDeviceInfo(device: AudioDeviceInfo | null): string {
    if (!device) {
      return 'No device available';
    }

    const shortId = device.deviceId.substring(0, 12);
    return `${device.label} (ID: ${shortId}...)`;
  }

  getDeviceSummary(): string {
    const input = this.formatDeviceInfo(this.currentInputDevice);
    const output = this.formatDeviceInfo(this.currentOutputDevice);

    return `Current Audio Devices:\nInput: ${input}\nOutput: ${output}`;
  }
}
