/**
 * config.js - Clockwork Banker v2 Discord Bot Configuration
 * 
 * Purpose: Central configuration file containing all bot settings including
 * Discord token, channel settings, Firebase configuration, and API endpoints.
 * 
 * real credentials to version control.
 */

module.exports = {
    token: 'discord-bot-token', // Replace with your actual bot token !!
    bankChannelName: 'bank-request', // The thread/channel for requests
    bankApiUrl: 'https://thj-dnt.web.app/assets/', // Base URL for inventory files
    // Discord Bot Token - REQUIRED
    // Get this from Discord Developer Portal
    
    // Bank Channel Configuration
    // Priority: bankChannelId > bankChannelName > fallback search
    
    // External Services
    
    // Firebase Configuration - REQUIRED for data persistence
    // Get these from Firebase Console > Project Settings
    firebase: {
        apiKey: "firebase-api-key", // !! Replace with your Firebase API Key !!
        authDomain: "thj-dnt.firebaseapp.com",
        projectId: "thj-dnt",
        storageBucket: "thj-dnt.appspot.com",
        messagingSenderId: "firebaseSenderID", // Replace with your actual Sender ID
        appId: "firebase-appID" // Replace with your actual App ID
    }
};
