import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIdleTimeout } from './useIdleTimeout';

describe('useIdleTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not trigger callbacks when disabled', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1,
        warningSeconds: 30,
        onWarning,
        onTimeout,
        enabled: false,
      })
    );

    // Advance time past timeout
    vi.advanceTimersByTime(120000); // 2 minutes

    expect(onWarning).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('registers event listeners on mount', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1,
        onWarning,
        onTimeout,
        enabled: true,
      })
    );

    // Check that all activity events are registered
    expect(window.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function), { passive: true });
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function), { passive: true });
    expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(window.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), { passive: true });
    expect(window.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
  });

  it('removes event listeners on unmount', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    const { unmount } = renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1,
        onWarning,
        onTimeout,
        enabled: true,
      })
    );

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
  });

  it('calls onWarning before timeout', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1, // 60 seconds
        warningSeconds: 30, // Warning at 30 seconds before timeout
        onWarning,
        onTimeout,
        enabled: true,
      })
    );

    // Advance to just past warning threshold (60s - 30s = 30s + check interval)
    vi.advanceTimersByTime(35000); // 35 seconds (past the 30s warning threshold)

    expect(onWarning).toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('calls onTimeout after full timeout period', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1, // 60 seconds
        warningSeconds: 30,
        onWarning,
        onTimeout,
        enabled: true,
      })
    );

    // Advance past full timeout
    vi.advanceTimersByTime(65000); // 65 seconds

    expect(onTimeout).toHaveBeenCalled();
  });

  it('resets on user activity', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1,
        warningSeconds: 30,
        onWarning,
        onTimeout,
        enabled: true,
      })
    );

    // Advance to near warning
    vi.advanceTimersByTime(25000);

    // Simulate user activity
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    // Advance another 25 seconds (should still be under warning threshold from reset)
    vi.advanceTimersByTime(25000);

    // Warning should not have been called because timer was reset
    expect(onWarning).not.toHaveBeenCalled();
  });

  it('resetTimer function resets all state', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    const { result } = renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1,
        warningSeconds: 30,
        onWarning,
        onTimeout,
        enabled: true,
      })
    );

    // Advance to past warning
    vi.advanceTimersByTime(35000);
    expect(onWarning).toHaveBeenCalledTimes(1);

    // Reset timer
    act(() => {
      result.current.resetTimer();
    });

    // Advance again to warning threshold
    vi.advanceTimersByTime(35000);

    // Warning should be called again (2 total)
    expect(onWarning).toHaveBeenCalledTimes(2);
  });

  it('does not call timeout twice', () => {
    const onWarning = vi.fn();
    const onTimeout = vi.fn();

    renderHook(() =>
      useIdleTimeout({
        timeoutMinutes: 1,
        warningSeconds: 30,
        onWarning,
        onTimeout,
        enabled: true,
      })
    );

    // Advance well past timeout multiple intervals
    vi.advanceTimersByTime(120000); // 2 minutes

    // Timeout should only be called once
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
