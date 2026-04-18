import * as game from 'game'
import * as matrix from 'matrices'
import * as webgl from 'webgl'
import * as u from 'utils'
import * as vec2 from 'vector2'

export function drawSprite({
  sprite,
  color = [1.0, 1.0, 1.0],
  alpha = 1.0,
  position = [0, 0],
  width = 32,
  height = 32,
  depth = 100,
  centered = false,
  rotation = 0,
  stripsAnimationState = 256,
} = {}) {
  webgl.setTexture(sprite)
  webgl.set('color', [...color, alpha])
  webgl.set('stripsAnimationState', stripsAnimationState)
  webgl.set('modelMatrix', matrix.getTransformation({
    position: [
      u.map(position[0] + (centered ? 0 : width/2), 0, game.getWidth(), -1, 1),
      u.map(position[1] + (centered ? 0 : height/2), 0, game.getHeight(), 1, -1),
      convertDepth(depth),
    ],
    scale: rotation === Math.PI * 0.5 || rotation === Math.PI * 1.5 ? [-height / game.getHeight(), width / game.getWidth(), 1.0] : [width / game.getWidth(), -height / game.getHeight(), 1.0],
    rotation: [0, 0, rotation],
  }))

  webgl.drawScreen()
}

export function drawBackground({
  sprite,
  color = [1.0, 1.0, 1.0],
  alpha = 1.0,
  depth = 2,
  stripsAnimationState = 256,
} = {}) {
  const dSprite = sprite ?? game.assets.textures.square;

  webgl.setTexture(dSprite)
  webgl.set('color', [...color, alpha])
  webgl.set('stripsAnimationState', stripsAnimationState)
  webgl.set('modelMatrix', matrix.getTransformation({
    position: [0, 0, convertDepth(depth)],
    scale: [1.0, -1.0, 1.0],
  }))

  webgl.drawScreen()
}

export function drawText({
  text = "Test Text",
  color = [1.0, 1.0, 1.0],
  alpha = 1.0,
  depth = 2,
  position = [0, 0],
  scale = 1.0,
  stripsAnimationState = 256,
} = {}) {
  let translate = [0, 0];
  text = text.toString()


  for (const char of text) {
    if (char === '\n') {
      translate[0] = 0;
      translate[1] += 32;
      continue
    }

    if (char === ' ') {
      translate[0] += 28;
      continue
    }

    let imgName = null;

    if (char === '.') {
      imgName = 'letter_symbol_period';
    }

    if (char === '?') {
      imgName = 'letter_symbol_question_mark';
    }

    if (char === '!') {
      imgName = 'letter_symbol_exclamation_point';
    }

    if (char === ',') {
      imgName = 'letter_symbol_comma';
    }

    if (char === ':') {
      imgName = 'letter_symbol_colon';
    }

    if (char === "'") {
      imgName = 'letter_symbol_apostraphe';
    }

    if (char >= '0' && char <= '9') {
      imgName = 'letter_number_' + char;
    }

    const isUpperCase = char === char.toUpperCase() && char !== char.toLowerCase();
    const isLowerCase = char === char.toLowerCase() && char !== char.toUpperCase();
    if (isUpperCase) {
      imgName = 'letter_upper_' + char.toLowerCase();
    }
    if (isLowerCase) {
      imgName = 'letter_lower_' + char.toLowerCase();
    }

    if (char && imgName) {
      const img = game.assets.textures[imgName];
      drawSprite({
        sprite: img,
        position: vec2.add(position, vec2.scale(translate, scale)),
        color: color,
        alpha: alpha,
        stripsAnimationState: stripsAnimationState,
        width: 32 * scale,
        height: 32 * scale,
        depth: depth,
      });
      translate[0] += 20;
    }
    
  }
}

export function getTextHeight(text) {
  return text.split('\n').length * 32;
}

export function getTextWidth(text) {
  return Math.max(...text.split('\n').map(x => x.length)) * 20
}

function convertDepth(depth) {
  const near = game.getCamera3D().near;
  const far = game.getCamera3D().far;

  if (depth <= 0) {
    return far
  }
  return -(near + (1.0 / depth) * (far - near));
}
