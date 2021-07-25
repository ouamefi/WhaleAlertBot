# Whale Alert Bot

## Intro
This bot listens to events coming from a given masterchef contract then publishes them on discord (+ logs them in the console).

## Set up
You'll need a `.env` file with these two keys:
```
BOT_TOKEN = "Bot token from Discord"
WS_URL = "Provider URL, like wss://your-provider"
```

## Run
`npm install` then `npm start`

## How it works
It iterates through the platforms in `platforms.json` and listens to events such as *Withdraw*, *Deposit*, *Harvest*, etc.

It then posts on the given discord channel and logs in the console if the amount is above `alert_amount` for pool tokens and `harvest_alert_amount` for rewards.

If the address is a known whale (is in `whales.json`) then it also logs the `name` that's associated with it.

## Limitations
This version only works with AuguryFinance and IronFinance's masterchef contracts.

## Todo
Next version should make it easier to add support for a new platform without having to tweak the code.
