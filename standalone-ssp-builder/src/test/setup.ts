/**
 * Test setup file for Vitest
 */
import '@testing-library/jest-dom';

// Mock crypto.randomUUID for tests
if (!globalThis.crypto) {
  globalThis.crypto = {} as Crypto;
}
if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

// Ensure File.prototype.text is available (polyfill for older jsdom versions)
if (typeof File !== 'undefined' && !File.prototype.text) {
  File.prototype.text = function(): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
}
