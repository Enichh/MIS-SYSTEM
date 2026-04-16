/**
 * @fileoverview Router handles navigation between sections
 * @module app/router
 */

let currentSection = "employees";

/**
 * Handle navigation between sections
 * @param {string} section - The section to navigate to
 */
export function navigateToSection(section) {
  if (!section) return;

  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));
  const activeButton = document.querySelector(`[data-section="${section}"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }

  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("active"));
  const activeSection = document.getElementById(`${section}-section`);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  currentSection = section;
}

/**
 * Get current section
 * @returns {string} Current section name
 */
export function getCurrentSection() {
  return currentSection;
}

/**
 * Setup navigation event listeners
 */
export function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach((button) => {
    button.addEventListener("click", handleNavigation);
  });
}

/**
 * Handle navigation click event
 * @param {Event} event - Click event
 */
function handleNavigation(event) {
  const section = event.target.dataset.section;
  navigateToSection(section);
}
