const navItems = [...document.querySelectorAll(".nav-item")];
const chapterNav = document.querySelector(".chapter-nav");
const copyButton = document.querySelector(".copy-link");
const shareButton = document.querySelector(".share-image");
const deck = document.querySelector(".deck-scroll");
const deckStage = document.querySelector(".deck-stage");
const introMouseFollowLayer = document.querySelector(".intro-mouse-follow-layer");
const socialOrbitRingFrame = document.querySelector(".social-orbit-ring-frame");
const socialOrbitRing = document.querySelector(".social-orbit-ring");
const deckCards = [...document.querySelectorAll(".deck-card")];
const hoverImageRevealCards = [...document.querySelectorAll(".hover-image-reveal-card")];
const navSections = navItems.map((item) => item.dataset.section).filter(Boolean);
const navMagnetConfig = {
  radius: 240,
  falloff: 2.1,
  maxScale: 1.18,
  maxLift: 7,
};
const socialOrbitConfig = {
  normalRate: 1,
  hoverRate: 0.12,
  easing: 0.16,
};
const introMouseFollowConfig = {
  images: [
    { src: "assets/intro/mouse-follow/follow-107x162.png", width: 107 },
    { src: "assets/intro/mouse-follow/follow-139x139.png", width: 139 },
    { src: "assets/intro/mouse-follow/follow-171x214.png", width: 171 },
    { src: "assets/intro/mouse-follow/follow-175x237.png", width: 175 },
    { src: "assets/intro/mouse-follow/follow-193x260.png", width: 193 },
    { src: "assets/intro/mouse-follow/follow-204x209.png", width: 204 },
  ],
  baseViewportWidth: 1920,
  imageScale: 0.8,
  minDistance: 56,
  minInterval: 54,
  lifetime: 760,
  driftMax: 54,
  poolSize: 5,
};
const clickEffectConfig = {
  color: "#ffffff",
  particleCount: 8,
  duration: 300,
  particleSize: 2,
  effectSize: 90,
  maxActiveParticles: 96,
};
const themeConfig = {
  gold: {
    bg: "#f799bd",
    ink: "#fff",
    grid: "#ffb0d0",
    coverImage: 'url("assets/covers/social-cover-2x.png")',
  },
  intro: {
    bg: "#352118",
    ink: "#fff",
    grid: "#442d24",
  },
  introCover: {
    bg: "#ff7e17",
    ink: "#fff",
    grid: "#f26403",
  },
  black: {
    bg: "#020202",
    ink: "#fff",
    grid: "rgba(255, 255, 255, 0.12)",
  },
  community: {
    bg: "#f8cb5e",
    ink: "#fff",
    grid: "#ffb829",
    coverImage: 'url("assets/covers/community-cover-2x.png")',
  },
  online: {
    bg: "#73a7e5",
    ink: "#050505",
    grid: "#86b1ef",
    coverImage: 'url("assets/covers/online-cover-2x.png")',
  },
  offline: {
    bg: "#9f2524",
    ink: "#fff",
    grid: "#871717",
    coverImage: 'url("assets/covers/offline-cover-2x.png")',
  },
  preview: {
    bg: "#141414",
    ink: "#fff",
    grid: "#000000",
    coverImage: 'url("assets/covers/preview-cover-2x.png")',
  },
  purple: {
    bg: "#7a38cd",
    ink: "#fff",
    grid: "rgba(255, 255, 255, 0.16)",
  },
};

let activeSection = "";
let currentProgress = 0;
let wheelLocked = false;
let rafId = 0;
let navSectionLookup = new Map();
const introMouseFollow = {
  imageIndex: 0,
  poolIndex: 0,
  lastX: 0,
  lastY: 0,
  lastTime: 0,
  ready: false,
  items: [],
  timers: [],
};
const socialOrbitMotion = {
  frame: 0,
  rate: socialOrbitConfig.normalRate,
  targetRate: socialOrbitConfig.normalRate,
};
let clickEffectsLayer = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getClickEffectsLayer() {
  if (clickEffectsLayer) return clickEffectsLayer;

  clickEffectsLayer = document.createElement("div");
  clickEffectsLayer.className = "click-effects-layer";
  clickEffectsLayer.setAttribute("aria-hidden", "true");
  document.body.appendChild(clickEffectsLayer);

  return clickEffectsLayer;
}

function trimClickEffectParticles(layer) {
  const overflow = layer.children.length - clickEffectConfig.maxActiveParticles;

  if (overflow <= 0) return;

  [...layer.children].slice(0, overflow).forEach((particle) => {
    particle.remove();
  });
}

function spawnClickEffect(event) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  if (!event.clientX && !event.clientY) {
    return;
  }

  const layer = getClickEffectsLayer();
  const baseDistance = clickEffectConfig.effectSize * 0.2;
  const randomDistance = clickEffectConfig.effectSize * 0.3;

  for (let index = 0; index < clickEffectConfig.particleCount; index += 1) {
    const angle = (index * 360) / clickEffectConfig.particleCount * (Math.PI / 180);
    const distance = baseDistance + Math.random() * randomDistance;
    const particle = document.createElement("span");

    particle.className = "click-effect-particle";
    particle.style.setProperty("--click-x", `${event.clientX}px`);
    particle.style.setProperty("--click-y", `${event.clientY}px`);
    particle.style.setProperty("--click-dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--click-dy", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--click-duration", `${clickEffectConfig.duration}ms`);
    particle.style.setProperty("--click-particle-size", `${clickEffectConfig.particleSize}px`);
    particle.style.setProperty("--click-particle-color", clickEffectConfig.color);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
    layer.appendChild(particle);
  }

  trimClickEffectParticles(layer);
}

function setHoverRevealIndex(card, activeIndex) {
  const items = [...card.querySelectorAll(".online-series-item")];
  const panels = [...card.querySelectorAll(".hover-reveal-panel")];

  card.classList.add("is-hovering");
  card.dataset.hoverIndex = `${activeIndex}`;

  items.forEach((item, index) => {
    item.classList.toggle("is-active", index === activeIndex);
  });

  panels.forEach((panel, index) => {
    panel.classList.toggle("is-active", index === activeIndex);
    panel.classList.toggle("is-before", index < activeIndex);
    panel.classList.toggle("is-after", index > activeIndex);
  });
}

function clearHoverReveal(card) {
  card.classList.remove("is-hovering");
  delete card.dataset.hoverIndex;

  card.querySelectorAll(".online-series-item, .hover-reveal-panel").forEach((element) => {
    element.classList.remove("is-active", "is-before", "is-after");
  });
}

function moveHoverReveal(event) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();

  card.style.setProperty("--hover-x", `${event.clientX - rect.left}px`);
  card.style.setProperty("--hover-y", `${event.clientY - rect.top}px`);
}

function setupHoverImageRevealCards() {
  hoverImageRevealCards.forEach((card) => {
    card.addEventListener("pointermove", moveHoverReveal);
    card.addEventListener("pointerleave", () => clearHoverReveal(card));

    card.querySelectorAll(".online-series-item").forEach((item) => {
      item.addEventListener("pointerenter", () => {
        setHoverRevealIndex(card, Number(item.dataset.hoverIndex || 0));
      });
    });
  });
}

function openPreviewCalendarResponse(button) {
  const card = button.closest(".preview-calendar-card");
  if (!card) return;

  card.classList.add("is-response-open");
  card.querySelector(".preview-calendar-response")?.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    card.querySelector(".preview-calendar-input")?.focus({ preventScroll: true });
  }, 280);
}

function closePreviewCalendarResponse(card) {
  if (!card) return;

  card.classList.remove("is-response-open");
  card.querySelector(".preview-calendar-response")?.setAttribute("aria-hidden", "true");
}

function syncDeckHeight() {
  if (!deck) return;
  deck.style.height = `${Math.max(deckCards.length, 1) * 100}svh`;
}

function getDeckMetrics() {
  if (!deck) return { top: 0, end: 0, distance: 1, step: window.innerHeight };

  const top = deck.offsetTop;
  const distance = Math.max(deck.offsetHeight - window.innerHeight, 1);
  const step = deckCards.length > 1 ? distance / (deckCards.length - 1) : window.innerHeight;

  return {
    top,
    end: top + distance,
    distance,
    step,
  };
}

function getProgress(metrics = getDeckMetrics()) {
  const raw = ((window.scrollY - metrics.top) / metrics.distance) * (deckCards.length - 1);
  return clamp(raw, 0, Math.max(deckCards.length - 1, 0));
}

function getCardNavSection(card) {
  return card?.dataset.navSection || card?.dataset.section || "";
}

function buildNavSectionMeta() {
  const counts = new Map(navSections.map((section) => [section, 0]));
  const starts = new Map();

  deckCards.forEach((card, index) => {
    const navSection = getCardNavSection(card);

    if (!counts.has(navSection)) {
      return;
    }

    if (!starts.has(navSection)) {
      starts.set(navSection, index);
    }

    counts.set(navSection, counts.get(navSection) + 1);
  });

  navSectionLookup = new Map(
    navSections.map((section, order) => [
      section,
      {
        order,
        section,
        startIndex: starts.get(section) ?? 0,
        total: Math.max(counts.get(section) || 1, 1),
      },
    ]),
  );

  const seen = new Map();

  deckCards.forEach((card) => {
    const navSection = getCardNavSection(card);
    const meta = navSectionLookup.get(navSection);

    if (!meta) {
      return;
    }

    const cardIndex = (seen.get(navSection) || 0) + 1;
    seen.set(navSection, cardIndex);
    card.dataset.navCardIndex = String(cardIndex);
    card.dataset.navCardCount = String(meta.total);
  });
}

function updateNavProgress(activeCard, progressValue = currentProgress) {
  if (!activeCard) return;

  if (!navSectionLookup.size) {
    buildNavSectionMeta();
  }

  const navSection = getCardNavSection(activeCard);
  const activeMeta = navSectionLookup.get(navSection);

  if (!activeMeta) return;

  const currentRatio = clamp(
    (progressValue - activeMeta.startIndex + 1) / activeMeta.total,
    1 / activeMeta.total,
    1,
  );

  navItems.forEach((item) => {
    const itemMeta = navSectionLookup.get(item.dataset.section);
    let ratio = 0;

    if (itemMeta) {
      if (itemMeta.order < activeMeta.order) {
        ratio = 1;
      } else if (itemMeta.order === activeMeta.order) {
        ratio = currentRatio;
      }
    }

    item.style.setProperty("--nav-progress-angle", `${(ratio * 360).toFixed(3)}deg`);
    item.classList.toggle("is-progressed", ratio > 0);
    item.classList.toggle("is-complete", ratio >= 1 && itemMeta?.order < activeMeta.order);
    item.classList.toggle("is-active", item.dataset.section === navSection);
  });
}

function setNavMagnet(x, y) {
  navItems.forEach((item) => {
    const icon = item.querySelector(".nav-icon");
    const rect = icon?.getBoundingClientRect();

    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(x - centerX, (y - centerY) * 0.7);
    const rawInfluence = clamp(1 - distance / navMagnetConfig.radius, 0, 1);
    const influence = Math.pow(rawInfluence, navMagnetConfig.falloff);
    const scale = 1 + (navMagnetConfig.maxScale - 1) * influence;
    const lift = navMagnetConfig.maxLift * influence;

    item.style.setProperty("--nav-magnet-scale", scale.toFixed(4));
    item.style.setProperty("--nav-magnet-lift", `${lift.toFixed(3)}px`);
  });
}

function resetNavMagnet() {
  navItems.forEach((item) => {
    item.style.setProperty("--nav-magnet-scale", "1");
    item.style.setProperty("--nav-magnet-lift", "0px");
  });
}

function prepareIntroMouseFollow() {
  if (!introMouseFollowLayer || introMouseFollow.ready) return;

  for (let index = 0; index < introMouseFollowConfig.poolSize; index += 1) {
    const image = document.createElement("img");
    image.className = "intro-follow-image";
    image.alt = "";
    image.decoding = "async";
    image.draggable = false;
    image.style.setProperty("--follow-width", "0px");
    image.addEventListener("animationend", () => {
      image.classList.remove("is-playing");
    });
    introMouseFollowLayer.appendChild(image);
    introMouseFollow.items.push(image);
    introMouseFollow.timers.push(0);
  }

  introMouseFollow.ready = true;
}

function resetIntroMouseFollow() {
  introMouseFollow.items.forEach((image, index) => {
    window.clearTimeout(introMouseFollow.timers[index]);
    introMouseFollow.timers[index] = 0;
    image.classList.remove("is-playing");
    image.style.opacity = "0";
  });
  introMouseFollow.lastX = 0;
  introMouseFollow.lastY = 0;
  introMouseFollow.lastTime = 0;
}

function triggerIntroMouseFollow(event) {
  if (!introMouseFollowLayer || !deckStage?.classList.contains("is-intro-cover-stage") || event.pointerType === "touch") return;

  const rect = introMouseFollowLayer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    return;
  }

  const now = performance.now();
  const distance = Math.hypot(x - introMouseFollow.lastX, y - introMouseFollow.lastY);

  if (introMouseFollow.lastTime && (distance < introMouseFollowConfig.minDistance || now - introMouseFollow.lastTime < introMouseFollowConfig.minInterval)) {
    return;
  }

  prepareIntroMouseFollow();

  const poolIndex = introMouseFollow.poolIndex % introMouseFollow.items.length;
  const image = introMouseFollow.items[poolIndex];
  const imageConfig = introMouseFollowConfig.images[introMouseFollow.imageIndex % introMouseFollowConfig.images.length];
  const viewportScale = rect.width / introMouseFollowConfig.baseViewportWidth;
  const velocityX = introMouseFollow.lastTime ? x - introMouseFollow.lastX : 0;
  const velocityY = introMouseFollow.lastTime ? y - introMouseFollow.lastY : 0;
  const rotate = clamp(velocityX * 0.046 + velocityY * 0.015, -7, 7);
  const width = imageConfig.width * viewportScale * introMouseFollowConfig.imageScale;
  const driftX = clamp(velocityX * 0.42, -introMouseFollowConfig.driftMax, introMouseFollowConfig.driftMax);
  const driftY = clamp(velocityY * 0.42, -introMouseFollowConfig.driftMax, introMouseFollowConfig.driftMax);

  window.clearTimeout(introMouseFollow.timers[poolIndex]);
  image.classList.remove("is-playing");
  image.style.opacity = "";
  image.style.setProperty("--follow-width", `${width.toFixed(2)}px`);
  image.style.setProperty("--follow-x", `${x.toFixed(2)}px`);
  image.style.setProperty("--follow-y", `${y.toFixed(2)}px`);
  image.style.setProperty("--follow-mid-drift-x", `${(driftX * 0.58).toFixed(2)}px`);
  image.style.setProperty("--follow-mid-drift-y", `${(driftY * 0.58).toFixed(2)}px`);
  image.style.setProperty("--follow-drift-x", `${driftX.toFixed(2)}px`);
  image.style.setProperty("--follow-drift-y", `${driftY.toFixed(2)}px`);
  image.style.setProperty("--follow-rotate-start", `${(rotate * 0.22).toFixed(2)}deg`);
  image.style.setProperty("--follow-rotate", `${rotate.toFixed(2)}deg`);
  image.style.setProperty("--follow-rotate-mid", `${(rotate * 0.82).toFixed(2)}deg`);
  image.style.setProperty("--follow-rotate-end", `${(rotate * 0.35).toFixed(2)}deg`);
  image.src = imageConfig.src;
  void image.offsetWidth;
  image.classList.add("is-playing");

  introMouseFollow.timers[poolIndex] = window.setTimeout(() => {
    image.classList.remove("is-playing");
  }, introMouseFollowConfig.lifetime);

  introMouseFollow.poolIndex += 1;
  introMouseFollow.imageIndex += 1;
  introMouseFollow.lastX = x;
  introMouseFollow.lastY = y;
  introMouseFollow.lastTime = now;
}

function handleIntroGlowPointerMove(event) {
  if (!deckStage?.classList.contains("is-intro-cover-stage") || event.pointerType === "touch") return;

  triggerIntroMouseFollow(event);
}

function handleIntroGlowPointerLeave() {
  resetIntroMouseFollow();
}

function updateSocialOrbitPlayback() {
  socialOrbitMotion.frame = 0;

  if (!socialOrbitRing) return;

  socialOrbitMotion.rate += (socialOrbitMotion.targetRate - socialOrbitMotion.rate) * socialOrbitConfig.easing;

  const animations = socialOrbitRing.getAnimations?.() || [];
  animations.forEach((animation) => {
    animation.updatePlaybackRate(socialOrbitMotion.rate);
  });

  if (Math.abs(socialOrbitMotion.rate - socialOrbitMotion.targetRate) > 0.002) {
    socialOrbitMotion.frame = window.requestAnimationFrame(updateSocialOrbitPlayback);
    return;
  }

  socialOrbitMotion.rate = socialOrbitMotion.targetRate;
  animations.forEach((animation) => {
    animation.updatePlaybackRate(socialOrbitMotion.rate);
  });
}

function setSocialOrbitTargetRate(rate) {
  socialOrbitMotion.targetRate = rate;
  if (!socialOrbitMotion.frame) {
    socialOrbitMotion.frame = window.requestAnimationFrame(updateSocialOrbitPlayback);
  }
}

function handleNavPointerMove(event) {
  if (event.pointerType === "touch") return;
  setNavMagnet(event.clientX, event.clientY);
}

function setActiveSection(sectionId, replaceHash = true, progressValue = currentProgress) {
  if (!sectionId) {
    return;
  }

  const activeCard = deckCards.find((card) => card.dataset.section === sectionId);

  if (!activeCard) {
    return;
  }

  updateNavProgress(activeCard, progressValue);

  if (activeSection === sectionId) {
    return;
  }

  activeSection = sectionId;

  const lightUi = activeCard?.dataset.ui === "light";

  document.body.classList.toggle("theme-light-ui", lightUi);
  document.body.classList.toggle("theme-dark-ui", !lightUi);

  if (replaceHash && window.location.hash !== `#${sectionId}`) {
    history.replaceState(null, "", `#${sectionId}`);
  }
}

function applyStageTheme(card) {
  if (!deckStage || !card) return;

  const theme = themeConfig[card.dataset.theme] || themeConfig.black;
  const isCoverStage = card.dataset.cover === "true" && Boolean(theme.coverImage);
  deckStage.style.setProperty("--chapter-bg", theme.bg);
  deckStage.style.setProperty("--chapter-ink", theme.ink);
  deckStage.style.setProperty("--grid-line", theme.grid);
  deckStage.style.setProperty("--cover-image", theme.coverImage || "none");
  deckStage.style.setProperty("--cover-size", theme.coverSize || "cover");
  deckStage.style.setProperty("--cover-bleed-x", theme.coverBleedX || "0px");
  deckStage.style.setProperty("--cover-bleed-y", theme.coverBleedY || "0px");
  deckStage.classList.toggle("is-cover-stage", isCoverStage);
  deckStage.classList.toggle("is-intro-cover-stage", card.dataset.section === "intro");
  deckStage.classList.toggle("is-section-cover-stage", isCoverStage && card.dataset.section !== "intro");
  if (card.dataset.section !== "intro") {
    handleIntroGlowPointerLeave();
  }
}

function applyCardPose(card, offset) {
  const abs = Math.abs(offset);
  const sign = Math.sign(offset);
  const overflow = Math.max(abs - 1, 0);
  const x = abs <= 1 ? offset * 34 : sign * (34 + overflow * 17.5);
  const z = -Math.min(abs, 1) * 136 - overflow * 163;
  const scale = clamp(1 - Math.min(abs, 1) * 0.25 - overflow * 0.12, 0.42, 1);
  const widthScale = clamp(1 - overflow * 0.12, 0.72, 1);
  const rotateY = clamp(sign * (Math.min(abs, 1) * 27 + overflow * 27), -54, 54);
  const opacity = abs <= 1 ? 1 - abs * 0.04 : clamp(0.96 - overflow * 2.4, 0, 0.96);

  card.style.transform = [
    "translate(-50%, -50%)",
    `translateX(${x.toFixed(3)}vw)`,
    `translateZ(${z.toFixed(3)}px)`,
    `rotateY(${rotateY.toFixed(3)}deg)`,
    `scaleX(${widthScale.toFixed(4)})`,
    `scale(${scale.toFixed(4)})`,
  ].join(" ");
  card.style.opacity = opacity.toFixed(3);
  card.style.zIndex = String(Math.round(1000 - abs * 100));
  card.style.visibility = abs > 1.45 ? "hidden" : "visible";
  card.classList.toggle("is-active", abs < 0.5);
  card.classList.toggle("is-intro-cover-mode", card.dataset.section === "intro" && offset > -0.98);
  card.setAttribute("aria-hidden", abs < 1.45 ? "false" : "true");
}

function updateDeck() {
  rafId = 0;
  const metrics = getDeckMetrics();

  if (window.scrollY < metrics.top - 8) {
    currentProgress = 0;
    deckCards.forEach((card, index) => applyCardPose(card, index));
    applyStageTheme(deckCards[0]);
    setActiveSection(deckCards[0]?.dataset.section, true, 0);
    return;
  }

  currentProgress = getProgress(metrics);
  const activeIndex = clamp(Math.round(currentProgress), 0, deckCards.length - 1);
  const activeCard = deckCards[activeIndex];

  deckCards.forEach((card, index) => {
    applyCardPose(card, index - currentProgress);
  });

  applyStageTheme(activeCard);
  setActiveSection(activeCard.dataset.section, true, currentProgress);
}

function requestDeckUpdate() {
  if (rafId) return;
  rafId = window.requestAnimationFrame(updateDeck);
}

function scrollToSection(sectionId, behavior = "smooth") {
  const index = deckCards.findIndex((card) => card.dataset.section === sectionId);
  if (index < 0) return;

  const metrics = getDeckMetrics();
  const top = metrics.top + metrics.step * index;
  const target = deckCards[index];
  window.scrollTo({ top, behavior });
  applyStageTheme(target);
  setActiveSection(sectionId, true, index);
  requestDeckUpdate();
}

function handleHashLink(event) {
  const openCalendar = event.target.closest(".preview-calendar-card.is-response-open");
  if (
    openCalendar &&
    event.target.closest(".preview-calendar-response") &&
    !event.target.closest(".preview-calendar-input-wrap, .preview-calendar-submit")
  ) {
    event.preventDefault();
    closePreviewCalendarResponse(openCalendar);
    return;
  }

  const calendarButton = event.target.closest(".preview-calendar-button");
  if (calendarButton) {
    event.preventDefault();
    openPreviewCalendarResponse(calendarButton);
    return;
  }

  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const sectionId = link.getAttribute("href").slice(1);
  const known = deckCards.some((card) => card.dataset.section === sectionId);
  if (!known) return;

  event.preventDefault();
  scrollToSection(sectionId);
}

function handleDeckWheel(event) {
  if (!deckCards.length || Math.abs(event.deltaY) < 20 || event.ctrlKey) return;

  const metrics = getDeckMetrics();
  const direction = Math.sign(event.deltaY);

  const inDeck = window.scrollY >= metrics.top - 4 && window.scrollY <= metrics.end + 4;
  if (!inDeck) return;

  event.preventDefault();
  if (wheelLocked) return;

  const progress = getProgress(metrics);

  if (progress <= 0.03 && direction < 0) {
    return;
  }

  const targetIndex = clamp(Math.round(progress) + direction, 0, deckCards.length - 1);
  if (targetIndex === Math.round(progress)) return;

  wheelLocked = true;
  window.setTimeout(() => {
    wheelLocked = false;
  }, 620);

  const target = deckCards[targetIndex];
  scrollToSection(target.dataset.section);
}

document.addEventListener("click", handleHashLink);
document.addEventListener("mousedown", spawnClickEffect);
setupHoverImageRevealCards();
chapterNav?.addEventListener("pointermove", handleNavPointerMove);
chapterNav?.addEventListener("pointerleave", resetNavMagnet);
deckStage?.addEventListener("pointermove", handleIntroGlowPointerMove);
deckStage?.addEventListener("pointerleave", handleIntroGlowPointerLeave);
socialOrbitRingFrame?.addEventListener("pointerenter", () => {
  setSocialOrbitTargetRate(socialOrbitConfig.hoverRate);
});
socialOrbitRingFrame?.addEventListener("pointerleave", () => {
  setSocialOrbitTargetRate(socialOrbitConfig.normalRate);
});
window.addEventListener("scroll", requestDeckUpdate, { passive: true });
window.addEventListener("resize", () => {
  syncDeckHeight();
  requestDeckUpdate();
});
window.addEventListener("wheel", handleDeckWheel, { passive: false });

copyButton?.addEventListener("click", async () => {
  const url = `${window.location.origin}${window.location.pathname}#${activeSection}`;

  try {
    await navigator.clipboard.writeText(url);
    copyButton.textContent = "Copied";
  } catch {
    copyButton.textContent = "Copy failed";
  }

  window.setTimeout(() => {
    copyButton.textContent = "Return";
  }, 1400);
});

shareButton?.addEventListener("click", () => {
  shareButton.textContent = "Asset pending";
  window.setTimeout(() => {
    shareButton.textContent = "START SCROLLING";
  }, 1400);
});

const initialId = window.location.hash.replace("#", "") || "intro";

buildNavSectionMeta();
syncDeckHeight();
scrollToSection(initialId, "auto");
updateDeck();

window.requestAnimationFrame(() => {
  updateDeck();
  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("is-deck-preloading");
    updateDeck();
  });
});
