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

// Language toggle setup
const languageCheckbox = document.getElementById("language-checkbox");
languageCheckbox.checked = currentLanguage === "zh";
languageCheckbox.addEventListener("change", () => {
  currentLanguage = languageCheckbox.checked ? "zh" : "en";
  localStorage.setItem("language", currentLanguage);
  updatePageLanguage();
});

// Update page on load
updatePageLanguage();

// ===== Lightbox setup =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.querySelector(".lightbox-img");
const closeBtn = document.querySelector(".lightbox .close");
const leftArrow = document.querySelector(".lightbox .arrow.left");
const rightArrow = document.querySelector(".lightbox .arrow.right");
const artNameElem = document.querySelector(".lightbox-caption .art-name");
const artDescElem = document.querySelector(".lightbox-caption .art-desc");

// Gather artworks
const artworks = Array.from(document.querySelectorAll(".gallery-grid img")).map(img => ({
  src: img.src,
  alt: img.alt,
  name: img.getAttribute("data-name") || img.alt,
  desc: img.getAttribute("data-desc") || "",
  link: img.getAttribute("data-link") || ""
}));

let currentIndex = 0;

// ===== Functions =====
function showLightbox(index) {
  const art = artworks[index];
  lightbox.style.display = "flex";
  lightboxImg.src = art.src;
  lightboxImg.alt = art.alt;
  artNameElem.textContent = art.name;
  if(art.link) {
    artDescElem.innerHTML = `${art.desc} <a href="${art.link}" target="_blank" rel="noopener">Link to Artist</a>`;
  } else {
    artDescElem.textContent = art.desc;
  }
  currentIndex = index;
}

function showNext() { showLightbox((currentIndex + 1) % artworks.length); }
function showPrev() { showLightbox((currentIndex - 1 + artworks.length) % artworks.length); }

// Open lightbox when clicking gallery image
document.querySelectorAll(".gallery-grid img").forEach((img, i) => {
  img.addEventListener("click", () => showLightbox(i));
});

// Close lightbox
closeBtn.addEventListener("click", () => lightbox.style.display = "none");
lightbox.addEventListener("click", (e) => {
  if(e.target === lightbox) lightbox.style.display = "none";
});

// Prevent clicking link from closing lightbox
artDescElem.addEventListener("click", e => e.stopPropagation());

// Arrow buttons
leftArrow.addEventListener("click", e => { e.stopPropagation(); showPrev(); });
rightArrow.addEventListener("click", e => { e.stopPropagation(); showNext(); });

// Keyboard navigation
document.addEventListener("keydown", e => {
  if(lightbox.style.display === "flex") {
    switch(e.key){
      case "ArrowLeft": showPrev(); break;
      case "ArrowRight": showNext(); break;
      case "Escape": lightbox.style.display = "none"; break;
    }
  }
});

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
  popupOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePopup() {
  if (!popupOverlay) return;
  popupOverlay.classList.remove("is-open");
  popupOverlay.setAttribute("aria-hidden", "true");
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
  popupOverlay.addEventListener("click", e => {
    if (e.target === popupOverlay) closePopup();
  });

  document.addEventListener("keydown", e => {
    if (popupOverlay.classList.contains("is-open") && e.key === "Escape") {
      closePopup();
    }
  });
}

// Smooth open/close animations for details
document.querySelectorAll("details.animated").forEach((details) => {
  const summary = details.querySelector("summary");
  const content = details.querySelector(".details-content");
  details.style.overflow = "hidden";
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (details.open) {
      const height = content.offsetHeight;
      content.animate([{ height: height + "px" }, { height: "0px" }], { duration: 300, easing: "ease-in-out" }).onfinish = () => {
        details.open = false;
        content.style.height = "";
      };
    } else {
      details.open = true;
      const height = content.offsetHeight;
      content.style.height = "0px";
      content.animate([{ height: "0px" }, { height: height + "px" }], { duration: 300, easing: "ease-in-out" }).onfinish = () => {
        content.style.height = "";
      };
    }
  });
});
