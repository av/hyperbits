(() => {
  const DATA = window.LAUNCH_DATA;
  const world = document.getElementById("launch-world");
  const hb = window.hyperbits;
  const DURATION = 38;
  const LENS = 1200;
  const WALL_CENTER = [0, 0, 2600];
  const WALL_RADIUS = 4000;
  const COLUMN_STEP = 530 / WALL_RADIUS;
  const ROW_STEP = 320;
  const ACCENT = "#ec8b49";

  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const easeCache = {};
  const ease = (name) => (easeCache[name] ||= gsap.parseEase(name));
  const progress = (time, start, duration, easing = "none") =>
    ease(easing)(clamp((time - start) / duration, 0, 1));
  const window01 = (time, start, end, fadeIn, fadeOut) =>
    Math.min(
      progress(time, start, fadeIn, "power2.out"),
      1 - progress(time, end - fadeOut, fadeOut, "power2.in"),
    );

  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const mix = (a, b, t) => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
  const length = (a) => Math.hypot(a[0], a[1], a[2]);
  const normalize = (a) => scale(a, 1 / (length(a) || 1));

  const quat = {
    axis(axis, angle) {
      const unit = normalize(axis);
      const half = Math.sin(angle / 2);
      return [
        unit[0] * half,
        unit[1] * half,
        unit[2] * half,
        Math.cos(angle / 2),
      ];
    },
    mul(a, b) {
      return [
        a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
      ];
    },
    slerp(a, b, t) {
      let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
      let end = b;
      if (dot < 0) {
        dot = -dot;
        end = b.map((value) => -value);
      }
      if (dot > 0.9995) {
        const out = a.map((value, index) => lerp(value, end[index], t));
        const size = Math.hypot(...out);
        return out.map((value) => value / size);
      }
      const theta = Math.acos(dot);
      const sinTheta = Math.sin(theta);
      const wa = Math.sin((1 - t) * theta) / sinTheta;
      const wb = Math.sin(t * theta) / sinTheta;
      return a.map((value, index) => value * wa + end[index] * wb);
    },
    matrix(q) {
      const [x, y, z, w] = q;
      return [
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
      ];
    },
  };
  const IDENTITY = [0, 0, 0, 1];
  const yaw = (angle) => quat.axis([0, 1, 0], angle);
  const pitch = (angle) => quat.axis([1, 0, 0], angle);
  const roll = (angle) => quat.axis([0, 0, 1], angle);

  function css(position, rotation, size) {
    const m = quat.matrix(rotation);
    const s = size;
    return `matrix3d(${m[0][0] * s},${m[1][0] * s},${m[2][0] * s},0,${m[0][1] * s},${m[1][1] * s},${m[2][1] * s},0,${m[0][2] * s},${m[1][2] * s},${m[2][2] * s},0,${position[0]},${position[1]},${position[2]},1)`;
  }

  function monotone(times, values) {
    const count = times.length;
    const slopes = [];
    for (let index = 0; index < count - 1; index += 1) {
      slopes.push(
        (values[index + 1] - values[index]) / (times[index + 1] - times[index]),
      );
    }
    const tangents = Array.from({ length: count }, () => 0);
    tangents[0] = slopes[0];
    tangents[count - 1] = slopes[count - 2];
    for (let index = 1; index < count - 1; index += 1) {
      tangents[index] =
        slopes[index - 1] * slopes[index] <= 0
          ? 0
          : (slopes[index - 1] + slopes[index]) / 2;
    }
    for (let index = 0; index < count - 1; index += 1) {
      if (slopes[index] === 0) {
        tangents[index] = 0;
        tangents[index + 1] = 0;
        continue;
      }
      const alpha = tangents[index] / slopes[index];
      const beta = tangents[index + 1] / slopes[index];
      const sum = alpha * alpha + beta * beta;
      if (sum > 9) {
        const tau = 3 / Math.sqrt(sum);
        tangents[index] = tau * alpha * slopes[index];
        tangents[index + 1] = tau * beta * slopes[index];
      }
    }
    return (time) => {
      if (time <= times[0]) return values[0];
      if (time >= times[count - 1]) return values[count - 1];
      let index = 0;
      while (time > times[index + 1]) index += 1;
      const span = times[index + 1] - times[index];
      const u = (time - times[index]) / span;
      const u2 = u * u;
      const u3 = u2 * u;
      return (
        (2 * u3 - 3 * u2 + 1) * values[index] +
        (u3 - 2 * u2 + u) * span * tangents[index] +
        (-2 * u3 + 3 * u2) * values[index + 1] +
        (u3 - u2) * span * tangents[index + 1]
      );
    };
  }

  function path(keys, field) {
    const times = keys.map((key) => key.t);
    const channels = [0, 1, 2].map((axis) =>
      monotone(
        times,
        keys.map((key) => key[field][axis]),
      ),
    );
    return (time) => channels.map((channel) => channel(time));
  }

  const bits = DATA.bits;
  const categories = DATA.categories;
  const tiles = [...document.querySelectorAll(".lv-tile")].map(
    (element, index) => {
      const bit = bits[index];
      return {
        element,
        bit,
        index,
        screen: element.querySelector(".lv-screen"),
        shade: element.querySelector(".lv-shade"),
        tint: element.querySelector(".lv-tint"),
        inspect: element.querySelector(".lv-inspect"),
        category: bit.category,
        within: bits
          .slice(0, index)
          .filter((other) => other.category === bit.category).length,
      };
    },
  );

  function wallSlot(index) {
    const column = Math.floor(index / 7);
    const row = index % 7;
    const angle = (column - 4) * COLUMN_STEP;
    const position = add(WALL_CENTER, [
      WALL_RADIUS * Math.sin(angle),
      (row - 3) * ROW_STEP,
      -WALL_RADIUS * Math.cos(angle),
    ]);
    const normal = [-Math.sin(angle), 0, Math.cos(angle)];
    return { position, rotation: yaw(-angle), normal, angle };
  }

  function wallPoint(angle, distance) {
    return add(WALL_CENTER, [
      (WALL_RADIUS - distance) * Math.sin(angle),
      0,
      -(WALL_RADIUS - distance) * Math.cos(angle),
    ]);
  }

  function tunnelSlot(index) {
    const angle = index * 2.39996 + 0.4;
    const radius = 780 + 360 * hb.random(`tunnel-radius-${index}`);
    const position = [
      radius * Math.cos(angle),
      radius * Math.sin(angle),
      16300 - index * 185,
    ];
    const tangent = [-Math.sin(angle), Math.cos(angle), 0];
    const rotation = quat.mul(
      quat.axis(tangent, 0.32),
      roll(hb.randomFloat(`tunnel-roll-${index}`, -0.18, 0.18)),
    );
    return {
      position,
      rotation,
      radial: [Math.cos(angle), Math.sin(angle), 0],
    };
  }

  const ICON_TRIANGLE = [
    [7.75, 10],
    [12, 2.8],
    [16.25, 10],
  ];
  const ICON_SQUARE = { x: 3, y: 14, size: 7 };
  const ICON_CIRCLE = { x: 17.5, y: 17.5, r: 3.5 };

  function triangleSpan(y) {
    const [left, apex, right] = ICON_TRIANGLE;
    if (y < apex[1] || y > left[1]) return null;
    const amount = (y - apex[1]) / (left[1] - apex[1]);
    return [lerp(apex[0], left[0], amount), lerp(apex[0], right[0], amount)];
  }

  function shapeCells(span, top, bottom, cellWidth, cellHeight, margin) {
    const cells = [];
    const rows = Math.floor((bottom - top - 2 * margin) / cellHeight);
    const offset = (bottom - top - rows * cellHeight) / 2;
    for (let row = 0; row < rows; row += 1) {
      const rowTop = top + offset + row * cellHeight;
      const a = span(rowTop);
      const b = span(rowTop + cellHeight);
      if (!a || !b) continue;
      const left = Math.max(a[0], b[0]) + margin;
      const right = Math.min(a[1], b[1]) - margin;
      const columns = Math.floor((right - left) / cellWidth);
      if (columns <= 0) continue;
      const start = (left + right) / 2 - (columns * cellWidth) / 2;
      for (let column = 0; column < columns; column += 1) {
        cells.push({
          x: start + (column + 0.5) * cellWidth,
          y: rowTop + cellHeight / 2,
        });
      }
    }
    return cells;
  }

  function mosaicCells(cellWidth) {
    const cellHeight = cellWidth * (270 / 480) * 1.06;
    const margin = 0.34;
    const square = (y) =>
      y >= ICON_SQUARE.y && y <= ICON_SQUARE.y + ICON_SQUARE.size
        ? [ICON_SQUARE.x, ICON_SQUARE.x + ICON_SQUARE.size]
        : null;
    const circle = (y) => {
      const dy = y - ICON_CIRCLE.y;
      if (Math.abs(dy) > ICON_CIRCLE.r) return null;
      const dx = Math.sqrt(ICON_CIRCLE.r * ICON_CIRCLE.r - dy * dy);
      return [ICON_CIRCLE.x - dx, ICON_CIRCLE.x + dx];
    };
    return [
      ...shapeCells(
        triangleSpan,
        ICON_TRIANGLE[1][1],
        ICON_TRIANGLE[0][1],
        cellWidth,
        cellHeight,
        margin,
      ),
      ...shapeCells(
        square,
        ICON_SQUARE.y,
        ICON_SQUARE.y + ICON_SQUARE.size,
        cellWidth,
        cellHeight,
        margin * 0.5,
      ),
      ...shapeCells(
        circle,
        ICON_CIRCLE.y - ICON_CIRCLE.r,
        ICON_CIRCLE.y + ICON_CIRCLE.r,
        cellWidth,
        cellHeight,
        margin * 0.5,
      ),
    ];
  }

  let mosaic = null;
  for (let width = 2.4; width > 0.6 && !mosaic; width -= 0.001) {
    const cells = mosaicCells(width);
    if (cells.length === tiles.length) mosaic = { cells, width };
  }
  for (let width = 2.4; width > 0.6 && !mosaic; width -= 0.001) {
    const cells = mosaicCells(width);
    if (cells.length >= tiles.length)
      mosaic = { cells: cells.slice(0, tiles.length), width };
  }

  const LOCKUP = { unit: 71, center: [-1253, -150, 0] };
  const iconToWorld = (x, y) => [
    LOCKUP.center[0] + (x - 12) * LOCKUP.unit,
    LOCKUP.center[1] + (y - 11.9) * LOCKUP.unit,
    0,
  ];
  const mosaicOrder = [...mosaic.cells]
    .map((cell, index) => ({ cell, index }))
    .sort((a, b) => a.cell.y - b.cell.y || a.cell.x - b.cell.x)
    .map((entry) => entry.cell);

  const DIVE_START = 11.2;
  const DIVE_LENGTH = 2.5;
  const diveIds = [
    "counter-confetti",
    "card-stack",
    "bauhaus-tiles",
    "pinwheel-grid",
  ];
  const dives = diveIds.map((id, order) => {
    const tile = tiles.find((entry) => entry.bit.id === id);
    const start = DIVE_START + order * DIVE_LENGTH;
    return { tile, start, arrive: start + 0.75, leave: start + 1.85 };
  });
  const carouselTile = tiles.find((entry) => entry.bit.id === "carousel");

  const TERMINAL = { position: [-241, -40, 480], rotation: yaw(0.14) };
  const CAROUSEL_SLOT = {
    position: [560, -40, 820],
    rotation: yaw(-0.22),
    size: 1.05,
  };

  function cameraKeys() {
    const keys = [
      { t: 0, pos: [70, -30, 17800], tgt: [0, 0, 16000] },
      { t: 1.0, pos: [40, -20, 11500], tgt: [0, 0, 9700] },
      { t: 2.0, pos: [10, -5, 5200], tgt: [0, 0, 3400] },
      { t: 2.7, pos: [0, 0, 2620], tgt: [0, 0, 0] },
      { t: 3.3, pos: [0, 0, 2060], tgt: [0, 0, 0] },
      { t: 5.0, pos: [0, 0, 1880], tgt: [0, 0, 0] },
      { t: 6.4, pos: [-420, -160, 2700], tgt: [0, 0, -1400] },
      { t: 8.2, pos: [380, -60, 2550], tgt: [0, 0, -1400] },
    ];
    const inspectAngles = [0.4, 0.05, -0.32];
    [8.9, 10.0, 11.0].forEach((t, index) => {
      keys.push({
        t,
        pos: add(wallPoint(inspectAngles[index], 2100), [0, -40, 0]),
        tgt: wallPoint(inspectAngles[index], 0),
      });
    });
    dives.forEach((dive, order) => {
      const slot = wallSlot(dive.tile.index);
      keys.push({
        t: dive.arrive,
        pos: add(slot.position, scale(slot.normal, 282)),
        tgt: slot.position,
      });
      keys.push({
        t: dive.leave,
        pos: add(slot.position, scale(slot.normal, 262)),
        tgt: slot.position,
      });
      const next = dives[order + 1];
      if (next) {
        const nextSlot = wallSlot(next.tile.index);
        const midAngle = (slot.angle + nextSlot.angle) / 2;
        const midY = (slot.position[1] + nextSlot.position[1]) / 2;
        keys.push({
          t: dive.leave + 0.33,
          pos: add(wallPoint(midAngle, 860), [0, midY, 0]),
          tgt: add(wallPoint(midAngle, 0), [0, midY, 0]),
        });
      }
    });
    keys.push(
      { t: 21.9, pos: [40, -90, 2050], tgt: [60, -40, 0] },
      { t: 28.2, pos: [170, -20, 1840], tgt: [130, -40, 0] },
      { t: 31.3, pos: [0, 0, 3000], tgt: [0, 0, 0] },
      { t: 38, pos: [0, 0, 2800], tgt: [0, 0, 0] },
    );
    return keys;
  }

  const keys = cameraKeys();
  const cameraPosition = path(keys, "pos");
  const cameraTarget = path(keys, "tgt");
  const cameraRoll = monotone([0, 2.3, 38], [-0.1, 0, 0]);

  function cameraAt(time) {
    const position = cameraPosition(time);
    const target = cameraTarget(time);
    const forward = normalize(sub(target, position));
    const rx = Math.asin(clamp(forward[1], -1, 1));
    const ry = Math.atan2(-forward[0], -forward[2]);
    const rz = cameraRoll(time);
    const orientation = quat.mul(quat.mul(yaw(ry), pitch(rx)), roll(rz));
    const inverse = quat.matrix([
      -orientation[0],
      -orientation[1],
      -orientation[2],
      orientation[3],
    ]);
    return { position, rx, ry, rz, inverse };
  }

  function depthOf(camera, point) {
    const relative = sub(point, camera.position);
    const m = camera.inverse;
    return -(
      m[2][0] * relative[0] +
      m[2][1] * relative[1] +
      m[2][2] * relative[2]
    );
  }

  function flightStart(tile) {
    return 3.05 + tile.category * 0.4 + tile.within * 0.035;
  }
  const FLIGHT = 1.75;
  const landing = categories.map((category, index) => {
    const members = tiles.filter((tile) => tile.category === index);
    return {
      first: Math.min(
        ...members.map((tile) => flightStart(tile) + FLIGHT * 0.8),
      ),
      last: Math.max(...members.map((tile) => flightStart(tile) + FLIGHT)),
    };
  });

  const SCAN_START = 8.55;
  const SCAN_END = 10.55;
  const SCAN_FROM = 0.72;
  const SCAN_TO = -0.72;
  const scanAt = (time) =>
    lerp(
      SCAN_FROM,
      SCAN_TO,
      progress(time, SCAN_START, SCAN_END - SCAN_START, "power1.inOut"),
    );
  const scanTimeFor = (angle) => {
    const target = (angle - SCAN_FROM) / (SCAN_TO - SCAN_FROM);
    let low = SCAN_START;
    let high = SCAN_END;
    for (let step = 0; step < 30; step += 1) {
      const mid = (low + high) / 2;
      if ((scanAt(mid) - SCAN_FROM) / (SCAN_TO - SCAN_FROM) < target) low = mid;
      else high = mid;
    }
    return low;
  };
  tiles.forEach((tile) => {
    tile.scanTime = scanTimeFor(wallSlot(tile.index).angle);
  });

  const scanLine = document.createElement("div");
  scanLine.style.cssText =
    "left:-4px;top:-1300px;width:8px;height:2600px;background-color:#4385be;box-shadow:0 0 40px 12px rgba(67,133,190,0.55);border-radius:4px;";
  world.appendChild(scanLine);

  const finaleStart = (tile, cellIndex) => 28.6 + cellIndex * 0.028;
  const FINALE_FLIGHT = 1.9;

  function tileState(tile, time) {
    const wall = wallSlot(tile.index);
    let position;
    let rotation;
    let size = 1;
    const start = flightStart(tile);
    if (time < start) {
      const tunnel = tunnelSlot(tile.index);
      position = tunnel.position;
      rotation = tunnel.rotation;
    } else if (time < start + FLIGHT) {
      const tunnel = tunnelSlot(tile.index);
      const amount = progress(time, start, FLIGHT, "power3.inOut");
      const control = add(scale(tunnel.radial, 2700), [0, 0, -300]);
      position = add(
        add(
          scale(tunnel.position, (1 - amount) ** 2),
          scale(control, 2 * amount * (1 - amount)),
        ),
        scale(wall.position, amount ** 2),
      );
      rotation = quat.slerp(
        tunnel.rotation,
        wall.rotation,
        progress(time, start, FLIGHT, "power2.inOut"),
      );
    } else {
      position = wall.position;
      rotation = wall.rotation;
    }
    if (tile === carouselTile && time >= 24.95) {
      const amount = progress(time, 24.95, 1.5, "expo.inOut");
      const lift = Math.sin(Math.PI * amount) * 700;
      position = add(mix(wall.position, CAROUSEL_SLOT.position, amount), [
        0,
        -lift * 0.4,
        lift,
      ]);
      rotation = quat.slerp(wall.rotation, CAROUSEL_SLOT.rotation, amount);
      size = lerp(1, CAROUSEL_SLOT.size, amount);
    }
    const cellIndex = tile.cellIndex;
    const begin = finaleStart(tile, tile.finaleOrder);
    if (time >= begin) {
      const cell = mosaicOrder[cellIndex];
      const target = iconToWorld(cell.x, cell.y);
      const targetSize = (mosaic.width * LOCKUP.unit * 0.95) / 480;
      const amount = progress(time, begin, FINALE_FLIGHT, "expo.inOut");
      const arc = Math.sin(Math.PI * amount);
      position = add(mix(position, target, amount), [0, -arc * 300, arc * 900]);
      rotation = quat.slerp(
        rotation,
        IDENTITY,
        progress(time, begin, FINALE_FLIGHT, "power3.inOut"),
      );
      size = lerp(size, targetSize, amount);
    }
    return { position, rotation, size };
  }

  const cellOrder = tiles.map((tile) => tile.index);
  tiles.forEach((tile, index) => {
    tile.cellIndex = cellOrder[index];
  });
  const finaleOrder = [...tiles].sort((a, b) => {
    const ca = iconToWorld(
      mosaicOrder[a.cellIndex].x,
      mosaicOrder[a.cellIndex].y,
    );
    const cb = iconToWorld(
      mosaicOrder[b.cellIndex].x,
      mosaicOrder[b.cellIndex].y,
    );
    return length(sub(ca, LOCKUP.center)) - length(sub(cb, LOCKUP.center));
  });
  finaleOrder.forEach((tile, order) => {
    tile.finaleOrder = order;
  });

  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("width", "240");
  icon.setAttribute("height", "240");
  icon.style.cssText =
    "left:-120px;top:-120px;width:240px;height:240px;overflow:visible;";
  icon.innerHTML = `
    <path pathLength="1" d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
    <rect pathLength="1" x="3" y="14" width="7" height="7" rx="1" />
    <circle pathLength="1" cx="17.5" cy="17.5" r="3.5" />`;
  icon.querySelectorAll("path,rect,circle").forEach((shape) => {
    shape.setAttribute("fill", "none");
    shape.setAttribute("stroke", ACCENT);
    shape.setAttribute("stroke-linecap", "round");
    shape.setAttribute("stroke-linejoin", "round");
    shape.setAttribute("stroke-dasharray", "1 1");
  });
  world.appendChild(icon);
  const iconShapes = [...icon.querySelectorAll("path,rect,circle")];

  const wordmark = document.getElementById("wordmark");
  wordmark.style.cssText = "left:0;top:0;width:0;height:0;";
  const wordColumn = document.createElement("div");
  wordColumn.style.cssText =
    "position:absolute;left:0;top:0;transform:translate(-50%,-50%);";
  const wordRow = document.createElement("div");
  wordRow.className = "lv-wordrow";
  const wordSub = document.createElement("div");
  wordSub.className = "lv-wordsub";
  wordSub.textContent = "62 motion bits for HyperFrames";
  wordColumn.append(wordRow, wordSub);
  const glyphs = [..."hyperbits"].map((character) => {
    const span = document.createElement("span");
    span.textContent = character;
    span.style.cssText = "display:inline-block;color:#fffcf0;";
    wordRow.appendChild(span);
    return span;
  });
  wordmark.appendChild(wordColumn);

  const BRAND = {
    word: [252, 48, 0],
    wordSize: 1.2,
    icon: [-1056, 5, 0],
    iconSize: 1.94,
  };
  const FINAL = { word: [780, -110, 0], wordSize: 1.56 };

  const hook = document.getElementById("hook");
  hook.innerHTML = "";
  const hookChars = [];
  [
    ["This is all ", ""],
    ["HTML", "em"],
    [".", ""],
  ].forEach(([text, className]) => {
    for (const character of text) {
      const span = document.createElement("span");
      span.textContent = character === " " ? " " : character;
      if (className) span.className = `lv-${className}`;
      hook.appendChild(span);
      hookChars.push(span);
    }
  });

  const total = document.getElementById("total");
  total.innerHTML = `<span class="lv-num">0</span> bits · 7 categories`;
  const totalNumber = total.querySelector(".lv-num");
  const legend = document.getElementById("legend");
  const legendItems = categories.map((category) => {
    const item = document.createElement("div");
    item.className = "lv-item";
    item.innerHTML = `<span class="lv-swatch" style="background-color:${category.color}"></span><span>${category.label}</span><span class="lv-count">0</span>`;
    legend.appendChild(item);
    return { item, count: item.querySelector(".lv-count"), category };
  });

  const inspectHeadline = document.getElementById("inspect-headline");
  inspectHeadline.innerHTML = `Every tile is a live <span class="lv-em">HTML</span> composition.`;

  const diveLabel = document.getElementById("dive-label");
  const diveSwatch = diveLabel.querySelector(".lv-swatch");
  const diveName = diveLabel.querySelector(".lv-name");
  const diveCategory = diveLabel.querySelector(".lv-cat");

  const agentHeadline = document.getElementById("agent-headline");
  agentHeadline.innerHTML = `Your agent already <span class="lv-em">knows how.</span>`;
  const chips = document.getElementById("chips");
  const chipItems = ["MCP server", "CLI", "Agent skill"].map((label) => {
    const chip = document.createElement("div");
    chip.className = "lv-chip";
    chip.innerHTML = `<i>+</i>${label}`;
    chips.appendChild(chip);
    return chip;
  });

  const cta = document.getElementById("cta");
  cta.innerHTML = `<div class="lv-url">hyperbits.dev</div><div class="lv-repo">github.com/av/hyperbits · MIT</div><div class="lv-meta">This video is a hyperbits composition: 62 live bits in one HTML page.</div>`;
  const ctaLines = [...cta.children];
  const vignette = document.getElementById("vignette");

  const terminal = document.getElementById("terminal");
  const terminalBody = document.getElementById("terminal-body");
  const LINES = [
    {
      at: 21.9,
      type: 0.9,
      parts: [
        ["prompt", "› "],
        ["hit", "add a 3D carousel to my launch video"],
      ],
    },
    {
      at: 23.0,
      type: 0.45,
      parts: [
        ["call", "● "],
        ["call", "hyperbits find "],
        ["call", '<i>"3d carousel"</i>'],
      ],
    },
    {
      at: 23.55,
      parts: [
        ["dim", "  1. "],
        ["hit", "carousel     "],
        ["dim", "Rotating carousel of cards in 3D space"],
      ],
    },
    {
      at: 23.67,
      parts: [
        ["dim", "  2. "],
        ["dim", "3d-basic     3D camera transitions between steps"],
      ],
    },
    {
      at: 23.79,
      parts: [
        ["dim", "  3. "],
        ["dim", "3d-elements  Arbitrary elements in 3D space"],
      ],
    },
    {
      at: 24.15,
      type: 0.5,
      parts: [
        ["call", "● "],
        ["call", "hyperbits add carousel --into compositions/"],
      ],
    },
    { at: 24.75, parts: [["dim", "  Wrote compositions/carousel.html"]] },
    { at: 24.87, parts: [["dim", "  Wrote compositions/hyperbits.iife.js"]] },
    {
      at: 26.0,
      type: 0.5,
      parts: [
        ["ok", "✓ "],
        ["hit", "carousel is on the timeline at 0:12"],
      ],
    },
  ];
  const lineElements = LINES.map(() => {
    const line = document.createElement("div");
    line.className = "lv-line";
    terminalBody.appendChild(line);
    return line;
  });
  const lineCache = LINES.map(() => "");

  function plainLength(text) {
    return text.replace(/<[^>]+>/g, "").length;
  }

  function sliceMarkup(text, count) {
    let out = "";
    let visible = 0;
    let index = 0;
    while (index < text.length && visible < count) {
      if (text[index] === "<") {
        const close = text.indexOf(">", index);
        out += text.slice(index, close + 1);
        index = close + 1;
        continue;
      }
      out += text[index];
      visible += 1;
      index += 1;
    }
    const openings =
      (out.match(/<i>/g) || []).length - (out.match(/<\/i>/g) || []).length;
    return out + "</i>".repeat(Math.max(0, openings));
  }

  function renderTerminal(time) {
    LINES.forEach((line, index) => {
      const totalChars = line.parts.reduce(
        (sum, [, text]) => sum + plainLength(text),
        0,
      );
      const shown = line.type
        ? Math.floor(clamp((time - line.at) / line.type, 0, 1) * totalChars)
        : time >= line.at
          ? totalChars
          : 0;
      const typing = line.type && time >= line.at && shown < totalChars;
      const lastTyped = LINES.reduce(
        (last, entry, entryIndex) =>
          entry.type && time >= entry.at ? entryIndex : last,
        -1,
      );
      const cursor =
        (typing ||
          (index === lastTyped &&
            Math.floor(time * 2.2) % 2 === 0 &&
            time < 28.3)) &&
        time >= line.at;
      let remaining = shown;
      let markup = "";
      for (const [className, text] of line.parts) {
        if (remaining <= 0) break;
        const size = plainLength(text);
        markup += `<span class="lv-${className}">${sliceMarkup(text, remaining)}</span>`;
        remaining -= size;
      }
      if (cursor) markup += `<span class="lv-cursor"></span>`;
      if (markup !== lineCache[index]) {
        lineElements[index].innerHTML = markup;
        lineCache[index] = markup;
      }
    });
  }

  function place(element, camera, position, rotation, size, minimumDepth = 60) {
    const depth = depthOf(camera, position);
    if (depth < minimumDepth) {
      element.style.visibility = "hidden";
      return depth;
    }
    element.style.visibility = "visible";
    element.style.transform = css(position, rotation, size);
    return depth;
  }

  function render(time) {
    const camera = cameraAt(time);
    world.style.transform = `translateZ(${LENS}px) rotateZ(${-camera.rz}rad) rotateX(${-camera.rx}rad) rotateY(${-camera.ry}rad) translate3d(${-camera.position[0]}px,${-camera.position[1]}px,${-camera.position[2]}px)`;

    const activeDive = dives.find(
      (dive) => time >= dive.start - 0.2 && time < dive.start + DIVE_LENGTH,
    );
    const agentDim = window01(time, 21.2, 28.9, 0.8, 0.6);

    tiles.forEach((tile) => {
      const state = tileState(tile, time);
      const depth = place(
        tile.element,
        camera,
        state.position,
        state.rotation,
        state.size,
        40,
      );
      const fog = clamp((depth - 5200) / 9000, 0, 0.7);
      let dim = fog;
      if (activeDive && activeDive.tile !== tile)
        dim = Math.max(
          dim,
          0.45 *
            window01(
              time,
              activeDive.start - 0.2,
              activeDive.start + DIVE_LENGTH,
              0.5,
              0.5,
            ),
        );
      if (tile !== carouselTile) dim = Math.max(dim, 0.72 * agentDim);
      tile.shade.style.opacity = dim.toFixed(3);
      const landed = finaleStart(tile, tile.finaleOrder) + FINALE_FLIGHT * 0.7;
      tile.tint.style.opacity = (
        0.42 * progress(time, landed, 0.8, "power2.out")
      ).toFixed(3);
      const inspected =
        progress(time, tile.scanTime, 0.22, "power2.out") *
        (1 - progress(time, 10.95, 0.35, "power2.in"));
      tile.inspect.style.opacity = inspected.toFixed(3);
      tile.inspect.style.transform = `scale(${lerp(1.08, 1, inspected)})`;
    });

    const scanVisible = window01(
      time,
      SCAN_START - 0.1,
      SCAN_END + 0.1,
      0.15,
      0.2,
    );
    const scanAngle = scanAt(time);
    if (scanVisible > 0) {
      place(
        scanLine,
        camera,
        add(WALL_CENTER, [
          (WALL_RADIUS - 30) * Math.sin(scanAngle),
          0,
          -(WALL_RADIUS - 30) * Math.cos(scanAngle),
        ]),
        yaw(-scanAngle),
        1,
      );
    } else scanLine.style.visibility = "hidden";
    scanLine.style.opacity = scanVisible.toFixed(3);

    const brandOut = progress(time, 5.0, 0.8, "power2.in");
    iconShapes.forEach((shape, index) => {
      const local =
        time < 20
          ? progress(time, 2.35 + index * 0.12, 0.85, "power2.inOut")
          : progress(time, 30.6 + index * 0.15, 1.1, "power2.inOut");
      shape.setAttribute("stroke-dasharray", local >= 1 ? "none" : "1 1");
      shape.setAttribute("stroke-dashoffset", (1 - local).toFixed(4));
      shape.setAttribute("stroke-width", time < 20 ? "1.6" : "0.32");
    });
    if (time < 20) {
      const iconLift = brandOut * 900;
      const iconPos = add(BRAND.icon, [0, -iconLift, -brandOut * 400]);
      const visible = time >= 2.3 && brandOut < 1;
      icon.style.opacity = visible ? (1 - brandOut).toFixed(3) : "0";
      if (visible)
        place(
          icon,
          camera,
          iconPos,
          quat.mul(
            pitch(brandOut * 0.6),
            yaw(lerp(-0.5, 0, progress(time, 2.35, 1.1, "expo.out"))),
          ),
          BRAND.iconSize,
        );
      else icon.style.visibility = "hidden";
    } else {
      const iconWorld = iconToWorld(12, 12);
      icon.style.opacity = time >= 30.5 ? "1" : "0";
      place(icon, camera, iconWorld, IDENTITY, (24 * LOCKUP.unit) / 240);
    }

    const wordVisible = (time >= 2.4 && time < 6) || time >= 30.7;
    if (wordVisible) {
      const finale = time >= 30.7;
      const anchor = finale ? FINAL.word : BRAND.word;
      place(
        wordmark,
        camera,
        anchor,
        IDENTITY,
        finale ? FINAL.wordSize : BRAND.wordSize,
      );
      glyphs.forEach((glyph, index) => {
        let y = 0;
        let z = 0;
        let rx = 0;
        let opacity = 1;
        if (!finale) {
          const enter = progress(time, 2.55 + index * 0.045, 0.9, "expo.out");
          const exit = progress(time, 5.0 + index * 0.03, 0.7, "power3.in");
          y = lerp(160, 0, enter) - exit * 700;
          z = lerp(-900, 0, enter) + exit * 300;
          rx = lerp(-70, 0, enter) + exit * 50;
          opacity = Math.min(
            progress(time, 2.55 + index * 0.045, 0.35),
            1 - exit,
          );
        } else {
          const enter = progress(time, 31.1 + index * 0.05, 1.0, "expo.out");
          y = lerp(120, 0, enter);
          z = lerp(-600, 0, enter);
          rx = lerp(-60, 0, enter);
          opacity = progress(time, 31.1 + index * 0.05, 0.4);
        }
        glyph.style.transform = `translate3d(0,${y}px,${z}px) rotateX(${rx}deg)`;
        glyph.style.opacity = opacity.toFixed(3);
      });
      const subIn = finale
        ? progress(time, 32.0, 0.9, "expo.out")
        : progress(time, 3.15, 0.9, "expo.out");
      const subOut = finale ? 0 : progress(time, 4.85, 0.35, "power2.in");
      wordSub.style.opacity = Math.min(subIn, 1 - subOut).toFixed(3);
      wordSub.style.transform = `translate3d(0,${lerp(40, 0, subIn) - subOut * 60}px,0)`;
      wordmark.style.visibility = "visible";
    } else wordmark.style.visibility = "hidden";

    hookChars.forEach((char, index) => {
      const enter = progress(time, 0.12 + index * 0.032, 0.7, "expo.out");
      const centre = Math.abs(index - (hookChars.length - 1) / 2);
      const exit = progress(time, 2.0 + centre * 0.018, 0.45, "power2.in");
      const opacity = Math.min(
        progress(time, 0.12 + index * 0.032, 0.3),
        1 - exit,
      );
      char.style.opacity = opacity.toFixed(3);
      char.style.transform = `translate3d(${(index - (hookChars.length - 1) / 2) * exit * 40}px,${lerp(70, 0, enter)}px,${exit * 500}px) rotateX(${lerp(-85, 0, enter)}deg)`;
      char.style.filter =
        exit > 0 ? `blur(${(exit * 14).toFixed(2)}px)` : "none";
    });
    vignette.style.opacity = (1 - progress(time, 2.0, 0.6)).toFixed(3);
    const legendShow = window01(time, 5.8, 8.45, 0.5, 0.35);
    legend.style.opacity = legendShow.toFixed(3);
    legend.style.transform = `translateX(-50%) translateY(${lerp(30, 0, progress(time, 5.8, 0.7, "expo.out"))}px)`;
    let landed = 0;
    legendItems.forEach((entry, index) => {
      const range = landing[index];
      const count = Math.round(
        entry.category.count *
          progress(time, range.first - 0.1, range.last - range.first + 0.1),
      );
      landed += count;
      entry.count.textContent = String(count);
      const lit = progress(time, range.first - 0.1, 0.3, "power2.out");
      entry.item.style.opacity = lerp(0.35, 1, lit).toFixed(3);
      entry.item.style.borderColor =
        lit > 0.5 ? entry.category.color : "#343331";
    });
    total.style.opacity = legendShow.toFixed(3);
    total.style.transform = `translateX(-50%) translateY(${lerp(-24, 0, progress(time, 5.8, 0.7, "expo.out"))}px)`;
    totalNumber.textContent = String(landed);

    const inspectShow = window01(time, 8.6, 11.0, 0.5, 0.35);
    inspectHeadline.style.opacity = inspectShow.toFixed(3);
    inspectHeadline.style.transform = `translateY(${lerp(-24, 0, progress(time, 8.6, 0.7, "expo.out"))}px)`;

    const labelDive = dives.find(
      (dive) => time >= dive.arrive - 0.3 && time < dive.leave + 0.35,
    );
    if (labelDive) {
      const show = window01(
        time,
        labelDive.arrive - 0.25,
        labelDive.leave + 0.3,
        0.35,
        0.25,
      );
      const category = categories[labelDive.tile.category];
      diveSwatch.style.backgroundColor = category.color;
      diveName.textContent = labelDive.tile.bit.id;
      diveCategory.textContent = category.label;
      diveLabel.style.opacity = show.toFixed(3);
      diveLabel.style.transform = `translateX(${lerp(-40, 0, progress(time, labelDive.arrive - 0.25, 0.5, "expo.out"))}px)`;
    } else diveLabel.style.opacity = "0";

    const terminalIn = progress(time, 20.9, 1.1, "expo.out");
    const terminalOut = progress(time, 28.4, 0.9, "power3.in");
    if (time >= 20.9 && terminalOut < 1) {
      const position = add(TERMINAL.position, [
        lerp(-500, 0, terminalIn) - terminalOut * 900,
        lerp(200, 0, terminalIn) + terminalOut * 300,
        lerp(-1400, 0, terminalIn) - terminalOut * 2400,
      ]);
      const rotation = quat.mul(
        TERMINAL.rotation,
        quat.mul(
          yaw(lerp(0.6, 0, terminalIn) + terminalOut * 0.5),
          pitch(lerp(0.25, 0, terminalIn)),
        ),
      );
      place(terminal, camera, position, rotation, 1);
      terminal.style.opacity = Math.min(
        terminalIn * 1.4,
        1 - terminalOut,
      ).toFixed(3);
      renderTerminal(time);
    } else terminal.style.visibility = "hidden";

    const agentShow = window01(time, 21.9, 28.4, 0.6, 0.35);
    agentHeadline.style.opacity = agentShow.toFixed(3);
    agentHeadline.style.transform = `translateY(${lerp(-24, 0, progress(time, 21.9, 0.7, "expo.out"))}px)`;
    chipItems.forEach((chip, index) => {
      const show = window01(time, 26.2 + index * 0.14, 28.4, 0.45, 0.3);
      chip.style.opacity = show.toFixed(3);
      chip.style.transform = `translateY(${lerp(30, 0, progress(time, 26.2 + index * 0.14, 0.6, "expo.out"))}px)`;
    });

    const scrimTop = Math.max(legendShow, inspectShow, agentShow);
    const scrimBottom = Math.max(legendShow, agentShow);
    document.getElementById("scrim-top").style.opacity = scrimTop.toFixed(3);
    document.getElementById("scrim-bottom").style.opacity =
      scrimBottom.toFixed(3);
    ctaLines.forEach((line, index) => {
      const start = 32.7 + index * 0.25;
      line.style.opacity = progress(time, start, 0.5).toFixed(3);
      line.style.transform = `translateY(${lerp(24, 0, progress(time, start, 0.8, "expo.out"))}px)`;
    });
  }

  const timeline = gsap.timeline({ paused: true });
  const clock = { time: 0 };
  timeline.to(
    clock,
    {
      time: DURATION,
      duration: DURATION,
      ease: "none",
      onUpdate: () => render(timeline.time()),
    },
    0,
  );
  window.__timelines = window.__timelines || {};
  window.__timelines.launch = timeline;
  render(0);
})();
