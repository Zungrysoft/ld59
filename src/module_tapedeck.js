import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Module from './module.js'
import Clickable from './clickable.js'
import { DISABLED_GREY, HIGHLIGHT_YELLOW } from './colors.js'

export default class ModuleTapedeck extends Module {
  width = 96
  height = 46
  sprite = 'module_tapedeck'
  outputHeight = 24
  parameters = {}
  
  loadedTape = null
  isPlaying = false
  isLoading = false
  isRestarting = false

  constructor(position) {
    super(position);

    this.init();
  }

  init() {
    super.init();

    // Spawn button clickables
    this.clickables['play'] = game.addThing(new Clickable(this, 'play', [28, 16, 49, 32]));
    this.clickables['restart'] = game.addThing(new Clickable(this, 'restart', [9, 16, 25, 32]));
    this.clickables['load'] = game.addThing(new Clickable(this, 'load', [52, 16, 65, 32]));
  }

  isPlayEnabled() {
    return !game.globals.isConnecting && this.loadedTape && !this.isLoading && !this.isRestarting;
  }

  isLoadEnabled() {
    return !game.globals.isConnecting && !this.isPlaying && !this.isRestarting && !this.isLoading;
  }

  isRestartEnabled() {
    return !game.globals.isConnecting && this.loadedTape && !this.isRestarting && !this.isLoading;
  }

  isChildClickable(key) {
    if (key === 'play') {
      return this.isPlayEnabled();
    }
    if (key === 'restart') {
      return this.isRestartEnabled();
    }
    if (key === 'load') {
      return this.isLoadEnabled();
    }

    return super.isChildClickable(key);
  }

  onClickChild(key) {
    if (key === 'play') {
      return true;
    }
    else if (key === 'restart') {
      return true;
    }
    else if (key === 'load') {
      return true;
    }
    else {
      super.onClickChild(key);
    }
  }

  draw() {
    super.draw();

    // Restart Button
    let restartSprite = 'restart';
    if (this.isRestarting) {
      restartSprite = 'restart_depressed';
    }
    let restartColor = [1.0, 1.0, 1.0];
    if (this.clickables['restart'].isHighlighted) {
      restartColor = HIGHLIGHT_YELLOW;
    }
    if (!this.isRestartEnabled()) {
      restartColor = DISABLED_GREY;
    }
    drawSprite({
      sprite: game.assets.textures['module_tapedeck_button_' + restartSprite],
      color: restartColor,
      position: this.position,
      width: 128,
      height: 128,
      depth: this.depth + 1,
    })

    // Play Button
    let playSprite = 'play';
    if (this.isPlaying) {
      playSprite = 'play_depressed';
    }
    let playColor = [1.0, 1.0, 1.0];
    if (this.clickables['play'].isHighlighted) {
      playColor = HIGHLIGHT_YELLOW;
    }
    if (!this.isPlayEnabled()) {
      playColor = DISABLED_GREY;
    }
    drawSprite({
      sprite: game.assets.textures['module_tapedeck_button_' + playSprite],
      color: playColor,
      position: this.position,
      width: 128,
      height: 128,
      depth: this.depth + 1,
    })

    // Load Button
    let loadSprite = 'load';
    if (this.isLoading) {
      playSprite = 'load_depressed';
    }
    let loadColor = [1.0, 1.0, 1.0];
    if (this.clickables['load'].isHighlighted) {
      loadColor = HIGHLIGHT_YELLOW;
    }
    if (!this.isLoadEnabled()) {
      loadColor = DISABLED_GREY;
    }
    drawSprite({
      sprite: game.assets.textures['module_tapedeck_button_' + loadSprite],
      color: loadColor,
      position: this.position,
      width: 128,
      height: 128,
      depth: this.depth + 1,
    })
  }
}
