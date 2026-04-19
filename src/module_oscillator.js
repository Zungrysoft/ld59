import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Module from './module.js'
import { DISABLED_GREY, DISABLED_GREY_DARK } from './colors.js'
import { logFreq, normToFreq, normToFreq2, normToFreq3, scaleSigma } from './audiohelpers.js'

export default class ModuleOscillator extends Module {
  width = 104
  height = 42
  sprite = 'module_oscillator'
  outputHeight = 27
  parameters = {
    frequency: {
      inputHeight: 20,
      defaultValue: 0.3,
    },
    gain: {
      inputHeight: 27,
      defaultValue: 1.0,
    },
    isSquare: {
      inputHeight: 34,
      isBoolean: true,
      disallowConnections: true,
    },
  }

  constructor(nodeId, position) {
    super(nodeId, position);

    this.init();
  }

  draw() {
    super.draw();

    // Wave chart
    const OSC_X = 34;
    const OSC_Y = 27;
    const OSC_WIDTH = 61;
    const OSC_HEIGHT = 9;
    for (let i = 0; i < OSC_WIDTH; i ++) {
      const val = i / (OSC_WIDTH - 1);
      const output = this.oscDisplayWave(
        val,
        this.getParameterValueDisplay('frequency'),
        this.getParameterValueDisplay('gain'),
        this.getParameterValueDisplay('isSquare'),
      );

      const x = OSC_X + i;
      const y = OSC_Y + Math.round(OSC_HEIGHT * (u.clamp(output, 0, 1) * -2 + 1));

      drawSprite({
        sprite: game.assets.textures.square,
        position: vec2.add(this.position, [x, y]),
        width: 1,
        height: 1,
        color: [1, 0.2, 0.3],
        depth: this.depth + 3,
      })

      drawText({
        text: this.parameterValues.isSquare ? "square" : "sine",
        color: DISABLED_GREY,
        depth: this.depth + 3,
        position: vec2.add(this.position, [6, 31]),
      })

      if (i % 2 === 0) {
        if (y - OSC_Y > 0) {
          drawSprite({
            sprite: game.assets.textures.square,
            position: vec2.add(this.position, [x, y]),
            width: 1,
            height: OSC_Y - y,
            color: [0.5, 0, 0.1],
            depth: this.depth + 2,
          })
        }
        else if (y - OSC_Y < 0) {
          drawSprite({
            sprite: game.assets.textures.square,
            position: vec2.add(this.position, [x, y + 1]),
            width: 1,
            height: OSC_Y - y,
            color: [0.5, 0, 0.1],
            depth: this.depth + 2,
          })
        }
        
      }
    }
  }

  oscDisplayWave(x, freq, gain, isSquare) {
    const f = normToFreq3(freq, 3.14 * 2, 3.14 * 2 * 6);

    const w = Math.sin(x * f);
    if (isSquare) {
      const w2 = w > 0 ? gain : -gain;
      return (w2 + 1) * 0.5;
    }
    return ((w * gain) + 1) * 0.5;
  }
}
