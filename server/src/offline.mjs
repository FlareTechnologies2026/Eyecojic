// Offline mode: answers straight from kb/ with no model. Used when ANTHROPIC_API_KEY is missing
// or Claude is unreachable. Yields the same events as streamChat: { type:'text' } and { type:'tool' }.
import { expandQuery, tokenize } from './bm25.mjs'

const REACTION = /\b(burn(ing|s|ed)?|sting(ing|s)?|itch(y|ing)?|rash|redness|red|swell(ing|ed)?|swollen|irritat\w*|allerg\w*|reaction|pain|painful|infect\w*|watery|blur\w*)\b/i
const MEDICAL = /\b(pregnan\w*|breastfeed\w*|nursing|medicat\w*|prescription|disease|eczema|psoriasis|glaucoma|surgery|diagnos\w*|doctor|dermatologist)\b/i
const HUMAN = /\b(human|person|agent|representative|someone|team|talk to|speak to|call me|complain\w*)\b/i
const ORDER = /\b(order|tracking|track|payment|paid|invoice|my parcel|my package)\b/i
const COMPARE = /\b(better than|versus|vs\.?|compare|compared|alternative to|garnier|olay|loreal|l'oreal|neutrogena|nivea|clinique|ordinary|minimalist|dot ?& ?key|mamaearth|plum)\b/i
const GREETING = /^\s*(hi|hello|hey|hii+|namaste|good (morning|afternoon|evening))\b[\s!.?]*$/i
const THANKS = /^\s*(thanks|thank you|thx|ok(ay)?|great|cool)\b[\s!.?]*$/i

const MIN_SCORE = 1.2

function* pieces(text) {
  for (const w of text.split(/(\s+)/)) if (w) yield { type: 'text', text: w }
}

export function planOffline(query, retriever) {
  const q = String(query)
  if (GREETING.test(q))
    return { text: "Hi, I'm Minerva, the virtual assistant for Eyecojic. Ask me about ingredients, how to use the gel, delivery or returns." }
  if (THANKS.test(q)) return { text: "You're welcome! Ask me anything else about Eyecojic whenever you like." }

  if (REACTION.test(q) && /\b(eye|eyes|skin|face|under|used|using|applied|after)\b/i.test(q))
    return {
      text:
        'I am sorry to hear that. Please stop using the product, rinse the area gently with water, and see a doctor if it continues. I cannot say what caused it, but our team would like to follow up. You can share your details with them below.',
      handoff: { reason: 'Customer reports a skin or eye reaction after use.', category: 'reaction' },
    }
  if (MEDICAL.test(q))
    return {
      text:
        'I am a virtual assistant and cannot give medical advice. Please ask your doctor about this. Our team can also take a note if you would like to share your question.',
      handoff: { reason: 'Customer asked a medical question.', category: 'medical' },
    }
  if (COMPARE.test(q))
    return {
      text: 'I can only speak about Eyecojic Under Eye Gel, so I am not able to compare it with other products. I am happy to explain what is in it and how to use it.',
    }
  if (HUMAN.test(q)) {
    const c = retriever.search('contact email phone', 1)[0]
    return {
      text: `Of course. ${c ? c.chunk.text : 'You can email info@eyecojic.com.'} You can also leave your details below and the team will reply by email.`,
      handoff: { reason: 'Customer asked to speak with the team.', category: 'requested_human' },
    }
  }

  const hits = retriever.search(q, 2)
  if (ORDER.test(q) && !(hits[0] && /policies#shipping|policies#returns/.test(hits[0].chunk.id)))
    return {
      text: 'I cannot see or track individual orders. Our team can help with order or payment questions, so please leave your details below.',
      handoff: { reason: 'Customer has an order or payment question.', category: 'order' },
    }
  if (!hits.length || hits[0].score < MIN_SCORE)
    return {
      text: 'I do not have that information. Our team can answer it, so please leave your details below and they will reply by email.',
      handoff: { reason: `Customer asked: ${q.slice(0, 160)}`, category: 'unanswered' },
    }
  // Add a second chunk only when the question names its heading (e.g. "delivery & returns").
  const parts = [hits[0].chunk.text]
  if (hits[1] && hits[1].score >= hits[0].score * 0.4) {
    const qt = new Set(tokenize(expandQuery(q)))
    if (tokenize(hits[1].chunk.heading).some((t) => qt.has(t))) parts.push(hits[1].chunk.text)
  }
  return { text: parts.join('\n\n') }
}

export async function* offlineChat({ messages, retriever }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const plan = planOffline(lastUser?.content ?? '', retriever)
  yield* pieces(plan.text)
  if (plan.handoff) yield { type: 'tool', name: 'offer_human_handoff', input: plan.handoff }
}
