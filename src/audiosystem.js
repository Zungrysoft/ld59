import * as game from 'game'
import * as u from 'utils'
import { normToFreq, scaleSigma } from './audiohelpers.js';

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

    this._createCoreNodes();
  }

  _createCoreNodes() {
    // Persistent outputs for audio players
    this.nodes.set("audio1", this._createBufferPlayerNode());
    this.nodes.set("audio2", this._createBufferPlayerNode());

    // Sine oscillator
    this.nodes.set("sine1", this._createOscillatorNode());

    // EQs
    this.nodes.set("eq1", this._createEQNode());
    this.nodes.set("eq2", this._createEQNode());

    // Speaker
    this.nodes.set("speaker", {
      type: "speaker",
      input: this.ctx.createGain()
    });
    this.nodes.get("speaker").input.connect(this.ctx.destination);
  }

  _createBufferPlayerNode() {
    return {
      type: "bufferPlayer",
      output: this.ctx.createGain(),   // persistent graph output
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
    osc.start();

    return {
      type: "oscillator",
      node: osc,
      output: gain,
      isPlaying: false
    };
  }

  _createEQNode() {
    const input = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const bypassGain = this.ctx.createGain();
    const output = this.ctx.createGain();

    filter.type = "peaking";

    // Two possible paths:
    // input -> filter -> output
    // input -> bypassGain -> output
    input.connect(filter);
    filter.connect(output);

    input.connect(bypassGain);
    bypassGain.connect(output);

    // Default: filter active, bypass muted
    bypassGain.gain.value = 0;

    return {
      type: "eq",
      input,
      filter,
      bypassGain,
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
    if (['boolean', 'number'].includes(typeof this.currentGraph?.[nodeId]?.[parameter])) {
      this.currentGraph[nodeId][parameter] = value;
      const node = this.nodes.get(nodeId);
      if (node) {
        this._applyNodeConfig(node, this.currentGraph[nodeId]);
      }
    }
  }

  _disconnectDynamicConnections() {
    for (const [key, node] of this.nodes.entries()) {
      if (node.type === "eq") {
        try { node.input.disconnect(); } catch {}
        try { node.filter.disconnect(); } catch {}
        try { node.bypassGain.disconnect(); } catch {}
        try { node.output.disconnect(); } catch {}

        node.input.connect(node.filter);
        node.filter.connect(node.output);
        node.input.connect(node.bypassGain);
        node.bypassGain.connect(node.output);

        node.modulationMixers.clear();
      } else if (node.type === "speaker") {
        try { node.input.disconnect(); } catch {}
        node.input.connect(this.ctx.destination);
      } else if (node.type === "bufferPlayer" || node.type === "oscillator") {
        try { node.output.disconnect(); } catch {}
      }
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

        node.bypassGain.gain.setValueAtTime(0, this.ctx.currentTime);
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
        node.node.frequency.setValueAtTime(config.frequency, now);
      }
      if (typeof config.gain === "number") {
        node.output.gain.setValueAtTime(config.gain, now);
      }
      if (typeof config.isPlaying === "boolean") {
        node.isPlaying = config.isPlaying;
        if (!config.isPlaying) {
          node.output.gain.setValueAtTime(0, now);
        }
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
        const gain = u.map(config.gain, 0, 1, -25, 25);
        node.filter.gain.setValueAtTime(gain, now);
      }
      if (config.bypass === true) {
        node.bypassGain.gain.setValueAtTime(1, now);
      } else {
        node.bypassGain.gain.setValueAtTime(0, now);
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

    const audioParam = this._getTargetAudioParam(targetNode, paramName);
    if (audioParam) {
      sourceOutput.connect(audioParam);
      return;
    }

    // Best-effort fallback for non-audio params:
    // follow the source with an analyser/update loop if needed in future.
    console.warn(`Cannot modulate "${targetKey}.${paramName}" directly.`);
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
        offset: finished ? 0 : newOffset,
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
