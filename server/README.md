# Eyecojic chat server

Small Node backend (>= 20.12) for the website chat widget. The only dependency is `nodemailer`.

## How it works

1. The widget (`src/components/ChatWidget.tsx`) POSTs the conversation to `/api/chat`.
2. `src/bm25.mjs` retrieves the top 4 chunks from `kb/*.md` (one chunk per `##` section).
   The pinned chunk (`type: pinned`, safety) and the known-gaps chunk (`type: gaps`) are always added.
3. `src/prompt.mjs` builds the system prompt: answer only from context, no cure/treat/guarantee wording,
   no brand comparisons, no medical advice, always hand off on a skin or eye reaction.
4. `src/anthropic.mjs` streams the Claude reply over SSE. The `offer_human_handoff` tool call becomes a
   `handoff` event that opens the contact form in the widget.
5. `POST /api/escalate` validates the form, appends it to `data/escalations.jsonl`, then emails the team
   (`src/escalate.mjs`) with the customer's address as reply-to. If SMTP is not configured it returns 503
   instead of pretending the message was sent.

`GET /api/health` returns `{ ok, chunks, anthropicConfigured, emailConfigured }`.

## Run locally

```bash
cd server
npm install
cp .env.example .env   # then fill in ANTHROPIC_API_KEY and SMTP_*
npm start              # :8787
```

In the project root run `npm run dev`. Vite proxies `/api` to `localhost:8787`.

## Checks

```bash
npm test           # unit tests
npm run eval       # retrieval hit@4 over eval/questions.json (fails under 90%)
npm run smoke      # live Claude answers, flags risky wording (needs ANTHROPIC_API_KEY)
```

`smoke` flags cure/treat wording, "guarantee", other brand names and a missing handoff on reactions.
Whether an answer invents a fact not in `kb/` has to be checked by reading it.

## Production

- Build the site with `VITE_CHAT_API_URL=https://<chat-server-origin> npm run build`. This is a URL, never a key.
- Set `ALLOWED_ORIGINS` to the real site origin(s), comma separated. Requests from other browser origins get 403.
- Set `TRUST_PROXY=1` behind a reverse proxy so rate limits use `X-Forwarded-For`.
- Confirm `/api/health` shows `emailConfigured: true`.
- `ANTHROPIC_API_KEY` and `SMTP_*` stay in `server/.env` or the host's secret store. Never in client code or `VITE_*`.
- `ANTHROPIC_API_URL` exists only to point tests at a mock.

## Knowledge base rules

Facts come only from `kb/`. Each file starts with `type: normal | pinned | gaps` front matter.
A chunk is a `## Heading`, an optional `keywords:` line, then text. Anything the site does not state goes in
`kb/known-gaps.md`, not into an answer.

## Planned: embeddings (not built)

A second retriever with the same `search(query, k) -> [{ chunk, score }]` interface as `Bm25Retriever`,
fused with BM25 by reciprocal rank fusion, falling back to BM25 alone on any embedding failure.
`buildContext(retriever, chunks, query)` is the single place to swap it in. Ingestion would live in
`scripts/embed-kb.mjs`, hashing each chunk so only changed chunks are re-embedded.
