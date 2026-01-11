// Universal Backfill Merge Logic
// Strategy: Merges generated content for 'en, de, fr, ru, zh, ar' into existing data.
// - Overwrites 'meaning' and 'content' for target languages.
// - Updates 'dialogue' English text and target translations.
// - PRESERVES existing 'ko', 'ja', 'es' data.

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

    // Target Languages for Backfill (Universal updates EN + 5 new langs)
    const targetLangs = ['en', 'de', 'fr', 'ru', 'zh', 'ar'];

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
    if (mergedData.dialogue && Array.isArray(mergedData.dialogue) &&
        generatedData.dialogue && Array.isArray(generatedData.dialogue)) {

        mergedData.dialogue.forEach((turn, index) => {
            const newTurn = generatedData.dialogue[index];
            if (newTurn) {
                // Update English text if present (Universal strategy allows EN update)
                if (newTurn.en) {
                    turn.en = newTurn.en;
                }

                // Update translations
                if (newTurn.translations) {
                    if (!turn.translations) turn.translations = {};
                    // Merge new languages into translations object
                    targetLangs.forEach(lang => {
                        if (lang === 'en') return;
                        if (newTurn.translations[lang]) {
                            turn.translations[lang] = newTurn.translations[lang];
                        }
                    });
                } else {
                    if (!mergedData._warnings) mergedData._warnings = [];
                    mergedData._warnings.push(`Missing translations in dialogue turn ${index}`);
                }
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
