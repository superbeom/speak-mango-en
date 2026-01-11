// Supplementary Backfill Merge Logic
// Strategy: Merges ONLY new languages ('de, fr, ru, zh, ar') into existing data.
// - Does NOT update 'en', 'ko', 'ja', 'es'.
// - Generated 'dialogue' is an array of translations only (no 'role' or 'en' keys).

const rawText = $input.first().json.text;
const cleanJson = rawText.replace(/```json/g, "").replace(/`/g, "").trim();

try {
    const generatedData = JSON.parse(cleanJson);

    // Using pairedItem to find the item from 'Split In Batches' node logic
    const inputItem = $input.item;

    let originalData = null;

    if (inputItem.pairedItem) {
        // Accessing item from Split In Batches
        const splitItems = $items("Split In Batches");
        if (splitItems && splitItems.length > 0) {
            originalData = splitItems[0].json;
        }
    }

    if (!originalData) {
        throw new Error("Could not find original data to merge");
    }

    // Clone original
    const mergedData = JSON.parse(JSON.stringify(originalData));

    // Target Languages for Supplementary (Excludes EN)
    const targetLangs = ['de', 'fr', 'ru', 'zh', 'ar'];

    // 1. Merge 'meaning'
    if (!mergedData.meaning) mergedData.meaning = {};
    targetLangs.forEach(lang => {
        if (generatedData.meaning && generatedData.meaning[lang]) {
            mergedData.meaning[lang] = generatedData.meaning[lang];
        }
    });

    // 2. Merge 'content'
    if (!mergedData.content) mergedData.content = {};
    targetLangs.forEach(lang => {
        if (generatedData.content && generatedData.content[lang]) {
            mergedData.content[lang] = generatedData.content[lang];
        }
    });

    // 3. Merge 'dialogue'
    // Note: supplementary prompt outputs 'dialogue_translations' which is an array of simple objects
    // e.g. [{ "de": "...", "fr": "..." }, { "de": "...", "fr": "..." }]
    if (mergedData.dialogue && Array.isArray(mergedData.dialogue) &&
        generatedData.dialogue_translations && Array.isArray(generatedData.dialogue_translations)) {

        mergedData.dialogue.forEach((turn, index) => {
            const newTurnTranslations = generatedData.dialogue_translations[index];
            if (newTurnTranslations) {
                if (!turn.translations) turn.translations = {};

                // Merge only target languages
                targetLangs.forEach(lang => {
                    if (newTurnTranslations[lang]) {
                        turn.translations[lang] = newTurnTranslations[lang];
                    }
                });
            }
        });
    }

    return {
        json: mergedData
    };
} catch (error) {
    return {
        json: {
            error: "JSON Parsing/Merge Failed",
            raw: rawText,
            details: error.message
        }
    };
}
