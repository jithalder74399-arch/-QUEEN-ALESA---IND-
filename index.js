const { default: makeWASocket, useMultiFileAuthState, disconnectType, delay } = require("@whiskeysockets/baileys"); // ওপরে delay যুক্ত করা হয়েছে
const pino = require("pino");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"] // ব্রাউজার সেটআপ যোগ করা হলো যাতে হোয়াটসঅ্যাপ রিজেক্ট না করে
    });

    if (!sock.authState.creds.registered) {
        console.log("\n=============================================");
        const phoneNumber = await question('আপনার নাম্বারটি কান্ট্রি কোডসহ দিন (Ex: 8801xxx বা 91xxx): ');
        console.log("=============================================\n");
        
        console.log("পেয়ারিং কোড তৈরি হচ্ছে, ৩ সেকেন্ড অপেক্ষা করুন...");
        await delay(3000); // সার্ভার কানেকশন স্টেবল হওয়ার জন্য ৩ সেকেন্ড বিরতি (Fix)

        try {
            const code = await sock.requestPairingCode(phoneNumber.trim());
            console.log("---------------------------------------------");
            console.log(`Your WhatsApp Pairing Code Is: ${code}`);
            console.log("---------------------------------------------");
            console.log("এই কোডটি কপি করে আপনার হোয়াটসঅ্যাপের Linked Devices-এ বসান।\n");
        } catch (pairErr) {
            console.log("কোড জেনারেট করতে সমস্যা হয়েছে, আবার npm start দিন।", pairErr);
        }
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            console.log('QUEEN ALESA - IND সফলভাবে চালু হয়েছে! 🎉');
        }
    });

    // মেসেজ এবং কমান্ড হ্যান্ডলার
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message || mek.key.fromMe) return;

            const from = mek.key.remoteJid;
            const messageType = Object.keys(mek.message)[0];
            const body = messageType === 'conversation' ? mek.message.conversation : 
                         messageType === 'extendedTextMessage' ? mek.message.extendedTextMessage.text : '';

            const prefix = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#/$%^&@.\-+]/.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™✓_=|~!?#/$%^&@.\-+]/)[0] : '';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(" ");

            if (command === 'menu' || command === 'help') {
                const mainMenu = `╭─────〔 👑 QUEEN ALESA - IND 👑 〕─────╮
┃ ✦ Owner    : TERMINAL HACKER
┃ ✦ Commands : 698+
┃ ✦ Runtime  : সচল আছে
┃ ✦ Prefix   : ${prefix || '.'}
┃ ✦ Mode     : Private
┃ ✦ Version  : 1.0.0
╰─────────────────────────────────────╯

╭────〔 🤖 AI MENU 🤖 〕────╮
┃ ◈ COPILOT, CHATGPTELITE, TALKAI
┃ ◈ BRAIN, ELITE, MSCOPILOT
┃ ◈ ELITEGPT, ASSISTANT, SMART
┃ ◈ GENIUS, PROAI, ULTRA, NOVA
┃ ◈ GPT, GPT4, GPT4O, CHATGPT
┃ ◈ CLAUDE, GEMINI, KIMI, LLAMA3
┃ ◈ PERPLEXITY, MISTRAL, DEEPSEEK
┃ ◈ QWEN, MATHGPT
╰────────────────╯

╭────〔 🌸 ANIME 🌸 〕────╮
┃ ◈ WAIFU, NEKO, MEGUMIN, MAID, AWOO
╰────────────────╯

╭────〔 🎵 AUDIO 🎵 〕────╮
┃ ◈ BASS, DEEP, SMOOTH, FAT, RADIO
┃ ◈ ROBOT, CHIPMUNK, NIGHTCORE
┃ ◈ REVERSE, SLOW, FAST, BABY
┃ ◈ DEMON, TOMP3, TOPTT
╰────────────────╯

╭────〔 ⬇️ DOWNLOAD ⬇️ 〕────╮
┃ ◈ GDRIVE, CAPCUT, APK, FB, IGDL
┃ ◈ MEDIAFIRE, TIKTOK, TIKTOK2
┃ ◈ TIKTOK3, YTPOST, TTS, GITCLONE
┃ ◈ PLAY, VIDEO, SONG
╰───────────────────╯

╭────〔 🎭 FUN MENU 🎭 〕────╮
┃ ◈ CHARACTER, SHIP, DAD, MOM, SON
┃ ◈ DAUGHTER, BOYFRIEND, GIRLFRIEND
┃ ◈ TWIN, PARTNER, BODYGUARD, BOSS
┃ ◈ EMPLOYEE, PET, ANGEL, DEVIL
┃ ◈ KING, QUEEN, MASTER, GENIUS
┃ ◈ FOOL, RICH, POOR, BHAI, BAHAN
┃ ◈ WIFE, HUSBAND, BESTFRIEND, ENEMY
┃ ◈ CRUSH, TEACHER, STUDENT, RIVAL
┃ ◈ FLIRT, QUOTE, JOKE, CAKE, PICKUP
┃ ◈ EMIX, COMPATIBILITY, AURA, ROAST
┃ ◈ 8BALL, COMPLIMENT, LOVETEST
┃ ◈ EMOJI, CRY, HUG, KISS, SLAP
┃ ◈ PAT, CUDDLE, WINK, LAUGH, WAVE
┃ ◈ HIGHFIVE, HANDHOLD, BITE, POKE
┃ ◈ SMILE, BLUSH, SLEEP, KICK
┃ ◈ SHOOT, DANCE, SHRUG, FACEPALM
┃ ◈ THUMBSUP
╰────────────────╯
| ©POWERD BY〔 QUEEN ALESA - IND 〕`;

                await sock.sendMessage(from, { text: mainMenu }, { quoted: mek });
            }

            const aiCommands = ['copilot', 'chatgptelite', 'talkai', 'brain', 'elite', 'mscopilot', 'elitegpt', 'assistant', 'smart', 'genius', 'proai', 'ultra', 'nova', 'gpt', 'gpt4', 'gpt4o', 'chatgpt', 'claude', 'gemini', 'kimi', 'perplexity', 'llama3', 'mistral', 'deepseek', 'qwen', 'mathgpt'];
            if (aiCommands.includes(command)) {
                if (!text) return await sock.sendMessage(from, { text: `অনুগ্রহ করে আপনার প্রশ্নটি লিখুন।` }, { quoted: mek });
                await sock.sendMessage(from, { text: `🤖 *QUEEN ALESA AI* আপনার উত্তরের খোঁজ করছে...` }, { quoted: mek });
                await sock.sendMessage(from, { text: `আপনি '${command}' এর কাছে জানতে চেয়েছেন:\n\n"${text}"` }, { quoted: mek });
            }

            if (command === 'joke') {
                await sock.sendMessage(from, { text: `😜 বল্টু আর শিক্ষকের জোকস:\nশিক্ষক: বল্টু, বলতো ভারতের সবচেয়ে বড় নদী কোনটা?\nবল্টু: কেন স্যার? ম্যাপে তো সব নদীই ১ ইঞ্চি লম্বা! 🤣` }, { quoted: mek });
            }

        } catch (err) {
            console.log(err);
        }
    });
}

startBot();
