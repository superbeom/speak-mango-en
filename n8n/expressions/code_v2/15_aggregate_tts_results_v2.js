// n8n Code Node: Aggregate TTS Results
// 분리되었던 대화문 라인들을 다시 하나로 합치고 audio_url을 주입합니다.

const items = $input.all();
if (items.length === 0) return [];

// 1. 원본 데이터 복원 (Prepare TTS Requests 노드의 결과 참조)
const firstItem = items[0];
const parentItemIndex = firstItem.pairedItem.item;
const parentData = $items("Prepare TTS Requests")[parentItemIndex].json;

// 원본 데이터 복제 (deep copy)
let finalData = JSON.parse(JSON.stringify(parentData));

// 2. 불필요한 임시 필드 일괄 제거 (tts_ 로 시작하는 모든 필드)
Object.keys(finalData).forEach((key) => {
  if (
    key.startsWith("tts_") ||
    key === "storage_path" ||
    key === "_validation"
  ) {
    delete finalData[key];
  }
});

// 3. 오디오 URL 주입
items.forEach((item) => {
  const pIdx = item.pairedItem.item;
  const originalReq = $items("Prepare TTS Requests")[pIdx].json;

  const idx = originalReq.tts_line_index;
  // Upload to Storage 결과(Key)에서 경로 추출
  let path = item.json.Key || originalReq.storage_path;

  // 버킷 명칭(speak-mango-en/)이 포함되어 있다면 제거하여 경로 정규화
  if (path.startsWith("speak-mango-en/")) {
    path = path.replace("speak-mango-en/", "");
  }

  // top-level dialogue에 audio_url 주입
  if (finalData.dialogue && finalData.dialogue[idx]) {
    finalData.dialogue[idx].audio_url = path;
  }
});

return [{ json: finalData }];
