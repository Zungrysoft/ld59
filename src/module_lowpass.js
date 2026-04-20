import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Module from './module.js'
import { DISABLED_GREY, DISABLED_GREY_DARK } from './colors.js'
import { logFreq, normToFreq, scaleSigma } from './audiohelpers.js'
import ModuleEQ from './module_eq.js'

export default class ModuleLowpass extends ModuleEQ {
  width = 96
  height = 52
  sprite = 'module_lowpass'
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
    bypass: {
      inputHeight: 34,
      isBoolean: true,
      disallowConnections: true,
    },

    width: {
      inputHeight: 42,
      defaultValue: 0.2,
      isHidden: true,
    },
    gain: {
      inputHeight: 41,
      defaultValue: 0,
      isHidden: true,
    },
  }
  isLowPass = true

  constructor(nodeId, position) {
    super(nodeId, position, true);

    this.init();
  }
}
