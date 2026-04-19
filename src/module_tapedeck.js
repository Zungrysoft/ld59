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
  loadTime = 0
  restartTime = 0
  isAtStartOfTape = true
  isAtEndOfTape = false

  constructor(nodeId, position) {
    super(nodeId, position);

    this.init();
  }

  update() {
    super.update();

    this.loadTime --;
    this.restartTime --;

    if (this.restartTime === 0) {
      soundmanager.playSound(['switchloud4'], 1.0, [0.9, 1.0]);
      game.assets.sounds.rewind.pause();
    }

    // Check for song ended
    if (this.isPlaying) {
      const playState = game.globals.audioSystem?.playState?.get(this.nodeId);
      if (playState) {
        console.log(playState?.offset)
      }
      if (playState && (!playState.playing)) {
        soundmanager.playSound(['switchloud1', 'switchloud2'], 1.0, [0.9, 1.1]);
        this.isPlaying = false;
        this.isAtEndOfTape = true;
      }
    }
  }

  init() {
    super.init();

    // Spawn button clickables
    this.clickables['play'] = game.addThing(new Clickable(this, 'play', [28, 16, 49, 32]));
    this.clickables['restart'] = game.addThing(new Clickable(this, 'restart', [9, 16, 25, 32]));
    this.clickables['load'] = game.addThing(new Clickable(this, 'load', [52, 16, 65, 32]));
  }

  isPlayEnabled() {
    return !game.globals.isConnecting && this.loadedTape && this.loadTime <= 0 && this.restartTime <= 0 && !this.isAtEndOfTape;
  }

  isLoadEnabled() {
    return !game.globals.isConnecting && !this.isPlaying && this.loadTime <= 0 && this.restartTime <= 0;
  }

  isRestartEnabled() {
    return !game.globals.isConnecting && this.loadedTape && this.loadTime <= 0 && this.restartTime <= 0 && !this.isAtStartOfTape;
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
      if (this.isPlaying) {
        soundmanager.playSound(['switchloud1', 'switchloud2'], 1.0, [0.9, 1.1]);
        this.isPlaying = false;
        if (game.globals.audioSystem) {
          game.globals.audioSystem.pause(this.nodeId);
        }
      }
      else {
        soundmanager.playSound(['switch2'], 1.0, [0.9, 1.1]);
        this.isPlaying = true;
        this.isAtStartOfTape = false;
        if (game.globals.audioSystem) {
          const tape = game.assets.data.tapes[this.loadedTape].tape;
          game.globals.audioSystem.playSound(game.assets.tapes[tape], this.nodeId);
        }
      }
    }
    else if (key === 'restart') {
      if (game.globals.audioSystem) {
        game.globals.audioSystem.pause(this.nodeId);
        this.restartTime = Math.floor(u.map(game.globals.audioSystem.playState.get(this.nodeId).offset, 0, 45, 25, 240, true));
        if (this.isAtEndOfTape) {
          this.restartTime = 240;
        }
        game.globals.audioSystem.reset(this.nodeId);
      }
      else {
        this.restartTime = 30;
      }
      
      this.isPlaying = false;
      this.isAtStartOfTape = true;
      soundmanager.playSound(['switchloud3'], 1.0, [0.9, 1.1]);
      soundmanager.playSound(['rewind'], 1.0, 1.0);
      this.isAtEndOfTape = false;
    }
    else if (key === 'load') {
      this.loadTime = 85;
      this.loadedTape = 'test';
      game.globals.audioSystem.reset(this.nodeId);
      soundmanager.playSound('load', 1.0, [0.9, 1.1]);
      this.isAtEndOfTape = false;
      this.isAtStartOfTape = true;
    }
    else {
      super.onClickChild(key);
    }
  }

  draw() {
    super.draw();

    // Restart Button
    let restartSprite = 'restart';
    if (this.restartTime > 0) {
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
    if (this.loadTime <= 0) {
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

    // Label
    if (this.loadedTape && this.loadTime <= 0) {
      drawSprite({
        sprite: game.assets.textures.module_tapedeck_label_1,
        color: game.assets.data.tapes[this.loadedTape].color_1,
        position: this.position,
        width: 128,
        height: 128,
        depth: this.depth + 1,
      })
      drawSprite({
        sprite: game.assets.textures.module_tapedeck_label_2,
        color: game.assets.data.tapes[this.loadedTape].color_2,
        position: this.position,
        width: 128,
        height: 128,
        depth: this.depth + 1,
      })
      drawText({
        text:  game.assets.data.tapes[this.loadedTape].title,
        color: game.assets.data.tapes[this.loadedTape].color_3,
        position: vec2.add(this.position, [7, 35]),
        depth: this.depth + 2,
      })
    }
  }
}
