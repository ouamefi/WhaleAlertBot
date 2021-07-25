const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
//const keepAlive = require("./server/server"); //workaround to keep the bot running on replit
const ethers = require('ethers');
const Discord = require('discord.js');

const provider = new ethers.providers.WebSocketProvider(process.env.WS_URL);
const auguryMcAbi = loadObjectsFromJsonFile("./abi/AuguryMcAbi.json");
const ironAbi = loadObjectsFromJsonFile("./abi/IronMcAbi.json");
const platforms = loadObjectsFromJsonFile('./data/platforms.json');

//Discord bot
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN);

function loadObjectsFromJsonFile(path) {
    try {
        return JSON.parse(fs.readFileSync(path));
    } catch (err) {
        console.log(err)
    }
}

function formatAmount(amount) {
    //Divide by 10**18, round to 4 decimals and add commas (10000 -> 10,000)
    let amnt = ethers.utils.formatUnits(amount, 18);
    return parseFloat(amnt).toFixed(4).toString().replace(/\B(?=(?=\d*\.)(\d{3})+(?!\d))/g, ',');
}

function listenToPools() {
    console.log("Started!");
    console.log("Monitoring pools: ");

    for (platform of platforms) {
        console.log(`-> ${platform.name}: ${platform.pools.map(p => p.name).join(', ')}`);

        listenToContractPools(platform.mc_address);
    }
}

function toLink(address) {
    return `<https://apeboard.finance/dashboard/${address}>`; // <> are used to disable link preview
}

function listenToContractPools(mcContractAddress) {
    var mcContract = new ethers.Contract(mcContractAddress, auguryMcAbi, provider);
    const ironMcAddress = "0x1fD1259Fa8CdC60c6E8C86cfA592CA1b8403DFaD";

    if (mcContractAddress === ironMcAddress) {
        mcContract = new ethers.Contract(mcContractAddress, ironAbi, provider);
    }
    
    //Unstaking event
    mcContract.on("Withdraw", (user, pid, amount) => {
        const platformMCAddress = mcContract.address;
        const pool = getPoolIfExists(pid, platformMCAddress);
        const whale = getWhaleIfExists(user);

        if (pool != null && amount.gte(ethers.utils.parseUnits(''+pool.alert_amount))) {
            let message = '';
            if (whale != null) {
                console.log(`[${getCurrentDateTime()}] ${user} (${whale.name}) unstaked ${formatAmount(amount)} from ${pool.name} pool`);

                message = new Discord.MessageEmbed().setDescription(`[${user}](${toLink(user)}) (${whale.name}) unstaked **${formatAmount(amount)}** from **${pool.name}** pool`);
            }
            else {
                console.log(`[${getCurrentDateTime()}] ${user} unstaked ${formatAmount(amount)} from ${pool.name.toString()} pool`);
                
                message = new Discord.MessageEmbed().setDescription(`[${user}](${toLink(user)}) unstaked **${formatAmount(amount)}** from **${pool.name}** pool`);
            }

            postOnDiscordChannel(message, '🐳whale-watching');
        }
    });

    //Staking event
    mcContract.on("Deposit", (user, pid, amount) => {
        const platformMCAddress = mcContract.address;
        const pool = getPoolIfExists(pid, platformMCAddress);
        const whale = getWhaleIfExists(user);

        if (pool != null && amount.gte(ethers.utils.parseUnits(''+pool.alert_amount))) {
            let message = '';
            if (whale != null) {
                console.log(`[${getCurrentDateTime()}] ${user} (${whale.name}) staked ${formatAmount(amount)} in ${pool.name} pool`);

                message = new Discord.MessageEmbed().setDescription(`[${user}](${toLink(user)}) (${whale.name}) staked **${formatAmount(amount)}** in **${pool.name}** pool`);
            }
            else {
                console.log(`[${getCurrentDateTime()}] ${user} staked ${formatAmount(amount)} in ${pool.name} pool`);

                message = new Discord.MessageEmbed().setDescription(`[${user}](${toLink(user)}) staked **${formatAmount(amount)}** in **${pool.name}** pool`);
            }

            postOnDiscordChannel(message, '🐳whale-watching');
        }
    });

    //Harvesting event (IronFinance)
    if (mcContractAddress === ironMcAddress) {
        mcContract.on("Harvest", (user, pid, amount) => {
            const platformMCAddress = mcContract.address;
            const pool = getPoolIfExists(pid, platformMCAddress);
            const whale = getWhaleIfExists(user);
    
            if (pool != null && amount.gte(ethers.utils.parseUnits(''+pool.harvest_alert_amount))) {
                if (whale != null) {
                    console.log(`[${getCurrentDateTime()}] ${user} (${whale.name}) harvested ${formatAmount(amount)} from ${pool.name}`);
                    
                    message = new Discord.MessageEmbed().setDescription(`[${user}](${toLink(user)}) harvested **${formatAmount(amount)}** ICE from **${pool.name}** pool`);
                }
                else {
                    console.log(`[${getCurrentDateTime()}] ${user} harvested ${formatAmount(amount)} from ${pool.name}`);
                    
                    message = new Discord.MessageEmbed().setDescription(`[${user}](${toLink(user)}) harvested **${formatAmount(amount)}** ICE from **${pool.name}** pool`);
                }

                postOnDiscordChannel(message, '🐳whale-watching');
            }
        });
    }
}

function getWhaleIfExists(address) {
    const whales = loadObjectsFromJsonFile('./data/whales.json');

    for (whale of whales) {
        if (whale.address.toString() === address.toString()) {
            return whale;
        }
    }

    return null;
}

function getPoolIfExists(pid, platformMCAddress) {
    const platforms = loadObjectsFromJsonFile('./data/platforms.json');

    for (platform of platforms) {
        for (pool of platform.pools) {
            if (platform.mc_address === platformMCAddress && pool.id.toString() === pid.toString()) {
                return pool;
            }
        }
    }

    return null;
}

function getCurrentDateTime() {
    let date_ob = new Date();

    let day = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);

    return day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
}

function postOnDiscordChannel(message, channelName) {
  channel = client.channels.cache.find(ch => ch.name === channelName);

  if (!channel) {
      console.log("Channel not found!");
      return;
  }

  channel.send(message);
}

// keepAlive(); // For replit, not needed if you run the bot on your own computer/server

listenToPools();

