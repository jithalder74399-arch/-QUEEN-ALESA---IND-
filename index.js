const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys");
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
        // হোয়াটসঅ্যাপের ৪২৮ এরর বাইপাস করার জন্য লেটেস্ট ব্রাউজার অ্যারে
        browser: ["Chromium", "Ubuntu", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        console.log("\n[!] হোয়াটসঅ্যাপ সার্ভারের সাথে সকেট কানেকশন তৈরি হচ্ছে...");
        console.log("[!] ১০ সেকেন্ড অপেক্ষা করুন (সিকিউরিটি চেক চলছে)...");
        await delay(10000); // নতুন সিকিউরিটির জন্য ১০ সেকেন্ড সময় দরকার

        try {
            console.log("\n=============================================");
            const phoneNumber = await question('আপনার নাম্বারটি কান্ট্রি কোডসহ দিন (Ex: 91xxx): ');
            console.log("=============================================\n");
            
            console.log("হোয়াটসঅ্যাপের কাছে পেয়ারিং কোড রিকোয়েস্ট পাঠানো হচ্ছে...");
            await delay(3000);
            
            let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(formattedNumber);
            
            console.log("---------------------------------------------");
            console.log(`Your WhatsApp Pairing Code Is: ${code}`);
            console.log("---------------------------------------------");
            console.log("এই কোডটি কপি করে আপনার হোয়াটসঅ্যাপের Linked Devices-এ বসান।\n");
            rl.close();
        } catch (pairErr) {
            console.log("কোড জেনারেট করতে সমস্যা হয়েছে। টার্মাক্স ক্লোজ করে আবার ট্রাই করুন।\n");
            console.log(pairErr.message || pairErr);
            rl.close();
            process.exit(1);
        }
    }

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('QUEEN ALESA - IND সফলভাবে চালু হয়েছে! 🎉');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
