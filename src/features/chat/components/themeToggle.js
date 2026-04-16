const THEME_STORAGE_KEY = "enosoft_theme_preference";

class ThemeToggle {
  constructor(element) {
    this.element = element;
    this.currentTheme = loadThemePreference() || this.detectSystemPreference();
    this.render();
    this.attachEventListener();
  }

  detectSystemPreference() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }

  render() {
    this.element.innerHTML = `
      <button class="theme-toggle-btn" aria-label="Toggle theme">
        <svg class="theme-icon sun-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" fill="currentColor"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <svg class="theme-icon moon-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
        </svg>
      </button>
    `;
    this.updateIcon();
  }

  updateIcon() {
    const sunIcon = this.element.querySelector(".sun-icon");
    const moonIcon = this.element.querySelector(".moon-icon");

    if (this.currentTheme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }

  toggle() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    saveThemePreference(this.currentTheme);
    applyTheme(this.currentTheme);
    this.updateIcon();
  }

  attachEventListener() {
    const button = this.element.querySelector(".theme-toggle-btn");
    if (button) {
      button.addEventListener("click", () => this.toggle());
    }
  }
}

function initializeThemeManager() {
  const savedTheme = loadThemePreference();
  const theme =
    savedTheme ||
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(theme);
  return theme;
}

function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const validTheme =
    currentTheme === "light" || currentTheme === "dark"
      ? currentTheme
      : "light";
  const newTheme = validTheme === "light" ? "dark" : "light";
  saveThemePreference(newTheme);
  applyTheme(newTheme);
  return newTheme;
}

function saveThemePreference(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error("Failed to save theme preference:", error);
  }
}

function loadThemePreference() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to load theme preference:", error);
    return null;
  }
}

function applyTheme(theme) {
  const validTheme = theme === "light" || theme === "dark" ? theme : "light";
  document.documentElement.setAttribute("data-theme", validTheme);
}

export { ThemeToggle, initializeThemeManager, toggleTheme };
