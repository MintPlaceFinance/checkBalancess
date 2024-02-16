const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const ElectrumClient = require('electrum-client');

const generateAddressesAndCheckBalances = async () => {
    const ecl = new ElectrumClient(51002, 'fulcrum.not.fyi', 'ssl');
    try {
        await ecl.connect();
        const bitcoin = require('bitcoinjs-lib');
        const bip39 = require('bip39');
        const ElectrumClient = require('electrum-client');
        const async = require('async'); // Make sure to install this package
        
        const generateAddressesAndCheckBalances = async () => {
            const ecl = new ElectrumClient(51002, 'fulcrum.not.fyi', 'ssl');
            await ecl.connect();
        
            const checkBalance = async (scriptHash) => {
                try {
                    const balance = await ecl.blockchainScripthash_getBalance(scriptHash);
                    return balance;
                } catch (error) {
                    console.error(`Error checking balance: ${error}`);
                    return null; // or handle retry logic here
                }
            };
        
            const queue = async.queue(async (task, callback) => {
                const { scriptHash, address, mnemonic } = task;
                const balance = await checkBalance(scriptHash);
                if (balance && (balance.confirmed > 0 || balance.unconfirmed > 0)) {
                    console.log(`Balance found! Address: ${address}, Balance: ${JSON.stringify(balance)}, Mnemonic: ${mnemonic}`);
                    process.exit(0); // Exit if balance is found
                } else {
                    console.log(`No balance found for ${address}.`);
                }
                callback();
            }, 5); // Limit the number of parallel balance checks to 5
        
            while (true) {
                const mnemonic = bip39.generateMnemonic();
                const seed = bip39.mnemonicToSeedSync(mnemonic);
                const network = bitcoin.networks.bitcoin;
        
                ['bip84', 'bip49', 'bip44'].forEach((type, i) => {
                    const path = `m/${type === 'bip84' ? '84' : type === 'bip49' ? '49' : '44'}'/0'/0'/0/${i}`;
                    const root = bitcoin.bip32.fromSeed(seed, network).derivePath(path);
                    const address = bitcoin.payments[type === 'bip84' ? 'p2wpkh' : type === 'bip49' ? 'p2sh' : 'p2pkh']({ pubkey: root.publicKey, network }).address;
                    const script = bitcoin.address.toOutputScript(address, network);
                    const scriptHash = bitcoin.crypto.sha256(script).reverse().toString('hex');
                    queue.push({ scriptHash, address, mnemonic });
                });
            }
        
            // Optional: add a listener to drain to handle when all tasks have been processed
            queue.drain(() => {
                console.log("Processed all addresses.");
            });
        };
        
        generateAddressesAndCheckBalances().catch(console.error);
        
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

            console.log(`Generated Mnemonic: ${mnemonic}`);
            console.log(`Checking balances for addresses: ${bip84Address}, ${bip49Address}, ${bip44Address}`);

            // Prepare script hashes in parallel
            const addresses = [bip84Address, bip49Address, bip44Address];
            const scriptHashes = addresses.map(address => {
                const script = bitcoin.address.toOutputScript(address, network);
                return bitcoin.crypto.sha256(script).reverse().toString('hex');
            });

            // Check balances in parallel
            const balancePromises = scriptHashes.map(scriptHash => ecl.blockchainScripthash_getBalance(scriptHash));
            const balances = await Promise.all(balancePromises);

            // Check for any balance found
            for (let i = 0; i < balances.length; i++) {
                if (balances[i].confirmed > 0 || balances[i].unconfirmed > 0) {
                    console.log(`Balance found! Address: ${addresses[i]}, Balance: ${JSON.stringify(balances[i])}, Mnemonic: ${mnemonic}`);
                    return; // Stop the loop if balance is found
                }
            }
        }
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    } finally {
        await ecl.close();
    }
};

generateAddressesAndCheckBalances().catch(console.error);
