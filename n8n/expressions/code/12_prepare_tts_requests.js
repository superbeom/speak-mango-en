// n8n Code Node: Prepare TTS Requests (Groq Orpheus V1)
// 대화문의 역할(A, B)에 따라 아이템을 분리하고 각각 목소리를 할당합니다.

const items = $input.all();
let results = [];

items.forEach((item, itemIndex) => {
  const data = item.json;

  // top-level dialogue 추출
  const dialogueEntries = data.dialogue || [];
  const expressionId = data.id;

  dialogueEntries.forEach((entry, lineIndex) => {
    const rawText = entry.en || "";
    const role = (entry.role || "A").toUpperCase();

    // 텍스트 정제
    const cleanedText = rawText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

    // 역할별 목소리 할당
    const voice = role === "B" ? "troy" : "hannah";

    results.push({
      json: {
        ...data, // 원본 데이터 유지
        tts_input: cleanedText.substring(0, 200),
        tts_voice: voice,
        tts_line_index: lineIndex,
        tts_model: "canopylabs/orpheus-v1-english",
        tts_format: "wav",
        tts_endpoint: "https://api.groq.com/openai/v1/audio/speech",
        // Storage 저장을 위한 경로 확정
        storage_path: `expressions/${expressionId}/${lineIndex}.wav`,
      },
      pairedItem: { item: itemIndex },
    });
  });
});

return results;
