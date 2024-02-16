const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const ElectrumClient = require('electrum-client');

let mnemonicsChecked = 0;
let lastLoggedTime = Date.now();
const logInterval = 10000; // Log summary every 10 seconds

const logSummary = () => {
    console.log(`Summary: Mnemonics Checked: ${mnemonicsChecked}`);
};

const generateAddressesAndCheckBalances = async () => {
    const ecl = new ElectrumClient(51002, 'fulcrum.not.fyi', 'ssl');
    try {
        await ecl.connect();

        while (true) {
            // Log summary at regular intervals
            if (Date.now() - lastLoggedTime > logInterval) {
                logSummary();
                lastLoggedTime = Date.now();
            }

            mnemonicsChecked++; // Increment mnemonic check count
            const mnemonic = bip39.generateMnemonic();
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const network = bitcoin.networks.bitcoin;
            
            const paths = ["m/84'/0'/0'/0/0", "m/49'/0'/0'/0/0", "m/44'/0'/0'/0/0"];
            const addresses = paths.map(path => {
                const root = bitcoin.bip32.fromSeed(seed, network).derivePath(path);
                return bitcoin.payments.p2wpkh({ pubkey: root.publicKey, network }).address;
            });

            const scriptHashes = addresses.map(address => {
                const script = bitcoin.address.toOutputScript(address, network);
                return bitcoin.crypto.sha256(script).reverse().toString('hex');
            });

            for (const [index, scriptHash] of scriptHashes.entries()) {
                const balance = await ecl.blockchainScripthash_getBalance(scriptHash);
                if (balance.confirmed > 0 || balance.unconfirmed > 0) {
                    console.log(`\nBalance found! Mnemonic: ${mnemonic}, Address: ${addresses[index]}, Balance: ${JSON.stringify(balance)}`);
                    return; // Stop the search as balance is found
                }
            }
        }
    } catch (error) {
        console.error(`\nAn error occurred: ${error.message}`);
        logSummary(); // Log final summary if an error occurs
    } finally {
        await ecl.close();
    }
};

generateAddressesAndCheckBalances().catch(console.error);
