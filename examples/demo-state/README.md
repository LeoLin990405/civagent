# demo-state — sample fixtures for demo mode

Everything under this directory is **hand-written sample data**, not the output of a model run.
It mirrors the on-disk layout of `~/.civagent/` (tournaments/, matches/) so that
`frontend/scripts/build-demo-fixtures.mjs` can run the *real* server routes against it and
snapshot their JSON responses into `frontend/src/demo/fixtures.json`.

Every record carries `demo: true`, the backend id `demo-fixture`, and a `【示例数据】`/`[DEMO]` prefix
in its text so it can never be mistaken for a real run.
