import * as game from 'game'
import * as u from 'utils'
import * as soundmanager from 'soundmanager'
import * as vec2 from 'vector2'
import * as vec3 from 'vector3'
import Thing from 'thing'
import { drawBackground, drawSprite, drawText, getTextHeight } from './draw.js'
import Guest from './guest.js'

export default class QuizClickable extends Thing {
  aabb = [0, 0, 0, 0]

  constructor(parent, question, option) {
    super();

    this.parent = parent;
    this.question = question;
    this.option = option;
  }

  onClick() {
    this.parent.clickedButton(this.question, this.option);
  }

  getAabb() {
    return this.aabb;
  }

  setAabb(position, width, height) {
    this.aabb[0] = position[0];
    this.aabb[1] = position[1];
    this.aabb[2] = position[0] + width;
    this.aabb[3] = position[1] + height;
  }

  isClickable() {
    return this.parent.getIsEnabled();
  }
}
