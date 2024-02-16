const { fork } = require("child_process");
const { program } = require('commander');

program.option("-c, --count <number>", "number of processes");
var options = program.parse().opts();
const count = parseInt(options.count) || 100; // Default to 1 if not specified

console.log(`Starting ${count} process(es).`);

for (let i = 0; i < count; i++) {
    const child = fork("worker.js");

    child.on("message", (msg) => {
        if (msg.found) {
            console.log(`Balance found by worker: ${msg}`);
            process.exit(0); // Exit main process if any child reports finding a balance
        }
    });

    child.on("exit", (code) => {
        console.log(`Child process exited with code ${code}`);
    });
}
