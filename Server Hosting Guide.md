# 🤖 Death and Taxes Guild Bank Bot - Server Hosting Guide

This guide provides step-by-step instructions to install and run the Death and Taxes Guild Bank Bot on a Linux server (like a Raspberry Pi or any VPS) so it can operate 24/7.

---

## 🚀 Overview

This bot automates item requests, provides bank inventory search (items & spells), and offers staff management tools within Discord.

---

## 📋 Prerequisites (One-Time Server Setup)

Log in to your Linux server via SSH (or directly if you have a monitor/keyboard).

1.  **Install Node.js (LTS version) & npm:**
    (Your bot requires Node.js v18 or higher for full functionality.)
    ```bash
    sudo apt update
    sudo apt install -y curl
    curl -fsSL [https://deb.nodesource.com/setup_lts.x](https://deb.nodesource.com/setup_lts.x) | sudo -E bash -
    sudo apt install -y nodejs
    ```
    **Verify Installation:**
    ```bash
    node -v  # Should show v18.x.x or higher
    npm -v   # Should show a version number
    ```

2.  **Install Git:**
    ```bash
    sudo apt install -y git
    ```
    **Verify Installation:**
    ```bash
    git --version # Should show a version number
    ```

3.  **Install PM2 (Process Manager - Highly Recommended for 24/7 Uptime):**
    PM2 will keep your bot running constantly, even if it crashes, and manages restarts.
    ```bash
    sudo npm install -g pm2
    ```
    **Verify Installation:**
    ```bash
    pm2 --version # Should show a version number
    ```

---

## 📦 Bot Setup & Launch

Now, let's get the bot's files and configure it.

1.  **Clone the Bot's Repository:**
    Navigate to where you want to store the bot (e.g., your home directory `~`).
    ```bash
    cd ~
    git clone [https://github.com/grumpy-gaming/clockwork-banker-v2.git](https://github.com/grumpy-gaming/clockwork-banker-v2.git)
    ```
    Then, move into the bot's folder:
    ```bash
    cd clockwork-banker-v2
    ```

2.  **Configure the Bot (Crucial Security Step!)**
    You need to create a `config.js` file with your bot's token and Firebase API keys. **This file MUST NOT be pushed to public GitHub.**

    * **Create the `config.js` file:**
        ```bash
        nano config.js
        ```
    * **Paste the following content into `nano`:**
        (Replace the placeholder values with your **actual production bot's token and Firebase keys**.)
        ```javascript
        module.exports = {
            token: 'YOUR_DISCORD_BOT_TOKEN_HERE', // !! REPLACE WITH YOUR ACTUAL LIVE BOT TOKEN !!
            bankChannelName: 'bank-requests', // The Discord channel for requests (e.g., 'bank-requests')
            bankApiUrl: '[https://thj-dnt.web.app/assets/](https://thj-dnt.web.app/assets/)', // Base URL for inventory files (from the main bank web app)
            firebase: {
                apiKey: "YOUR_FIREBASE_API_KEY_HERE", // !! REPLACE WITH YOUR ACTUAL FIREBASE API KEY !!
                authDomain: "thj-dnt.firebaseapp.com",
                projectId: "thj-dnt",
                storageBucket: "thj-dnt.appspot.com",
                messagingSenderId: "123456789", // REPLACE with your actual Sender ID from Firebase
                appId: "1:123456789:web:abcdef123456789" // REPLACE with your actual App ID from Firebase
            }
        };
        ```
    * **Save and Exit `nano`:** Press `Ctrl+O` (then Enter), then `Ctrl+X`.

3.  **Install Bot Dependencies:**
    In the `clockwork-banker-v2` folder:
    ```bash
    npm install
    ```
    *(This downloads all necessary libraries. It might take a few minutes.)*

4.  **Launch the Bot with PM2:**
    ```bash
    pm2 start index.js --name "ClockworkBanker"
    ```
    *(This starts the bot in the background.)*

5.  **Configure PM2 to Start Bot on Server Boot (for 24/7 operation):**
    ```bash
    pm2 startup
    # Follow the instructions it provides (usually copy-paste a command like 'sudo env PATH=...')
    pm2 save
    ```
    *(`pm2 startup` gives a command to run once to make PM2 automatically start on server reboot. `pm2 save` saves the current running processes so PM2 knows what to restart.)*

---

## ⚙️ Discord Bot Setup (One-Time)

This step involves configuring the bot within Discord itself. **You should create a NEW Discord Bot Application for this live deployment, separate from any development bots.**

1.  **Create a NEW Discord Bot Application:**
    * Go to [Discord Developer Portal](https://discord.com/developers/applications) and log in.
    * Click **"New Application"** (e.g., name it "DeathAndTaxesBanker_Live").
    * Go to the **"Bot"** tab in the left sidebar. Click **"Add Bot"**.
    * **Copy the new bot's TOKEN.** This is the token you put in `config.js` above.
    * Under **"Privileged Gateway Intents"**, enable `PRESENCE INTENT` and `SERVER MEMBERS INTENT`.

2.  **Invite the NEW Bot to Your Guild's Discord Server:**
    * In the Developer Portal, for your *new bot application*, go to **"OAuth2" > "URL Generator"**.
    * Under **"SCOPES"**, check `bot` and `applications.commands`.
    * Under **"BOT PERMISSIONS"**, select `Administrator` (or at least `Send Messages`, `Embed Links`, `Manage Channels`, `Create Public Threads`, `Send Messages in Threads`).
    * Copy the "Generated URL" at the bottom.
    * Paste the URL into your browser, select your server, and authorize the bot.

3.  **Set Up Persistent Bank Buttons in Discord:**
    * Once the bot is online in your Discord server (give it a minute or two after `pm2 start`), log into Discord *as a guild admin*.
    * Go to the Discord channel where you want the main bank buttons to appear (e.g., `#bank-requests`).
    * Type the command, replacing `#your-bank-channel` with the exact name of your channel:
        ```
        /banksetup channel:#your-bank-channel
        ```
        *(This will post the message with the "View Full Bank" and "Request Items (Instructions)" buttons.)*

---

## 🛠️ Bot Management (PM2 Commands)

To manage the bot on the server:

* **`pm2 status`**: See if the bot is running.
* **`pm2 logs ClockworkBanker`**: View the bot's live output/logs.
* **`pm2 stop ClockworkBanker`**: Stop the bot.
* **`pm2 start ClockworkBanker`**: Start the bot.
* **`pm2 restart ClockworkBanker`**: Restart the bot (useful after code updates).
* **`pm2 delete ClockworkBanker`**: Remove the bot from PM2's management.

---

**For future code updates:**

1.  Go to the `clockwork-banker-v2` folder on the server.
2.  `git pull origin main` (to get the latest changes from GitHub).
3.  `npm install` (if `package.json` changed).
4.  `pm2 restart ClockworkBanker`.

Good luck!
