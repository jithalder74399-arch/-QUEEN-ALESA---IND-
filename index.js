const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    // সেশন সেভ করার জন্য ফোল্ডার তৈরি হবে
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // QR code বন্ধ রাখা হলো কারণ আমরা পেয়ার কোড ব্যবহার করব
        auth: state
    });

    // যদি আগে থেকে লগইন করা না থাকে, তবে ফোন নাম্বার চাইবে
    if (!sock.authState.creds.registered) {
        console.log("\n=============================================");
        const phoneNumber = await question('আপনার হোয়াটসঅ্যাপ নাম্বারটি কান্ট্রি কোডসহ দিন (Ex: 8801xxx বা 91xxx): ');
        console.log("=============================================\n");
        
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log("---------------------------------------------");
        console.log(`Your WhatsApp Pairing Code Is: ${tarmenal}`);
        console.log("---------------------------------------------");
        console.log("এই কোডটি কপি করে আপনার হোয়াটসঅ্যাপের Linked Devices-এ বসান।\n");
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log('কানেকশন বিচ্ছিন্ন হয়েছে! আবার চেষ্টা করা হচ্ছে...');
            startBot();
        } else if (connection === 'open') {
            console.log('অভিনন্দন! আপনার হোয়াটসঅ্যাপ বট সফলভাবে কানেক্ট হয়েছে। 🎉');
        }
    });

    // সাধারণ একটা মেসেজ রিপ্লাই কমান্ড (কেউ 'Hi' বা 'Hello' দিলে বট উত্তর দেবে)
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            if (mek.key.fromMe) return; // নিজের মেসেজে বট নিজে উত্তর দেবে না

            const from = mek.key.remoteJid;
            const messageType = Object.keys(mek.message)[0];
            const body = messageType === 'conversation' ? mek.message.conversation : 
                         messageType === 'extendedTextMessage' ? mek.message.extendedTextMessage.text : '';

            if (body.toLowerCase() === 'hi' || body.toLowerCase() === 'hello') {
                await sock.sendMessage(from, { text: 'হ্যালো! আমি আপনার রোবট এসিস্ট্যান্ট। আমি সচল আছি! 🤖' }, { quoted: mek });
            }
        } catch (err) {
            console.log(err);
        }
    });
}

startBot();
