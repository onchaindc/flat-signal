# Flat Signal

**Attention market on Robinhood Chain.**

Burn $WIF to boost signals. Highest burn ranks first.

No likes. No algorithms. Real capital that disappears.

---

### Features

- Create signals (Stock Token, Project, Idea, Builder, Infra)
- Boost by burning real $WIF on Robinhood Chain
- Ranked board by total burned
- Filter by type
- Adjustable boost size (10 / 50 / 100 $WIF)
- Live $WIF balance
- Share link
- Signals persist in your browser (localStorage)

---

### Wallet connection (important)

RainbowKit needs a **WalletConnect Cloud project ID**.

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a free project → copy the Project ID
3. In **Vercel** → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id_here
```

4. Redeploy

Without this, you will see “invalid config” when connecting.

---

### Chain

- Robinhood Chain · ID `4663`
- $WIF `0x5173b8ea6923c2d40267890d45c46a3480954773`
- Burns go to `0x000000000000000000000000000000000000dEaD`

---

### Local

```bash
npm install
npm run dev
```

Optional: create `.env.local` with `NEXT_PUBLIC_WC_PROJECT_ID=...`

---

### Built for World is Flat Hackathon

Ownership is not only about holding an asset — it is also about having a voice.

https://github.com/onchaindc/flat-signal
