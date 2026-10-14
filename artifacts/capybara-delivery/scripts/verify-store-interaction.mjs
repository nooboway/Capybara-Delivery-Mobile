// Test-only fixtures: normal startup is required; collected/cart/allCollected are never assigned.
// Spatial setup and required-item fixtures use the canonical store-entry API.
export async function verifyStoreInteractions(page, check) {
  const started = await page.evaluate(
    () =>
      document.body.classList.contains("in-game") &&
      !__capyGame._menuRendering &&
      __capyGame.mode === "world",
  );
  if (!started)
    throw new Error(
      "Store acceptance requires completed normal startup in canonical world mode",
    );
  await page.evaluate(async () => {
    window.h = await OkadaInput.initOkadaInput(window, document, {
      gamepad: false,
    });
  });

  await page.evaluate(() => {
    __capyGame._onOrderAccepted({});
    __capyGame._pendingStoreItems = ["Bubble Milk Tea", "Apple"];
    __capyGame.setMode("store");
  });
  await page.waitForFunction(
    () =>
      __capyGame.store.isActive &&
      document.body.classList.contains("in-store-mode"),
  );
  await page.evaluate(() => {
    const s = __capyGame.store,
      r = h.adapter.getEngineInput();
    window.trace = [];
    window.calls = 0;
    const orig = s.update;
    window.originalStoreUpdate = orig;
    s.update = function (A, dt, c) {
      calls++;
      window.inUpdate = true;
      const entry = {
        same: A === r,
        interact: A.interact,
        nearest: this.nearestItem?.type.name,
        hasCart: this.hasCart,
        cooldown: this._interactCooldown,
        dt,
      };
      const before = this.cart.length;
      try {
        return orig.call(this, A, dt, c);
      } finally {
        window.inUpdate = false;
        if (entry.interact)
          trace.push({
            entry,
            before,
            after: this.cart.length,
            mode: __capyGame.mode,
          });
      }
    };
    const d = Object.getOwnPropertyDescriptor(r, "interact");
    Object.defineProperty(r, "interact", {
      ...d,
      get() {
        const v = d.get.call(r);
        if (window.inUpdate && v)
          trace.push({
            read: true,
            v,
            nearest: s.nearestItem?.type.name,
            hasCart: s.hasCart,
            cooldown: s._interactCooldown,
          });
        return v;
      },
    });
    const c = s.cartPickupPos;
    const milk = s.shelfItems.filter((m) => m.type.name === "Bubble Milk Tea");
    const candidates = Array.from({ length: 24 }, (_, i) => ({
      x: c.x + 0.9 * Math.cos((i * Math.PI) / 12),
      z: c.z + 0.9 * Math.sin((i * Math.PI) / 12),
    })).filter(
      (p) =>
        p.x >= s.bounds.minX + 0.4 &&
        p.x <= s.bounds.maxX - 0.4 &&
        p.z >= s.bounds.minZ + 0.4 &&
        p.z <= s.bounds.maxZ - 0.4,
    );
    candidates.sort(
      (a, b) =>
        Math.min(...milk.map((m) => s._dist2D(b, m.mesh.position))) -
        Math.min(...milk.map((m) => s._dist2D(a, m.mesh.position))),
    );
    const p = candidates[0] || c;
    s.walkerPos.set(p.x, 0, p.z);
    s.walkerVel.set(0, 0, 0);
  });
  const cdp = await page.context().newCDPSession(page);
  async function touchUntil(predicate) {
    const b = await page.locator("#okada-btn-interact").boundingBox();
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }],
    });
    try {
      await page.waitForFunction(predicate, null, { timeout: 20000 });
    } finally {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    }
  }
  await page.evaluate(() => {
    const w = document.getElementById("okada-walk"),
      r = w.getBoundingClientRect();
    w.dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerId: 91,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2,
      }),
    );
  });
  await touchUntil(() => __capyGame.store.hasCart);
  const cart = await page.evaluate(() => ({
    hasCart: __capyGame.store.hasCart,
    consumed: trace.some((x) => x.entry?.same && x.entry.interact),
    calls,
    menu: __capyGame._menuRendering,
  }));
  check(
    "canonical cart acquired by visible trusted touch after normal startup",
    cart.hasCart && cart.consumed && cart.calls > 0 && !cart.menu,
    JSON.stringify(cart),
  );
  async function position(name) {
    console.log(
      "POSITION",
      await page.evaluate(async (name) => {
        const s = __capyGame.store,
          m = s.shelfItems.find((m) => !m.collected && m.type.name === name);
        window.target = m;
        if (!m)
          return {
            alreadyCollected: s.cart.some((m) => m.name === name),
            name,
          };
        const x = m.mesh.position.x,
          z = m.mesh.position.z;
        for (const [dx, dz] of [
          [0, 0.6],
          [0, -0.6],
          [0.6, 0],
          [-0.6, 0],
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ]) {
          s.walkerPos.set(x + dx, 0, z + dz);
          s.walkerVel.set(0, 0, 0);
          for (let i = 0; i < 3; i++)
            await new Promise((r) => requestAnimationFrame(r));
          if (s.nearestItem === m) break;
        }
        for (let i = 0; s._interactCooldown > 0 && i < 60; i++)
          await new Promise((r) => requestAnimationFrame(r));
        return {
          nearest: s.nearestItem?.type.name,
          matches: s.nearestItem === m,
          cart: s.hasCart,
          cooldown: s._interactCooldown,
          mode: __capyGame.mode,
        };
      }, name),
    );
  }
  // A held canonical press may collect more than one nearby required item.
  // Do not press for another shelf copy after that requirement is already met.
  for (const name of ["Bubble Milk Tea", "Apple"]) {
    const unmet = await page.evaluate(
      (name) => __capyGame.store.remainingItems.includes(name),
      name,
    );
    if (!unmet) continue;
    const mode = await page.evaluate(() => __capyGame.mode);
    if (mode !== "store")
      throw new Error(`Store left ${mode} with unmet ${name}`);
    await position(name);
    if (await page.evaluate(() => !!target))
      await touchUntil(() => target.collected);
  }
  const items = await page.evaluate(() => ({
    all: __capyGame.store.allCollected,
    cart: __capyGame.store.cart.map((m) => m.name),
    read: trace.some(
      (x) =>
        x.read &&
        x.v &&
        x.nearest === "Bubble Milk Tea" &&
        x.hasCart &&
        x.cooldown === 0,
    ),
    picked: trace.some(
      (x) => x.entry?.same && x.entry.interact && x.after > x.before,
    ),
  }));
  check(
    "canonical touch item branch collects actual required items",
    items.all &&
      items.read &&
      items.picked &&
      items.cart.includes("Bubble Milk Tea") &&
      items.cart.includes("Apple"),
    JSON.stringify(items),
  );
  // Completing the requirements while still holding Interact near the exit
  // can already have completed the canonical store. This is valid gameplay.
  if (await page.evaluate(() => __capyGame.mode === "store")) {
    await page.evaluate(async () => {
      const s = __capyGame.store;
      s.walkerPos.set(s.exitPos.x, 0, s.exitPos.z);
      s.walkerVel.set(0, 0, 0);
      for (let i = 0; i < 60 && (!s._nearExit || s._interactCooldown > 0); i++)
        await new Promise((r) => requestAnimationFrame(r));
    });
    await touchUntil(() => __capyGame.mode === "world");
  }
  await page.waitForFunction(
    () => !document.body.classList.contains("in-store-mode"),
  );
  const exit = await page.evaluate(() => {
    const w = document.getElementById("okada-walk");
    w.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 91,
        clientX: 400,
        clientY: 0,
      }),
    );
    return {
      mode: __capyGame.mode,
      walkHidden: getComputedStyle(w).display === "none",
      controls: ["okada-steer", "okada-btn-throttle", "okada-btn-brake"].every(
        (id) =>
          getComputedStyle(document.getElementById(id)).display !== "none",
      ),
      owner: h.touch.walkOwner,
      state: h.manager.getState(),
    };
  });
  check(
    "canonical world exit restores controls and revokes stale walking ownership",
    exit.mode === "world" &&
      exit.walkHidden &&
      exit.controls &&
      exit.owner === null &&
      Object.values(exit.state).every((v) => v === 0 || v === false),
    JSON.stringify(exit),
  );
  // Fresh canonical store fixture for the exact Bubble Milk Tea keyboard differential.
  await page.evaluate(() => {
    __capyGame._onOrderAccepted({});
    __capyGame._pendingStoreItems = ["Bubble Milk Tea"];
    if (__capyGame.store?.shelfItems) {
      __capyGame.store.shelfItems.forEach((m) => { m.collected = false; });
      __capyGame.store.cart = [];
      __capyGame.store.hasCart = false;
    }
    __capyGame.setMode("store");
  });
  await page.waitForFunction(
    () =>
      __capyGame.store.isActive &&
      document.body.classList.contains("in-store-mode"),
  );
  await page.evaluate(() => {
    const s = __capyGame.store;
    const c = s.cartPickupPos;
    const milk = s.shelfItems.filter((m) => m.type.name === "Bubble Milk Tea");
    const candidates = Array.from({ length: 24 }, (_, i) => ({
      x: c.x + 0.9 * Math.cos((i * Math.PI) / 12),
      z: c.z + 0.9 * Math.sin((i * Math.PI) / 12),
    })).filter(
      (p) =>
        p.x >= s.bounds.minX + 0.4 &&
        p.x <= s.bounds.maxX - 0.4 &&
        p.z >= s.bounds.minZ + 0.4 &&
        p.z <= s.bounds.maxZ - 0.4,
    );
    candidates.sort(
      (a, b) =>
        Math.min(...milk.map((m) => s._dist2D(b, m.mesh.position))) -
        Math.min(...milk.map((m) => s._dist2D(a, m.mesh.position))),
    );
    const p = candidates[0] || c;
    s.walkerPos.set(p.x, 0, p.z);
    s.walkerVel.set(0, 0, 0);
  });
  await touchUntil(() => __capyGame.store.hasCart);
  await position("Bubble Milk Tea");
  await page.evaluate(() => trace.splice(0));
  if (!(await page.evaluate(() => !!target)))
    throw new Error("Keyboard differential has no uncollected target");
  await page.keyboard.down("e");
  try {
    await page.waitForFunction(() => target.collected, null, {
      timeout: 20000,
    });
  } finally {
    await page.keyboard.up("e");
  }
  const native = await page.evaluate(() => ({
    collected: target.collected,
    normalized: h.manager.getState().interact,
    consumed: trace.some(
      (x) =>
        x.entry?.same &&
        x.entry.interact &&
        x.entry.nearest === "Bubble Milk Tea" &&
        x.entry.hasCart &&
        x.entry.cooldown === 0 &&
        x.after > x.before,
    ),
  }));
  check(
    "native keyboard E collects canonical item without normalized interaction",
    native.collected && native.consumed && !native.normalized,
    JSON.stringify(native),
  );

  await cdp.detach();
  await page.evaluate(() => {
    __capyGame.store.update = window.originalStoreUpdate;
    h.dispose();
    delete window.h;
    delete window.trace;
    delete window.target;
    delete window.originalStoreUpdate;
  });
}
