import "@testing-library/jest-dom";

// jsdom doesn't implement scrollIntoView — provide a no-op polyfill
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  // @ts-expect-error - adding a polyfill for test environment
  Element.prototype.scrollIntoView = () => {};
}
