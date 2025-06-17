const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banklist')
        .setDescription('Get link to browse the full bank inventory website'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🏦 Guild Bank Inventory')
            .setColor(0xFF9800)
            .setDescription('Click the link below to browse the full bank inventory with item stats and descriptions.')
            .addFields({
                name: '🔗 Full Bank Website',
                value: '[**Browse Bank Inventory →**](https://thj-dnt.web.app/bank)',
                inline: false
            })
            .addFields({
                name: '💡 How to Request Items',
                value: '1. Browse items on the website\n2. Come back to Discord\n3. Use `/search ItemName` to find what you want\n4. Click add buttons to build your cart\n5. Use `/cart character:YourName` to submit',
                inline: false
            })
            .setFooter({ text: 'No need to type long item names - just use the search and add buttons!' });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    },
};