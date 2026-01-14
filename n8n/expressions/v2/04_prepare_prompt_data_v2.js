// Prepare Prompt Data (Aggregation)
// Get Existing Expressions의 결과(다중 아이템)를 
// Pick Category의 원본 아이템(6개) 기준으로 그룹화합니다.

const categoryItems = $items("Pick Category");
const existingItems = $input.all();

// 1. 카테고리별로 기본 구조 초기화
const results = categoryItems.map(c => ({
    ...c.json,
    existing: []
}));

// 카테고리 이름으로 인덱스를 찾기 위한 맵 생성
const categoryMap = {};
categoryItems.forEach((c, index) => {
    if (c.json.category) {
        categoryMap[c.json.category] = index;
    }
});

// 2. 검색된 기존 표현들을 해당 카테고리에 매핑
existingItems.forEach(item => {
    let targetIndex = -1;

    // [수정됨] 우선순위 변경: 데이터의 내용(category 필드)을 최우선으로 신뢰합니다.
    // n8n의 pairedItem은 실행 흐름에 따라 부정확할 수 있으므로(Mock 데이터나 Pinned Data 사용 시),
    // 실제 데이터에 적혀있는 카테고리 값을 1순위로 사용합니다.

    // 우선순위 1: 아이템 내부의 'category' 필드로 매핑
    if (item.json.category && categoryMap.hasOwnProperty(item.json.category)) {
        targetIndex = categoryMap[item.json.category];
    }
    // 우선순위 2: category 필드가 없는 경우에만 실행 컨텍스트(pairedItem) 사용
    else if (item.pairedItem) {
        targetIndex = item.pairedItem.item;
    }

    // 유효한 인덱스를 찾았고, 표현식이 있다면 추가
    if (targetIndex !== -1 && results[targetIndex] && item.json.expression) {
        results[targetIndex].existing.push(item.json.expression);
    }
});

// 3. 포맷팅하여 반환
return results.map(r => ({
    json: {
        domain: r.domain,
        category: r.category,
        topic: r.topic,
        existing_expressions_str: r.existing.length > 0 ? r.existing.join(", ") : "(None)"
    }
}));
