# Whale Alert Bot
This bot listens to events coming from a given masterchef contract then publishes them on discord (+ logs them).

It is currently monitoring *staking* and *unstaking* events from Omen pools: OMEN, OMEN-USDC, OMEN-WETH, and OMEN-WMATIC.

# How it works
It iterates through the platforms in `platforms.json` and listens to *Withdraw* and *Deposit* events.

It then logs to the console if the amount is above `alert_amount`.

If the address is a known whale (is in `whales.json`) then it also prints the `name` that's associated with it.
