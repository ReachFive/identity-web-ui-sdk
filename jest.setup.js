const ResizeObserverMock = jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
}));

Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverMock });

// Mock pointer capture APIs for Radix UI components in jsdom
window.HTMLElement.prototype.hasPointerCapture = jest.fn();
window.HTMLElement.prototype.setPointerCapture = jest.fn();
window.HTMLElement.prototype.releasePointerCapture = jest.fn();

// Mock scrollIntoView for Radix UI components in jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();
