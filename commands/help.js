const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands and how to use the bank bot'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Clockwork Banker - Command Help')
            .setColor(0x2196F3)
            .setDescription('Here are all the commands you can use with the guild bank bot:')
            .addFields(
                {
                    name: '👥 **Player Commands**',
                    value: '**`/search ItemName`** - Search for items by full or partial name\n' +
                           '• Examples: `/search sword`, `/search truth`, `/search sword of truth`\n' +
                           '• Click item names to add to your cart\n\n' +
                           '**`/search spell [class]`** - Search for spells by class\n' +
                           '• Examples: `/search spell wizard`, `/search spell enc`, `/search spell necro`\n' +
                           '• Supported: mag, nec, wiz, enc, dru, sha, cle, pal, sk, ran, bst, brd, mnk, rog, war\n\n' +
                           '**`/request`** - Open form to request multiple items at once\n' +
                           '• Type items one per line with optional quality\n' +
                           '• Example: "Sword of Flame (Enchanted)"\n\n' +
                           '**`/cart`** - View your shopping cart\n' +
                           '**`/cart character:YourName`** - Submit cart as a request\n\n' +
                           '**`/banklist`** - Get link to browse full bank website\n\n' +
                           '**`/help`** - Show this help message',
                    inline: false
                },
                {
                    name: '📜 **Spell Search Tips**',
                    value: '• Use class abbreviations: mag, nec, wiz, enc, etc.\n' +
                           '• Spells are sorted alphabetically\n' +
                           '• Shows all available qualities (Raw/Enchanted/Legendary)\n' +
                           '• Click spell names to add to cart just like items',
                    inline: false
                },
                {
                    name: '🛡️ **Staff Commands**',
                    value: '**`/fulfill request-id:1234`** - Mark request as completed\n' +
                           '**`/deny request-id:1234 reason:"Out of stock"`** - Deny request\n' +
                           '**`/partial request-id:1234 sent-items:"..." unavailable-items:"..."`** - Partial fulfillment',
                    inline: false
                },
                {
                    name: '📋 **How to Use**',
                    value: '1. **Browse** → Use `/banklist` to view full inventory\n' +
                           '2. **Search** → Use `/search ItemName` or `/search spell class`\n' +
                           '3. **Add** → Click item/spell names to add to cart\n' +
                           '4. **Submit** → Use `/cart character:YourName` to request\n' +
                           '5. **Staff** → Processes requests with fulfill/deny/partial commands',
                    inline: false
                }
            )
            .setFooter({ text: 'Questions? Ask in #bank-requests channel!' });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    },
};