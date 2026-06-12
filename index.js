const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason, ConnectionState } = require("@whiskeysockets/baileys");
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
        // হোয়াটসঅ্যাপের নতুন সিকিউরিটি বাইপাস করার জন্য অফিশিয়াল মোবাইল/ওয়েব ব্রাউজার প্রোটোকল (Fix)
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        console.log("\n[!] হোয়াটসঅ্যাপ সার্ভারের সাথে কানেক্ট হচ্ছে, ৭ সেকেন্ড অপেক্ষা করুন...");
        // কানেকশন পুরোপুরি স্টেবল হওয়ার জন্য সময় বাড়ানো হলো
        await delay(7000); 

        try {
            console.log("\n=============================================");
            const phoneNumber = await question('আপনার নাম্বারটি কান্ট্রি কোডসহ দিন (Ex: 91xxx): ');
            console.log("=============================================\n");
            
            console.log("পেয়ারিং কোড তৈরি হচ্ছে... একটু অপেক্ষা করুন...");
            await delay(3000);
            
            let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
            
            // requestPairingCode-এর সাথে অফিশিয়াল ব্রাউজার নাম সিঙ্ক করা হলো
            const code = await sock.requestPairingCode(formattedNumber);
            
            console.log("---------------------------------------------");
            console.log(`Your WhatsApp Pairing Code Is: ${code}`);
            console.log("---------------------------------------------");
            console.log("এই কোডটি কপি করে আপনার হোয়াটসঅ্যাপের Linked Devices-এ বসান।\n");
            rl.close();
        } catch (pairErr) {
            console.log("কোড জেনারেট করতে সমস্যা হয়েছে। টার্মাক্স ক্লোজ করে আবার ট্রাই করুন।\n");
            console.log(pairErr);
            rl.close();
            process.exit(1);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('QUEEN ALESA - IND সফলভাবে চালু হয়েছে! 🎉');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // কমান্ড হ্যান্ডলার অংশ
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

            if (command === 'menu' || command === 'help') {
                const mainMenu = `╭─────〔 👑 QUEEN ALESA - IND 👑 〕─────╮\n┃ ✦ Prefix   : ${prefix || '.'}\n┃ ✦ Mode     : Private\n╰─────────────────────────────────────╯\n\nবট সফলভাবে সচল হয়েছে!`;
                await sock.sendMessage(from, { text: mainMenu }, { quoted: mek });
            }
        } catch (err) {
            console.log(err);
        }
    });
}

startBot();
