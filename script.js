// Language state
let currentLanguage = localStorage.getItem("language") || "en";

// Translation function
function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

// Update DOM with translations
function updatePageLanguage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    
    // Special handling for footer to support HTML
    if (key === "footer") {
      el.innerHTML = text;
    } else {
      // Find and replace only the first text node, preserving nested elements
      let foundTextNode = false;
      for (let node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent = text;
          foundTextNode = true;
          break;
        }
      }
      
      // If no text node exists, prepend as text node
      if (!foundTextNode) {
        el.textContent = text;
      }
    }
  });
}

// Language dropdown setup
const languageFlags = { en: "🇺🇸", zh: "🇹🇼", jp: "🇯🇵" };
const supportedLanguages = ["en", "zh", "jp"];
const languageSelect = document.getElementById("language-select");
const languageButton = document.getElementById("language-selected");
const languageOptions = document.getElementById("language-options");
const languageFlag = languageButton?.querySelector(".language-flag");

if (!supportedLanguages.includes(currentLanguage)) {
  currentLanguage = "en";
  localStorage.setItem("language", currentLanguage);
}

function updateLanguageDropdown() {
  if (languageFlag) languageFlag.textContent = languageFlags[currentLanguage] || languageFlags.en;
  if (languageOptions) {
    languageOptions.querySelectorAll("li").forEach(li => {
      li.classList.toggle("is-active", li.dataset.value === currentLanguage);
    });
  }
}

if (languageSelect && languageButton && languageOptions) {
  updateLanguageDropdown();

  languageButton.addEventListener("click", (e) => {
    e.stopPropagation();
    languageSelect.classList.toggle("is-open");
  });

  languageOptions.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-value]");
    if (!li) return;
    const next = li.dataset.value;
    if (supportedLanguages.includes(next)) {
      currentLanguage = next;
      localStorage.setItem("language", currentLanguage);
      document.documentElement.lang = currentLanguage;
      updateLanguageDropdown();
      updatePageLanguage();
    }
    languageSelect.classList.remove("is-open");
  });

  document.addEventListener("click", () => {
    languageSelect.classList.remove("is-open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") languageSelect.classList.remove("is-open");
  });
}

// Update page on load
document.documentElement.lang = currentLanguage;
updatePageLanguage();

// Loop gallery
function initLoopGallery(gallery) {
  const loopImageSlots = Array.from(gallery.querySelectorAll(".loop-image"));
  const loopPrev = gallery.querySelector(".loop-arrow-left");
  const loopNext = gallery.querySelector(".loop-arrow-right");
  let loopImages = [];
  let loopIndex = 0;
  let loopTimer = null;
  let activeSlotIndex = 0;
  let isTransitioning = false;

  function clearSlideClasses(element) {
    element.classList.remove(
      "slide-in-next",
      "slide-in-prev",
      "slide-out-next",
      "slide-out-prev"
    );
  }

  function showLoopImage(index, direction) {
    if (!loopImageSlots.length || !loopImages.length || isTransitioning) return;
    const safeIndex = index % loopImages.length;
    const current = loopImages[safeIndex];
    const outgoing = loopImageSlots[activeSlotIndex];
    const incoming = loopImageSlots[1 - activeSlotIndex];

    isTransitioning = Boolean(direction);
    const preload = new Image();
    preload.onload = () => {
      clearSlideClasses(outgoing);
      clearSlideClasses(incoming);

      incoming.src = current.src;
      incoming.alt = current.alt || "loop image";
      incoming.classList.add("is-active");
      outgoing.classList.remove("is-active");

      if (direction) {
        incoming.classList.add(direction === "prev" ? "slide-in-prev" : "slide-in-next");
        outgoing.classList.add(direction === "prev" ? "slide-out-prev" : "slide-out-next");
      }

      loopIndex = safeIndex;
      activeSlotIndex = 1 - activeSlotIndex;
    };
    preload.onerror = () => {
      isTransitioning = false;
    };
    preload.src = current.src;
  }

  function showPrevImage() {
    if (!loopImages.length) return;
    showLoopImage((loopIndex - 1 + loopImages.length) % loopImages.length, "prev");
  }

  function showNextImage() {
    if (!loopImages.length) return;
    showLoopImage((loopIndex + 1) % loopImages.length, "next");
  }

  function startLoop() {
    if (!loopImageSlots.length || loopImages.length <= 1) return;
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = setInterval(() => {
      showLoopImage(loopIndex + 1, "next");
    }, 4000);
  }

  function stopLoop() {
    if (loopTimer) {
      clearInterval(loopTimer);
      loopTimer = null;
    }
  }

  const gallerySource = gallery.getAttribute("data-source");
  if (!gallerySource || !loopImageSlots.length) return;

  fetch(gallerySource)
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then(data => {
      if (Array.isArray(data?.images)) {
        loopImages = data.images.filter(item => item?.src);
        if (loopImages.length) {
          loopImageSlots.forEach((slot, index) => {
            slot.addEventListener("animationend", () => {
              clearSlideClasses(slot);
              isTransitioning = false;
            });
            if (index !== activeSlotIndex) {
              slot.classList.remove("is-active");
            }
          });

          const first = loopImages[0];
          loopImageSlots[activeSlotIndex].src = first.src;
          loopImageSlots[activeSlotIndex].alt = first.alt || "loop image";
          loopImageSlots[activeSlotIndex].classList.add("is-active");
          startLoop();
        }
      }
    })

  gallery.addEventListener("mouseenter", stopLoop);
  gallery.addEventListener("mouseleave", startLoop);

  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  gallery.addEventListener("touchstart", e => {
    if (!e.touches.length) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSwiping = true;
    stopLoop();
  }, { passive: true });

  gallery.addEventListener("touchmove", e => {
    if (!isSwiping || !e.touches.length) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    if (deltaX > deltaY) {
      e.preventDefault();
    }
  }, { passive: false });

  gallery.addEventListener("touchend", e => {
    if (!isSwiping) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const minSwipe = 40;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipe) {
      if (deltaX > 0) {
        showPrevImage();
      } else {
        showNextImage();
      }
    }

    isSwiping = false;
    startLoop();
  }, { passive: true });

  if (loopPrev && loopNext) {
    loopPrev.addEventListener("click", () => {
      stopLoop();
      showPrevImage();
    });
    loopNext.addEventListener("click", () => {
      stopLoop();
      showNextImage();
    });

    loopPrev.addEventListener("mouseenter", stopLoop);
    loopPrev.addEventListener("mouseleave", startLoop);
    loopNext.addEventListener("mouseenter", stopLoop);
    loopNext.addEventListener("mouseleave", startLoop);
  }
}

document.querySelectorAll(".loop-gallery").forEach(initLoopGallery);

// Back to Top
const backToTopButton = document.querySelector(".back-to-top-button");
if (backToTopButton) {
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===== Social link popup =====
const popupLinks = Array.from(document.querySelectorAll(".popup-link"));
const popupOverlay = document.getElementById("popup-overlay");
const popupClose = popupOverlay?.querySelector(".popup-close");
const popupAction = popupOverlay?.querySelector(".popup-action");
const popupMessage = popupOverlay?.querySelector(".popup-message");
const popupWindow = popupOverlay?.querySelector(".popup-window");

function openPopup(linkHref, message) {
  if (!popupOverlay || !popupAction || !popupMessage) return;
  popupAction.href = linkHref;
  popupMessage.textContent = message || "";
  popupOverlay.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closePopup() {
  if (!popupOverlay) return;
  popupOverlay.classList.remove("is-open");
  document.body.style.overflow = "";
}

if (popupLinks.length && popupOverlay && popupClose && popupWindow) {
  popupLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const messageSource = link.querySelector(".popup-message-source");
      const message = messageSource?.textContent?.trim() || "";
      openPopup(link.href, message);
    });
  });

  popupClose.addEventListener("click", closePopup);
  popupAction.addEventListener("click", closePopup);
  popupOverlay.addEventListener("click", e => {
    if (e.target === popupOverlay) closePopup();
  });

  document.addEventListener("keydown", e => {
    if (popupOverlay.classList.contains("is-open") && e.key === "Escape") {
      closePopup();
    }
  });
}
