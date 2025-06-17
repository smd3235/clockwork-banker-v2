const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { userCarts, activeRequests, getNextRequestId } = require('../data/bankData');
const { formatItemForRequest } = require('../utils/itemFormatting');
const config = require('../config');

// Create cart management buttons
function createCartButtons(userId) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`cart_clear_${userId}`)
                .setLabel('Clear Cart')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`cart_submit_${userId}`) // This button now just informs to use slash command
                .setLabel('Submit Request (Use /cart CharName)')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true) // Disable this button to force slash command
        );
}

// Get or create user cart
function getUserCart(userId) {
    if (!userCarts.has(userId)) {
        userCarts.set(userId, []);
    }
    return userCarts.get(userId);
}


async function showCart(interaction, userId) {
    const userCart = getUserCart(userId);

    if (userCart.length === 0) {
        await interaction.editReply({
            content: '🛒 Your cart is empty! Use `/search` or `/banklist` to find items.',
            ephemeral: true
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('🛒 Your Shopping Cart')
        .setColor(0x4CAF50)
        .setDescription(`You have ${userCart.length} item(s) in your cart:`)
        .setFooter({ text: 'Use /cart character:YourCharName to submit this request' });

    const cartItems = userCart.map((item, index) =>
        `${index + 1}. ${formatItemForRequest(item)}`
    ).join('\n');

    embed.addFields({
        name: 'Items in Cart',
        value: cartItems,
        inline: false
    });

    const buttons = createCartButtons(userId);

    await interaction.editReply({
        embeds: [embed],
        components: [buttons],
        ephemeral: true
    });
}

async function submitCart(interaction, userId, characterName) {
    const userCart = getUserCart(userId);

    if (userCart.length === 0) {
        await interaction.editReply({
            content: 'Your cart is empty! Add some items first.',
            ephemeral: true
        });
        return;
    }
    console.log('1. submitCart: Starting channel lookup.');
    const channel = interaction.guild.channels.cache.find(ch =>
        ch.name === config.bankChannelName || ch.name.includes('bank-request')
    );

    if (!channel) {
        await interaction.editReply({
            content: 'Bank requests channel not found. Please contact any bank staff.',
            ephemeral: true
        });
        return;
    }

    const requestId = getNextRequestId();
    const formattedItems = userCart.map(item => formatItemForRequest(item));

    activeRequests.set(requestId, {
        id: requestId,
        userId: interaction.user.id,
        characterName: characterName,
        items: [...userCart],
        requestedAt: new Date(),
        status: 'pending'
    });

    const requestEmbed = new EmbedBuilder()
        .setTitle(`🎒 Guild Bank Request #${requestId}`)
        .setColor(0x4CAF50)
        .addFields(
            { name: 'Requested by', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Send to Character', value: characterName, inline: true },
            { name: 'Request ID', value: `#${requestId}`, inline: true },
            { name: 'Items Requested', value: formattedItems.join('\n'), inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Staff: Use /fulfill, /deny, or /partial commands with this ID' });

    const threadName = `Request #${requestId} - ${characterName}`;
    const requestMessage = await channel.send({
        embeds: [requestEmbed]
    });

    const thread = await requestMessage.startThread({
        name: threadName,
        autoArchiveDuration: 1440,
        reason: `Bank request #${requestId} by ${interaction.user.username}`
    });

    await thread.send(`Hello Bank Staff! This is a new bank request from <@${interaction.user.id}> for **${characterName}**.\n\nUse the staff commands to update its status: \`/fulfill\`, \`/deny\`, or \`/partial\`.`);

    activeRequests.get(requestId).messageId = requestMessage.id;
    activeRequests.get(requestId).threadId = thread.id;

    let replyMessage = `✅ Request #${requestId} submitted successfully!\n\n`;
    replyMessage += `Your request for the following items has been sent to the bank staff:\n${formattedItems.join('\n')}\n\n`;
    replyMessage += `**Send to:** ${characterName}`;

    await interaction.editReply({
        content: replyMessage,
        ephemeral: true
    });

    userCarts.set(userId, []); // Clear cart after submission
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('cart')
        .setDescription('View and manage your shopping cart')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Character name to send items to (required to submit)')
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true }); // Immediately defer the reply

        const characterName = interaction.options.getString('character');
        if (characterName) {
            await submitCart(interaction, interaction.user.id, characterName);
        } else {
            await showCart(interaction, interaction.user.id);
        }
    },
};