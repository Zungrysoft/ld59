import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Clickable from './clickable.js'
import { aabbIou, rectToPolygonDistance } from './helpers.js'

const REPEL_FORCE = 2.3;
const FRICTION = 0.2;
const BOUND_CORRECTION_FORCE = 0.02;

export default class Module extends Thing {
  depth = 10
  width = 100
  height = 100
  moveable = true
  sprite = 'square'
  outputHeight = 10
  clickables = {}
  parameters = {}
  connections = []
  isInitialized = false
  
  constructor(nodeId, position = [100, 100]) {
    super();

    this.nodeId = nodeId;
    this.position = position;
  }

  init() {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    this.parameterValues = {};
    this.clickBoxes = [];
    for (const paramKey in this.parameters) {
      const param = this.parameters[paramKey];

      const typeDefault = param.isBoolean ? false : 0.5;
      this.parameterValues[paramKey] = param.defaultValue ?? typeDefault;

      if (!param.isHidden) {
        // Spawn clickable for jack
        const clickableAabb = [
          -3,
          param.inputHeight - 3,
          4,
          param.inputHeight + 4,
        ];
        this.clickables[paramKey] = game.addThing(new Clickable(this, paramKey, clickableAabb));
      }
    }

    // Spawn clickable for output jack
    if (this.outputHeight != null) {
      const clickableAabb = [
        this.width - 4,
        this.outputHeight - 3,
        this.width + 3,
        this.outputHeight + 4,
      ];
      this.clickables['output'] = game.addThing(new Clickable(this, 'output', clickableAabb));
    }

    // Spawn clickable for dragging
    if (!this.isImmoveable) {
      const dragClickableAabb = [
        this.width - 11,
        0,
        this.width,
        16,
      ];
      this.clickables['drag'] = game.addThing(new Clickable(this, 'drag', dragClickableAabb, true));
    }
  }

  isChildClickable(key) {
    if (game.getThing('tapeDrawer').isOpen) {
      return false;
    }

    if (this.editingParameter) {
      return false;
    }

    if (key === 'drag' && !game.globals.connectingModule) {
      return true;
    }

    if (game.globals.connectingModule) {
      if (game.globals.connectingModule === this) {
        if (key !== 'output') {
          return false;
        }
      }
      else {
        if (key === 'output' || this.parameters?.[key]?.disallowConnections) {
          return false;
        }
      }
    }
    else {
      if (this.parameters?.[key]?.isSignal && this.getPreviousModule(key) == null) {
        return false;
      }
    }

    return true;
  }

  onClickChild(key) {
    if (key === 'drag') {
      this.isBeingDragged = true;
      this.dragDelta = vec2.subtract(game.mouse.position, this.position);
    }
    else if (key === 'output') {
      if (game.globals.connectingModule) {
        if (game.globals.connectingModule === this) {
          game.globals.connectingModule = null;
          soundmanager.playSound('snip', 1.0, [0.7, 0.8])
        }
      }
      else {
        game.globals.connectingModule = this;
        soundmanager.playSound('clack', 1.0, [0.7, 0.8]);
      }
    }
    else {
      if (game.globals.connectingModule) {
        const didAddConnection = game.globals.connectingModule.addConnection(this, key);
        if (didAddConnection) {
          soundmanager.playSound('clack', 1.0, [0.8, 0.9]);
        }
        game.globals.connectingModule = null;
      }
      else {
        const previousModule = this.getPreviousModule(key);
        if (previousModule) {
          previousModule.removeConnection(this, key);
        }
        else {
          // TODO: Manual parameter adjustment
          if (this.parameters[key].isBoolean) {
            soundmanager.playSound(this.parameterValues[key] ? 'off' : 'on', 1.0, [0.9, 1.0]);
            this.updateParameter(key, !this.parameterValues[key])
          }
          else {
            soundmanager.playSound('adjust', 0.6, 1.0);
            this.editingParameter = key;
            this.editingStartMousePosition = [...game.mouse.position];
            this.editingParameterStartValue = this.parameterValues[key];
            this.editingParameterLastSoundValue = this.parameterValues[key];
          }
        }
      }
    }
  }

  onReleaseChild(key) {
    if (key === 'drag') {
      this.isBeingDragged = false;
    }
    else if (this.editingParameter === key) {
      this.editingParameter = null;
    }
  }

  getPreviousModule(parameter) {
    for (const module of game.getThings().filter(x => x instanceof Module)) {
      for (const connection of module.connections) {
        if (connection.module === this && connection.parameter === parameter) {
          return module;
        }
      }
    }
    return null;
  }

  removeConnection(module, parameter, noUpdate) {
    for (let i = 0; i < this.connections.length; i ++) {
      const connection = this.connections[i];
      if (connection.module === module && connection.parameter === parameter) {
        this.connections.splice(i, 1);

        // Rebuild audio graph
        if (!noUpdate) {
          game.globals.audioSystem.rebuildGraph();
        }

        soundmanager.playSound('snip', 1.0, [0.7, 0.8])

        return true;
      }
    }
    return false;
  }

  addConnection(module, parameter) {
    for (const connection of this.connections) {
      if (connection.module === module && connection.parameter === parameter) {
        return false;
      }
    }
    
    // Remove other conflicting connections
    // Each output can only have one input
    const oldModule = module.getPreviousModule(parameter);
    if (oldModule) {
      oldModule.removeConnection(module, parameter, true);
    }

    this.connections.push({ module, parameter });

    this.removeCycles();

    // Rebuild audio graph
    game.globals.audioSystem.rebuildGraph();

    return true;
  }

  removeCycles() {
    const speakers = game.getThing('speakers');
    let startedVisit = new Set();
    let endedVisit = new Set();
    let removedNodes = [];
    this.removeCyclesDfs(speakers, startedVisit, endedVisit, removedNodes);
    for (const r of removedNodes) {
      r.oldModule.removeConnection(r.module, r.parameter, true);
    }
  }

  removeCyclesDfs(module, startedVisit, endedVisit, removedNodes) {
    startedVisit.add(module);
    for (const param in this.parameters) {
      const prev = module.getPreviousModule(param);
      if (prev) {
        if (startedVisit.has(prev) && !endedVisit.has(prev)) {
          removedNodes.push({
            module,
            oldModule: prev,
            parameter: param,
          });
        }
        if (!startedVisit.has(prev)) {
          this.removeCyclesDfs(prev, startedVisit, endedVisit, removedNodes);
        }
      }
    }
    endedVisit.add(module);
  }

  updateParameter(parameter, value) {
    if (this.parameterValues[parameter] !== value) {
      this.parameterValues[parameter] = value;

      // Rebuild audio graph
      game.globals.audioSystem.updateParameter(this.nodeId, parameter, value);
    }
  }

  getParameterValueDisplay(parameter) {
    const value = game.globals.audioSystem.getObservedControlValue(this.nodeId, parameter);

    if (value != null) {
      return value;
    }

    return this.parameterValues[parameter] ?? 0;
  }

  update() {
    this.time ++;

    // Manual parameter adjustment
    if (this.editingParameter) {
      const curPos = game.mouse.position;
      const oldPos = this.editingStartMousePosition;

      const paramDelta = ((oldPos[1] - curPos[1]) + (curPos[0] - oldPos[0])) / 120;

      this.updateParameter(this.editingParameter, u.clamp(this.editingParameterStartValue + paramDelta, 0, 1));

      if (Math.abs(this.editingParameterLastSoundValue - this.parameterValues[this.editingParameter]) > 0.05) {
        this.editingParameterLastSoundValue = this.parameterValues[this.editingParameter];
        soundmanager.playSound('adjust2', 0.2, 1.0);
      }
      
    }

    // Automatic parameter adjustment from connections
    for (const parameter in this.parameters) {
      const val = game.globals.audioSystem.getObservedControlValue(this.nodeId, parameter);
      if (val != null) {
        this.parameterValues[parameter] = val;
      }
    }

    // Dragging
    const borderPolygon = [
      [24, 0],
      [game.getWidth(), 0],
      [game.getWidth(), game.getHeight()],
      [0, game.getHeight()],
      [0, 24],
      [24, 24],
    ];
    if (this.isBeingDragged) {
      // Used to keep track of how far this word has moved this frame
      const prevPosition = [...this.position]

      // Drag word to new location
      if (game?.mouse?.position) {
        this.position = vec2.lerp(this.position, vec2.subtract(game.mouse.position, this.dragDelta), 0.7)
      }

      // Constrain to boundary area
      const [ distance, direction ] = rectToPolygonDistance(borderPolygon, this.getAabb());
      if (distance > 0) {
        this.position = vec2.add(this.position, vec2.scale(direction, distance));
      }

      // Set velocity from delta position in order to maintain inertia after release
      this.velocity = vec2.subtract(this.position, prevPosition)
    }
    else if (!this.isImmoveable) {
      // Constrain to boundary area (gently)
      const [ distance, direction ] = rectToPolygonDistance(borderPolygon, this.getAabb());
      if (distance > 0) {
        this.velocity = vec2.add(this.velocity, vec2.scale(direction, distance * BOUND_CORRECTION_FORCE));
      }

      // Friction
      this.velocity = vec2.scale(this.velocity, 1.0 - FRICTION)

      // Repel from other modules to prevent overlapping
      for (const other of game.getThings().filter(x => x instanceof Module && this !== x)) {
        const overlap = aabbIou(
          this.getAabb(),
          other.getAabb(),
        );

        if (overlap > 0) {
          const dir = vec2.normalize(vec2.subtract(this.position, other.position));
          this.velocity = vec2.add(this.velocity, vec2.scale(dir, u.map(overlap, 0, 1, REPEL_FORCE * 0.2, REPEL_FORCE)));
        }
      }

      // Move based on velocity
      this.position = vec2.add(this.position, this.velocity)
    }
  }

  getAabb() {
    return [...this.position, ...vec2.add(this.position, [this.width, this.height])];
  }

  draw() {
    // Base
    drawSprite({
      sprite: game.assets.textures[this.sprite],
      position: this.position,
      width: 128,
      height: 128,
      depth: this.depth,
    })

    // Inputs
    for (const parameter in this.parameters) {
      if (this.parameters[parameter].isHidden) {
        continue;
      }

      const jackPos = [-7, this.parameters[parameter].inputHeight - 7];

      let sprite = 'jack';
      if (this.clickables[parameter]?.isHighlighted || this.editingParameter === parameter) {
        sprite = 'jack_selected';
      }
      if (!this.isChildClickable(parameter) && game.globals.connectingModule) {
        sprite = 'jack_disabled';
      }


      drawSprite({
        sprite: game.assets.textures[sprite],
        position: vec2.add(this.position, jackPos),
        width: 16,
        height: 16,
        depth: this.depth + 1,
      })
    }

    // Output Jack
    if (this.outputHeight) {
      const jackPos = [this.width - 8, this.outputHeight - 7];

      let sprite = 'jack';
      if (this.clickables['output']?.isHighlighted) {
        sprite = 'jack_selected';
      }
      if (!this.isChildClickable('output') && game.globals.connectingModule) {
        sprite = 'jack_disabled';
      }

      drawSprite({
        sprite: game.assets.textures[sprite],
        position: vec2.add(this.position, jackPos),
        width: 16,
        height: 16,
        depth: this.depth + 1,
      })
    }

    // Connection to next module
    for (const connection of this.connections) {
      const otherModule = connection.module;

      // Start and end position
      const startPos = vec2.add(this.position, [this.width - 8, this.outputHeight - 7]);
      const endPos = vec2.add(otherModule.position, [-7, otherModule.parameters[connection.parameter].inputHeight - 7]);
      
      this.drawConnection(startPos, endPos);
    }

    // Connection being made
    if (game.globals.connectingModule === this) {
      const startPos = vec2.add(this.position, [this.width - 8, this.outputHeight - 7]);
      const endPos = vec2.add(game.mouse.position, [-7, -7]);

      this.drawConnection(startPos, endPos);
    }
  }

  drawLink(position) {
    drawSprite({
      sprite: game.assets.textures.link,
      position: position,
      width: 16,
      height: 16,
      depth: 20,
    })
  }

  drawConnection(startPos, endPos, stable=false) {
    // Middle links
    const dist = vec2.distance(startPos, endPos);
    const numLinks = Math.max(Math.floor(dist / 8), 1);
    const linkSpacing = stable ? 8 : dist / numLinks;
    const dir = vec2.normalize(vec2.subtract(endPos, startPos));
    for (let i = 0; i < numLinks; i ++) {
      const linkPos = vec2.add(startPos, vec2.scale(dir, i * linkSpacing));
      this.drawLink(linkPos);
    }

    // End link
    this.drawLink(endPos);
  }
}
