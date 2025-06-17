const { bankData, isSpellItem } = require('../data/bankData'); // Import from bankData

// Search function
async function searchItems(query) {
    const results = [];
    const searchTerm = query.toLowerCase().trim();

    // Check for various spell class search patterns
    const spellPatterns = [
        /^spell\s+(\w+)$/,         // "spell wizard"
        /^spells\s+(\w+)$/,        // "spells wizard"
        /^(\w+)\s+spell$/,         // "wizard spell"
        /^(\w+)\s+spells$/,        // "wizard spells"
        /^show\s+(\w+)\s+spells$/, // "show wizard spells"
        /^list\s+(\w+)\s+spells$/  // "list wizard spells"
    ];

    for (const pattern of spellPatterns) {
        const match = searchTerm.match(pattern);
        if (match) {
            const className = match[1];
            return searchSpellsByClass(className);
        }
    }

    // Regular item search
    for (const [key, item] of bankData.items) {
        if (key.includes(searchTerm) && results.length < 10) { // Limit results for embeds
            results.push(item);
        }
    }
    return results;
}

// Search for spells by class
function searchSpellsByClass(className) {
    const classSearchTerm = className.toLowerCase();

    const classMap = {
        'mag': 'magician', 'mage': 'magician', 'magician': 'magician',
        'nec': 'necromancer', 'necro': 'necromancer', 'necromancer': 'necromancer',
        'wiz': 'wizard', 'wizard': 'wizard',
        'enc': 'enchanter', 'ench': 'enchanter', 'enchanter': 'enchanter',
        'dru': 'druid', 'druid': 'druid',
        'sha': 'shaman', 'sham': 'shaman', 'shaman': 'shaman',
        'cle': 'cleric', 'clr': 'cleric', 'cleric': 'cleric',
        'pal': 'paladin', 'pally': 'paladin', 'paladin': 'paladin',
        'sk': 'shadowknight', 'shadow': 'shadowknight', 'shadowknight': 'shadowknight',
        'ran': 'ranger', 'rng': 'ranger', 'ranger': 'ranger',
        'bst': 'beastlord', 'beast': 'beastlord', 'beastlord': 'beastlord',
        'brd': 'bard', 'bard': 'bard',
        'ber': 'berserker', 'berserker': 'berserker',
        'mnk': 'monk', 'monk': 'monk',
        'rog': 'rogue', 'rogue': 'rogue',
        'war': 'warrior', 'warrior': 'warrior'
    };

    const fullClassName = classMap[classSearchTerm] || classSearchTerm;

    const classSpells = bankData.spellsByClass.get(fullClassName) || [];

    if (classSpells.length === 0) {
        console.log(`No pre-classified spells for ${fullClassName}, searching all items...`);
        const results = [];
        for (const [key, item] of bankData.items) {
            if (item.isSpell && containsClassName(item.name, fullClassName, classSearchTerm)) {
                results.push(item);
                if (results.length >= 25) break;
            }
        }
        return results;
    }
    return classSpells.slice(0, 25);
}

// Check if item name contains the class name (for fallback spell search)
function containsClassName(itemName, fullClassName, searchTerm) {
    const lowerName = itemName.toLowerCase();
    if (lowerName.includes(fullClassName) || lowerName.includes(searchTerm)) {
        return true;
    }
    const classSpellPatterns = {
        'wizard': ['burnout', 'ice comet', 'lure', 'evacuate', 'gate', 'familiar'],
        'magician': ['summon', 'elemental', 'pet haste', 'burnout', 'mage armor'],
        'necromancer': ['lich', 'darkness', 'feign death', 'lifetap', 'undead', 'disease'],
        'enchanter': ['clarity', 'haste', 'slow', 'mez', 'charm', 'illusion', 'rune'],
        'cleric': ['heal', 'cure', 'resurrection', 'divine', 'celestial', 'aegis'],
        'druid': ['snare', 'root', 'regeneration', 'port', 'harmony', 'nature'],
        'shaman': ['slow', 'haste', 'cannibalize', 'ancestral', 'spirit', 'focus'],
        'paladin': ['lay hands', 'divine', 'holy', 'valor', 'blessing', 'guard'],
        'shadowknight': ['harm touch', 'darkness', 'terror', 'shadow', 'disease'],
        'ranger': ['snare', 'track', 'camouflage', 'trueshot', 'call'],
        'beastlord': ['spiritual', 'feral', 'savage', 'warder', 'pet'],
        'bard': ['selo', 'song', 'melody', 'chorus', 'chant', 'composition']
    };
    const patterns = classSpellPatterns[fullClassName] || [];
    return patterns.some(pattern => lowerName.includes(pattern));
}

module.exports = {
    searchItems,
    searchSpellsByClass,
    containsClassName
};