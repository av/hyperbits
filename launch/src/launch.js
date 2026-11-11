(() => {
  const DATA = window.LAUNCH_DATA;
  const TIMING = DATA.timing;
  const hb = window.hyperbits;
  const world = document.getElementById("launch-world");
  const stage = document.getElementById("launch-stage");
  const hud = document.getElementById("launch-hud");
  const DURATION = TIMING.duration;
  const PRIMARY = "#ec8b49";
  const COLUMNS = 9;
  const ROWS = 7;
  const PITCH_X = 520;
  const PITCH_Y = 310;
  const HERO_ID = "halftone-sweep";
  const HERO_SLOT = 31;
  const GITHUB_MARK =
    "M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z";

  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const easeCache = {};
  const ease = (name) => (easeCache[name] ||= gsap.parseEase(name));
  const progress = (time, start, duration, easing = "none") =>
    ease(easing)(clamp((time - start) / duration, 0, 1));
  const span = (time, start, end, fadeIn, fadeOut) =>
    Math.min(
      progress(time, start, fadeIn, "power2.out"),
      1 - progress(time, end - fadeOut, fadeOut, "power2.in"),
    );

  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (a, factor) => [a[0] * factor, a[1] * factor, a[2] * factor];
  const mix = (a, b, amount) => [
    lerp(a[0], b[0], amount),
    lerp(a[1], b[1], amount),
    lerp(a[2], b[2], amount),
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
    slerp(a, b, amount) {
      let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
      let end = b;
      if (dot < 0) {
        dot = -dot;
        end = b.map((value) => -value);
      }
      if (dot > 0.9995) {
        const out = a.map((value, index) => lerp(value, end[index], amount));
        const size = Math.hypot(...out);
        return out.map((value) => value / size);
      }
      const theta = Math.acos(dot);
      const sinTheta = Math.sin(theta);
      const weightA = Math.sin((1 - amount) * theta) / sinTheta;
      const weightB = Math.sin(amount * theta) / sinTheta;
      return a.map((value, index) => value * weightA + end[index] * weightB);
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
  const DEG = Math.PI / 180;

  function css(position, rotation, size) {
    const m = quat.matrix(rotation);
    return `matrix3d(${m[0][0] * size},${m[1][0] * size},${m[2][0] * size},0,${m[0][1] * size},${m[1][1] * size},${m[2][1] * size},0,${m[0][2] * size},${m[1][2] * size},${m[2][2] * size},0,${position[0]},${position[1]},${position[2]},1)`;
  }

  const icon = (name, size, color = PRIMARY) =>
    `<svg viewBox="0 -960 960 960" width="${size}" height="${size}" fill="${color}"><path d="${DATA.icons[name]}"/></svg>`;

  function element(tag, className, html, parent) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    if (parent) parent.appendChild(node);
    return node;
  }

  const categories = DATA.categories;
  const tiles = [...document.querySelectorAll(".lv-tile")].map(
    (node, index) => ({
      element: node,
      bit: DATA.bits[index],
      index,
      category: DATA.bits[index].category,
      shade: node.querySelector(".lv-shade"),
      sheen: node.querySelector(".lv-sheen"),
      ring: node.querySelector(".lv-ring"),
      inspect: node.querySelector(".lv-inspect"),
      label: node.querySelector(".lv-label"),
      tint: node.querySelector(".lv-tint"),
    }),
  );
  const byId = (id) => tiles.find((tile) => tile.bit.id === id);
  const heroTile = byId(HERO_ID);
  const slots = tiles.map((tile) => tile.index);
  const displaced = tiles.find((tile) => tile.index === HERO_SLOT);
  slots[heroTile.index] = HERO_SLOT;
  slots[displaced.index] = heroTile.index;
  tiles.forEach((tile) => {
    const slot = slots[tile.index];
    tile.column = slot % COLUMNS;
    tile.row = Math.floor(slot / COLUMNS);
    tile.home = [
      (tile.column - (COLUMNS - 1) / 2) * PITCH_X,
      (tile.row - (ROWS - 1) / 2) * PITCH_Y,
      0,
    ];
    tile.heroDistance = Math.hypot(tile.column - 4, (tile.row - 3) * 1.3);
    tile.appear = tile === heroTile ? -1 : 0.42 + tile.heroDistance * 0.11;
    const radial = normalize([
      tile.column - 4 || 0.001,
      tile.row - 3 || 0.001,
      0,
    ]);
    tile.flipAxis = [-radial[1], radial[0], 0];
  });

  const dives = TIMING.dives.map((id, order) => {
    const arrive = TIMING.diveArrive + order * TIMING.diveStep;
    return { tile: byId(id), arrive, leave: arrive + 1.25 };
  });
  const carousel = byId("carousel");
  const AGENT = {
    terminal: { position: [-472, 233, 500], rotation: yaw(4 * DEG) },
    carousel: {
      position: [630, -35, 700],
      rotation: yaw(-8 * DEG),
      size: 1.556,
    },
  };

  function cameraKeys() {
    const hero = heroTile.home;
    const keys = [
      {
        t: 0,
        pos: add(hero, [0, 0, 600]),
        tgt: hero,
        roll: -2,
        lens: 2400,
        ease: "sine.inOut",
      },
      {
        t: 0.32,
        pos: add(hero, [0, 0, 585]),
        tgt: hero,
        roll: -2,
        lens: 2400,
        ease: "power4.inOut",
      },
      {
        t: 2.55,
        pos: [-950, -620, 3350],
        tgt: [120, 60, 0],
        roll: 3,
        lens: 1150,
        ease: "sine.inOut",
      },
      {
        t: 2.85,
        pos: [-860, -560, 3240],
        tgt: [110, 55, 0],
        roll: 2.6,
        lens: 1150,
        ease: "expo.inOut",
      },
      {
        t: 3.7,
        pos: [0, 0, 1500],
        tgt: [0, 0, 300],
        roll: 0,
        lens: 1200,
        ease: "sine.inOut",
      },
      {
        t: 5.35,
        pos: [0, 0, 1400],
        tgt: [0, 0, 300],
        roll: 0,
        lens: 1200,
        ease: "expo.inOut",
      },
      {
        t: 6.35,
        pos: [1950, -1000, 2750],
        tgt: [-650, 150, 0],
        roll: 4,
        lens: 1100,
        ease: "sine.inOut",
      },
      {
        t: 9.6,
        pos: [1450, -820, 3050],
        tgt: [-650, 150, 0],
        roll: 2,
        lens: 1100,
        ease: "expo.inOut",
      },
      {
        t: 10.25,
        pos: [1150, -40, 2000],
        tgt: [1150, 0, 0],
        roll: 0,
        lens: 1200,
        ease: "sine.inOut",
      },
      {
        t: 12.3,
        pos: [-1150, -40, 2000],
        tgt: [-1150, 0, 0],
        roll: 0,
        lens: 1200,
        ease: "expo.inOut",
      },
    ];
    dives.forEach((dive, order) => {
      const home = dive.tile.home;
      const next = dives[order + 1];
      keys.push({
        t: dive.arrive,
        pos: add(home, [0, 0, 292]),
        tgt: home,
        roll: 0,
        lens: 1200,
        ease: "sine.inOut",
      });
      keys.push({
        t: dive.leave,
        pos: add(home, [0, 0, 270]),
        tgt: home,
        roll: order % 2 ? 0.8 : -0.8,
        lens: 1200,
        ease: next ? "power3.in" : "expo.inOut",
      });
      if (next) {
        const middle = mix(home, next.tile.home, 0.5);
        keys.push({
          t: dive.leave + 0.33,
          pos: add(middle, [0, 0, 980]),
          tgt: middle,
          roll: order % 2 ? -5 : 5,
          lens: 1000,
          ease: "expo.out",
        });
      }
    });
    keys.push(
      {
        t: 21.6,
        pos: [0, 0, 2100],
        tgt: [0, 0, 0],
        roll: 0,
        lens: 1200,
        ease: "sine.inOut",
      },
      {
        t: 27.6,
        pos: [-110, -40, 2010],
        tgt: [-10, 0, 0],
        roll: 0,
        lens: 1200,
        ease: "expo.inOut",
      },
      {
        t: 29.9,
        pos: [0, -40, 3300],
        tgt: [0, -40, 0],
        roll: 0,
        lens: 1200,
        ease: "sine.out",
      },
      {
        t: DURATION,
        pos: [0, -40, 3060],
        tgt: [0, -40, 0],
        roll: 0,
        lens: 1200,
        ease: "none",
      },
    );
    return keys;
  }

  const keys = cameraKeys();

  function cameraAt(time) {
    let index = 0;
    while (index < keys.length - 2 && time >= keys[index + 1].t) index += 1;
    const from = keys[index];
    const to = keys[index + 1];
    const amount = ease(from.ease)(
      clamp((time - from.t) / (to.t - from.t), 0, 1),
    );
    const position = mix(from.pos, to.pos, amount);
    const target = mix(from.tgt, to.tgt, amount);
    const tilt = lerp(from.roll, to.roll, amount) * DEG;
    const lens = lerp(from.lens, to.lens, amount);
    const forward = normalize(sub(target, position));
    const rx = Math.asin(clamp(forward[1], -1, 1));
    const ry = Math.atan2(-forward[0], -forward[2]);
    const orientation = quat.mul(quat.mul(yaw(ry), pitch(rx)), roll(tilt));
    const inverse = quat.matrix([
      -orientation[0],
      -orientation[1],
      -orientation[2],
      orientation[3],
    ]);
    return { position, rx, ry, rz: tilt, lens, inverse };
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

  const SPOT_START = 6.55;
  const SPOT_STEP = 0.42;
  const spotTime = (category) => SPOT_START + category * SPOT_STEP;
  const SCAN_START = 10.0;
  const SCAN_END = 11.9;
  const scanX = (time) =>
    lerp(
      2700,
      -2700,
      progress(time, SCAN_START, SCAN_END - SCAN_START, "power1.inOut"),
    );
  tiles.forEach((tile) => {
    const target = tile.home[0] + 240;
    let low = SCAN_START;
    let high = SCAN_END;
    for (let step = 0; step < 30; step += 1) {
      const middle = (low + high) / 2;
      if (scanX(middle) > target) low = middle;
      else high = middle;
    }
    tile.scanTime = low;
  });

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

  function shapeCells(spanAt, top, bottom, cellWidth, cellHeight, margin) {
    const cells = [];
    const rows = Math.floor((bottom - top - 2 * margin) / cellHeight);
    const offset = (bottom - top - rows * cellHeight) / 2;
    for (let row = 0; row < rows; row += 1) {
      const rowTop = top + offset + row * cellHeight;
      const a = spanAt(rowTop);
      const b = spanAt(rowTop + cellHeight);
      if (!a || !b) continue;
      const left = Math.max(a[0], b[0]) + margin;
      const right = Math.min(a[1], b[1]) - margin;
      const count = Math.floor((right - left) / cellWidth);
      if (count <= 0) continue;
      const start = (left + right) / 2 - (count * cellWidth) / 2;
      for (let column = 0; column < count; column += 1) {
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
  const LOCKUP = { unit: 64, center: [-1295, -40, 0], column: [-459, -40, 0] };
  const iconToWorld = (x, y) => [
    LOCKUP.center[0] + (x - 12) * LOCKUP.unit,
    LOCKUP.center[1] + (y - 11.8) * LOCKUP.unit,
    0,
  ];
  const mosaicOrder = [...mosaic.cells].sort((a, b) => a.y - b.y || a.x - b.x);
  const FINALE_START = 27.9;
  const FINALE_FLIGHT = 1.7;
  [...tiles]
    .sort(
      (a, b) =>
        (a === carousel ? 0 : 1) - (b === carousel ? 0 : 1) ||
        a.column - b.column ||
        a.row - b.row,
    )
    .forEach((tile, order) => {
      tile.finaleStart = FINALE_START + order * 0.02;
      tile.cell = iconToWorld(
        mosaicOrder[tile.index].x,
        mosaicOrder[tile.index].y,
      );
    });
  const mosaicSize = (mosaic.width * LOCKUP.unit * 0.94) / 480;

  function rippleAmount(time) {
    return span(time, 1.4, 12.4, 1, 0.6) + span(time, 21, 27.9, 0.8, 0.6);
  }

  function tileState(tile, time) {
    let position = tile.home;
    let rotation = IDENTITY;
    let size = 1;
    let visible = 1;
    if (tile !== heroTile) {
      const flip = progress(time, tile.appear, 0.85, "expo.out");
      visible = clamp((time - tile.appear) / 0.12, 0, 1);
      rotation = quat.slerp(
        quat.axis(tile.flipAxis, 100 * DEG),
        IDENTITY,
        flip,
      );
      position = add(position, [0, 0, -900 * (1 - flip)]);
      size = lerp(0.72, 1, flip);
    }
    const ripple =
      rippleAmount(time) *
      22 *
      Math.sin(time * Math.PI * 1.1 - tile.heroDistance * 0.9);
    position = add(position, [0, 0, ripple]);

    const portal =
      progress(time, 2.75, 0.95, "expo.inOut") -
      progress(time, 5.35, 0.9, "expo.inOut");
    if (portal > 0) {
      const radius = Math.hypot(tile.home[0], tile.home[1] * 1.6);
      const push = clamp(1 - radius / 2300, 0, 1) ** 0.7;
      const direction = normalize([tile.home[0] || 1, tile.home[1], 0]);
      position = add(
        position,
        add(scale(direction, 1250 * push * portal), [
          0,
          0,
          -600 * push * portal,
        ]),
      );
      rotation = quat.mul(
        rotation,
        quat.axis([-direction[1], direction[0], 0], -0.5 * push * portal),
      );
    }

    const lift =
      progress(time, spotTime(tile.category), 0.38, "expo.out") -
      progress(
        time,
        spotTime(tile.category) + SPOT_STEP * 1.05,
        0.5,
        "power2.inOut",
      );
    if (lift > 0) position = add(position, [0, 0, 240 * lift]);

    if (tile === carousel && time >= 24.45) {
      const flight = progress(time, 24.45, 1.2, "expo.inOut");
      const arc = Math.sin(Math.PI * flight);
      position = add(mix(position, AGENT.carousel.position, flight), [
        0,
        -arc * 220,
        arc * 500,
      ]);
      rotation = quat.slerp(rotation, AGENT.carousel.rotation, flight);
      size = lerp(size, AGENT.carousel.size, flight);
    }

    if (time >= tile.finaleStart) {
      const flight = progress(
        time,
        tile.finaleStart,
        FINALE_FLIGHT,
        "expo.inOut",
      );
      const arc = Math.sin(Math.PI * flight);
      position = add(mix(position, tile.cell, flight), [
        0,
        -arc * 260,
        arc * 1100,
      ]);
      rotation = quat.slerp(
        rotation,
        IDENTITY,
        progress(time, tile.finaleStart, FINALE_FLIGHT, "power3.inOut"),
      );
      size = lerp(size, mosaicSize, flight);
    }
    return { position, rotation, size, visible };
  }

  function place(node, camera, position, rotation, size, minimumDepth = 50) {
    const depth = depthOf(camera, position);
    if (depth < minimumDepth) {
      node.style.display = "none";
      return depth;
    }
    node.style.display = "";
    node.style.transform = css(position, rotation, size);
    return depth;
  }

  const scan = element("div", "lv-scan", undefined, world);

  const logo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  logo.setAttribute("viewBox", "0 0 24 24");
  logo.setAttribute("class", "lv-icon");
  logo.innerHTML = `
    <path pathLength="1" d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" />
    <rect pathLength="1" x="3" y="14" width="7" height="7" rx="1" />
    <circle pathLength="1" cx="17.5" cy="17.5" r="3.5" />`;
  logo.querySelectorAll("path,rect,circle").forEach((shape) => {
    shape.setAttribute("fill", "none");
    shape.setAttribute("stroke", PRIMARY);
    shape.setAttribute("stroke-linecap", "round");
    shape.setAttribute("stroke-linejoin", "round");
  });
  logo.style.filter = "drop-shadow(0 0 8px rgba(236,139,73,0.55))";
  world.appendChild(logo);
  const logoShapes = [...logo.querySelectorAll("path,rect,circle")];

  const column = element("div", "lv-column", undefined, world);
  const columnInner = element("div", "lv-column-inner", undefined, column);
  const wordRow = element("div", "lv-wordrow", undefined, columnInner);
  const glyphs = [..."Hyperbits"].map((character) =>
    element("span", "", character, wordRow),
  );
  const subline = element("div", "lv-subline", undefined, columnInner);
  const sublineLine = element("span", "lv-line", undefined, subline);
  const sublineWords = "Building blocks for HyperFrames"
    .split(" ")
    .map((word) => ({
      node: element("span", "lv-word lv-grad", word, sublineLine),
      line: sublineLine,
      gradient: true,
    }));
  const ctaRow = element("div", "lv-cta", undefined, columnInner);
  const buttons = [
    element(
      "div",
      "lv-button lv-light",
      `<svg viewBox="0 0 24 24" width="72" height="72"><path fill="#000" d="${GITHUB_MARK}"/></svg>github.com/av/hyperbits`,
      ctaRow,
    ),
    element("div", "lv-button lv-dark", "hyperbits.dev", ctaRow),
  ];

  const ticker = element("div", "lv-ticker", undefined, hud);
  const categoryLabels = categories.map((category, index) => ({
    index,
    label: element(
      "div",
      "lv-category-label",
      `<span class="lv-tile-chip" style="width:60px;height:60px;border-radius:15px">${icon(category.icon, 36)}</span>${category.label}<span class="lv-count">${category.count}</span>`,
      ticker,
    ),
  }));

  const terminal = element(
    "div",
    "lv-terminal",
    `<div class="lv-bar"><span class="lv-dot"></span><span class="lv-dot"></span><span class="lv-dot"></span><span class="lv-title">agent — ~/my-launch-video</span></div><div class="lv-body"></div>`,
    world,
  );
  const terminalBody = terminal.querySelector(".lv-body");
  const LINES = [
    {
      at: 21.65,
      type: 0.85,
      parts: [
        ["lv-p", "➜ "],
        ["lv-w", "add a 3D carousel to my launch video"],
      ],
    },
    {
      at: 22.7,
      type: 0.4,
      parts: [
        ["lv-o", "● "],
        ["lv-c", "hyperbits find "],
        ["lv-w", '"3d carousel"'],
      ],
    },
    {
      at: 23.25,
      parts: [
        ["lv-o", "  carousel     "],
        ["lv-g", " Rotating carousel of cards in 3D space"],
      ],
    },
    {
      at: 23.37,
      parts: [
        ["lv-o", "  3d-basic     "],
        ["lv-g", " 3D camera transitions between steps"],
      ],
    },
    {
      at: 23.49,
      parts: [
        ["lv-o", "  3d-elements  "],
        ["lv-g", " Arbitrary elements in 3D space"],
      ],
    },
    {
      at: 23.85,
      type: 0.45,
      parts: [
        ["lv-o", "● "],
        ["lv-c", "hyperbits add "],
        ["lv-w", "carousel"],
        ["lv-c", " --into compositions/"],
      ],
    },
    { at: 24.45, parts: [["lv-g", "  Wrote compositions/carousel.html"]] },
    { at: 24.55, parts: [["lv-g", "  Wrote compositions/hyperbits.iife.js"]] },
    {
      at: 25.9,
      type: 0.45,
      parts: [
        ["lv-k", "✓ "],
        ["lv-w", "Added the carousel at 0:12"],
      ],
    },
  ];
  const lineNodes = LINES.map(() =>
    element("div", "lv-line", undefined, terminalBody),
  );
  const lineCache = LINES.map(() => "");

  function renderTerminal(time) {
    const lastTyped = LINES.reduce(
      (last, entry, index) => (entry.type && time >= entry.at ? index : last),
      -1,
    );
    LINES.forEach((line, index) => {
      const total = line.parts.reduce((sum, [, text]) => sum + text.length, 0);
      const shown = line.type
        ? Math.floor(clamp((time - line.at) / line.type, 0, 1) * total)
        : time >= line.at
          ? total
          : 0;
      const typing = line.type && time >= line.at && shown < total;
      const cursor =
        time >= line.at &&
        (typing || (index === lastTyped && Math.floor(time * 2.4) % 2 === 0));
      let remaining = shown;
      let markup = "";
      for (const [className, text] of line.parts) {
        if (remaining <= 0) break;
        markup += `<span class="${className}">${text.slice(0, remaining).replace(/</g, "&lt;")}</span>`;
        remaining -= text.length;
      }
      if (cursor) markup += `<span class="lv-cursor"></span>`;
      if (markup !== lineCache[index]) {
        lineNodes[index].innerHTML = markup;
        lineCache[index] = markup;
      }
    });
  }

  const glow = element("div", "lv-glow", undefined, hud);
  const grainCanvas = element("canvas", "lv-grain", undefined, hud);
  grainCanvas.width = 960;
  grainCanvas.height = 540;
  const grainContext = grainCanvas.getContext("2d");
  const grainFrames = [];
  if (grainContext && typeof grainContext.createImageData === "function") {
    for (let frame = 0; frame < 6; frame += 1) {
      const image = grainContext.createImageData(960, 540);
      let seed = Math.floor(hb.random(`grain-${frame}`) * 4294967295);
      for (let offset = 0; offset < image.data.length; offset += 4) {
        seed = (seed + 0x6d2b79f5) | 0;
        let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        const shade = ((value ^ (value >>> 14)) >>> 0) % 256;
        image.data[offset] = shade;
        image.data[offset + 1] = shade;
        image.data[offset + 2] = shade;
        image.data[offset + 3] = 255;
      }
      grainFrames.push(image);
    }
  }
  let grainShown = -1;
  element("div", "lv-vignette", undefined, hud);
  const scrim = element("div", "lv-scrim", undefined, hud);
  const scrimCenter = element("div", "lv-scrim-center", undefined, hud);
  const scrimCorner = element("div", "lv-scrim-corner", undefined, hud);
  const flash = element("div", "lv-flash", undefined, hud);
  hud.appendChild(ticker);

  function display(lines, fontSize, parent) {
    const block = element("div", "lv-display", undefined, parent);
    block.style.fontSize = `${fontSize}px`;
    const words = [];
    lines.forEach(([text, gradient]) => {
      const line = element("span", "lv-line", undefined, block);
      text.split(" ").forEach((word) => {
        const accent = word.startsWith("*");
        const label = accent ? word.slice(1) : word;
        const className = accent
          ? "lv-word lv-accent"
          : gradient
            ? "lv-word lv-grad"
            : "lv-word";
        words.push({
          node: element("span", className, label, line),
          line,
          gradient: gradient && !accent,
        });
      });
    });
    return { block, words };
  }

  function reveal(words, time, start, end, stagger = 0.07) {
    words.forEach((word, index) => {
      const enter = progress(time, start + index * stagger, 0.95, "expo.out");
      const exit =
        end === undefined
          ? 0
          : progress(time, end + index * 0.035, 0.5, "power3.in");
      const node = word.node;
      if (enter <= 0 || exit >= 1) {
        node.style.opacity = "0";
        return;
      }
      node.style.opacity = Math.min(1, enter * 1.6).toFixed(3);
      node.style.transform = `translate3d(0,${((1 - enter) * 105 - exit * 105).toFixed(2)}%,0)`;
      const blur = (1 - enter) * 16 + exit * 16;
      node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
      if (word.gradient) {
        node.style.backgroundSize = `${word.line.offsetWidth}px 100%`;
        node.style.backgroundPosition = `${-node.offsetLeft + word.line.offsetLeft}px 0`;
      }
    });
  }

  function pop(node, time, start, end, from = 24) {
    const enter = progress(time, start, 0.8, "expo.out");
    const exit = end === undefined ? 0 : progress(time, end, 0.4, "power3.in");
    node.style.opacity = Math.max(
      0,
      Math.min(1, enter * 1.5, 1 - exit),
    ).toFixed(3);
    node.style.transform = `translate3d(0,${((1 - enter) * from - exit * from).toFixed(2)}px,0) scale(${lerp(0.94, 1, enter).toFixed(4)})`;
    const blur = (1 - enter) * 10 + exit * 10;
    node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
  }

  const hook = element("div", "lv-hook", undefined, hud);
  const hookText = display(
    [
      ["Motion design,", false],
      ["written in *HTML.", true],
    ],
    168,
    hook,
  );
  hookText.block.style.textAlign = "center";

  function headlineBlock(chipIcon, chipText, lines, fontSize) {
    const block = element("div", "lv-block", undefined, hud);
    const chip = element(
      "div",
      "lv-chip",
      `${icon(chipIcon, 30)}${chipText}`,
      block,
    );
    const text = display(lines, fontSize, block);
    return { block, chip, text };
  }
  const catalog = headlineBlock(
    "stacks",
    "The catalog",
    [
      ["62 bits.", false],
      ["7 categories.", true],
    ],
    128,
  );
  const inspector = headlineBlock(
    "code",
    "Under the hood",
    [
      ["Every tile is a", false],
      ["live composition.", true],
    ],
    112,
  );
  const agent = headlineBlock(
    "smart_toy",
    "Agent ready",
    [
      ["Your agent already", false],
      ["knows how.", true],
    ],
    96,
  );

  const lower = element("div", "lv-lower", undefined, hud);
  const lowerIcon = element("div", "lv-tile-chip", undefined, lower);
  const lowerText = element("div", "lv-lower-text", undefined, lower);
  const lowerName = element("div", "lv-lower-name", undefined, lowerText);
  const lowerCommand = element("div", "lv-chip", undefined, lowerText);
  lower.style.filter = "drop-shadow(0 20px 40px rgba(0,0,0,0.6))";

  const features = element("div", "lv-features", undefined, hud);
  features.style.left = "1060px";
  features.style.right = "96px";
  features.style.bottom = "150px";
  const featureNodes = [
    ["smart_toy", "MCP server"],
    ["terminal", "CLI"],
    ["code", "Agent skill"],
  ].map(([name, label]) =>
    element(
      "div",
      "lv-feature",
      `<span class="lv-tile-chip">${icon(name, 36)}</span>${label}`,
      features,
    ),
  );

  const footnote = element(
    "div",
    "lv-footnote",
    "This video is a hyperbits composition: 62 live bits, one HTML page.",
    hud,
  );

  function render(time) {
    const camera = cameraAt(time);
    stage.style.perspective = `${camera.lens}px`;
    world.style.transform = `translateZ(${camera.lens}px) rotateZ(${-camera.rz}rad) rotateX(${-camera.rx}rad) rotateY(${-camera.ry}rad) translate3d(${-camera.position[0]}px,${-camera.position[1]}px,${-camera.position[2]}px)`;

    const activeDive = dives.find(
      (dive) => time >= dive.arrive - 0.7 && time < dive.leave + 0.4,
    );
    const brandDim = span(time, 2.8, 5.9, 0.6, 0.5);
    const spotActive = span(
      time,
      SPOT_START - 0.1,
      SPOT_START + SPOT_STEP * 7.4,
      0.25,
      0.4,
    );
    const agentDim = span(time, 21.0, 28.2, 0.7, 0.6);

    tiles.forEach((tile) => {
      const state = tileState(tile, time);
      const node = tile.element;
      if (state.visible <= 0) {
        node.style.display = "none";
        return;
      }
      const depth = place(
        node,
        camera,
        state.position,
        state.rotation,
        state.size,
        40,
      );
      node.style.opacity = state.visible < 1 ? state.visible.toFixed(3) : "";
      let dim = clamp((depth - 4600) / 7000, 0, 0.7);
      if (tile !== heroTile) dim = Math.max(dim, 0.45 * brandDim);
      const inSpot =
        progress(time, spotTime(tile.category) - 0.05, 0.25) -
        progress(time, spotTime(tile.category) + SPOT_STEP * 1.05, 0.4);
      dim = Math.max(dim, 0.4 * spotActive * (1 - inSpot));
      if (activeDive && activeDive.tile !== tile) dim = Math.max(dim, 0.55);
      if (tile !== carousel) dim = Math.max(dim, 0.74 * agentDim);
      tile.shade.style.opacity = dim.toFixed(3);

      const landing =
        tile === heroTile ? 0 : progress(time, tile.appear, 0.85, "expo.out");
      let ring =
        tile === heroTile
          ? 0
          : Math.sin(Math.PI * clamp(landing * 1.4, 0, 1)) * 0.85;
      ring = Math.max(ring, 0.95 * inSpot * spotActive);
      if (tile === carousel)
        ring = Math.max(ring, span(time, 23.35, 27.6, 0.3, 0.5));
      const settled = progress(
        time,
        tile.finaleStart + FINALE_FLIGHT * 0.75,
        0.9,
        "power2.out",
      );
      ring = Math.max(ring, Math.sin(Math.PI * settled) * 0.9);
      tile.tint.style.opacity = (0.22 * settled).toFixed(3);
      tile.ring.style.opacity = ring.toFixed(3);

      const focused = activeDive && activeDive.tile === tile;
      tile.label.style.opacity = (
        clamp((depth / state.size - 1100) / 700, 0, 1) * 0.9
      ).toFixed(3);
      tile.sheen.style.opacity = focused ? "0" : "0.5";
      tile.sheen.style.transform = `translateX(${clamp((camera.position[0] - state.position[0]) * 0.18, -340, 340).toFixed(1)}px)`;

      const inspected =
        progress(time, tile.scanTime, 0.25, "expo.out") *
        (1 - progress(time, 12.15, 0.3, "power2.in"));
      tile.inspect.style.opacity = inspected.toFixed(3);
      tile.inspect.style.transform = `scale(${lerp(1.06, 1, inspected).toFixed(4)})`;
    });

    const scanShow = span(time, SCAN_START - 0.15, SCAN_END + 0.15, 0.2, 0.25);
    if (scanShow > 0) place(scan, camera, [scanX(time), 0, 40], IDENTITY, 1);
    else scan.style.display = "none";
    scan.style.opacity = scanShow.toFixed(3);

    categoryLabels.forEach((entry) => {
      const begin = spotTime(entry.index);
      const last = entry.index === categories.length - 1;
      const enter = progress(time, begin, 0.5, "expo.out");
      const exit = last
        ? progress(time, 9.5, 0.35, "power3.in")
        : progress(time, begin + SPOT_STEP, 0.3, "power3.in");
      const show = Math.min(enter, 1 - exit);
      if (show <= 0.001) {
        entry.label.style.opacity = "0";
        return;
      }
      entry.label.style.opacity = show.toFixed(3);
      entry.label.style.transform = `translate3d(0,${((1 - enter) * 60 - exit * 60).toFixed(1)}px,0)`;
      const blur = (1 - enter) * 10 + exit * 10;
      entry.label.style.filter =
        blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
    });

    const brand = time < 20;
    const logoExit = brand ? progress(time, 5.3, 0.5, "power3.in") : 0;
    if ((brand && time >= 2.95 && logoExit < 1) || (!brand && time >= 29.4)) {
      const position = brand
        ? [-585, -logoExit * 200, 300]
        : iconToWorld(12, 12);
      const size = brand ? (24 * 12.6) / 240 : (24 * LOCKUP.unit) / 240;
      place(
        logo,
        camera,
        position,
        brand
          ? yaw(lerp(-0.35, 0, progress(time, 2.95, 1.2, "expo.out")))
          : IDENTITY,
        size,
      );
      logo.style.opacity = (1 - logoExit).toFixed(3);
      logoShapes.forEach((shape, index) => {
        const drawn = brand
          ? progress(time, 3.0 + index * 0.12, 0.8, "power3.inOut")
          : progress(time, 29.55 + index * 0.14, 1.0, "power3.inOut");
        shape.setAttribute("stroke-dasharray", drawn >= 1 ? "none" : "1 1");
        shape.setAttribute("stroke-dashoffset", (1 - drawn).toFixed(4));
        shape.setAttribute("stroke-width", brand ? "1.7" : "0.36");
      });
    } else logo.style.display = "none";

    const finale = time >= 29;
    if ((time >= 3.15 && time < 6.1) || time >= 29.8) {
      ctaRow.style.display = finale ? "flex" : "none";
      place(
        column,
        camera,
        finale ? LOCKUP.column : [-400, 0, 300],
        IDENTITY,
        finale ? 1 : 0.48,
      );
      glyphs.forEach((glyph, index) => {
        const start = finale ? 30.0 + index * 0.045 : 3.3 + index * 0.04;
        const enter = progress(time, start, 1.0, "expo.out");
        const exit = finale
          ? 0
          : progress(time, 5.3 + index * 0.03, 0.55, "power3.in");
        glyph.style.opacity = Math.max(
          0,
          Math.min(enter * 1.6, 1 - exit),
        ).toFixed(3);
        glyph.style.transform = `translate3d(0,${((1 - enter) * 0.5 - exit * 0.6).toFixed(3)}em,0) rotateX(${((1 - enter) * -70 + exit * 50).toFixed(2)}deg)`;
        const blur = (1 - enter) * 30 + exit * 30;
        glyph.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "none";
      });
      reveal(
        sublineWords,
        time,
        finale ? 30.45 : 3.8,
        finale ? undefined : 5.25,
        0.06,
      );
      buttons.forEach((button, index) =>
        pop(button, time, 30.85 + index * 0.14, undefined, 60),
      );
    } else column.style.display = "none";

    const terminalIn = progress(time, 20.95, 1.0, "expo.out");
    const terminalOut = progress(time, 27.65, 0.75, "power3.in");
    if (time >= 20.95 && terminalOut < 1) {
      const position = add(AGENT.terminal.position, [
        lerp(-300, 0, terminalIn) - terminalOut * 600,
        Math.sin(time * 1.3) * 6 + terminalOut * 200,
        lerp(-1600, 0, terminalIn) - terminalOut * 1800,
      ]);
      const rotation = quat.mul(
        AGENT.terminal.rotation,
        quat.mul(
          yaw(lerp(28, 0, terminalIn) * DEG + terminalOut * 0.4),
          pitch(lerp(10, 0, terminalIn) * DEG),
        ),
      );
      place(terminal, camera, position, rotation, 1);
      terminal.style.opacity = Math.min(
        terminalIn * 1.5,
        1 - terminalOut,
      ).toFixed(3);
      renderTerminal(time);
    } else terminal.style.display = "none";

    const glowStrength =
      0.75 +
      0.5 * span(time, 2.9, 5.9, 0.6, 0.5) +
      0.55 * progress(time, 29.4, 1.5) +
      0.2 * span(time, 21, 28, 0.6, 0.6);
    glow.style.opacity = clamp(glowStrength, 0, 1.6).toFixed(3);
    glow.style.transform = `translateX(${clamp(-camera.ry * 900, -500, 500).toFixed(1)}px) scale(${(1 + 0.15 * progress(time, 29.4, 2)).toFixed(3)})`;

    if (grainFrames.length) {
      const frame = Math.floor(time * 24) % grainFrames.length;
      if (frame !== grainShown) {
        grainContext.putImageData(grainFrames[frame], 0, 0);
        grainShown = frame;
      }
    }

    let flashAmount = 0;
    dives.forEach((dive) => {
      if (time >= dive.arrive - 0.06)
        flashAmount = Math.max(
          flashAmount,
          0.11 * (1 - progress(time, dive.arrive - 0.06, 0.4, "power2.out")),
        );
    });
    flash.style.opacity = flashAmount.toFixed(3);

    reveal(hookText.words, time, 0.12, 2.45, 0.075);
    scrimCenter.style.opacity = (span(time, 0, 2.95, 0.01, 0.5) * 0.6).toFixed(
      3,
    );

    pop(catalog.chip, time, 6.2, 9.55);
    reveal(catalog.text.words, time, 6.28, 9.55, 0.08);
    pop(inspector.chip, time, 9.85, 12.15);
    reveal(inspector.text.words, time, 9.93, 12.15, 0.07);
    pop(agent.chip, time, 21.55, 27.55);
    reveal(agent.text.words, time, 21.62, 27.55, 0.07);
    scrim.style.opacity = Math.max(
      span(time, 6.2, 9.75, 0.3, 0.4),
      span(time, 9.8, 12.35, 0.3, 0.3),
    ).toFixed(3);
    scrimCorner.style.opacity = span(time, 21.4, 27.9, 0.4, 0.4).toFixed(3);

    const labelDive = dives.find(
      (dive) => time >= dive.arrive - 0.2 && time < dive.leave + 0.4,
    );
    if (labelDive) {
      const category = categories[labelDive.tile.category];
      if (lower.dataset.id !== labelDive.tile.bit.id) {
        lower.dataset.id = labelDive.tile.bit.id;
        lowerIcon.innerHTML = icon(category.icon, 44);
        lowerName.textContent = labelDive.tile.bit.name;
        lowerCommand.innerHTML = `${icon("terminal", 28)}hyperbits add ${labelDive.tile.bit.id}`;
      }
      const enter = progress(time, labelDive.arrive + 0.05, 0.7, "expo.out");
      const exit = progress(time, labelDive.leave - 0.05, 0.3, "power3.in");
      lower.style.opacity = Math.max(
        0,
        Math.min(enter * 1.6, 1 - exit),
      ).toFixed(3);
      lower.style.transform = `translate3d(${((1 - enter) * -60 - exit * 40).toFixed(1)}px,0,0)`;
      lowerIcon.style.transform = `scale(${lerp(0.6, 1, progress(time, labelDive.arrive + 0.05, 0.6, "back.out(2)")).toFixed(3)})`;
    } else lower.style.opacity = "0";

    featureNodes.forEach((node, index) =>
      pop(node, time, 26.15 + index * 0.12, 27.55, 30),
    );
    pop(footnote, time, 31.4, undefined, 16);
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
