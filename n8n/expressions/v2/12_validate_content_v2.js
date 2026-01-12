/**
 * Relaxed Verification Logic for Gemini Output (V2)
 * Filters out invalid items instead of failing the entire workflow.
 * 
 * Usage:
 * 1. Copy this code into the n8n Code node.
 * 2. Connect after 'Parse Content JSON'.
 * 3. Returns only VALID items to the next node. Invalid items are logged.
 */

const REGEX = {
    hangul: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/,
    kana: /[\u3040-\u309F\u30A0-\u30FF]/,
    han: /[\u4E00-\u9FCC\u3400-\u4DB5]/,
    cyrillic: /[\u0400-\u04FF]/,
    arabic: /[\u0600-\u06FF\u0750-\u077F]/,
    english_letters: /[a-zA-Z]/,
    markdown_emphasis: /(\*\*|__|\*|_)/
};

const TARGET_LANGS = ['ko', 'ja', 'es', 'fr', 'de', 'ru', 'zh', 'ar'];
const ALLOWED_ENGLISH_TERMS = ['iPhone', 'eBay', 'iMac', 'iPad', 'iOS', 'macOS'];

function validateItem(item) {
    let errors = [];
    if (!item.expression) errors.push("Missing 'expression' field.");
    if (!item.meaning) errors.push("Missing 'meaning' field.");
    if (!item.content) errors.push("Missing 'content' field.");
    if (!item.tags) errors.push("Missing 'tags' field.");
    if (!item.dialogue || !Array.isArray(item.dialogue)) errors.push("Missing 'dialogue' top-level array.");

    // Tags Validation
    if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
            if (tag.includes('#')) errors.push(`Tag '${tag}' contains '#'.`);
            if (tag !== tag.toLowerCase()) errors.push(`Tag '${tag}' must be lowercase.`);
            if (!REGEX.english_letters.test(tag)) errors.push(`Tag '${tag}' must contain English letters.`);
            if (REGEX.hangul.test(tag) || REGEX.kana.test(tag) || REGEX.cyrillic.test(tag) || REGEX.arabic.test(tag)) {
                errors.push(`Tag '${tag}' must be English ONLY.`);
            }
        });
    }

    // Meaning Validation
    if (item.meaning) {
        TARGET_LANGS.forEach(lang => {
            const text = item.meaning[lang];
            if (!text) return;
            if (lang === 'ko' && (REGEX.kana.test(text) || REGEX.han.test(text))) errors.push(`Meaning (${lang}) contains Mixed Foreign Script.`);
            if (lang === 'ja' && REGEX.hangul.test(text)) errors.push(`Meaning (${lang}) contains Mixed Foreign Script (Hangul).`);
            if (['ko', 'ja', 'zh', 'ru', 'ar'].includes(lang)) {
                checkEnglishInclusion(text, `Meaning (${lang})`, errors);
            }
        });
    }

    // Content Validation
    if (item.content) {
        TARGET_LANGS.forEach(lang => {
            const contentObj = item.content[lang];
            if (!contentObj) return;

            const fieldsToCheck = [
                contentObj.situation,
                contentObj.tip,
                contentObj.quiz?.question,
                contentObj.quiz?.A,
                contentObj.quiz?.B,
                contentObj.quiz?.C
            ].filter(Boolean);

            fieldsToCheck.forEach(text => {
                if (lang === 'ko' && REGEX.kana.test(text)) errors.push(`Content (${lang}) contains Kana.`);
                else if (lang === 'ja' && REGEX.hangul.test(text)) errors.push(`Content (${lang}) contains Hangul.`);
                else if (['es', 'fr', 'de'].includes(lang)) {
                    if (REGEX.hangul.test(text) || REGEX.kana.test(text) || REGEX.cyrillic.test(text) || REGEX.arabic.test(text)) {
                        errors.push(`Content (${lang}) contains Mixed Foreign Script.`);
                    }
                }
            });

            if (contentObj.quiz && contentObj.quiz.answer) {
                if (!['A', 'B', 'C'].includes(contentObj.quiz.answer)) {
                    errors.push(`Quiz Answer (${lang}) must be 'A', 'B', or 'C'. Found: ${contentObj.quiz.answer}`);
                }
            }
        });
    }

    // Dialogue Validation
    if (item.dialogue && Array.isArray(item.dialogue)) {
        item.dialogue.forEach((dItem, idx) => {
            if (dItem.en) {
                if (REGEX.hangul.test(dItem.en) || REGEX.kana.test(dItem.en)) {
                    errors.push(`Dialogue[${idx}].en contains non-English characters.`);
                }
            }

            if (dItem.translations) {
                TARGET_LANGS.forEach(lang => {
                    const text = dItem.translations[lang];
                    if (!text) return;

                    if (text.includes('**') || text.includes('__')) {
                        errors.push(`Dialogue[${idx}].translations.${lang} contains Markdown Bold (**): "${text}"`);
                    }

                    if (['ko', 'ja', 'zh', 'ru', 'ar'].includes(lang)) {
                        checkEnglishInclusion(text, `Dialogue[${idx}].translations.${lang}`, errors);
                    } else {
                        if (item.expression && text.toLowerCase().includes(item.expression.toLowerCase())) {
                            if (item.expression.length > 4) {
                                errors.push(`Dialogue[${idx}].translations.${lang} contains English expression leakage: "${item.expression}"`);
                            }
                        }
                    }

                    if (lang === 'ko' && (REGEX.kana.test(text) || REGEX.han.test(text))) errors.push(`Dialogue[${idx}].translations.${lang} contains foreign script.`);
                    if (lang === 'ja' && REGEX.hangul.test(text)) errors.push(`Dialogue[${idx}].translations.${lang} contains Hangul.`);
                });
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

function checkEnglishInclusion(text, context, errors) {
    const englishMatches = text.match(/[a-zA-Z]{2,}/g) || [];
    const invalidWords = englishMatches.filter(word => {
        if (ALLOWED_ENGLISH_TERMS.some(term => term.toLowerCase() === word.toLowerCase())) return false;
        if (/^[A-Z]/.test(word)) return false;
        return true;
    });

    if (invalidWords.length > 0) {
        errors.push(`${context} contains English leakage: ${invalidWords.join(", ")}`);
    }
}

// Execution Block
const validItems = [];
const invalidItems = [];

for (const item of $input.all()) {
    const dataToCheck = item.json;
    const result = validateItem(dataToCheck);

    if (result.valid) {
        validItems.push({
            json: item.json,
            pairedItem: item.pairedItem
        });
    } else {
        // Log errors to console (visible in n8n execution log)
        console.log(`⚠️ Invalid Item Skipped [${dataToCheck.expression}]:`, result.errors);

        invalidItems.push({
            json: {
                ...item.json,
                _validationErrors: result.errors,
                _validationStatus: "error"
            },
            pairedItem: item.pairedItem
        });
    }
}

// Optional: You could return specific output for invalid items on a second output branch
// For now, we only return valid items to proceed with the workflow.
if (validItems.length === 0 && invalidItems.length > 0) {
    // If ALL failed, maybe we should throw or just return empty?
    // User asked to "skip failed items", so returning empty array is technically correct behavior (stops workflow for those items).
    console.log("❌ All items failed validation.");
}

return validItems;
