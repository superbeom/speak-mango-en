// n8n Code Node: Cleanup Meaning
// meaning 필드의 문장 부호(마침표, 세미콜론)를 정리합니다.

const items = $input.all();
const TARGET_LANGS = ["en", "ko", "ja", "es", "fr", "de", "ru", "zh", "ar"];

items.forEach((item) => {
  const data = item.json;

  if (data.meaning) {
    TARGET_LANGS.forEach((lang) => {
      let text = data.meaning[lang];
      if (typeof text === "string") {
        // 1. 마침표(.) 제거 (문장 중간 포함, ...은 제외)
        // 말줄임표(...) 보존을 위해 임시 치환
        const tempEllipsis = "___ELLIPSIS___";
        text = text.replace(/\.\.\./g, tempEllipsis);

        // 모든 마침표 제거
        text = text.replace(/\./g, "");

        // 말줄임표 복원
        text = text.replace(new RegExp(tempEllipsis, "g"), "...");

        // 2. 세미콜론(;)을 ' · '로 변경
        // ref.json 예시: "suitable · appropriate · compatible"
        // 앞뒤 공백을 확보하기 위해 " · "로 치환
        text = text.replace(/;/g, " · ");

        // 중복 공백 제거 ( " ·  " -> " · " )
        text = text.replace(/\s+·\s+/g, " · ");

        data.meaning[lang] = text;
      }
    });
  }
});

return items;
