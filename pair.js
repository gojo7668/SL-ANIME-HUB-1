const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function start() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const sock = makeWASocket({
    version,
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        start();
      }
    } else if (connection === 'open') {
      console.log('opened connection');
    }
  });

  rl.question('Enter phone number (with country code): ', (phoneNumber) => {
    sock.sendMessage(phoneNumber + '@s.whatsapp.net', { text: 'Hello from Baileys!' })
      .then(() => {
        console.log('Message sent successfully');
        rl.close();
      })
      .catch((err) => {
        console.error('Failed to send message:', err);
        rl.close();
      });
  });
}

start();
