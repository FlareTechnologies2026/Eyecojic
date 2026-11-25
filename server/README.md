# Minerva chat server

Small Node backend (>= 20.12) for Minerva, the virtual assistant on the Eyecojic website (`/minerva`).
Minerva is a deterministic intent-and-slot bot: no LLM, no retrieval, no API keys. The only dependency is
`nodemailer`, for the handoff email. Chat text is never sent to a third-party service.

## How it works

1. The Minerva page (`src/pages/Minerva.tsx`, state in `src/context/MinervaProvider.tsx`) POSTs one turn to `/api/chat`:
   `{ text?, button?, state? }`. `button` is a button `value` and wins over `text`. `state` is whatever the
   previous reply returned; the server keeps no session.
2. `src/dialog.mjs` resolves the turn against `data/intents.json`, in this order:
   1. a button value (exact intent id, or `slot=value`);
   2. safety rules (skin/eye reaction, medical, order/payment, asks for a human): these always win, even mid-slot;
   3. a pending slot: the text must match one of its values (labels or synonyms), otherwise the slot's
      invalid-input message and the same buttons come back;
   4. comparison decline, known gaps (go to `fallback`), greetings (`welcome`), thanks;
   5. a typed label of a button on screen ("yes", "about us");
   6. keyword scoring over each intent's `utterances` (ties go to the current intent);
   7. otherwise `fallback`, which offers the handoff with category `unanswered`.
3. The reply is `{ messages: [{ text }], buttons: [{ label, value }], handoff?: { reason, category }, state }`.
   A `handoff` makes the page show "Contact our team", which opens the contact form.
4. `POST /api/escalate` validates the form, appends it to `data/escalations.jsonl` (`/tmp` on Vercel), then emails
   the team (`src/escalate.mjs`) with the customer's address as reply-to. If SMTP is not configured it returns 503
   instead of pretending the message was sent. `consent: true` is required; a non-empty `website` field is a
   honeypot and gets a silent success.

`GET /api/health` returns `{ ok, intents, mode: 'intent', emailConfigured }`.

## Editing replies and flows

Everything lives in `data/intents.json`:

- `intents`: `replies` (strings; `@other_intent` includes another intent's replies), `buttons` (an intent id, or
  `{ label, value }` to override the label), `utterances` (keyword phrases for scoring), optional `handoff`
  (`{ category, reason }`, `{text}` is replaced by the customer's message) and optional `slot`.
- `buttons`: default labels for intent ids used as buttons.
- `slots`: `prompt`, `values` (`value`, `label`, `synonyms`), extra `buttons`, `invalid` message and the `next`
  intent. A new slot needs no code: add it here and point an intent's `slot` at it. Replies can use `{slot_name}`.
- `rules`: ordered regex rules (`all` must match, `none` must not) for safety, comparisons, known gaps, greetings.
- `synonyms`: token rewrites for Hinglish and common typos (best effort).

`data/eyecojic_tina_flow_map.json` is the reference capture of the previous bot (Tina). Its flow and button names are
followed; its product claims are not (see content rules).

## Content rules

- Facts come from the former knowledge base wording only. Unknowns (full ingredient list, shelf life, discounts,
  international shipping, other products, ...) route to `fallback` and the handoff, never a guess.
- Never cure/treat/heal/guarantee wording, no brand comparisons, no medical advice. A test scans every reply.
- Reactions always reply "stop using, rinse gently, see a doctor if it continues" and always hand off.
- Personal details are collected only by the handoff form, never in chat.

## Run locally

```bash
cd server
npm install
cp .env.example .env   # only SMTP_* are needed, and only for handoff email
npm start              # :8787
```

In the project root run `npm run dev`. Vite proxies `/api` to `localhost:8787`.

## Checks

```bash
npm test           # unit + API contract tests
npm run eval       # intent routing accuracy over eval/questions.json (fails under 95%)
npm run smoke      # walks the main flows against a running server (default http://localhost:8787)
```

## Production (Vercel)

- `api/chat.mjs`, `api/escalate.mjs` and `api/health.mjs` re-export the handler from `src/index.mjs`;
  `vercel.json` bundles `server/{data,src}/**` with them. Site and API share one origin, so no `VITE_CHAT_API_URL`.
- For a separate API host, build with `VITE_CHAT_API_URL=https://<chat-server-origin>` and set `ALLOWED_ORIGINS`.
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` and `ESCALATION_TO` so handoffs
  reach email, and confirm `/api/health` shows `emailConfigured: true`. On Vercel only `/tmp` is writable, so without
  SMTP an escalation is effectively lost.
- Rate limits are in memory per instance; add a Vercel Firewall rule on `/api/chat` for a firm cap.
