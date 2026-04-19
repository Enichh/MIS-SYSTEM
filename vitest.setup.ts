import '@testing-library/jest-dom';

// Mock scrollIntoView for all tests
window.HTMLElement.prototype.scrollIntoView = vi.fn();
