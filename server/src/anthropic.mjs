// Streams from the Claude Messages API with plain fetch (no SDK).
// Yields { type: 'text', text } and { type: 'tool', name, input }.
// ANTHROPIC_API_URL is only for pointing tests at a local mock.
const API = process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages'

export async function* streamChat({ apiKey, model, system, messages, tools, signal, maxTokens = 600 }) {
  const res = await fetch(API, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      tools,
      stream: true,
    }),
  })
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 300)}`)
  }

  const decoder = new TextDecoder()
  let buf = ''
  let tool = null // { name, json }
  for await (const part of res.body) {
    buf += decoder.decode(part, { stream: true })
    let idx
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      const data = frame
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('')
      if (!data) continue
      let ev
      try {
        ev = JSON.parse(data)
      } catch {
        continue
      }
      if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') {
        tool = { name: ev.content_block.name, json: '' }
      } else if (ev.type === 'content_block_delta') {
        if (ev.delta?.type === 'text_delta') yield { type: 'text', text: ev.delta.text }
        else if (ev.delta?.type === 'input_json_delta' && tool) tool.json += ev.delta.partial_json
      } else if (ev.type === 'content_block_stop' && tool) {
        let input = {}
        try {
          input = tool.json ? JSON.parse(tool.json) : {}
        } catch {
          /* leave empty */
        }
        yield { type: 'tool', name: tool.name, input }
        tool = null
      } else if (ev.type === 'error') {
        throw new Error(ev.error?.message ?? 'Anthropic stream error')
      }
    }
  }
}
