import * as game from 'game'
import * as u from 'utils'
import { normToFreq, normToFreq2, scaleSigma } from './audiohelpers.js';

function buildGraph() {
  let graph = {};
  recurseGraph(game.getThing('speakers'), graph);
  return graph;
}

function recurseGraph(module, graph) {
  let entry = {};
  for (const parameter in module.parameters) {
    const previousModule = module.getPreviousModule(parameter);
    if (previousModule) {
      entry[parameter] = previousModule.nodeId;
      recurseGraph(previousModule, graph);
    }
    else {
      entry[parameter] = module.parameterValues[parameter] ?? 0;
    }
  }
  graph[module.nodeId] = entry;
}

export default class AudioGraphManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.nodes = new Map();
    this.playState = new Map();
    this.currentGraph = {};

    // Tracks audio->control-rate modulation readers
    this.modulationReaders = new Map();

    // Tracks observer readers for audio-output nodes
    this.nodeObservers = new Map();

    // Tracks which params are currently controlled by which source node
    // key format: "targetKey.paramName" -> sourceKey
    this.paramControllers = new Map();

    // Global silent sink that keeps otherwise-inaudible graphs alive
    this.keepAlive = this.ctx.createGain();
    this.keepAlive.gain.value = 0;
    this.keepAlive.connect(this.ctx.destination);

    this._createCoreNodes();
    this._createNodeObservers();
  }

  _createCoreNodes() {
    // Persistent outputs for audio players
    this.nodes.set("audio1", this._createBufferPlayerNode());
    this.nodes.set("audio2", this._createBufferPlayerNode());

    // Sine oscillator
    this.nodes.set("sine1", this._createOscillatorNode());
    // this.nodes.set("sine2", this._createOscillatorNode());

    // EQs
    this.nodes.set("eq1", this._createEQNode());
    this.nodes.set("eq2", this._createEQNode("highshelf"));
    this.nodes.set("eq3", this._createEQNode("lowshelf"));

    // Speaker
    this.nodes.set("speaker", {
      type: "speaker",
      input: this.ctx.createGain()
    });
    this.nodes.get("speaker").input.connect(this.ctx.destination);
  }

  _createNodeObservers() {
    for (const [key, node] of this.nodes.entries()) {
      const output = this._getNodeOutput(node);
      if (!output) continue;

      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;

      output.connect(analyser);

      const sampleBuffer = new Float32Array(analyser.fftSize);

      const observer = {
        analyser,
        sampleBuffer,
        lastValue: 0,
        intervalId: window.setInterval(() => {
          analyser.getFloatTimeDomainData(sampleBuffer);

          let sum = 0;
          for (let i = 0; i < sampleBuffer.length; i++) {
            sum += Math.abs(sampleBuffer[i]);
          }

          observer.lastValue = Math.min(1, Math.max(0, sum / sampleBuffer.length));
        }, 1000 / 60)
      };

      this.nodeObservers.set(key, observer);
    }
  }

  _createBufferPlayerNode() {
    const output = this.ctx.createGain();
    output.connect(this.keepAlive);

    return {
      type: "bufferPlayer",
      output,
      buffer: null,
      playbackRate: 1,
      currentSource: null
    };
  }

  _createOscillatorNode() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.keepAlive);
    osc.start();

    return {
      type: "oscillator",
      node: osc,
      output: gain,
      isPlaying: false
    };
  }

  _createEQNode(type = "peaking") {
    const input = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const output = this.ctx.createGain();

    filter.type = type;

    input.connect(filter);
    filter.connect(output);

    input.connect(output);

    output.connect(this.keepAlive);

    return {
      type: "eq",
      input,
      filter,
      output,
      modulationMixers: new Map()
    };
  }

  async resume() {
    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }
  }

  rebuildGraph() {
    const graph = buildGraph();

    this.currentGraph = graph || {};

    // Disconnect all dynamic connections first
    this._disconnectDynamicConnections();

    // Reset nodes to safe defaults
    this._resetNodeState();

    // Apply config and rebuild routing
    for (const [key, config] of Object.entries(this.currentGraph)) {
      const node = this.nodes.get(key);
      if (!node) continue;

      this._applyNodeConfig(node, config);
    }

    for (const [key, config] of Object.entries(this.currentGraph)) {
      for (const [paramName, inputValue] of Object.entries(config)) {
        if (typeof inputValue === "string" && this.nodes.has(inputValue)) {
          this._connectNodeToTargetParam(inputValue, key, paramName);
        }
      }
    }
  }

  updateParameter(nodeId, parameter, value) {
    if (["boolean", "number"].includes(typeof this.currentGraph?.[nodeId]?.[parameter])) {
      this.currentGraph[nodeId][parameter] = value;
      const node = this.nodes.get(nodeId);
      if (node) {
        this._applyNodeConfig(node, this.currentGraph[nodeId]);
      }
    }
  }

  _disconnectDynamicConnections() {
    for (const reader of this.modulationReaders.values()) {
      try { clearInterval(reader.intervalId); } catch {}
      try { reader.analyser.disconnect(); } catch {}
    }
    this.modulationReaders.clear();
    this.paramControllers.clear();

    for (const [key, node] of this.nodes.entries()) {
      if (node.type === "eq") {
        try { node.input.disconnect(); } catch {}
        try { node.filter.disconnect(); } catch {}
        try { node.output.disconnect(); } catch {}

        node.input.connect(node.filter);
        node.filter.connect(node.output);

        // Restore permanent keepalive connection
        node.output.connect(this.keepAlive);

        node.modulationMixers.clear();
      } else if (node.type === "speaker") {
        try { node.input.disconnect(); } catch {}
        node.input.connect(this.ctx.destination);
      } else if (node.type === "bufferPlayer" || node.type === "oscillator") {
        try { node.output.disconnect(); } catch {}

        // Restore permanent keepalive connection
        node.output.connect(this.keepAlive);
      }
    }

    // Reconnect observers after output disconnect/reconnect work
    this._reconnectNodeObservers();
  }

  _reconnectNodeObservers() {
    for (const [key, observer] of this.nodeObservers.entries()) {
      const node = this.nodes.get(key);
      const output = node ? this._getNodeOutput(node) : null;
      if (!output) continue;

      try { observer.analyser.disconnect(); } catch {}

      output.connect(observer.analyser);
    }
  }

  _resetNodeState() {
    for (const node of this.nodes.values()) {
      if (node.type === "bufferPlayer") {
        node.playbackRate = 1;
      }

      if (node.type === "oscillator") {
        node.node.frequency.setValueAtTime(440, this.ctx.currentTime);
        node.output.gain.setValueAtTime(0, this.ctx.currentTime);
        node.isPlaying = false;
      }

      if (node.type === "eq") {
        node.filter.Q.setValueAtTime(1, this.ctx.currentTime);
        node.filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        node.filter.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }
  }

  _applyNodeConfig(node, config) {
    const now = this.ctx.currentTime;

    if (node.type === "bufferPlayer") {
      if (typeof config.playbackRate === "number") {
        node.playbackRate = config.playbackRate;
      }
      return;
    }

    if (node.type === "oscillator") {
      if (typeof config.frequency === "number") {
        const freq = normToFreq2(config.frequency);
        node.node.frequency.setValueAtTime(freq, now);
      }
      if (typeof config.gain === "number") {
        node.output.gain.setValueAtTime(config.gain, now);
      }
      if (typeof config.isSquare === 'boolean') {
        const oscType = config.isSquare ? 'square' : 'sine';
        node.node.type = oscType;
      }
      return;
    }

    if (node.type === "eq") {
      if (typeof config.width === "number") {
        const q = 0.33 / scaleSigma(config.width);
        node.filter.Q.setValueAtTime(q, now);
      }
      if (typeof config.frequency === "number") {
        const freq = normToFreq(config.frequency);
        node.filter.frequency.setValueAtTime(freq, now);
      }
      if (typeof config.gain === "number") {
        let gain = u.map(config.gain, 0, 1, -25, 25);
        if (config.bypass) {
          gain = 0;
        }
        node.filter.gain.setValueAtTime(gain, now);
      }
    }
  }

  _connectNodeToTargetParam(sourceKey, targetKey, paramName) {
    const sourceNode = this.nodes.get(sourceKey);
    const targetNode = this.nodes.get(targetKey);
    if (!sourceNode || !targetNode) return;

    const sourceOutput = this._getNodeOutput(sourceNode);
    if (!sourceOutput) return;

    if (paramName === "input") {
      const targetInput = this._getNodeInput(targetNode);
      if (!targetInput) return;
      sourceOutput.connect(targetInput);
      return;
    }

    // For eq/osc parameters, convert audio-rate modulation into control-rate
    // by measuring average loudness over ~1/60s windows.
    if (this._isControlRateParamTarget(targetNode, paramName)) {
      if (sourceKey.includes('sine')) {
        this._connectAudioRateSourceAsDirectControl(sourceOutput, targetNode, paramName, sourceKey, targetKey);
      }
      else {
        this._connectAudioRateSourceAsLoudnessControl(sourceOutput, targetNode, paramName, sourceKey, targetKey);
      }
      
      this.paramControllers.set(`${targetKey}.${paramName}`, sourceKey);
      return;
    }

    const audioParam = this._getTargetAudioParam(targetNode, paramName);
    if (audioParam) {
      console.log("Connected")
      sourceOutput.connect(audioParam);
      return;
    }

    console.warn(`Cannot modulate "${targetKey}.${paramName}" directly.`);
  }

  _isControlRateParamTarget(node, paramName) {
    if (node.type === "eq") {
      return paramName === "frequency" || paramName === "gain" || paramName === "width";
    }

    if (node.type === "oscillator") {
      return paramName === "frequency" || paramName === "gain";
    }

    return false;
  }

  _connectAudioRateSourceAsLoudnessControl(sourceOutput, targetNode, paramName, sourceKey, targetKey) {
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;

    sourceOutput.connect(analyser);

    const sampleBuffer = new Float32Array(analyser.fftSize);
    const intervalMs = 1000 / 60;
    const readerId = `${sourceKey}->${targetKey}.${paramName}`;

    const reader = {
      analyser,
      lastValue: 0,
      intervalId: window.setInterval(() => {
        analyser.getFloatTimeDomainData(sampleBuffer);

        let sum = 0;
        for (let i = 0; i < sampleBuffer.length; i++) {
          sum += Math.abs(sampleBuffer[i]);
        }

        const loudness = Math.min(1, Math.max(0, (sum / sampleBuffer.length) * 3.2));
        reader.lastValue = loudness;
        this._setNormalizedTargetParam(targetNode, paramName, loudness);
      }, intervalMs)
    };

    this.modulationReaders.set(readerId, reader);
  }

  _connectAudioRateSourceAsDirectControl(sourceOutput, targetNode, paramName, sourceKey, targetKey) {
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;

    sourceOutput.connect(analyser);

    const sampleBuffer = new Float32Array(analyser.fftSize);
    const intervalMs = 1000 / 60;
    const readerId = `${sourceKey}->${targetKey}.${paramName}`;

    const reader = {
      analyser,
      lastValue: 0,
      intervalId: window.setInterval(() => {
        analyser.getFloatTimeDomainData(sampleBuffer);
        const raw = sampleBuffer[0];
        const normalized = u.map(raw, -1, 1, 0, 1);
        reader.lastValue = normalized;
        this._setNormalizedTargetParam(targetNode, paramName, normalized);
      }, intervalMs)
    };

    this.modulationReaders.set(readerId, reader);
  }

  _setNormalizedTargetParam(node, paramName, normalizedValue) {
    const now = this.ctx.currentTime;
    const value = Math.min(1, Math.max(0, normalizedValue));

    if (node.type === "eq") {
      if (paramName === "width") {
        const q = 0.33 / scaleSigma(value);
        node.filter.Q.setTargetAtTime(q, now, 0.01);
        return;
      }

      if (paramName === "frequency") {
        const freq = normToFreq(value);
        node.filter.frequency.setTargetAtTime(freq, now, 0.01);
        return;
      }

      if (paramName === "gain") {
        const gain = u.map(value, 0, 1, -25, 25);
        node.filter.gain.setTargetAtTime(gain, now, 0.01);
        return;
      }
    }

    if (node.type === "oscillator") {
      if (paramName === "frequency") {
        node.node.frequency.setTargetAtTime(value, now, 0.01);
        return;
      }

      if (paramName === "gain") {
        node.output.gain.setTargetAtTime(value, now, 0.01);
      }

      if (paramName === 'isSquare') {
        const oscType = value ? 'square' : 'sine';
        node.node.type = oscType;
      }
    }
  }

  getObservedControlValue(nodeKey, paramName) {
    const controllerKey = this.paramControllers.get(`${nodeKey}.${paramName}`);
    if (!controllerKey) return null;

    const readerId = `${controllerKey}->${nodeKey}.${paramName}`;
    const reader = this.modulationReaders.get(readerId);
    return reader ? reader.lastValue : null;
  }

  _getNodeInput(node) {
    if (node.type === "eq") return node.input;
    if (node.type === "speaker") return node.input;
    return null;
  }

  _getNodeOutput(node) {
    if (node.type === "bufferPlayer") return node.output;
    if (node.type === "oscillator") return node.output;
    if (node.type === "eq") return node.output;
    return null;
  }

  _getTargetAudioParam(node, paramName) {
    if (node.type === "eq") {
      if (paramName === "frequency") return node.filter.frequency;
      if (paramName === "gain") return node.filter.gain;
      if (paramName === "width") return node.filter.Q;
    }

    if (node.type === "oscillator") {
      if (paramName === "frequency") return node.node.frequency;
      if (paramName === "gain") return node.output.gain;
    }

    return null;
  }

  playSound(buffer, key) {
    const node = this.nodes.get(key);
    if (!node || node.type !== "bufferPlayer") {
      throw new Error(`Node "${key}" is not a buffer player.`);
    }

    node.buffer = buffer;

    // Stop prior source if currently active
    if (node.currentSource) {
      try { node.currentSource.stop(); } catch {}
      try { node.currentSource.disconnect(); } catch {}
      node.currentSource = null;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = node.buffer;
    source.playbackRate.value = node.playbackRate;

    source.connect(node.output);

    const prevState = this.playState.get(key) || {
      offset: 0,
      startedAt: 0,
      playing: false
    };

    const offset = Math.min(prevState.offset || 0, Math.max(0, buffer.duration - 0.001));

    source.start(0, offset);

    node.currentSource = source;
    this.playState.set(key, {
      offset,
      startedAt: this.ctx.currentTime,
      playing: true
    });

    source.onended = () => {
      const state = this.playState.get(key);
      if (!state || !state.playing) return;

      const elapsed = this.ctx.currentTime - state.startedAt;
      const newOffset = state.offset + elapsed;

      const finished = !node.buffer || newOffset >= node.buffer.duration - 0.001;

      this.playState.set(key, {
        offset: newOffset,
        startedAt: 0,
        playing: false
      });

      if (node.currentSource === source) {
        node.currentSource = null;
      }
    };
  }

  pause(key) {
    const node = this.nodes.get(key);
    const state = this.playState.get(key);

    if (!node || node.type !== "bufferPlayer" || !state?.playing) return;

    const elapsed = this.ctx.currentTime - state.startedAt;
    const newOffset = state.offset + elapsed;

    this.playState.set(key, {
      offset: newOffset,
      startedAt: 0,
      playing: false
    });

    if (node.currentSource) {
      try { node.currentSource.stop(); } catch {}
      try { node.currentSource.disconnect(); } catch {}
      node.currentSource = null;
    }
  }

  reset(key) {
    const node = this.nodes.get(key);
    if (!node || node.type !== "bufferPlayer") return;

    if (node.currentSource) {
      try { node.currentSource.stop(); } catch {}
      try { node.currentSource.disconnect(); } catch {}
      node.currentSource = null;
    }

    this.playState.set(key, {
      offset: 0,
      startedAt: 0,
      playing: false
    });
  }

  debugNode(key) {
    const node = this.nodes.get(key);
    if (!node) return null;

    return {
      key,
      type: node.type,
      hasInput: !!this._getNodeInput(node),
      hasOutput: !!this._getNodeOutput(node),
      node
    };
  }
}
