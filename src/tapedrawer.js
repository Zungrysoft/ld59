import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText, getTextHeight } from './draw.js'
import Clickable from './clickable.js'
import { getTapeTranscribedCount, getTotalTranscribedCount } from './save.js'
import ModuleTapedeck from './module_tapedeck.js'
import { DISABLED_GREY, HIGHLIGHT_YELLOW } from './colors.js'

const TAPES_PER_PAGE = 12;

const BUTTON_POS_LEFT = [192, 119];
const BUTTON_POS_RIGHT = [192 + 32, 119];
const BUTTON_POS_CLOSE = [192 + 64, 119];
const BUTTON_SIZE = [32, 23];

export default class TapeDrawer extends Thing {
  page = 0
  clickables = []
  clickables2 = {}
  backgroundAlpha = 0
  depth = 60

  constructor() {
    super();
    game.setThingName(this, 'tapeDrawer')

    this.isOpen = false;

    this.tapes = [];
    this.position = [0, -200]
    
    for (const tapeKey in game.assets.data.tapes) {
      this.tapes.push({
        ...game.assets.data.tapes[tapeKey],
        id: tapeKey,
      });
    }

    this.tapes.sort((a, b) => a.pointsToUnlock - b.pointsToUnlock);

    for (let i = 0; i < TAPES_PER_PAGE; i ++) {
      const aabb = this.getTapeAabb(i);
      this.clickables.push(game.addThing(new Clickable(this, i, aabb)))
    }

    this.clickables2['left'] = game.addThing(new Clickable(this, 'left', [...BUTTON_POS_LEFT, ...vec2.add(BUTTON_POS_LEFT, BUTTON_SIZE)]))
    this.clickables2['right'] = game.addThing(new Clickable(this, 'right', [...BUTTON_POS_RIGHT, ...vec2.add(BUTTON_POS_RIGHT, BUTTON_SIZE)]))
    this.clickables2['close'] = game.addThing(new Clickable(this, 'close', [...BUTTON_POS_CLOSE, ...vec2.add(BUTTON_POS_CLOSE, BUTTON_SIZE)]))
  }

  getTapePos(i) {
    return [
      Math.floor(i/2) * 80,
      i % 2 === 0 ? 0 : 60,
    ];
  }

  getTapeAabb(i) {
    return [
      Math.floor(i/2) * 80,
      i % 2 === 0 ? 0 : 60,
      (Math.floor(i/2) + 1) * 80,
      i % 2 === 0 ? 60 : 120,
    ];
  }

  update() {
    const desiredY = this.isOpen ? 0 : -150;
    this.backgroundAlpha = u.map(Math.abs(this.position[1] - 0), 0, 100, 0.6, 0, true);
    this.position[1] = u.lerp(this.position[1], desiredY, 0.2);
  }

  open(tapePlayerModule) {
    this.isOpen = true
    this.tapePlayerModule = tapePlayerModule;
    soundmanager.playSound('drawer_open', 0.7, 1.0);
  }

  close() {
    this.isOpen = false
    soundmanager.playSound('drawer_close', 0.7, 1.0);
  }

  isChildClickable(i) {
    if (i === 'left') {
      return this.page > 0;
    }
    if (i === 'right') {
      return this.page < Math.ceil(this.tapes.length / 10) - 1;
    }
    if (i === 'close') {
      return true;
    }

    let ind = i + this.page * TAPES_PER_PAGE;

    if (ind >= this.tapes.length) {
      return false;
    }

    return this.isTapeHere(this.tapes[i].id)
  }

  onClickChild(i) {
    if (i === 'left') {
      this.page --;
      soundmanager.playSound('clack', 1.0, [0.5, 0.6]);
      return;
    }
    if (i === 'right') {
      this.page ++;
      soundmanager.playSound('clack', 1.0, [0.5, 0.6]);
      return;
    }
    if (i === 'close') {
      this.close();
      return;
    }

    let ind = i + this.page * TAPES_PER_PAGE;

    this.close();
    if (this.tapePlayerModule) {
      this.tapePlayerModule.loadTape(this.tapes[ind].id)
    }
  }

  isTapeUnlocked(tapeId) {
    const [totalTranscribedCount, _] = getTotalTranscribedCount();
    if (totalTranscribedCount < game.assets.data.tapes[tapeId].pointsToUnlock) {
      return false;
    }
    return true;
  }

  isTapeHere(tapeId) {
    if (!this.isTapeUnlocked(tapeId)) {
      return false;
    }

    for (const tapedeck of game.getThings().filter(x => x instanceof ModuleTapedeck)) {
      if (tapedeck.loadedTape === tapeId) {
        return false;
      }
    }

    return true;
  }

  draw() {
    drawSprite({
      sprite: game.assets.textures.tape_drawer,
      position: this.position,
      width: 480,
      height: 144,
      depth: this.depth,
    })
    drawBackground({
      color: [0, 0, 0],
      alpha: this.backgroundAlpha ?? 0,
      depth: this.depth-1,
    })

    drawSprite({
      sprite: game.assets.textures.button_left,
      position: vec2.add(this.position, BUTTON_POS_LEFT),
      width: 32,
      height: 32,
      depth: this.depth + 1,
      color: this.isChildClickable('left') ? (this.clickables2['left'].isHighlighted ? HIGHLIGHT_YELLOW : [1, 1, 1]) : DISABLED_GREY,
    })
    drawSprite({
      sprite: game.assets.textures.button_right,
      position: vec2.add(this.position, BUTTON_POS_RIGHT),
      width: 32,
      height: 32,
      depth: this.depth + 1,
      color: this.isChildClickable('right') ? (this.clickables2['right'].isHighlighted ? HIGHLIGHT_YELLOW : [1, 1, 1]) : DISABLED_GREY,
    })
    drawSprite({
      sprite: game.assets.textures.button_close,
      position: vec2.add(this.position, BUTTON_POS_CLOSE),
      width: 32,
      height: 32,
      depth: this.depth + 1,
      color: this.isChildClickable('close') ? (this.clickables2['close'].isHighlighted ? HIGHLIGHT_YELLOW : [1, 1, 1]) : DISABLED_GREY,
    })

    for (let i = 0; i < TAPES_PER_PAGE; i ++) {
      let ind = i + this.page * TAPES_PER_PAGE;

      if (ind >= this.tapes.length) {
        break;
      }

      if (this.isTapeUnlocked(this.tapes[ind].id)) {
        const [complete, total] = getTapeTranscribedCount(this.tapes[ind].id);
        if (total > 0) {
          drawText({
            text: `Transcriptions: ${complete}/${total}`,
            depth: this.depth + 3,
            color: complete === total ? [0.0, 1.0, 0.0] : [1.0, 1.0, 1.0],
            position: vec2.add(vec2.add(this.position, this.getTapePos(i)), [1, 51]),
          })
        }
      }

      if (!this.isTapeHere(this.tapes[ind].id)) {
        continue;
      }
      
      // Tape select
      drawSprite({
        sprite: game.assets.textures.tape,
        position: vec2.add(this.position, this.getTapePos(i)),
        width: 128,
        height: 128,
        depth: this.depth + 1,
      })
      drawSprite({
        sprite: game.assets.textures.tape_label_1,
        position: vec2.add(this.position, this.getTapePos(i)),
        width: 128,
        height: 128,
        color: this.tapes[ind].color_1,
        depth: this.depth + 1,
      })
      drawSprite({
        sprite: game.assets.textures.tape_label_2,
        position: vec2.add(this.position, this.getTapePos(i)),
        width: 128,
        height: 128,
        color: this.tapes[ind].color_2,
        depth: this.depth + 1,
      })
      if (this.clickables[i].isHighlighted) {
        drawSprite({
          sprite: game.assets.textures.tape_select,
          position: vec2.add(this.position, this.getTapePos(i)),
          width: 128,
          height: 128,
          depth: this.depth + 4,
        })
      }
      drawText({
        text: this.tapes[ind].title,
        depth: this.depth + 2,
        color: this.tapes[ind].color_3,
        position: vec2.add(vec2.add(this.position, this.getTapePos(i)), [9, 9]),
      })
    }
  }
}
