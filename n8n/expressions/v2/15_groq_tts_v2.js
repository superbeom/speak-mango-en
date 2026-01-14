// 15. Groq TTS V2 (Batching & Rate Limit)
// Groq API의 10 RPM 제한을 준수하기 위해 10개씩 배치 처리하고 65초 대기합니다.
// 보안: 환경변수(GROQ_API_KEY) 또는 Credential('httpHeaderAuth')을 시도합니다.

const items = $input.all();
const BATCH_SIZE = 10;
const WAIT_MS = 65000; // 65초 대기
const results = [];

// 대기 함수
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API Key 가져오기 전략
// 1. 환경변수 ($env.GROQ_API_KEY) 확인
// 2. this.getCredentials 시도
// 3. 실패 시 에러
let apiKey;

// Strategy 1: Environment Variable
// Note: n8n sandbox might restrict access to process.env or $env, throwing an error.
try {
    console.log("Debug: Starting API Key Check");

    if (typeof $env !== 'undefined') {
        console.log("Debug: Keys in $env", Object.keys($env));
        if ($env.GROQ_API_KEY) {
            console.log("Debug: Found GROQ_API_KEY in $env");
            apiKey = $env.GROQ_API_KEY;
        }
    }

    if (!apiKey && typeof process !== 'undefined' && process.env) {
        console.log("Debug: Keys in process.env", Object.keys(process.env));
        if (process.env.GROQ_API_KEY) {
            console.log("Debug: Found GROQ_API_KEY in process.env");
            apiKey = process.env.GROQ_API_KEY;
        }
    }
} catch (error) {
    console.log("Environment variable access restricted: " + error.message);
}

// Strategy 2: Credentials (Fallback)
if (!apiKey) {
    try {
        let credentials;
        if (typeof this.getCredentials === 'function') {
            credentials = await this.getCredentials('httpHeaderAuth');
        } else if (this.helpers && typeof this.helpers.getCredentials === 'function') {
            credentials = await this.helpers.getCredentials('httpHeaderAuth');
        }

        if (credentials && credentials.value) {
            apiKey = credentials.value;
        }
    } catch (e) {
        // Credential 접근 실패는 무시하고 apiKey 없음을 체크
        console.log("Credential access failed: " + e.message);
    }
}

// Final Check
if (!apiKey) {
    // 진행 불가
    return items.map(item => ({
        json: {
            ...item.json,
            error: `API Key Missing. Set GROQ_API_KEY in docker-compose.yml or connect 'Groq Header Auth' credential.`
        },
        pairedItem: item.pairedItem
    }));
}


// 배치 처리 루프
for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    // 병렬 요청 처리
    const batchPromises = batch.map(async (item) => {
        try {
            // 1. 요청 옵션 구성
            const options = {
                method: 'POST',
                uri: 'https://api.groq.com/openai/v1/audio/speech',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'canopylabs/orpheus-v1-english',
                    input: item.json.tts_input,
                    voice: item.json.tts_voice,
                    response_format: 'wav'
                }),
                encoding: null // 중요: 바이너리(Buffer)로 받음
            };

            // 2. 요청 전송
            const response = await this.helpers.request(options);

            // 3. 성공 시 바이너리 데이터 포함하여 반환
            return {
                json: {
                    ...item.json,
                    status: "success"
                },
                binary: {
                    data: {
                        data: Buffer.from(response).toString('base64'),
                        mimeType: 'audio/wav',
                        fileName: `${item.json.id}_${item.json.tts_line_index}.wav`
                    }
                },
                pairedItem: item.pairedItem
            };

        } catch (error) {
            return {
                json: {
                    ...item.json,
                    status: "error",
                    error_message: error.message,
                    error_stack: error.stack,
                    error_response: error.response ? error.response.body : "No response body"
                },
                pairedItem: item.pairedItem
            };
        }
    });

    // 현재 배치의 모든 요청 완료 대기
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // 다음 배치가 남아있다면 대기
    if (i + BATCH_SIZE < items.length) {
        await sleep(WAIT_MS);
    }
}

return results;