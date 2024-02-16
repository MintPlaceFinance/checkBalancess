const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const ElectrumClient = require('electrum-client');

let mnemonicsChecked = 0;
let addressesChecked = 0;

const generateAddressesAndCheckBalances = async () => {
    const ecl = new ElectrumClient(51002, 'fulcrum.not.fyi', 'ssl');
    try {
        await ecl.connect();

        // Periodically log the progress every 10 seconds
        const logIntervalId = setInterval(() => {
            console.log(`Checked ${mnemonicsChecked} mnemonics and ${addressesChecked} addresses.`);
        }, 10000);

        while (true) {
            mnemonicsChecked++;
            const mnemonic = bip39.generateMnemonic();
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const network = bitcoin.networks.bitcoin;

            const paths = ["m/84'/0'/0'/0/0", "m/49'/0'/0'/0/0", "m/44'/0'/0'/0/0"];
            const addresses = paths.map(path => {
                const root = bitcoin.bip32.fromSeed(seed, network).derivePath(path);
                const { address } = bitcoin.payments.p2wpkh({ pubkey: root.publicKey, network });
                return address;
            });

            addressesChecked += addresses.length; // Increment the count of checked addresses

            const scriptHashes = addresses.map(address => {
                const script = bitcoin.address.toOutputScript(address, network);
                return bitcoin.crypto.sha256(script).reverse().toString('hex');
            });

            // Process balance checks in parallel
            const balancePromises = scriptHashes.map(scriptHash => ecl.blockchainScripthash_getBalance(scriptHash));
            const balances = await Promise.all(balancePromises);

            for (const [index, balance] of balances.entries()) {
                if (balance.confirmed > 0 || balance.unconfirmed > 0) {
                    console.log(`\nBalance found! Mnemonic: ${mnemonic}, Address: ${addresses[index]}, Balance: ${JSON.stringify(balance)}`);
                    clearInterval(logIntervalId); // Stop the periodic logging
                    return; // Stop the search as balance is found
                }
            }
        }
    } catch (error) {
        console.error(`\nAn error occurred: ${error.message}`);
        clearInterval(logIntervalId); // Ensure the logging is stopped on error
    } finally {
        await ecl.close();
    }
};

generateAddressesAndCheckBalances().catch(console.error);
