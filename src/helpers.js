export function rectToPolygonDistance(polygon, rect) {
  const [ rx1, ry1, rx2, ry2 ] = rect;
  const corners = [
    [rx1, ry1],
    [rx2, ry1],
    [rx2, ry2],
    [rx1, ry2],
  ];

  function isPointInPolygon(p, poly) {
    let [px, py] = p;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      let [xi, yi] = poly[i];
      let [xj, yj] = poly[j];
      let intersect = ((yi > py) !== (yj > py)) &&
                      (px < (xj - xi) * (py - yi) / (yj - yi + 1e-10) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function distanceAndDirectionToSegment(p, a, b) {
    let [px, py] = p;
    let [ax, ay] = a;
    let [bx, by] = b;

    let abx = bx - ax;
    let aby = by - ay;
    let apx = px - ax;
    let apy = py - ay;

    let abLenSq = abx * abx + aby * aby;
    let t = ((apx * abx + apy * aby) / (abLenSq || 1));
    t = Math.max(0, Math.min(1, t));

    let closestX = ax + t * abx;
    let closestY = ay + t * aby;

    let dx = closestX - px;
    let dy = closestY - py;
    let dist = Math.sqrt(dx * dx + dy * dy);
    let length = dist || 1;
    return {
      distance: dist,
      direction: [dx / length, dy / length]
    };
  }

  let maxDist = 0;
  let finalDirection = [0, 0];

  for (let corner of corners) {
    if (!isPointInPolygon(corner, polygon)) {
      let minDist = Infinity;
      let bestDirection = [0, 0];

      for (let i = 0; i < polygon.length; i++) {
        let a = polygon[i];
        let b = polygon[(i + 1) % polygon.length];
        let { distance, direction } = distanceAndDirectionToSegment(corner, a, b);
        if (distance < minDist) {
          minDist = distance;
          bestDirection = direction;
        }
      }

      if (minDist > maxDist) {
        maxDist = minDist;
        finalDirection = bestDirection;
      }
    }
  }

  return maxDist > 0 ? [ maxDist, finalDirection ] : [0, [1, 0]];
}

export function aabbIou(a, b) {
  const [ax1, ay1, ax2, ay2] = a;
  const [bx1, by1, bx2, by2] = b;

  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interW = Math.max(0, interX2 - interX1);
  const interH = Math.max(0, interY2 - interY1);
  const interArea = interW * interH;

  const areaA = Math.max(0, ax2 - ax1) * Math.max(0, ay2 - ay1);
  const areaB = Math.max(0, bx2 - bx1) * Math.max(0, by2 - by1);

  const unionArea = areaA + areaB - interArea;

  return unionArea === 0 ? 0 : interArea / unionArea;
}
