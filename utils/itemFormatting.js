// In utils/itemFormatting.js - UPDATED WITH QUANTITY SUPPORT

// Helper function to parse bank file format (from bank.component.ts logic)
function outputFileToJson(data, isSpellItemByIdFn, isSpellItemFn, enableDebugLogsForThisFile = false) {
    if (data.trim().startsWith('[') || data.includes('[Abilities]') || data.includes('[HotButtons]')) {
        return [];
    }

    const items = [];
    const lines = data.split('\n').filter(line => line.trim());

    if (lines.length > 0 && lines[0].toLowerCase().includes('location') && lines[0].toLowerCase().includes('id') && lines[0].toLowerCase().includes('count')) {
        lines.shift();
    }

    lines.forEach(line => {
        const trimmedLine = line.trim();
        const normalizedLine = trimmedLine.replace(/\s+/g, ' '); 

        console.log(`[DEBUG_PARSE_GENERAL] Processing normalized line: "${normalizedLine}"`); // KEEP THIS LOG

        if (normalizedLine.toLowerCase().includes('empty') && normalizedLine.endsWith(' 0')) {
            console.log(`[DEBUG_PARSE_GENERAL]   -> Skipping as empty.`); // KEEP THIS LOG
            return;
        }

        const mainRegex = /^(.*?)\s+(\d+)\s+(\d+)\s+(\d+)$/;
        const match = normalizedLine.match(mainRegex);


        if (match) {
            console.log(`[DEBUG_PARSE_GENERAL]   -> Matched by main regex.`); // KEEP THIS LOG
            const [fullMatch, nameAndLocationPart, idStr, countStr, slotsStr] = match;

            const id = parseInt(idStr);
            const count = parseInt(countStr);
            
            let name = nameAndLocationPart.trim();
            let location = '';

            const knownSlotRegex = /^(Charm|Ear|Head|Face|Neck|Shoulders|Arms|Back|Wrist|Range|Hands|Primary|Secondary|Fingers|Chest|Legs|Feet|Waist|Ammo|General\d*|Bank\d*|SharedBank\d*)(-Slot\d*)?\s*/i;
            const locationPrefixMatch = name.match(knownSlotRegex);

            if (locationPrefixMatch) {
                location = locationPrefixMatch[0].trim();
                name = name.substring(locationPrefixMatch[0].length).trim();
            } else {
                location = '';
            }

            processAndAddItem(name, id, count, location, items, isSpellItemByIdFn, isSpellItemFn, enableDebugLogsForThisFile);

        } else {
            console.log(`[DEBUG_PARSE_GENERAL]   -> NO match found by main regex. Line skipped.`); // KEEP THIS LOG
            return;
        }
    });

    return items;
}

// Helper function to clean item names by removing trailing numbers and whitespace
function cleanItemName(name) {
    if (!name || typeof name !== 'string') {
        return name;
    }
    
    // Remove trailing numbers and whitespace patterns commonly found in inventory files
    // This pattern removes:
    // - Trailing numbers (like "Sword of Flame 123")
    // - Trailing numbers with spaces (like "Sword of Flame  456")
    // - Multiple trailing spaces
    // - Combinations of the above
    let cleaned = name
        .replace(/\s+\d+\s*$/, '')     // Remove trailing numbers with optional spaces
        .replace(/\s+$/, '')          // Remove any remaining trailing whitespace
        .trim();                       // Final trim for safety
    
    // If cleaning resulted in an empty string, return the original
    if (!cleaned) {
        return name.trim();
    }
    
    return cleaned;
}

// Helper function to encapsulate item processing and quality detection
function processAndAddItem(name, id, count, location, itemsArrayToPushTo, isSpellItemByIdFn, isSpellItemFn, enableDebugLogs = false) {
    // === RE-ADDED ALL DEBUG LOGS FOR IS_SPELL_ITEM CHECK ===
    console.log(`[DEBUG_SPELL_CHECK] Processing item for spell status: "${name}" (ID: ${id})`);

    let baseCount = 0;
    let enchantedCount = 0;
    let legendaryCount = 0;
    let isSpellItemFlag = false; // This will be the result of our strict checks

    let actualName = name; // Name after quality removed
    let quality = 'raw';

    const enchantedMatch = actualName.match(/\(Enchanted\)$/i);
    const legendaryMatch = actualName.match(/\(Legendary\)$/i);

    if (enchantedMatch) {
        quality = 'enchanted';
        actualName = actualName.substring(0, enchantedMatch.index).trim();
    } else if (legendaryMatch) {
        quality = 'legendary';
        actualName = actualName.substring(0, legendaryMatch.index).trim();
    }

    // === CRITICAL FIX: Clean the item name after quality processing ===
    const originalName = actualName;
    actualName = cleanItemName(actualName);
    
    if (originalName !== actualName) {
        console.log(`[DEBUG_NAME_CLEAN] Cleaned "${originalName}" -> "${actualName}"`);
    }
    // === END CRITICAL FIX ===

    if (quality === 'enchanted') {
        enchantedCount = count;
    } else if (quality === 'legendary') {
        legendaryCount = count;
    } else {
        baseCount = count;
    }

    const lowerCaseName = actualName.toLowerCase();
    
    // Evaluate each part of the spell detection logic
    const isById = isSpellItemByIdFn(id);
    const isByName = isSpellItemFn(actualName); // Pass actualName, as isSpellItem will lowerCase internally

    // The final decision for item.isSpell
    isSpellItemFlag = isById || isByName;

    console.log(`[DEBUG_SPELL_CHECK]   - Actual Name for check: "${actualName}" (lowercase: "${lowerCaseName}")`);
    console.log(`[DEBUG_SPELL_CHECK]   - isSpellItemById(${id}): ${isById}`);
    console.log(`[DEBUG_SPELL_CHECK]   - isSpellItem("${actualName}") (name-based check): ${isByName}`);
    console.log(`[DEBUG_SPELL_CHECK]   -> FINAL item.isSpell flag: ${isSpellItemFlag}`);
    // === END DEBUG LOGS ===


    const item = {
        id: id,
        name: actualName, // Store the clean name without quality tags AND trailing numbers
        baseCount: baseCount,
        enchantedCount: enchantedCount,
        legendaryCount: legendaryCount,
        location: location,
        isSpell: isSpellItemFlag // Set the flag here
    };

    if (item.baseCount + item.enchantedCount + item.legendaryCount === 0 && item.name.toLowerCase().includes('empty')) {
        return;
    }

    itemsArrayToPushTo.push(item);
}

// Format item for display (used by search results)
function formatItem(item) {
    const qualities = [];
    if (item.baseCount > 0) qualities.push(`Raw: ${item.baseCount}`);
    if (item.enchantedCount > 0) qualities.push(`Enchanted: ${item.enchantedCount}`);
    if (item.legendaryCount > 0) qualities.push(`Legendary: ${item.legendaryCount}`);

    const qualityText = qualities.length > 0 ? ` (${qualities.join(', ')})` : '';
    return `${item.name}${qualityText}`;
}

// Format item for request - NOW SUPPORTS QUANTITIES
function formatItemForRequest(cartItem) {
    let quantityPrefix = '';
    let qualityText = '';
    
    // Add quantity prefix only if greater than 1
    if (cartItem.quantity && cartItem.quantity > 1) {
        quantityPrefix = `${cartItem.quantity}x `;
    }
    
    // Add quality suffix if not raw
    if (cartItem.quality === 'enchanted') {
        qualityText = ' (Enchanted)';
    } else if (cartItem.quality === 'legendary') {
        qualityText = ' (Legendary)';
    }
    
    return `${quantityPrefix}${cartItem.name}${qualityText}`;
}

// Format item for cart display - specialized version for cart view
function formatItemForCart(cartItem) {
    let displayText = '';
    
    // Always show quantity in cart view for clarity
    if (cartItem.quantity && cartItem.quantity > 1) {
        displayText = `${cartItem.quantity}x `;
    }
    
    displayText += cartItem.name;
    
    // Add quality suffix
    if (cartItem.quality === 'enchanted') {
        displayText += ' (Enchanted)';
    } else if (cartItem.quality === 'legendary') {
        displayText += ' (Legendary)';
    }
    
    return displayText;
}

// Get available qualities for an item
function getAvailableQualities(item) {
    const qualities = [];
    if (item.baseCount > 0) qualities.push('raw');
    if (item.enchantedCount > 0) qualities.push('enchanted');
    if (item.legendaryCount > 0) qualities.push('legendary');
    return qualities;
}

// Get highest quality available for an item
function getHighestQuality(item) {
    if (item.legendaryCount > 0) return 'legendary';
    if (item.enchantedCount > 0) return 'enchanted';
    if (item.baseCount > 0) return 'raw';
    return 'raw';
}

module.exports = {
    outputFileToJson,
    formatItem,
    formatItemForRequest,
    formatItemForCart,
    getAvailableQualities,
    getHighestQuality,
    cleanItemName  // Export the helper function for potential reuse
};