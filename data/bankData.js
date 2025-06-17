// In data/bankData.js - FULL, CORRECTED FILE WITH FINAL STRICT SPELL DEFINITION & CLASSIFICATION

const { outputFileToJson } = require('../utils/itemFormatting');

const bankData = {
    items: new Map(), // Maps item_name.toLowerCase() -> itemData
    itemsByClass: new Map(), // Maps class -> array of items
    spellsByClass: new Map(), // Maps class -> array of spell items
    inventoryFiles: new Map(), // Maps filename -> file content
    lastUpdated: null,
    actualSpellIdsByClass: new Map() // Stores spell IDs from @spells files
};

const itemIdsByClass = {};
const spellIdsByClass = {}; 

const userCarts = new Map();
const activeRequests = new Map();
let requestIdCounter = 1;

function getNextRequestId() {
    return requestIdCounter++;
}

// === CRITICAL FIX: isSpellItemById - NOW CHECKS AGAINST LOADED actualSpellIdsByClass ===
// An item ID is considered a spell ID *only if* it appears in one of the actualSpellIdsByClass lists.
// This is the most accurate way to define a spell by ID.
function isSpellItemById(itemId) {
    // Iterate through all loaded actual spell IDs by class
    for (const [className, ids] of bankData.actualSpellIdsByClass) {
        if (ids.includes(itemId)) {
            return true; // The ID is found in an actual spell list from the web app data
        }
    }
    return false; // Not found in any known spell list by ID
}
// === END CRITICAL FIX ===

// Enhanced spell detection by name keywords (EXTREMELY STRICT)
function isSpellItem(itemName) {
    const lowerCaseName = itemName.toLowerCase();
    
    // Only these explicit prefixes are used to identify spells by name.
    if (lowerCaseName.startsWith('spell:')) return true;
    if (lowerCaseName.startsWith('song:')) return true;
    
    return false; // If it doesn't have an explicit spell/song prefix, it's NOT a spell by name.
}

// Parse inventory files and create item database
async function parseInventoryFiles() {
    console.log('Parsing inventory files and building searchable database...');
    
    bankData.items.clear();
    bankData.itemsByClass.clear();
    bankData.spellsByClass.clear();
    
    const allClasses = ['Bard', 'Beastlord', 'Berserker', 'Cleric', 'Druid', 'Enchanter',
                        'Magician', 'Monk', 'Necromancer', 'Paladin', 'Ranger', 'Rogue',
                        'Shadowknight', 'Shaman', 'Warrior', 'Wizard'];
    
    const spellcastingClasses = ['bard', 'beastlord', 'cleric', 'druid', 'enchanter', 'magician', 
                                 'necromancer', 'paladin', 'ranger', 'shaman', 'shadowknight', 'wizard'];
    
    allClasses.forEach(className => {
        bankData.itemsByClass.set(className.toLowerCase(), []);
        bankData.spellsByClass.set(className.toLowerCase(), []);
    });
    bankData.spellsByClass.set('all', []); 
    
    let totalItems = 0;
    let totalSpells = 0;
    
    for (const [filename, fileData] of bankData.inventoryFiles) {
        console.log(`Processing ${filename}...`);
        
        const fileContent = fileData.content;
        const enableDebugForThisFile = fileData.enableDebug || false;
        
        const category = filename.substring(3).split('-')[0];
        const isSpellFileHint = category === 'spell' || filename.includes('spell');
        
        // Pass the actualSpellIdsByClass to outputFileToJson as well, so it can be used by isSpellItemByIdFn if needed
        const items = outputFileToJson(fileContent, isSpellItemById, isSpellItem, enableDebugForThisFile); // isSpellItemById and isSpellItem are passed directly.
                                                                                                        // Their internal logic now relies on bankData.actualSpellIdsByClass
        for (const item of items) {
            if (!item.name || !item.id) continue;
            
            // Re-evaluate item.isSpell strictly here based on its name (prefixes) or very strict ID ranges
            item.isSpell = isSpellItem(item.name) || isSpellItemById(item.id); 
            
            bankData.items.set(item.name.toLowerCase(), item);
            
            let classifiedToSpecificClass = false; 
            
            if (Object.keys(itemIdsByClass).length > 0) { 
                for (const [className, itemIds] of Object.entries(itemIdsByClass)) {
                    if (itemIds.includes(item.id)) { 
                        const classKey = className.toLowerCase();
                        
                        // Strict check: Only add to spellsByClass if it's a spell AND the class is a spellcasting class
                        if (item.isSpell && spellcastingClasses.includes(classKey)) { 
                            const spellList = bankData.spellsByClass.get(classKey) || [];
                            if (!spellList.find(s => s.id === item.id)) {
                                spellList.push(item);
                                bankData.spellsByClass.set(classKey, spellList);
                            }
                            classifiedToSpecificClass = true; 
                        } else { 
                            const itemList = bankData.itemsByClass.get(classKey) || [];
                            if (!itemList.find(i => i.id === item.id)) {
                                itemList.push(item);
                                bankData.itemsByClass.set(classKey, itemList);
                            }
                            classifiedToSpecificClass = true; 
                        }
                    }
                }
            }

            if (item.isSpell) {
                totalSpells++; 

                if (!classifiedToSpecificClass) { 
                    const allSpellsList = bankData.spellsByClass.get('all') || [];
                    if (!allSpellsList.find(s => s.id === item.id)) { 
                        allSpellsList.push(item);
                        bankData.spellsByClass.set('all', allSpellsList);
                    }
                }
            }
            
            totalItems++; 
        }
    }
    
    for (const [className, spells] of bankData.spellsByClass) {
        spells.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    console.log(`✅ Parsing complete!`);
    console.log(`📊 Total items: ${totalItems}`);
    console.log(`📜 Total spells: ${totalSpells}`);
    console.log(`📁 From ${bankData.inventoryFiles.size} inventory files`);
    
    console.log('\n📜 Spell inventory by class:');
    for (const [className, spells] of bankData.spellsByClass) {
        if (spells.length > 0) {
            console.log(`  ${className}: ${spells.length} spells`);
        }
    }
    
    bankData.lastUpdated = new Date();
}


module.exports = {
    bankData,
    userCarts,
    activeRequests,
    itemIdsByClass,
    isSpellItemById,
    isSpellItem,
    parseInventoryFiles,
    getNextRequestId
};