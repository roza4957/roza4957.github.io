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
