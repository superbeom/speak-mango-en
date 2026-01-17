"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

// Webkit 호환성을 위해 Window 인터페이스 확장
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface AudioContextType {
  /**
   * 공유된 AudioContext 인스턴스를 반환합니다.
   * 싱글턴 패턴을 따르며, 아직 생성되지 않았다면 새로 생성합니다.
   */
  getAudio: () => AudioContext | null;
}

const AudioContextContext = createContext<AudioContextType | undefined>(
  undefined
);

export function AudioProvider({ children }: { children: ReactNode }) {
  // 컴포넌트 생명주기와 무관하게 전역적으로 유일한 AudioContext를 유지하기 위한 ref
  // React Strict Mode나 리렌더링 시에도 컨텍스트가 닫히지 않도록 합니다.
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // 마운트 시에는 아무것도 하지 않음 (Lazy Initialization 권장)
    // AudioContext는 사용자 제스처(클릭 등)가 있을 때 생성/재개하는 것이 가장 안전합니다.

    return () => {
      // 언마운트 시 정리 로직
      // 주의: 페이지 이동(SPA 네비게이션) 시에는 컨텍스트를 유지하는 것이 좋을 수 있으나,
      // 앱 전체가 언마운트되거나 새로고침될 때는 브라우저가 알아서 정리합니다.
      // 명시적으로 close()를 호출하면, 실수로 레이아웃이 리렌더링될 때 오디오가 끊길 수 있습니다.
      // 따라서 여기서는 명시적 close를 하지 않거나, 정말 필요할 때만 합니다.
    };
  }, []);

  /**
   * AudioContext를 가져오거나 생성하는 함수입니다.
   * 이 함수는 여러 컴포넌트에서 동시에 호출될 수 있습니다.
   */
  const getAudio = useCallback(() => {
    if (typeof window === "undefined") return null;

    // 이미 생성된 인스턴스가 있다면 반환
    if (contextRef.current) {
      if (contextRef.current.state === "closed") {
        contextRef.current = null; // 닫혀 있다면 초기화
      } else {
        return contextRef.current;
      }
    }

    // 전역 싱글턴 확인 (HMR 대응)
    if ((window as any).__SHARED_AUDIO_CONTEXT__) {
      contextRef.current = (window as any).__SHARED_AUDIO_CONTEXT__;
      return contextRef.current;
    }

    // 새로운 AudioContext 생성
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioContextClass) {
      console.error("이 브라우저는 Web Audio API를 지원하지 않습니다.");
      return null;
    }

    const ctx = new AudioContextClass();
    contextRef.current = ctx;

    // 전역 변수에 저장하여 HMR이나 다른 인스턴스에서도 접근 가능하게 함
    (window as any).__SHARED_AUDIO_CONTEXT__ = ctx;

    return ctx;
  }, []);

  const value = useMemo(
    () => ({
      getAudio,
    }),
    [getAudio]
  );

  return (
    <AudioContextContext.Provider value={value}>
      {children}
    </AudioContextContext.Provider>
  );
}

/**
 * AudioContext를 사용하기 위한 커스텀 훅입니다.
 */
export function useAudio() {
  const context = useContext(AudioContextContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
