const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const os = require("os");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// বোট রান হওয়ার সময় বা আপটাইম হিসেব করার ফাংশন
const startTime = Date.now();
function getRuntime() {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

// র‍্যাম হিসেব করার ফাংশan
function getRAM() {
    const totalRAM = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
    const freeRAM = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
    const usedRAM = (totalRAM - freeRAM).toFixed(2);
    return `${usedRAM} / ${totalRAM} GB`;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Chromium", "Ubuntu", "20.04"]
    });

    if (!sock.authState.creds.registered) {
        console.log("\n[!] WhatsApp সার্ভারের সাথে কানেক্ট হচ্ছে...");
        await delay(3000);
        const phoneNumber = await question('আপনার হোয়াটসঅ্যাপ নাম্বারটি দেশের কোডসহ দিন (যেমন: 91xxxxxxxxxx): ');
        let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
        const code = await sock.requestPairingCode(formattedNumber);
        console.log(`\n====================================\nআপনার পেয়ারিং কোড: ${code}\n====================================\n`);
    }

    sock.ev.on('creds.update', saveCreds);

    let botMode = "Public"; // ডিফল্ট মোড

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') console.log('TERMINAL-X MD বোট সফলভাবে চালু হয়েছে!');
        if (connection === 'close') startBot();
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const messageType = Object.keys(msg.message)[0];
        const text = messageType === 'conversation' ? msg.message.conversation : 
                     messageType === 'extendedTextMessage' ? msg.message.extendedTextMessage.text : '';

        const from = msg.key.remoteJid;
        const prefix = ".";
        const pushname = msg.pushName || "User";
        const currentTime = new Date().toLocaleTimeString();

        // কমান্ড চেনার সুবিধার্থে
        const command = text.toLowerCase().split(" ")[0];
        const args = text.split(" ").slice(1).join(" ");

        if (!text.startsWith(prefix)) return;

        // ══════════════ [ MENU COMMAND ] ══════════════
        if (command === `${prefix}menu` || command === `${prefix}help`) {
            const menu = `─【 𝐓𝐄𝐑𝐌𝐈𝐍𝐀𝐋 -𝐗 𝐌𝐃 】─

╭═══【 𝘾𝙊𝙈𝙈𝘼𝙉𝘿 𝙋𝘼𝙉𝙀𝙇 】═══➛
│ ⏱ Run    : ${getRuntime()}
│ 🌐 Mode   : ${botMode}
│ 🔹 Prefix : ${prefix}
│ 💾 RAM    : ${getRAM()}
│ 🕒 Time   : ${currentTime}
│ 👤 User   : ${pushname}
╰════════════════════➛

【 OWNER 】
⤷ .owner
⤷ .alive
⤷ .pair
⤷ .uptime
⤷ .mode public
⤷ .mode private
⤷ .prefix

【 PROFILE 】
⤷ .getpp
⤷ .setpp
⤷ .vv
⤷ .lookup
⤷ .sticker
⤷ .getbio
⤷ .setbio
⤷ .block

【 GROUP 】
⤷ .hidetag
⤷ .tag
⤷ .tagall
⤷ .kick
⤷ .promote
⤷ .demote
⤷ .welcome
⤷ .goodbye
⤷ .antilink
⤷ .antibot
⤷ .open
⤷ .close
⤷ .resetlink

【 AUTO FEATURES 】
⤷ .autoreact
⤷ .autotyping
⤷ .autorecording
⤷ .autoseen
⤷ .anticall

【 MEDIA 】
⤷ .play
⤷ .song
⤷ .video
⤷ .fb
⤷ .insta
⤷ .tiktok
⤷ .ytmp4
⤷ .pinterest

【 AI / TOOLS 】
⤷ .gpt
⤷ .ping

【 EXTRA 】
⤷ .apk
⤷ .github
⤷ .image
⤷ .emojimix
⤷ .vnote
⤷ .save
⤷ .lyrics
⤷ .weather
⤷ .checkid
⤷ .delete
⤷ .sticker2image
⤷ .broadcast
⤷ .git`;

            await sock.sendMessage(from, { text: menu });
        }

        // ══════════════ [ LIVE WORKING COMMANDS ] ══════════════
        
        // .owner
        if (command === `${prefix}owner`) {
            await sock.sendMessage(from, { text: "😎 *Owner Info:* This bot is configured by *TERMINAL HACKER*." });
        }

        // .alive
        if (command === `${prefix}alive`) {
            await sock.sendMessage(from, { text: `👋 Hey ${pushname}! TERMINAL-X MD is fully active and running smoothly. ⚡` });
        }

        // .ping
        if (command === `${prefix}ping`) {
            const startPing = Date.now();
            await sock.sendMessage(from, { text: "Checking latency..." }).then(async () => {
                const endPing = Date.now() - startPing;
                await sock.sendMessage(from, { text: `🏓 *Pong:* ${endPing}ms` });
            });
        }

        // .uptime
        if (command === `${prefix}uptime`) {
            await sock.sendMessage(from, { text: `⏱ *Uptime:* ${getRuntime()}` });
        }

        // .mode public / private
        if (command === `${prefix}mode`) {
            if (args === "public" || args === "private") {
                botMode = args.charAt(0).toUpperCase() + args.slice(1);
                await sock.sendMessage(from, { text: `🌐 Bot mode updated to: *${botMode}*` });
            } else {
                await sock.sendMessage(from, { text: "Use *.mode public* or *.mode private*" });
            }
        }

        // ══════════════ [ ALL OTHER COMMANDS STUB ] ══════════════
        // আপনার বাকি সব কমান্ডের জন্য নিচে একটি লুপ দিয়ে অটো-রেসপন্স সেট করে দেওয়া হলো, 
        // যাতে বোট কোনোটায় 'Unknown Command' না দেখায়।
        const allCommands = [
            "pair", "prefix", "getpp", "setpp", "vv", "lookup", "sticker", "getbio", "setbio", "block",
            "hidetag", "tag", "tagall", "kick", "promote", "demote", "welcome", "goodbye", "antilink", 
            "antibot", "open", "close", "resetlink", "autoreact", "autotyping", "autorecording", "autoseen", 
            "anticall", "play", "song", "video", "fb", "insta", "tiktok", "ytmp4", "pinterest", "gpt", 
            "apk", "github", "image", "emojimix", "vnote", "save", "lyrics", "weather", "checkid", "delete", 
            "sticker2image", "broadcast", "git"
        ];

        const cmdWithoutPrefix = command.replace(prefix, "");
        if (allCommands.includes(cmdWithoutPrefix)) {
            await sock.sendMessage(from, { text: `⚙️ *[ TERMINAL-X MD ]* \n\n'${command}' কমান্ডটি সফলভাবে ডিটেক্ট হয়েছে। এই ফিচারের ব্যাকএন্ড ডেভেলপমেন্টের কাজ চলছে...` });
        }
    });
}

startBot();
