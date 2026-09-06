# Real AI integration

Dahlia now calls OpenAI Responses with strict structured outputs for prompt extraction and for selecting sourced places. There is no keyword-only fallback when AI fails. The visible form remains editable; **Fill details with AI** extracts a description, batches clarification questions, and lets the traveler review before **Build my trip**. Revisions use the same interpretation flow; review and rebuild to apply them.

## Activation

In Vercel project Settings → Environment Variables, set `OPENAI_API_KEY` to your own server-side OpenAI API key, and optionally `OPENAI_MODEL` (default `gpt-4.1-mini`). Enable it for the deployment environments you intend to use and redeploy. Never use a public/VITE/NEXT_PUBLIC prefix or commit the key. API billing is separate from a ChatGPT subscription. Locally configure the key in the server environment. `.env.example` contains names only.

No key was present in the implementation workspace, so live model quality and provider access have not been verified. The application reports an explicit configuration error without a key.

## Boundaries

- One city, 1–7 days, 1–12 travelers. Unsupported or ambiguous requests should receive clarification.
- Traveler text, current trip fields and sourced candidate descriptions are sent to OpenAI with `store: false`. Avoid entering sensitive personal information.
- Model-selected IDs are checked against actual retrieved places; coordinates, source links, photos and route calculations remain provider-backed.
- Budgets are allowances, not live quotes. No flight/hotel inventory, checkout, verified accessibility or guaranteed opening hours. “Cheaper” no longer fabricates savings.
- Before broad public rollout, configure deployment-level rate limiting/authentication and provider spending limits. The MVP endpoints are not authenticated; API usage incurs costs.

## Comparison researched

[Layla](https://layla.ai/) publicly describes conversational refinement, personalized itineraries and booking capabilities. This implementation addresses conversational extraction and sourced recommendation selection, not booking-inventory parity. Integration format follows [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
