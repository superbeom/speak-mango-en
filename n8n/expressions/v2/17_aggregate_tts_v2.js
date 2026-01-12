// 15. Aggregate TTS Results (V2 Fan-out Support)
// TTS 완료된 오디오 조각들을 원본 아이템별로 그룹화하여 합칩니다.
// V2 변경점: 모든 들어오는 아이템을 Paired Item(원본 표현식) 기준으로 그룹화하여 반환합니다.

const items = $input.all();
if (items.length === 0) return [];

// 1. Prepare TTS Requests의 원본 데이터 가져오기
const parentItems = $items("Prepare TTS Requests");

// 2. 그룹화 (Paired Item Index 기준)
const grouped = {};

items.forEach((item) => {
    const pIdx = item.pairedItem.item; // 원본 표현식의 인덱스

    if (!grouped[pIdx]) {
        // 해당 그룹이 처음 발견되면 초기화
        // 원본 데이터(parentData)를 깊은 복사하여 시작
        const parentData = parentItems[pIdx].json;
        grouped[pIdx] = JSON.parse(JSON.stringify(parentData));

        // 불필요한 임시 필드 제거 (한 번만 실행)
        Object.keys(grouped[pIdx]).forEach((key) => {
            if (key.startsWith("tts_") || key === "storage_path" || key === "_validation") {
                delete grouped[pIdx][key];
            }
        });
    }

    // 3. 오디오 URL 주입
    const originalReq = parentItems[pIdx].json; // 주의: pIdx는 정확하지만, Prepare TTS Requests가 Split된 상태라면?
    // Prepare TTS Requests는 N:N이 아니라 1:N (Split) 관계임.
    // 따라서 item.pairedItem.item은 "Prepare TTS Requests" 노드의 출력 아이템 인덱스를 가리킴.

    // 여기서 문제: "Prepare TTS Requests" 자체가 이미 Split된 아이템들인가?
    // "Prepare TTS Requests" 코드를 보면: items.forEach... results.push...
    // 즉, Prepare TTS Requests는 "Split된 개별 라인"들을 출력함.
    // 따라서 aggregation을 위해서는 그 *이전* 단계인 "Generate ID"의 아이템으로 묶어야 함.
    // 하지만 여기서는 간단히 "Expression ID" (id 필드)로 묶는 것이 가장 안전함.

    const expressionId = item.json.id; // Generate ID에서 생성된 UUID
    // item.json에는 원본 데이터가 포함되어 있으므로 id를 바로 사용 가능.
});

// 재설계: Paired Item 인덱스보다 'id' 필드를 기준으로 그룹화하는 것이 훨씬 안전함 (V2 Fan-out 환경)
const finalizedResults = {};

items.forEach((item) => {
    const data = item.json;
    const expressionId = data.id;

    if (!finalizedResults[expressionId]) {
        // 초기화: 현재 아이템의 데이터에서 tts 관련 필드만 제거하고 복사
        const cleanData = JSON.parse(JSON.stringify(data));
        Object.keys(cleanData).forEach(key => {
            if (key.startsWith("tts_") || key === "storage_path" || key === "_validation" || key === "Key") {
                delete cleanData[key];
            }
        });
        finalizedResults[expressionId] = cleanData;
    }

    // 오디오 경로 추출
    const originalReq = $items("Prepare TTS Requests")[item.pairedItem.item].json;
    const lineIndex = originalReq.tts_line_index;

    let path = data.Key || originalReq.storage_path; // Key는 Upload 노드 출력, storage_path는 fallback
    if (path && path.startsWith("speak-mango-en/")) {
        path = path.replace("speak-mango-en/", "");
    }

    // URL 주입
    if (finalizedResults[expressionId].dialogue && finalizedResults[expressionId].dialogue[lineIndex]) {
        finalizedResults[expressionId].dialogue[lineIndex].audio_url = path;
    }
});

// 객체를 배열로 변환하여 반환
return Object.values(finalizedResults).map(json => ({ json }));
