// AudioWorklet processor for playing back PCM16 audio data
class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferQueue = [];
    this.currentBuffer = null;
    this.currentOffset = 0;
    this.queuedSamples = 0;
    this.isPlaying = false;
    this.prebufferSamples = 4096;
    this.underrunSamples = 0;
    this.maxUnderrunSamples = 2048;

    this.port.onmessage = (event) => {
      if (event.data === null) {
        this.clear();
      } else {
        const buffer = event.data instanceof Int16Array ? event.data : new Int16Array(event.data);
        this.bufferQueue.push(buffer);
        this.queuedSamples += buffer.length;
        this.underrunSamples = 0;
      }
    };
  }

  clear() {
    const wasPlaying = this.isPlaying;
    this.bufferQueue = [];
    this.currentBuffer = null;
    this.currentOffset = 0;
    this.queuedSamples = 0;
    this.underrunSamples = 0;
    this.isPlaying = false;
    if (wasPlaying) {
      this.port.postMessage({ type: "playback-ended" });
    }
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (output.length === 0) return true;

    const channel = output[0];

    if (!this.isPlaying && this.queuedSamples < this.prebufferSamples) {
      channel.fill(0);
      return true;
    }

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.port.postMessage({ type: "playback-started" });
    }

    for (let i = 0; i < channel.length; i++) {
      if (!this.currentBuffer || this.currentOffset >= this.currentBuffer.length) {
        if (this.bufferQueue.length > 0) {
          this.currentBuffer = this.bufferQueue.shift();
          this.currentOffset = 0;
        } else {
          channel[i] = 0;
          this.underrunSamples++;
          if (this.isPlaying && this.underrunSamples >= this.maxUnderrunSamples) {
            this.isPlaying = false;
            this.currentBuffer = null;
            this.currentOffset = 0;
            this.underrunSamples = 0;
            this.port.postMessage({ type: "playback-ended" });
          }
          continue;
        }
      }

      this.underrunSamples = 0;
      channel[i] = this.currentBuffer[this.currentOffset] / 32768.0;
      this.currentOffset++;
      this.queuedSamples = Math.max(0, this.queuedSamples - 1);
    }
    return true;
  }
}

registerProcessor('audio-playback-processor', AudioPlaybackProcessor);
