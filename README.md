# Mixedbread Labs

Try Mixedbread without signing up. Every result is a link anyone can open.

- **Parse**: pick the mode, format and element types, then drop a document. Inspect what the parser read: every element boxed on its page beside a filterable list, the text as it renders or as written, and the raw JSON. Parse the same file again with other options to compare.
- **Chat**: add up to 10 files to make a chat, a Mixedbread store. Search it, or ask questions: GPT-5.6 Terra answers through the Vercel AI Gateway with Toast 1, Mixedbread's agentic search, as its one tool, and cites the elements of the pages it read.

The sidebar lists the parses and chats this browser opened; there are no accounts.

Uploads go from the browser straight to storage through presigned links, so no upload passes through the app's functions.

## Run it

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Set `MXBAI_API_KEY` and `AI_GATEWAY_API_KEY` in `.env.local`, then open http://localhost:3010.

## Deploy

On Vercel, set `MXBAI_API_KEY`; the AI Gateway authenticates through the deployment's OIDC token. The key should belong to an organization used only by Labs: every store and parsing job it can reach is open to anyone with its link. `vercel.json` keeps the functions in `iad1`, next to the API, and BotID guards the routes the page calls (not file and page image loads, which can't carry its headers).

Everyone shares the one key, so cap what a visitor can spend before opening Labs up:

- Set a spend limit on the Labs organization. The API stops serving it once the limit is reached.
- Add Vercel Firewall rate limit rules per IP on `/api/*`, tighter on `/api/uploads`, `/api/parse` and `/api/chats/*/chat`.

The API keeps parse results and uploaded files for 7 days, and a chat until 30 days after its last use.
