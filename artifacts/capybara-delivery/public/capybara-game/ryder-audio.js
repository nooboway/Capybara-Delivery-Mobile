/* Ryder mute completion: preserve canonical mixing and also mute active HTML SFX.
 * Loaded before canonical startup so detached pooled media is observed on play.
 * Does not add a mute-button listener, create audio, or alter playback/volume.
 */
(() => {
  if (window.__ryderAudio) return;
  const prototype = HTMLMediaElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "play");
  const originalPlay = prototype.play;
  const media = new Set();
  const previousMuted = new Map();
  let audio = null;
  let originalSetMuted = null;
  let wrappedSetMuted = null;
  let muted = false;
  let disposed = false;

  function remember(element) {
    media.add(element);
    if (muted) {
      if (!previousMuted.has(element)) previousMuted.set(element, element.muted);
      element.muted = true;
    }
  }

  function applyMuted(next) {
    muted = !!next;
    if (muted) {
      for (const element of media) remember(element);
    } else {
      for (const [element, previous] of previousMuted) element.muted = previous;
      previousMuted.clear();
    }
  }

  function bind() {
    const candidate = window.__capyAudio;
    if (!candidate || typeof candidate.setMuted !== "function" || candidate === audio) return;
    restoreAudio();
    audio = candidate;
    originalSetMuted = audio.setMuted;
    // Canonical drift sets its own muted flag. Capture its pre-mute state too,
    // including when it has not played yet.
    if (audio._driftAudio instanceof HTMLMediaElement) {
      remember(audio._driftAudio);
      // A persisted canonical mute may precede this bind. Drift's muted flag
      // follows the canonical global switch, not a separate per-track setting.
      if (audio.isMuted()) previousMuted.set(audio._driftAudio, false);
    }
    const native = originalSetMuted;
    wrappedSetMuted = function (next) {
      if (this !== audio) return native.apply(this, arguments);
      if (next && !muted) applyMuted(true); // snapshot before canonical mutates drift
      const result = native.apply(this, arguments);
      applyMuted(audio.isMuted());
      return result;
    };
    audio.setMuted = wrappedSetMuted;
    applyMuted(audio.isMuted());
  }

  function restoreAudio() {
    if (audio && audio.setMuted === wrappedSetMuted) audio.setMuted = originalSetMuted;
    audio = null;
    originalSetMuted = null;
    wrappedSetMuted = null;
  }

  function play() {
    bind();
    remember(this);
    return originalPlay.apply(this, arguments);
  }
  Object.defineProperty(prototype, "play", { ...descriptor, value: play });
  const poll = setInterval(bind, 100);
  bind();
  const controller = {
    get installed() { return !disposed; },
    get muted() { return muted; },
    get trackedMediaCount() { return media.size; },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearInterval(poll);
      window.removeEventListener("pagehide", onPageHide);
      restoreAudio();
      applyMuted(false);
      media.clear();
      if (prototype.play === play) Object.defineProperty(prototype, "play", descriptor);
      if (window.__ryderAudio === controller) delete window.__ryderAudio;
    },
  };
  function onPageHide(event) {
    if (!event.persisted) controller.dispose(); // retain mute across BFCache resume
  }
  window.__ryderAudio = controller;
  window.addEventListener("pagehide", onPageHide);
})();
