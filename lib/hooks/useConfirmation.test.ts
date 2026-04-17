import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfirmation } from './useConfirmation';

describe('useConfirmation', () => {
  it('should initialize with isOpen false', () => {
    const { result } = renderHook(() => useConfirmation());
    expect(result.current.isOpen).toBe(false);
  });

  it('should open confirmation when showConfirmation is called', () => {
    const { result } = renderHook(() => useConfirmation());
    const onConfirm = vi.fn();
    act(() => {
      result.current.showConfirmation(onConfirm);
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should execute confirm callback when confirm is called', () => {
    const { result } = renderHook(() => useConfirmation());
    const onConfirm = vi.fn();
    act(() => {
      result.current.showConfirmation(onConfirm);
    });
    act(() => {
      result.current.confirm();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it('should execute cancel callback when cancel is called', () => {
    const { result } = renderHook(() => useConfirmation());
    const onCancel = vi.fn();
    act(() => {
      result.current.showConfirmation(vi.fn(), onCancel);
    });
    act(() => {
      result.current.cancel();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it('should use empty function if onCancel is not provided', () => {
    const { result } = renderHook(() => useConfirmation());
    const onConfirm = vi.fn();
    act(() => {
      result.current.showConfirmation(onConfirm);
    });
    act(() => {
      result.current.cancel();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useConfirmation());
    act(() => {
      result.current.showConfirmation(vi.fn());
    });
    expect(result.current.isOpen).toBe(true);
    unmount();
    // Confirmation should be closed after unmount (cleanup effect)
  });

  it('should handle multiple showConfirmation calls', () => {
    const { result } = renderHook(() => useConfirmation());
    const onConfirm1 = vi.fn();
    const onConfirm2 = vi.fn();
    act(() => {
      result.current.showConfirmation(onConfirm1);
    });
    act(() => {
      result.current.showConfirmation(onConfirm2);
    });
    act(() => {
      result.current.confirm();
    });
    expect(onConfirm2).toHaveBeenCalledTimes(1);
    expect(onConfirm1).not.toHaveBeenCalled();
  });
});
