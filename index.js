const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // কানেকশন আপডেট হ্যান্ডলার
    sock.ev.on('connection.update', async (update) => {
        const { connection } = update;
        if (connection === 'close') {
            startBot();
        } else if (connection === 'open') {
            console.log('QUEEN ALESA - IND সফলভাবে চালু হয়েছে! 🎉');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // নাম্বার ইনপুট নেওয়ার একদম সেফ এবং ফ্রেশ লজিক (Fix)
    if (!sock.authState.creds.registered) {
        console.log("\n[!] হোয়াটসঅ্যাপ সার্ভারের সাথে কানেক্ট হচ্ছে, ৫ সেকেন্ড অপেক্ষা করুন...");
        await delay(5000);

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        
        rl.question('\n=============================================\nআপনার নাম্বারটি কান্ট্রি কোডসহ দিন (Ex: 91xxx): ', async (phoneNumber) => {
            rl.close(); // নাম্বার নেওয়ার সাথে সাথে ইন্টারফেস বন্ধ হবে, ফলে আর লুপ বা এরর হবে না
            console.log("=============================================\n");
            console.log("পেয়ারিং কোড তৈরি হচ্ছে...");
            
            try {
                const code = await sock.requestPairingCode(phoneNumber.trim());
                console.log("---------------------------------------------");
                console.log(`Your WhatsApp Pairing Code Is: ${code}`);
                console.log("---------------------------------------------");
                console.log("এই কোডটি কপি করে আপনার হোয়াটসঅ্যাপের Linked Devices-এ বসান।\n");
            } catch (pairErr) {
                console.log("কোড জেনারেট করতে সমস্যা হয়েছে, আবার npm start দিন।\n", pairErr);
            }
        });
    }

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

            if (command === 'menu' || command === 'help') {
                const mainMenu = `╭─────〔 👑 QUEEN ALESA - IND 👑 〕─────╮\n┃ ✦ Prefix   : ${prefix || '.'}\n┃ ✦ Mode     : Private\n╰─────────────────────────────────────╯\n\n.menu লিখে ট্রাই করুন!`;
                await sock.sendMessage(from, { text: mainMenu }, { quoted: mek });
            }
        } catch (err) {
            console.log(err);
        }
    });
}

startBot();
