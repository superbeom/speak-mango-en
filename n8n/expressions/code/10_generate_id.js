// n8n Code Node: Generate UUID
// 중복이 아님이 확인된 후, 저장 경로 및 DB ID로 사용할 UUID를 생성합니다.

// crypto 모듈이 글로벌에 없을 경우를 대비해 직접 UUID v4 생성 로직 사용
const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
  /[xy]/g,
  function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }
);

return {
  json: {
    ...$input.first().json,
    id: uuid,
  },
};
