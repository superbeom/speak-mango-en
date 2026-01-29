declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    __SHARED_AUDIO_CONTEXT__?: AudioContext;
  }
}

// 이 파일이 모듈(Module)로 취급되도록 강제합니다.
// (import/export가 없는 파일은 전역 스크립트로 간주되어 declare global이 동작하지 않습니다)
export {};
