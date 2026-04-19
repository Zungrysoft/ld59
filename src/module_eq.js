import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Module from './module.js'
import { DISABLED_GREY, DISABLED_GREY_DARK } from './colors.js'
import { logFreq, normToFreq, scaleSigma } from './audiohelpers.js'

export default class ModuleEQ extends Module {
  width = 96
  height = 56
  sprite = 'module_eq'
  outputHeight = 32
  parameters = {
    input: {
      inputHeight: 20,
      isSignal: true,
    },
    frequency: {
      inputHeight: 27,
      defaultValue: 0.7,
    },
    width: {
      inputHeight: 34,
      defaultValue: 0.2,
    },
    gain: {
      inputHeight: 41,
      defaultValue: 0.68,
    },
    bypass: {
      inputHeight: 48,
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

    // EQ chart
    const EQ_X = 34;
    const EQ_Y = 32;
    const EQ_WIDTH = 53;
    const EQ_HEIGHT = 14;
    for (let i = 0; i < EQ_WIDTH; i ++) {
      if (this.parameterValues.bypass && i % 2 === 0) {
        continue;
      }

      const val = i / (EQ_WIDTH - 1);
      const output = this.eqDisplayCurve(
        val,
        this.getParameterValueDisplay('frequency'),
        this.getParameterValueDisplay('width'),
        this.getParameterValueDisplay('gain'),
      );

      const x = EQ_X + i;
      const y = EQ_Y + Math.round(EQ_HEIGHT * (u.clamp(output, 0, 1) * -2 + 1));

      drawText({
        text: this.parameterValues.bypass ? 'bypass' : 'on',
        color: DISABLED_GREY,
        position: vec2.add(this.position, [6, 45]),
        depth: this.depth + 2,
      })

      drawSprite({
        sprite: game.assets.textures.square,
        position: vec2.add(this.position, [x, y]),
        width: 1,
        height: 1,
        color: this.parameterValues.bypass ? DISABLED_GREY_DARK : [0.2, 0.3, 1],
        depth: this.depth + 3,
      })

      if (!this.parameterValues.bypass && i % 2 === 0) {
        if (y - EQ_Y > 0) {
          drawSprite({
            sprite: game.assets.textures.square,
            position: vec2.add(this.position, [x, y]),
            width: 1,
            height: EQ_Y - y,
            color: [0, 0.1, 0.5],
            depth: this.depth + 2,
          })
        }
        else if (y - EQ_Y < 0) {
          drawSprite({
            sprite: game.assets.textures.square,
            position: vec2.add(this.position, [x, y + 1]),
            width: 1,
            height: EQ_Y - y,
            color: [0, 0.1, 0.5],
            depth: this.depth + 2,
          })
        }
        
      }
    }
  }

  eqDisplayCurve(x, freq, width, gain) {
    const f = normToFreq(x);
    const f0 = normToFreq(freq);

    const logF = logFreq(f);
    const logF0 = logFreq(f0);

    const distance = logF - logF0;
    const sigma = scaleSigma(width);
    const bell = Math.exp(-(distance * distance) / (2 * sigma * sigma));
    const scaledGain = (gain - 0.5) * 2;

    let y = 0.5 + bell * scaledGain * 0.5;
    return u.clamp(y, 0, 1);
  }
}
