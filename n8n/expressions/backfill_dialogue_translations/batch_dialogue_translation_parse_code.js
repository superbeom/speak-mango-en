// Batch Dialogue Translation Merge Logic
// Strategy: Maps a batch of generated translations back to their original items using ID.

const rawText = $input.first().json.text;
const cleanJson = rawText.replace(/```json/g, "").replace(/`/g, "").trim();

try {
    const generatedBatch = JSON.parse(cleanJson); // Expecting Array of { id, dialogue_translations }

    if (!Array.isArray(generatedBatch)) {
        throw new Error("Generated output is not an array");
    }

    // Map generated results by ID for easy lookup
    const resultMap = new Map(generatedBatch.map(item => [item.id, item.dialogue_translations]));

    // IMPORTANT: Access original items from the Loop Node
    // We assume the loop node is named "Loop Over Items". 
    // If you named it differently (e.g., "Split In Batches"), update this variable!
    const BATCH_NODE_NAME = "Loop Over Items";

    let originalItems = [];
    try {
        originalItems = $items(BATCH_NODE_NAME);
    } catch (e) {
        // Fallback: If node not found, try to use current input if it happens to be valid (unlikely in batch mode)
        originalItems = $input.all();
        // If this is just the LLM response, this will fail downstream, so we warn
        if (originalItems.length === 1 && !originalItems[0].json.dialogue) {
            throw new Error(`Could not find original items. Please ensure your loop node is named '${BATCH_NODE_NAME}' or update the script.`);
        }
    }

    return originalItems.map(item => {
        const originalData = item.json;
        const targetId = originalData.id;

        // Clone original
        const mergedData = JSON.parse(JSON.stringify(originalData));

        if (resultMap.has(targetId)) {
            const translationsArray = resultMap.get(targetId);
            const targetLangs = ['fr', 'de', 'ru', 'zh', 'ar'];

            if (mergedData.dialogue && Array.isArray(mergedData.dialogue)) {
                mergedData.dialogue.forEach((turn, index) => {
                    const newTrans = translationsArray[index];
                    if (newTrans) {
                        if (!turn.translations) turn.translations = {};
                        targetLangs.forEach(lang => {
                            if (newTrans[lang]) {
                                turn.translations[lang] = newTrans[lang];
                            }
                        });
                    }
                });
            }
            // Mark as processed
            mergedData._backfill_status = "success";
        } else {
            mergedData._backfill_status = "missing_in_batch_response";
        }

        // Clean up text field if it exists from previous node
        delete mergedData.text;

        return { json: mergedData };
    });

} catch (error) {
    // If parsing fails, return error for all input items to allow debugging
    return $input.all().map(item => ({
        json: {
            ...item.json,
            error: "Batch Merge Failed",
            details: error.message,
            raw: rawText
        }
    }));
}
