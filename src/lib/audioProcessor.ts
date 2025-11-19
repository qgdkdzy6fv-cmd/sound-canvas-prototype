export interface AudioFeatures {
  frequency: number;
  amplitude: number;
  lowFreq: number;
  midFreq: number;
  highFreq: number;
  signature: string;
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private frequencyBins: Uint8Array | null = null;
  private isActive = false;

  async initialize(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.frequencyBins = new Uint8Array(bufferLength);

      this.isActive = true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  getAudioFeatures(): AudioFeatures | null {
    if (!this.analyser || !this.dataArray || !this.frequencyBins || !this.isActive) {
      return null;
    }

    this.analyser.getByteTimeDomainData(this.dataArray);
    this.analyser.getByteFrequencyData(this.frequencyBins);

    const amplitude = this.calculateAmplitude(this.dataArray);

    if (amplitude < 0.1) {
      return null;
    }

    const dominantFrequency = this.getDominantFrequency();
    const { low, mid, high } = this.getFrequencyBands();
    const signature = this.generateSignature(dominantFrequency, low, mid, high);

    return {
      frequency: dominantFrequency,
      amplitude,
      lowFreq: low,
      midFreq: mid,
      highFreq: high,
      signature
    };
  }

  private calculateAmplitude(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / data.length);
  }

  private getDominantFrequency(): number {
    if (!this.frequencyBins || !this.audioContext) return 0;

    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < this.frequencyBins.length; i++) {
      if (this.frequencyBins[i] > maxValue) {
        maxValue = this.frequencyBins[i];
        maxIndex = i;
      }
    }

    const nyquist = this.audioContext.sampleRate / 2;
    return (maxIndex * nyquist) / this.frequencyBins.length;
  }

  private getFrequencyBands(): { low: number; mid: number; high: number } {
    if (!this.frequencyBins) return { low: 0, mid: 0, high: 0 };

    const lowEnd = Math.floor(this.frequencyBins.length * 0.1);
    const midEnd = Math.floor(this.frequencyBins.length * 0.4);

    let low = 0, mid = 0, high = 0;

    for (let i = 0; i < lowEnd; i++) {
      low += this.frequencyBins[i];
    }
    for (let i = lowEnd; i < midEnd; i++) {
      mid += this.frequencyBins[i];
    }
    for (let i = midEnd; i < this.frequencyBins.length; i++) {
      high += this.frequencyBins[i];
    }

    low /= lowEnd;
    mid /= (midEnd - lowEnd);
    high /= (this.frequencyBins.length - midEnd);

    return { low, mid, high };
  }

  private generateSignature(freq: number, low: number, mid: number, high: number): string {
    const freqBucket = Math.floor(freq / 50) * 50;
    const lowBucket = Math.floor(low / 20) * 20;
    const midBucket = Math.floor(mid / 20) * 20;
    const highBucket = Math.floor(high / 20) * 20;

    return `${freqBucket}-${lowBucket}-${midBucket}-${highBucket}`;
  }

  stop(): void {
    if (this.microphone) {
      this.microphone.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isActive = false;
  }

  get active(): boolean {
    return this.isActive;
  }
}
