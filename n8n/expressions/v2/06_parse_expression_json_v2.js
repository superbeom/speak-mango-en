// 06. Parse Expression JSON & Merge Context (V2 Robust)
// Gemini Expression Generator의 응답(텍스트)을 파싱합니다.
// 'Merge Context' 노드가 앞단에 추가되어, domain/category 정보가 이미 $input에 포함되어 있다고 가정합니다.

return $input.all().map((item) => {
    const rawText = item.json.text || "";

    // Clean Markdown
    const cleanJson = rawText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

    // Context: Merge Node를 통해 이미 json에 합쳐져 있음
    const domain = item.json.domain || "unknown";
    const category = item.json.category || "unknown";
    const topic = item.json.topic || "unknown";

    try {
        const parsed = JSON.parse(cleanJson);
        return {
            json: {
                ...parsed,
                domain,
                category,
                topic
            },
            pairedItem: item.pairedItem
        };
    } catch (error) {
        return {
            json: {
                error: "JSON Parsing Failed",
                message: error.message,
                raw: rawText,
                domain,
                category,
                topic
            },
            pairedItem: item.pairedItem
        };
    }
});
