/**
 * 부드러운 스크롤 이동을 처리하는 유틸리티 함수입니다.
 * 지정된 요소로 정해진 시간 동안 부드럽게 스크롤합니다.
 *
 * @param targetId - 스크롤할 대상 요소의 ID
 * @param duration - 스크롤 애니메이션 지속 시간 (ms). 기본값: 1000ms
 * @param offset - 대상 요소 위치에 더할 오프셋 (px). 기본값: 0
 */
export const smoothScrollTo = (
  targetId: string,
  duration: number = 1000,
  offset: number = 0,
) => {
  if (typeof window === "undefined") return;

  const target = document.getElementById(targetId);
  if (!target) return;

  // CSS scroll-margin-top 값 계산
  const style = window.getComputedStyle(target);
  const scrollMarginTop = parseInt(style.scrollMarginTop || "0", 10);

  // 최종 타겟 위치 계산 (현재 스크롤 + 요소 위치 + 오프셋 - 스크롤 마진)
  const targetPosition =
    target.getBoundingClientRect().top +
    window.scrollY +
    offset -
    scrollMarginTop;

  const startPosition = window.scrollY;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  const animation = (currentTime: number) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);

    if (timeElapsed < duration) requestAnimationFrame(animation);
  };

  requestAnimationFrame(animation);
};

/**
 * Ease In Out Quad 함수 - 시작과 끝을 부드럽게 감속/가속
 */
const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
  t /= d / 2;
  if (t < 1) return (c / 2) * t * t + b;
  t--;
  return (-c / 2) * (t * (t - 2) - 1) + b;
};
