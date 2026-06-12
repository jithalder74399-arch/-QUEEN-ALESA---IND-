const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");

// কীবোর্ড ইনপুট নেওয়ার জন্য গ্লোবাল ইন্টারফেস (যাতে বারবার তৈরি না হয়)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // ১. নাম্বার রেজিস্ট্রেশন লজিক (কানেকশন ইভেন্টের বাইরে এবং একদম সেফ)
    if (!sock.authState.creds.registered) {
        console.log("\n[!] হোয়াটসঅ্যাপ সার্ভারের সাথে কানেক্ট হচ্ছে, ৩ সেকেন্ড অপেক্ষা করুন...");
        await delay(3000);

        try {
            console.log("\n=============================================");
            const phoneNumber = await question('আপনার নাম্বারটি কান্ট্রি কোডসহ দিন (Ex: 91xxx): ');
            console.log("=============================================\n");
            
            console.log("পেয়ারিং কোড তৈরি হচ্ছে...");
            await delay(2000);
            
            const code = await sock.requestPairingCode(phoneNumber.trim());
            console.log("---------------------------------------------");
            console.log(`Your WhatsApp Pairing Code Is: ${code}`);
            console.log("---------------------------------------------");
            console.log("এই কোডটি কপি করে আপনার হোয়াটসঅ্যাপের Linked Devices-এ বসান।\n");
        } catch (pairErr) {
            console.log("কোড জেনারেট করতে সমস্যা হয়েছে। টার্মাক্স ক্লোজ করে আবার ট্রাই করুন।\n");
            process.exit(1); // কোড জেনারেট না হলে বট স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে, লুপ হবে না
        }
    }

    // ২. কানেকশন আপডেট হ্যান্ডলার
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('কানেকশন বন্ধ হয়েছে। পুনরায় চেষ্টা করা হচ্ছে...', shouldReconnect);
            if (shouldReconnect) {
                startBot(); // শুধু সেশন কানেক্টেড থাকলে রিস্টার্ট হবে, নয়তো না
            }
        } else if (connection === 'open') {
            console.log('QUEEN ALESA - IND সফলভাবে চালু হয়েছে! 🎉');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ৩. মেসেজ এবং কমান্ড হ্যান্ডলার
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

// বট রান করা হলো
startBot();
