// 13. Generate ID (V2 Fan-out Support)
// 중복이 아님이 확인된 각 아이템에 대해 저장 경로 및 DB ID로 사용할 UUID를 생성합니다.
// V2 변경점: $input.all()을 순회하며 모든 아이템에 대해 각각의 UUID를 생성합니다.

return $input.all().map(item => {
    // UUID v4 생성 (crypto 모듈 의존성 없이)
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
            ...item.json, // 기존 데이터 보존
            id: uuid,     // 고유 ID 부여
        },
        pairedItem: item.pairedItem // Lineage 유지
    };
});
