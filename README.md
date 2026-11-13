# Flat Signal

Attention market on Robinhood Chain. Burn $WIF to boost signals.

---

### Fix “Invalid App Configuration” (required)

This error is from **WalletConnect / Reown**, not from our code.

1. Open **https://dashboard.reown.com** (or cloud.walletconnect.com)
2. Create a project (or open yours) → copy the **Project ID**
3. Under project settings → **Domains / Allowlist**, add:
   - `0flatsignal.vercel.app`
   - `*.vercel.app`
   - `localhost` (for local dev)
4. In **Vercel** → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_WC_PROJECT_ID=your_real_project_id_here
```

5. **Redeploy** after saving the env var (Production + Preview)
6. Wait ~5–15 minutes for allowlist to propagate, then hard-refresh the app

If the domain is not allowlisted, WalletConnect always shows **Invalid App Configuration**.

---

### Features

- Create signals (wallet required)
- Delete your own signals
- Boost by burning real $WIF (10 / 50 / 100)
- Click Boost without wallet → opens connect modal
- Share a **specific signal** (deep link `?s=id`)
- Filters, stats, light/dark mode

---

### Chain

- Robinhood Chain `4663`
- $WIF `0x5173b8ea6923c2d40267890d45c46a3480954773`
- Burn `0x000000000000000000000000000000000000dEaD`

---

### Local

```bash
npm install
echo "NEXT_PUBLIC_WC_PROJECT_ID=your_id" > .env.local
npm run dev
```

https://github.com/onchaindc/flat-signal
