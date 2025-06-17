// In firebase/firebase.js - ADDING @SPELLS DATA LOADING

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { bankData, itemIdsByClass, isSpellItemById, isSpellItem, parseInventoryFiles } = require('../data/bankData');
const config = require('../config');

const firebaseApp = initializeApp(config.firebase);
const db = getFirestore(firebaseApp);

async function loadItemIdsByClassData() { // Renamed for clarity: now loadItemIdsByClassData
    try {
        console.log('Loading item IDs by class from website...');
        const response = await fetch(`${config.bankApiUrl}item-ids-by-class.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        Object.assign(itemIdsByClass, await response.json());
        console.log(`Loaded item classifications for ${Object.keys(itemIdsByClass).length} classes`);
        return true;
    } catch (error) {
        console.error('Failed to load item IDs by class:', error);
        return false;
    }
}

// === NEW FUNCTION: Load spell IDs by class from @spells folder ===
async function loadSpellsByClassData() {
    try {
        console.log('Loading spell IDs by class from @spells folder...');
        const spellcastingClasses = ['bard', 'beastlord', 'cleric', 'druid', 'enchanter', 'magician', 
                                     'necromancer', 'paladin', 'ranger', 'shaman', 'shadowknight', 'wizard'];
        
        for (const className of spellcastingClasses) {
            const fileName = `${className}-spells.ts`; // e.g., bard-spells.ts
            const url = `${config.bankApiUrl}@spells/${fileName}`; // Assuming @spells is within assets/
            
            console.log(`Fetching ${url}...`);
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Could not fetch ${url}: ${response.statusText}`);
                continue; // Skip to next class if file not found
            }
            const tsContent = await response.text();
            
            // Parse the TypeScript content to extract the array of numbers
            // Example: export const BardSpells = [123, 456, ...];
            const match = tsContent.match(/export const \w+ = \[([\s\S]*?)\];/);
            if (match && match[1]) {
                const idString = match[1].replace(/\s/g, ''); // Remove all whitespace
                const ids = idString.split(',').filter(Boolean).map(Number); // Split by comma, filter empty, convert to Number
                
                bankData.actualSpellIdsByClass.set(className, ids); // Store in a new map
                console.log(`  Loaded ${ids.length} spells for ${className}.`);
            } else {
                console.warn(`  Could not parse spell IDs from ${fileName}.`);
            }
        }
        console.log(`Loaded spell classifications for ${bankData.actualSpellIdsByClass.size} spellcasting classes.`);
        return true;
    } catch (error) {
        console.error('Failed to load spell IDs by class:', error);
        return false;
    }
}
// === END NEW FUNCTION ===


async function loadInventoryFromFirestore() {
    try {
        console.log('Loading inventory from Firestore...');
        const itemsCollection = collection(db, 'items');
        const querySnapshot = await getDocs(itemsCollection);

        let filesLoaded = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // console.log(`[DEBUG_FILENAME_CHECK] Filename found: "${data.name}"`); // Removed for production

            let shouldEnableDebug = false; // Normal production setting
            // To re-enable debugs for a specific file, set shouldEnableDebug = true here
            // e.g., if (data.name === 'dntspells-inventory.txt') { shouldEnableDebug = true; }
            
            bankData.inventoryFiles.set(data.name, {
                content: data.data,
                enableDebug: shouldEnableDebug 
            });

            filesLoaded++;
        });

        console.log(`Loaded ${filesLoaded} inventory files from Firestore`);
        await parseInventoryFiles();

        return true;
    } catch (error) {
        console.error('Failed to load from Firestore:', error);
        return false;
    }
}

async function initializeBankData() {
    console.log('Initializing bank data...');
    const classMapSuccess = await loadItemIdsByClassData(); // Use new function name
    if (!classMapSuccess) {
        console.warn('⚠️ Could not load item class mappings, item search may be limited');
    }
    // === NEW CALL: Load spell data as well ===
    const spellDataSuccess = await loadSpellsByClassData();
    if (!spellDataSuccess) {
        console.warn('⚠️ Could not load spell class mappings, spell search by class may be inaccurate');
    }
    // === END NEW CALL ===

    const firestoreSuccess = await loadInventoryFromFirestore();
    if (firestoreSuccess) {
        console.log('✅ Firestore inventory loaded successfully!');
        console.log(`📊 Total items available: ${bankData.items.size}`);
    } else {
        console.log('❌ Failed to load inventory from Firestore.');
        console.log('⚠️ Bot will have limited functionality without inventory data.');
    }
    console.log('✅ Bank data initialization complete!');
}

module.exports = { initializeBankData };