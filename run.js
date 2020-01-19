// Imports
const fs = require("fs");
const readline = require("readline");

// App constants
const path = "players";
const rules = ["wa", "w3"];

// Runtime vars
let rule = "wa";
let players = [];

console.log("Welcome to FGQueue!");

setup()
.then(mainLoop)
.catch(console.log);

// Setup the queue players and rules
async function setup() {
    let playerNames = await askConsole(`Who will play?\n default: reads from '${path}' file\n`);
    players = playerNames.length !== 0
        ? playerNames.split(" ")
        : await readFile();

    let chosenRule = await askConsole(`Which rule will you play on?\n default: wa\n possible options: ${rules}\n`);
    setRule(chosenRule);

    players.sort(() => 0.5 - Math.random());
}

// Applications main loop
async function mainLoop() {
    let queue = [...players];
    let lastMatches = [];
    // noinspection InfiniteLoopJS
    while (true) {
        console.clear();
        console.log(`Current match:`);
        // Gets the first and second players in the queue
        let player1 = queue.shift();
        let player2 = queue.shift();
        console.log(`${player1} vs ${player2}\n`);
        console.log(`Queue: `);
        queue.forEach((player) => console.log(' - ' + player));

        let advanceToNextFight = false;
        // Input loop
        while (!advanceToNextFight) {
            // Waits for a command
            let answer = (await askConsole(`$ `)).split(" ");

            // Every command needs at least 2 args
            if (answer.length >= 2) {
                if (answer[0] === "win".toLowerCase() || answer[0].toLowerCase() === "w") { // Reports the winner
                    advanceToNextFight = true;
                    if (answer[1] === "1" || answer[1].toLowerCase() === "l") {
                        lastMatches = processWinner(player1, player2, queue, lastMatches);
                    } else if (answer[1] === "2" || answer[1].toLowerCase() === "r") {
                        lastMatches = processWinner(player2, player1, queue, lastMatches);
                    } else {
                        advanceToNextFight = false;
                        console.log(`Invalid command`);
                    }
                } else if (answer[0].toLowerCase() === "rule") { // Change the rules
                    if (!setRule(answer[1])) {
                        console.log(`Invalid command`);
                    }
                } else if (answer[0].toLowerCase() === "skip" || answer[0].toLowerCase() === "s") { // Skips a player
                    advanceToNextFight = true;
                    if (answer[1] === "1" || answer[1].toLowerCase() === "l") {
                        skipPlayer(player1, player2, queue);
                    } else if (answer[1] === "2" || answer[1].toLowerCase() === "r") {
                        skipPlayer(player2, player1, queue);
                    } else {
                        advanceToNextFight = false;
                        console.log(`Invalid command`);
                    }
                } else if (answer[0].toLowerCase() === "add" || answer[0].toLowerCase() === "a") { // Adds a player
                    queue.push(answer[1]);
                    players.push(answer[1]);
                    queue = [player1, player2].concat(queue);
                    advanceToNextFight = true;
                } else if (answer[0].toLowerCase() === "rm") { // Removes a player
                    let index = players.findIndex(p => p === answer[1]);
                    if (index !== -1) {
                        advanceToNextFight = true;
                        players.splice(index, 1);
                        queue = [player1, player2].concat(queue);
                        queue.splice(queue.findIndex(p => p === answer[1]), 1);
                    } else {
                        advanceToNextFight = false;
                        console.log(`Invalid command`);
                    }
                } else {
                    advanceToNextFight = false;
                    console.log(`Invalid command`);
                }
            } else if (answer.length === 1 && answer[0] === "exit") { // Closes the application
                console.log("Thanks for using! Leave feedback if you want!");
                process.exit();
            } else {
                console.log(`Invalid command`);
            }
        }
    }
}

function processWinner(winner, loser, queue, lastMatches) {
    // Reinserts the loser in the queue
    queue.push(loser);

    // Resets lastMatches on winner change
    if (lastMatches.length > 0 && lastMatches[lastMatches.length - 1].winner !== winner) {
        lastMatches = [];
    }
    // Registers the winner
    lastMatches.push({winner, loser});

    // Validates rule
    if (winnerStays(lastMatches, winner, queue[0])) {
        // Inserts winner at the start of the queue
        queue.unshift(winner);
    } else {
        // Inserts winner at the back of the queue
        queue.push(winner);
    }

    return lastMatches;
}

// Skips a player
function skipPlayer(skipped, maintained, queue) {
    queue.push(skipped);
    queue.unshift(maintained);
}

// Validates current rules to see if the winner should stay
function winnerStays(lastMatches, winner, nextInQueue) {
    if (rule === rules[0]) { // Win against everyone
        let index = lastMatches.findIndex(m => m.loser === nextInQueue);
        if (index !== -1 && index !== lastMatches.length - 1) {
            return false;
        }
    } else if (rule === rules[1] && lastMatches.length >= 3) { // Win thrice
        return false;
    }

    return true;
}

// Sets the current rule and returns true if successful
function setRule(chosenRule) {
    if (rules.includes(chosenRule)) {
        rule = chosenRule;
        return true;
    } else {
        return false;
    }
}

// Makes a question and waits for an answer through the console
function askConsole(question) {
    return new Promise((fulfill, reject) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        readline.question(question, (answer) => {
            fulfill(answer);
            readline.close()
        })
    });
}

// Reads a file, line by line and returns an array with each line
function readFile() {
    return new Promise((fulfill, reject) => {
        let result = [];
        let input = fs.createReadStream(path);
        let lineReader = readline.createInterface({
            input: input
        });
        lineReader.on('line', function (line) {
            result.push(line.trim())
        });
        input.on('end', function () {
            lineReader.close();
            fulfill(result)
        });
    });
}
