import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Clickable from './clickable.js'

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
  
  constructor(position = [100, 100]) {
    super();

    this.position = position;
  }

  init() {
    this.parameterValues = {};
    this.clickBoxes = [];
    for (const paramKey in this.parameters) {
      const param = this.parameters[paramKey];

      const typeDefault = param.isBoolean ? false : 0.5;
      this.parameterValues[paramKey] = param.defaultValue ?? typeDefault;

      // Spawn clickable for jack
      const clickableAabb = [
        -3,
        param.inputHeight - 3,
        4,
        param.inputHeight + 4,
      ];
      this.clickables[paramKey] = game.addThing(new Clickable(this, paramKey, clickableAabb));
    }

    // Spawn clickable for output jack
    const clickableAabb = [
      this.width - 4,
      this.outputHeight - 3,
      this.width + 3,
      this.outputHeight + 4,
    ];
    this.clickables['output'] = game.addThing(new Clickable(this, 'output', clickableAabb));
  }

  isChildClickable(key) {
    if (game.globals.connectingModule) {
      if (game.globals.connectingModule === this) {
        if (key !== 'output') {
          return false;
        }
      }
      else {
        if (key === 'output') {
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
    if (key === 'output') {
      if (game.globals.connectingModule) {
        if (game.globals.connectingModule === this) {
          game.globals.connectingModule = null;
        }
      }
      else {
        game.globals.connectingModule = this;
      }
    }
    else {
      if (game.globals.connectingModule) {
        const didAddConnection = game.globals.connectingModule.addConnection(this, key);
        if (didAddConnection) {
          soundmanager.playSound('plug_in', 0.6, [0.7, 0.8]);
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
            this.parameterValues[key] = !this.parameterValues[key];
          }
          else {
            this.editingParameter = key;
            this.editingStartMousePosition = [...game.mouse.position];
            this.editingParameterStartValue = this.parameterValues[key];
          }
        }
      }
    }
  }

  onReleaseChild(key) {
    if (this.editingParameter === key) {
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

  removeConnection(module, parameter) {
    for (let i = 0; i < this.connections.length; i ++) {
      const connection = this.connections[i];
      if (connection.module === module && connection.parameter === parameter) {
        this.connections.splice(i, 1);
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
      oldModule.removeConnection(module, parameter);
    }

    this.connections.push({ module, parameter });

    return true;
  }

  update() {
    this.time++

    // Manual parameter adjustment
    if (this.editingParameter) {
      const curPos = game.mouse.position;
      const oldPos = this.editingStartMousePosition;

      const paramDelta = ((oldPos[1] - curPos[1]) + (curPos[0] - oldPos[0])) / 120;

      this.parameterValues[this.editingParameter] = u.clamp(this.editingParameterStartValue + paramDelta, 0, 1);

    }

    // TODO: Rebuild audio graph

    // System
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
      const jackPos = [-7, this.parameters[parameter].inputHeight - 7];

      let sprite = 'jack';
      if (this.clickables[parameter]?.isHighlighted) {
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
      if (!this.isChildClickable('output')) {
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
