import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal } from './useModal';

describe('useModal', () => {
  it('should initialize with isOpen false by default', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
  });

  it('should initialize with isOpen true when initialState is true', () => {
    const { result } = renderHook(() => useModal(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('should open modal when open is called', () => {
    const { result } = renderHook(() => useModal());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should close modal when close is called', () => {
    const { result } = renderHook(() => useModal(true));
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle modal when toggle is called', () => {
    const { result } = renderHook(() => useModal());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useModal(true));
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    unmount();
    // Modal should be closed after unmount (cleanup effect)
    // This is verified by no errors being thrown
  });
});
