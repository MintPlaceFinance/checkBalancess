const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const ElectrumClient = require('electrum-client');

function updateConsoleMessage(message) {
    console.clear(); // Clear the entire console window
    console.log(message); // Print the new message
}

const generateAddressesAndCheckBalances = async () => {
    const ecl = new ElectrumClient(51002, 'fulcrum.not.fyi', 'ssl');
    try {
        await ecl.connect();

        while (true) {
            const mnemonic = bip39.generateMnemonic();
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const network = bitcoin.networks.bitcoin;
            
            const bip84Root = bitcoin.bip32.fromSeed(seed, network).derivePath("m/84'/0'/0'/0/0");
            const bip84Address = bitcoin.payments.p2wpkh({ pubkey: bip84Root.publicKey, network }).address;

            const bip49Root = bitcoin.bip32.fromSeed(seed, network).derivePath("m/49'/0'/0'/0/0");
            const bip49Address = bitcoin.payments.p2sh({
                redeem: bitcoin.payments.p2wpkh({ pubkey: bip49Root.publicKey, network }),
                network,
            }).address;

            const bip44Root = bitcoin.bip32.fromSeed(seed, network).derivePath("m/44'/0'/0'/0/0");
            const bip44Address = bitcoin.payments.p2pkh({ pubkey: bip44Root.publicKey, network }).address;

            updateConsoleMessage(`Checking: ${bip84Address}, ${bip49Address}, ${bip44Address}`);
            
            const addresses = [bip84Address, bip49Address, bip44Address];
            const scriptHashes = addresses.map(address => {
                const script = bitcoin.address.toOutputScript(address, network);
                return bitcoin.crypto.sha256(script).reverse().toString('hex');
            });

            const balancePromises = scriptHashes.map(scriptHash => ecl.blockchainScripthash_getBalance(scriptHash));
            const balances = await Promise.all(balancePromises);

            for (let i = 0; i < balances.length; i++) {
                if (balances[i].confirmed > 0 || balances[i].unconfirmed > 0) {
                    console.log(`\nBalance found! Address: ${addresses[i]}, Balance: ${JSON.stringify(balances[i])}`);
                    return;
                }
            }
            // This ensures the message about the current operation is updated without leaving previous messages
        }
    } catch (error) {
        console.error(`\nAn error occurred: ${error.message}`);
    } finally {
        await ecl.close();
    }
};

generateAddressesAndCheckBalances().catch(console.error);
