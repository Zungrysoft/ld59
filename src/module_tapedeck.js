import * as game from 'game'
import * as u from 'utils'
import * as vec2 from 'vector2'
import * as soundmanager from 'soundmanager'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText } from './draw.js'
import Module from './module.js'
import Clickable from './clickable.js'
import { DISABLED_GREY, HIGHLIGHT_YELLOW } from './colors.js'

const REWIND_SPEED_MULTIPLIER = 6;

export default class ModuleTapedeck extends Module {
  width = 96
  height = 46
  sprite = 'module_tapedeck'
  outputHeight = 24
  parameters = {}
  
  loadedTape = null
  isPlaying = false
  loadTime = 0
  isRewinding = false
  isAtStartOfTape = true
  isAtEndOfTape = false

  constructor(nodeId, position) {
    super(nodeId, position);

    this.init();
  }

  update() {
    super.update();

    this.loadTime --;
    
    if (this.isRewinding) {
      const offset = game.globals.audioSystem?.playState?.get(this.nodeId)?.offset;
      if (offset <= REWIND_SPEED_MULTIPLIER / 60) {
        game.globals.audioSystem.playState.get(this.nodeId).offset = 0;
        this.isAtStartOfTape = true;
        this.endRewind();
      }
      else {
        game.globals.audioSystem.playState.get(this.nodeId).offset -= REWIND_SPEED_MULTIPLIER / 60;
      }
    }

    // Check for song ended
    if (this.isPlaying) {
      const playState = game.globals.audioSystem?.playState?.get(this.nodeId);
      if (playState && (!playState.playing)) {
        this.endPlay();
        this.isAtEndOfTape = true;
      }
    }
  }

  endRewind() {
    if (this.isRewinding) {
      soundmanager.playSound(['switchloud4'], 1.0, [0.9, 1.0]);
    }
    this.isRewinding = false;
    game.assets.sounds.rewind.pause();
  }

  endPlay() {
    if (this.isPlaying) {
      soundmanager.playSound(['switchloud1', 'switchloud2'], 1.0, [0.9, 1.1]);
    }
    this.isPlaying = false;
    game.assets.sounds.play.pause();
  }

  init() {
    super.init();

    // Spawn button clickables
    this.clickables['play'] = game.addThing(new Clickable(this, 'play', [28, 16, 49, 32]));
    this.clickables['rewind'] = game.addThing(new Clickable(this, 'rewind', [9, 16, 25, 32]));
    this.clickables['load'] = game.addThing(new Clickable(this, 'load', [52, 16, 65, 32]));
  }

  isPlayEnabled() {
    return !game.getThing('tapeDrawer')?.isOpen && !game.globals.connectingModule && this.loadedTape && this.loadTime <= 0 && !this.isAtEndOfTape;
  }

  isLoadEnabled() {
    return !game.getThing('tapeDrawer')?.isOpen && !game.globals.connectingModule && !this.isPlaying && this.loadTime <= 0 && !this.isRewinding;
  }

  isRewindEnabled() {
    return !game.getThing('tapeDrawer')?.isOpen && !game.globals.connectingModule && this.loadedTape && this.loadTime <= 0 && !this.isAtStartOfTape;
  }

  isChildClickable(key) {
    if (key === 'play') {
      return this.isPlayEnabled();
    }
    if (key === 'rewind') {
      return this.isRewindEnabled();
    }
    if (key === 'load') {
      return this.isLoadEnabled();
    }

    return super.isChildClickable(key);
  }

  onClickChild(key) {
    if (key === 'play') {
      if (this.isPlaying) {
        this.endPlay();
        this.isPlaying = false;
        if (game.globals.audioSystem) {
          game.globals.audioSystem.pause(this.nodeId);
        }
      }
      else {
        soundmanager.playSound(['switch2'], 1.0, [0.9, 1.1]);
        soundmanager.playSound(['play'], 0.4, 1.0);
        game.assets.sounds.play.loop = true
        this.isPlaying = true;
        this.isRewinding = false;
        this.endRewind();
        this.isAtStartOfTape = false;
        if (game.globals.audioSystem) {
          const tape = game.assets.data.tapes[this.loadedTape].tape;
          game.globals.audioSystem.playSound(game.assets.tapes[tape], this.nodeId);
        }
      }
    }
    else if (key === 'rewind') {
      if (game.globals.audioSystem) {
        game.globals.audioSystem.pause(this.nodeId);
      }

      if (this.isRewinding) {
        this.endRewind();
      }
      else {
        this.isRewinding = true;
        this.endPlay();
        soundmanager.playSound(['switchloud3'], 1.0, [0.9, 1.1]);
        soundmanager.playSound(['rewind'], 1.0, 1.0);
        game.assets.sounds.rewind.loop = true
        this.isAtEndOfTape = false;
      }
    }
    else if (key === 'load') {
      game.getThing('tapeDrawer').open(this);
    }
    else {
      super.onClickChild(key);
    }
  }

  loadTape(tapeId) {
    this.loadTime = 85;
    this.loadedTape = tapeId;
    game.globals.audioSystem.reset(this.nodeId);
    soundmanager.playSound('load', 1.0, [0.9, 1.1]);
    this.isAtEndOfTape = false;
    this.isAtStartOfTape = true;

    const tray = document.getElementById("tray");
    tray.setNewTapeData(game.assets.data.tapes[tapeId], tapeId);
  }

  draw() {
    super.draw();

    // Rewind Button
    let rewindSprite = 'rewind';
    if (this.isRewinding) {
      rewindSprite = 'rewind_depressed';
    }
    let rewindColor = [1.0, 1.0, 1.0];
    if (this.clickables['rewind'].isHighlighted) {
      rewindColor = HIGHLIGHT_YELLOW;
    }
    if (!this.isRewindEnabled()) {
      rewindColor = DISABLED_GREY;
    }
    drawSprite({
      sprite: game.assets.textures['module_tapedeck_button_' + rewindSprite],
      color: rewindColor,
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
