/**
 * getBankChannel.js - Discord Bot Bank Channel Utility
 * 
 * Purpose: Provides utility functions for safely retrieving Discord channels
 * for the Clockwork Banker v2 Discord bot banking system.
 * 
 * 
 * This utility ensures safe channel retrieval with proper error handling
 * and fallback mechanisms for Discord channel access.
 */

/**
 * Safely retrieves the bank request channel from the guild
 * Supports both direct channel ID lookup and channel name fallback
 * @param {Guild} guild - Discord guild object
 * @param {Object} config - Bot configuration object containing channel settings
 * @returns {TextChannel|null} - The bank channel or null if not found
 */
async function getBankChannel(guild, config) {
    try {
        // Validate inputs
        if (!guild) {
            console.warn('[BANK_CHANNEL] Guild is null or undefined');
            return null;
        }

        if (!config) {
            console.warn('[BANK_CHANNEL] Config object is missing');
            return null;
        }

        let channel = null;

        // Priority 1: Try to find by channel ID if provided
        if (config.bankChannelId) {
            try {
                channel = await guild.channels.fetch(config.bankChannelId);
                if (channel && channel.isTextBased()) {
                    console.log(`[BANK_CHANNEL] Found channel by ID: ${config.bankChannelId}`);
                    return channel;
                }
            } catch (error) {
                console.warn(`[BANK_CHANNEL] Could not fetch channel by ID ${config.bankChannelId}:`, error.message);
            }
        }

        // Priority 2: Try to find by channel name
        if (config.bankChannelName) {
            // First try exact name match
            channel = guild.channels.cache.find(ch => 
                ch.name === config.bankChannelName && ch.isTextBased()
            );

            if (channel) {
                console.log(`[BANK_CHANNEL] Found channel by exact name: ${config.bankChannelName}`);
                return channel;
            }

            // Fallback: Try partial name match for legacy compatibility
            channel = guild.channels.cache.find(ch => 
                ch.name.includes('bank-request') && ch.isTextBased()
            );

            if (channel) {
                console.log(`[BANK_CHANNEL] Found channel by partial name match: ${channel.name}`);
                return channel;
            }
        }

        // If we get here, no suitable channel was found
        console.warn('[BANK_CHANNEL] No suitable bank channel found');
        console.warn(`[BANK_CHANNEL] Searched for ID: ${config.bankChannelId || 'not provided'}`);
        console.warn(`[BANK_CHANNEL] Searched for name: ${config.bankChannelName || 'not provided'}`);
        
        return null;

    } catch (error) {
        console.error('[BANK_CHANNEL] Unexpected error finding bank channel:', error);
        return null;
    }
}

/**
 * Validates that a channel exists and is accessible for the bot
 * @param {TextChannel} channel - Discord channel to validate
 * @returns {boolean} - True if channel is valid and accessible
 */
function validateBankChannel(channel) {
    try {
        if (!channel) {
            return false;
        }

        // Check if it's a text-based channel
        if (!channel.isTextBased()) {
            console.warn('[BANK_CHANNEL] Channel is not text-based');
            return false;
        }

        // Check if bot can send messages
        if (!channel.permissionsFor(channel.guild.members.me)?.has(['SendMessages', 'ViewChannel'])) {
            console.warn('[BANK_CHANNEL] Bot lacks required permissions in channel');
            return false;
        }

        return true;

    } catch (error) {
        console.error('[BANK_CHANNEL] Error validating channel:', error);
        return false;
    }
}

module.exports = {
    getBankChannel,
    validateBankChannel
};
