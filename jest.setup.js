// A plain class, not a jest.fn: `jest.resetAllMocks()` in a test file would wipe its implementation.
class ResizeObserverMock {
    disconnect() {}
    observe() {}
    unobserve() {}
}

Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverMock });

// Mock pointer capture APIs for Radix UI components in jsdom
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.setPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();

// Mock scrollIntoView for Radix UI components in jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock elementFromPoint for input-otp's password manager badge detection in jsdom
document.elementFromPoint = jest.fn(() => null);

// Web platform globals jsdom leaves out, which `@reachfive/identity-core` needs: it encodes with
// `TextEncoder` and requests with `fetch`. Up to 1.42.0 the core bundled the fetch polyfill itself.
const { TextDecoder, TextEncoder } = require('node:util');
Object.defineProperty(global, 'TextEncoder', { value: TextEncoder });
Object.defineProperty(global, 'TextDecoder', { value: TextDecoder });
require('whatwg-fetch');
