For deployment,

- create a KV namespace to be used as HID_KV: `wrangler kv:namespace create NOTES_KV`

- copy or rename `wrangler.toml.example` -> `wrangler.toml` and fill in the marked fields there

- add secrets as described in `wrangler.toml`

- deploy using `npx wrangler deploy`