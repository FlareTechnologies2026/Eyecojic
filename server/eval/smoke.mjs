// No-key smoke test against a running server: node eval/smoke.mjs [baseUrl]
// Default base URL is http://localhost:8787. Walks the main flows and exits non-zero on any failure.
const base = (process.argv[2] || process.env.SMOKE_URL || 'http://localhost:8787').replace(/\/$/, '')

async function turn(body) {
  const r = await fetch(`${base}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${JSON.stringify(body)}`)
  return r.json()
}

const checks = []
const check = (name, ok) => checks.push({ name, ok: Boolean(ok) })

const health = await (await fetch(`${base}/api/health`)).json()
check('health ok, intent mode', health.ok && health.mode === 'intent')

const hi = await turn({ text: 'hi' })
check('greeting -> welcome with Yes/No', hi.state.intent === 'welcome' && hi.buttons.map((b) => b.label).join() === 'Yes,No')
const menu = await turn({ button: 'main_menu', state: hi.state })
check('main menu buttons', menu.buttons.map((b) => b.label).join() === 'About Us,Product,Buy,Contact Us')
const ask = await turn({ button: 'get_recommendations', state: menu.state })
check('recommendation asks for skin tone', ask.state.slot === 'skin_tone')
const bad = await turn({ text: 'purple', state: ask.state })
check('bad slot answer re-prompts', bad.state.slot === 'skin_tone')
const rec = await turn({ text: 'Medium', state: bad.state })
check('slot filled -> recommendation', rec.state.intent === 'recommendation')
const react = await turn({ text: 'my eyes are burning', state: rec.state })
check('reaction -> handoff', react.handoff?.category === 'reaction')
const gap = await turn({ text: 'what is the shelf life?' })
check('known gap -> unanswered handoff', gap.handoff?.category === 'unanswered')

for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.name}`)
process.exit(checks.every((c) => c.ok) ? 0 : 1)
