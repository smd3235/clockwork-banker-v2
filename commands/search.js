// In commands/search.js - FINAL VERSION WITH EXPANDED CLASS ALIASES

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getHighestQuality } = require('../utils/itemFormatting');
const { bankData } = require('../data/bankData'); 


// Create clickable item name buttons
function createItemButtons(items, userId) {
    const buttons = [];
    const itemsToDisplay = items.slice(0, 25); 

    itemsToDisplay.forEach(item => {
        const highestQuality = getHighestQuality(item);
        if (highestQuality) {
            const button = new ButtonBuilder()
                .setCustomId(`additem_${userId}_${item.name}_${highestQuality}`)
                .setLabel(item.name.substring(0, 80)) 
                .setStyle(ButtonStyle.Primary);
            
            buttons.push(button);
        }
    });
    return buttons;
}

// Helper function to create a spell-specific embed
function createSpellSearchEmbed(results, className, userId) {
    const capitalizedClass = className.charAt(0).toUpperCase() + className.slice(1);
    
    const embed = new EmbedBuilder()
        .setTitle(`📜 ${capitalizedClass} Spells in Bank`)
        .setColor(0x9C27B0) 
        .setDescription(`**Found ${results.length} spell(s) for ${capitalizedClass}**\n*Click spell names to add to cart*`)
        .setFooter({ text: 'Showing up to 25 spells • Use /cart to view selections' });
    
    if (results.length > 0) {
        const spellList = results.slice(0, 10).map((spell, index) => {
            const qualities = [];
            if (spell.baseCount > 0) qualities.push(`R:${spell.baseCount}`);
            if (spell.enchantedCount > 0) qualities.push(`E:${spell.enchantedCount}`);
            if (spell.legendaryCount > 0) qualities.push(`L:${spell.legendaryCount}`);
            
            return `${index + 1}. **${spell.name}** (${qualities.join(', ')})`;
        }).join('\n');
        
        embed.addFields({
            name: 'Available Spells',
            value: spellList,
            inline: false
        });
        
        if (results.length > 10) {
            embed.addFields({
                name: 'Additional Info',
                value: `Showing first 10 of ${results.length} spells. Click buttons below to add any spell to cart.`,
                inline: false
            });
        }
    }
    return embed;
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for items by name or spells by class')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Item name OR "spell [class]" (e.g., "spell wizard")')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const query = interaction.options.getString('query');
        
        try {
            const searchTerm = query.toLowerCase().trim();
            const isSpellClassSearch = searchTerm.match(/spell\s+(\w+)/);
            const isGeneralSpellSearch = searchTerm === 'spell' || searchTerm === 'spells'; 

            let searchResults = [];

            // === CRITICAL CHANGE: EXPANDED classAliases for all common EQ abbreviations ===
            const classAliases = {
                'bard': 'bard', 'brd': 'bard',
                'beastlord': 'beastlord', 'bst': 'beastlord', 'beast': 'beastlord',
                'berserker': 'berserker', 'ber': 'berserker',
                'cleric': 'cleric', 'clr': 'cleric',
                'druid': 'druid', 'dru': 'druid',
                'enchanter': 'enchanter', 'enc': 'enchanter', 'ench': 'enchanter',
                'magician': 'magician', 'mag': 'magician', 'mage': 'magician',
                'monk': 'monk', 'mnk': 'monk',
                'necromancer': 'necromancer', 'nec': 'necromancer', 'necro': 'necromancer',
                'paladin': 'paladin', 'pal': 'paladin', 'pally': 'paladin',
                'ranger': 'ranger', 'rng': 'ranger', 'ran': 'ranger',
                'rogue': 'rogue', 'rog': 'rogue',
                'shadowknight': 'shadowknight', 'shd': 'shadowknight', 'sk': 'shadowknight',
                'shaman': 'shaman', 'sha': 'shaman', 'sham': 'shaman',
                'warrior': 'warrior', 'war': 'warrior',
                'wizard': 'wizard', 'wiz': 'wizard',
                'all': 'all' // For general spell search
            };

            const requestedClassNameRaw = isSpellClassSearch ? isSpellClassSearch[1] : 'all';
            const className = classAliases[requestedClassNameRaw] || requestedClassNameRaw; // Resolve alias
            // === END CRITICAL CHANGE ===
            
            const classSpells = bankData.spellsByClass.get(className) || [];
            const allSpells = bankData.spellsByClass.get('all') || [];

            if (className === 'all') { 
                let combinedSpells = new Map();
                bankData.spellsByClass.forEach((spellsInClass, key) => {
                    if (key !== 'all') { 
                        spellsInClass.forEach(spell => {
                            combinedSpells.set(spell.name.toLowerCase(), spell); 
                        });
                    }
                });
                allSpells.forEach(spell => {
                    combinedSpells.set(spell.name.toLowerCase(), spell);
                });

                const specificSearchTermInQuery = searchTerm.replace(/^(spell|spells)\s+/, '').trim();
                if (specificSearchTermInQuery) { // If there's a term after "spell" or "spells"
                    searchResults = Array.from(combinedSpells.values()).filter(item => item.name.toLowerCase().includes(specificSearchTermInQuery));
                } else {
                    searchResults = Array.from(combinedSpells.values());
                }

            } else { 
                searchResults = classSpells.filter(item => item.isSpell); 

                searchResults = searchResults.concat(allSpells.filter(item => item.isSpell && item.name.toLowerCase().includes(className)));
            }

            const specificSpellNameSearch = searchTerm.match(/spell\s+\w+\s+(.*)/);
            if (specificSpellNameSearch && specificSpellNameSearch[1]) {
                const specificName = specificSpellNameSearch[1].toLowerCase();
                searchResults = searchResults.filter(item => item.name.toLowerCase().includes(specificName));
            }

            searchResults.sort((a, b) => a.name.localeCompare(b.name)); 
            searchResults = searchResults.slice(0, 25); 
            
            if (!searchResults || searchResults.length === 0) {
                await interaction.editReply({
                    content: `No spells found for "${query}". Try a different class or general search.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            
            if (isSpellClassSearch || isGeneralSpellSearch) {
                const classNameDisplay = classAliases[requestedClassNameRaw] || requestedClassNameRaw; // Display alias or raw name
                const embed = createSpellSearchEmbed(searchResults, classNameDisplay, interaction.user.id);
                const itemButtons = createItemButtons(searchResults, interaction.user.id);
                const actionRows = [];
                
                for (let i = 0; i < itemButtons.length; i += 5) {
                    const buttonChunk = itemButtons.slice(i, i + 5);
                    actionRows.push(new ActionRowBuilder().addComponents(...buttonChunk));
                }
                
                const limitedActionRows = actionRows.slice(0, 5); 
                
                await interaction.editReply({ 
                    embeds: [embed], 
                    components: limitedActionRows,
                    flags: MessageFlags.Ephemeral 
                });
            } else { // Regular item search display
                // This path should now be only for non-spell items.
                // The general item search itself also needs to be filtered against spells.
                // We will handle regular item search in its own dedicated loop.
                let regularItemSearchResults = [];
                for (const [key, item] of bankData.items) {
                    if (!item.isSpell && key.includes(searchTerm) && regularItemSearchResults.length < 25) { 
                        regularItemSearchResults.push(item);
                    }
                }
                regularItemSearchResults.sort((a, b) => a.name.localeCompare(b.name));
                
                if (regularItemSearchResults.length === 0) {
                     await interaction.editReply({
                        content: `No items found matching "${query}". Try a different search term.`,
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }


                const embed = new EmbedBuilder()
                    .setTitle(`🔍 Search Results for "${query}"`)
                    .setColor(0x2196F3)
                    .setDescription('**Click item names below to add to your cart!**\n*Highest available quality will be added automatically.*')
                    .setFooter({ text: `Found ${regularItemSearchResults.length} item(s) • Use /cart to view your cart` });
                
                regularItemSearchResults.forEach((item, index) => {
                    const qualities = [];
                    if (item.baseCount > 0) qualities.push(`R:${item.baseCount}`);
                    if (item.enchantedCount > 0) qualities.push(`E:${item.enchantedCount}`);
                    if (item.legendaryCount > 0) qualities.push(`L:${item.legendaryCount}`);
                    
                    embed.addFields({
                        name: `${index + 1}. ${item.name}`,
                        value: `Available: ${qualities.join(', ')}`,
                        inline: false
                    });
                });
                
                const itemButtons = createItemButtons(regularItemSearchResults, interaction.user.id);
                const actionRows = [];
                for (let i = 0; i < itemButtons.length; i += 5) {
                    const buttonChunk = itemButtons.slice(i, i + 5);
                    actionRows.push(new ActionRowBuilder().addComponents(...buttonChunk));
                }
                
                await interaction.editReply({ 
                    embeds: [embed], 
                    components: actionRows,
                    flags: MessageFlags.Ephemeral 
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            await interaction.editReply({
                content: 'An error occurred while searching. Please try again.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};