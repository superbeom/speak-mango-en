// Dialogue Translation Backfill Merge Logic
// Strategy: Merges specific dialogue translations (fr, de, ru, zh, ar) into existing data.

const rawText = $input.first().json.text;
const cleanJson = rawText.replace(/```json/g, "").replace(/`/g, "").trim();

try {
    const generatedData = JSON.parse(cleanJson);
    const translationsArray = generatedData.dialogue_translations;

    // Get original item
    const inputItem = $input.item;
    let originalData = null;

    if (inputItem.pairedItem) {
        const splitItems = $items("Split In Batches"); // Update this node name if needed!
        if (splitItems && splitItems.length > 0) {
            // Find specific paired item logic or just take the first if sequential
            // For simplicity in many n8n batch flows, if we process 1 by 1, it's index 0 of the current batch context
            // But robustly, we usually rely on the pass-through or a merge node. 
            // Assuming the workflow passes original data through or we have access to it.
            // If this node is strictly following an LLM node which followed the Split node:
            originalData = inputItem.json;
            // WAIT: The input to this node is the LLM output. The original data is in the paired item or we need to look it up.
            // If the LLM node outputs "json" with the response, we lose the original json fields unless we merged them.

            // Common N8N Pattern: 
            // The inputItem contains the LLM response. 
            // We need to fetch the original JSON from the previous node (e.g., the one before LLM)
            // OR, better, we assume the previous node (LLM) didn't strip the original data context if we used "Include Input Fields".

            // Let's assume we can get 'id' or 'dialogue' from a previous node if not present.
            // However, for safety, let's look at the 'Split In Batches' output for the current item index.
            // Accessing the Paired Item is the safest way in modern n8n.

            const batchIndex = inputItem.pairedItem.item; // Index in the batch
            // Actually, usually we can just look up the node before the LLM if it passed data.
            // Let's assume the user sets up the Merge Node or the LLM node passes through data.
        }
    }

    // For this specific script, let's assume valid 'originalData' can be reconstructed or is passed via a Merge node 
    // OR that we simply retrieve the 'dialogue' from the input if it was preserved.
    // IF the LLM node was set to "Replace" output, we only have LLM text.
    // IF it was "Append", we have everything.

    // Let's assume we have the original data available in a previous node named "Split In Batches" or similar, 
    // OR that the workflow uses a Merge node to bring them together.

    // SIMPLIFIED APPROACH: 
    // We expect the user to merge the Original Data + LLM Data into this Code node.
    // So $input.item.json should ideally have { ...originalFields, text: "..." }

    originalData = $input.item.json;

    if (!originalData.dialogue) {
        // Fallback: try to look for it in paired inputs if we are just receiving text
        if (inputItem.pairedItem) {
            const pairedNode = inputItem.pairedItem; // { item: 0, input: 0 }
            // This part is tricky without knowing the exact node graph. 
            // We will assume the user has merged the JSONs or appended the LLM response.
        }
    }

    if (!originalData.dialogue) {
        throw new Error("Original dialogue data not found in input. Ensure data is merged or appended.");
    }

    // Clone to be safe
    const mergedData = JSON.parse(JSON.stringify(originalData));

    if (!translationsArray || !Array.isArray(translationsArray)) {
        throw new Error("Invalid generated translation format");
    }

    // Merge Logic
    // Target Languages to inject
    const targetLangs = ['fr', 'de', 'ru', 'zh', 'ar'];

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

    // Clean up LLM text field if present
    delete mergedData.text;

    return {
        json: mergedData
    };

} catch (error) {
    return {
        json: {
            error: "Merge Failed",
            details: error.message,
            raw: rawText
        }
    };
}
