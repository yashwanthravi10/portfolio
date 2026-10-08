// ============================================================================
//  /api/chat.js   —   LLM backend for "Yashwanth's AI" (portfolio chatbot)
//  Vercel Serverless Function (Node.js).
//
//  PROVIDERS (first one with a key configured wins):
//    1. Google Gemini   — env var GEMINI_API_KEY   (free: https://aistudio.google.com/apikey)
//    2. Groq            — env var GROQ_API_KEY     (free: https://console.groq.com/keys)
//
//  SETUP:
//    Vercel → Settings → Environment Variables → add the key, tick ALL
//    environments (Production, Preview, Development) → then REDEPLOY.
//    Existing deployments do NOT pick up newly added variables.
//
//  DIAGNOSTICS:
//    Open  /api/chat?health=1  in a browser. It reports which provider and
//    model are live, lists every model the key can reach, and explains any
//    failure — without ever exposing the key.
//
//  WHY MODELS ARE DISCOVERED AT RUNTIME:
//    This chatbot previously broke silently because a hardcoded model
//    (llama-3.3-70b-versatile) was decommissioned and every request 404'd.
//    Both providers below now list their available models and pick the best
//    one, so a deprecation degrades gracefully instead of going dead quiet.
// ============================================================================

const SYSTEM_PROMPT = `You are "Yashwanth's AI" — the assistant embedded on Yashwanth Ravi's personal portfolio website. Answer visitors' questions about Yashwanth accurately, in a warm, professional tone, and concisely (usually 1-4 sentences). Use ONLY the facts below. If you don't know something or it's unrelated to Yashwanth, say so briefly and steer back to his work. Never invent facts, employers, dates, or numbers. You may use **bold** for emphasis.

=== PROFILE ===
Yashwanth Ravi — Staff Product Manager, Applied AI (~7 years experience), based in Bengaluru, India. Focus: agentic AI, enterprise platforms, 0-to-1 growth and customer acquisition across consumer (B2C) and enterprise (B2B). Combines rigorous experimentation and unit-economics thinking with hands-on technical depth from a Master's in AI/ML.

=== CURRENT ROLE ===
Staff Product Manager, Applied AI at QAD Redzone, Aug 2026-present. He owns product direction for Champion AI — QAD's agentic AI platform for supply chain, where autonomous "persona agents" work a function end to end inside enterprise ERP workflows (Procurement, Sourcing, Sales and Trade Compliance). He set the trust and autonomy model governing when an agent may act alone, when a human approves, and what evidence every action must leave behind — now the standard every Champion is built against. He also shifted the delivery model from services to product with Self-Serve Automations, and owns build/buy/integrate judgment across the AI and ERP stack.

=== PREVIOUS ROLES ===
Senior Product Manager at SimStar (Stargems Group), Jul 2024-Oct 2026. A diamond & jewelry enterprise; he built a 0-to-1 digital platform across Hong Kong, India, USA & Dubai. Shipped 9 products across 4 countries, cut manual effort ~40%, delivered 2 production AI systems, and led 2 PMs plus engineering, design, QA, data and vendors.

Product Manager, Growth & Acquisition at Magicbricks (Times Internet), Jun 2019-Jun 2024. Built a PG/Co-living vertical from 0-to-1 to 20M+ monthly users and 1.5M+ listings. Lifted checkout conversion ~9%->~11% (about +22%, an estimated +$1.25M/year), achieved >80% subscription renewal, cut CAC ~20%, and reached NPS >8.5.

=== AI / ML WORK ===
At QAD Redzone (agentic AI): autonomous persona agents that read the ERP system of record, act in the outside world (supplier email, portals, compliance screening), interpret what comes back and write results back to the ERP. The product problem is not generation but knowing when to stop and ask a human — hence a graduated-autonomy model (preview on real data -> validation gates -> supervised runs -> unattended), with every action audited and reversible. Stack includes AWS Bedrock, LLM tool/function calling, an LLM gateway, and QAD ERP (Enterprise Edition & Adaptive UX).

At SimStar, two production AI systems: (1) A predictive PRICING ENGINE — classical ML (regression), shadow-mode validated against human pricers, ~90%+ accuracy (MAPE ~8-10%), removed 100% of manual pricing, prices ~8,000+ stones/quarter, days->seconds. (2) A hybrid AI SUPPORT ASSISTANT — LLM + RAG on WhatsApp with a confidence-gated human hand-off; uses GPT-4o / GPT-4o-mini, text-embedding-3-small, and pgvector; deflection ~20%->~50-60%, ~92% answer correctness, ~95% hand-off recall, NPS >9. He evaluates models rigorously with MAPE, precision, recall, F1, deflection and answer-correctness. Completing an M.S. in AI & ML at IIT Kanpur.

=== PROJECTS ===
QAD Redzone: Procurement Champion (first live autonomous purchasing agent), Sourcing Champion (RFQ), Sales Champion (AOG/expedite alerting), Trade Compliance Agent, Self-Serve Automations, and the Agent Trust & Autonomy Framework.
SimStar: Odoo ERP core, simstar.co website, AI pricing engine, LLM+RAG WhatsApp assistant, video dashboard, RapNet marketplace sync, offer management workflow, pair-stone matching algorithm, Diamond Digital Passport.
Magicbricks: checkout CRO programme, subscription MVP, acquisition engine.

=== EDUCATION ===
M.S., Artificial Intelligence & Machine Learning — IIT Kanpur (Indian Institute of Technology), 2024-2026, CGPA 8.63/10.
PGDM — IIM Rohtak (Indian Institute of Management), 2022-2024, CGPA 5.56/10.
B.Tech, Electrical & Electronics Engineering — Reva University, Bengaluru, 2016-2020, CGPA 7.49/10.

=== CERTIFICATIONS ===
Scrum Master (CareerNinja, 2023); Lean Six Sigma - White Belt (AIGPE, 2024); Leadership Skills (IIM Ahmedabad via Coursera, 2026); plus six LinkedIn Learning courses in customer experience.

=== SKILLS ===
Agentic AI product strategy, AI governance & autonomy design, AI/LLM product management, RAG, tool/function calling, AI guardrails & human-in-the-loop, model evaluation, build/buy/integrate strategy, platform & API productisation, product strategy & roadmap, customer acquisition (SEM/PPC, SEO), A/B & multivariate testing, checkout/landing CRO, unit economics (CAC/LTV/CVR/ROAS), 0-to-1 & MVP development, RICE/ICE/WSJF prioritisation, SQL, Mixpanel, Metabase, GCP, cross-functional leadership, influence without authority, stakeholder management, Agile.

=== TOOLS HE USES ===
QAD ERP (Enterprise Edition & Adaptive UX), AWS Bedrock, Auth0/SSO, Microsoft Fabric, iPaaS & integration platforms, Jira, Confluence, Linear, Asana, Trello, Notion, Figma, Miro, Slack, Amplitude, Mixpanel, Google Analytics, Tableau, Salesforce, HubSpot, GitHub, Postman, PostgreSQL, Odoo ERP, Whimsical, SQL, Metabase, Google Cloud.

=== BEYOND WORK ===
Recommended for the Indian Armed Forces three times via the SSB (Services Selection Board): All-India Rank 1 for the Indian Army (Technical entry), recommended again at AIR 17, and AIR 3 for the Indian Coast Guard. The SSB is a demanding 5-day officer-selection process assessing 15 Officer-Like Qualities. Competitive footballer: represented national level in Class 10, played KSFA (Karnataka State Football Association) divisions A-D and leagues TAL/NBL, for clubs Spartans FC, Bangalore City FC and Football Academy of Bangalore. Volunteers with the Indian Red Cross Youth Wing and served as a COVID warrior.

=== CONTACT ===
Email yashwanthgangur@gmail.com, LinkedIn linkedin.com/in/yashwanth-ravi. There is also a "Get in touch" form on the site. Do not provide a phone number — he is reachable by email, LinkedIn or the contact form only. He is open to senior product roles and interesting conversations.`;

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Warm-lambda cache so we don't list models on every request.
let modelCache = { provider: null, model: null, at: 0 };
const CACHE_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
//  Gemini
// ---------------------------------------------------------------------------

// Higher score wins. Favours newest stable Flash: best quality-per-free-quota
// for a site chatbot (Pro has a far lower daily cap on the free tier).
function scoreGemini(id) {
  if (!/^gemini-/.test(id)) return -1;
  // Exclude non-chat and specialised variants.
  if (/embedding|aqa|image|vision-only|tts|audio|live|native-audio|computer-use|robotics|guard/.test(id)) return -1;
  const ver = parseFloat((id.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || '0');
  let s = ver * 100;                       // newer generation wins first
  if (/-flash/.test(id)) s += 40;          // Flash: high free quota, fast
  if (/-pro/.test(id)) s += 20;            // Pro: better, but ~100 req/day free
  if (/-lite/.test(id)) s -= 25;           // Lite: weaker answers
  if (/preview|exp/.test(id)) s -= 30;     // prefer stable
  if (/-\d{3,}$/.test(id)) s -= 5;         // prefer alias over dated snapshot
  return s;
}

async function listGeminiModels(key) {
  const r = await fetch(`${GEMINI_BASE}/models?key=${encodeURIComponent(key)}&pageSize=200`);
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  if (!r.ok) {
    return { ok: false, status: r.status, error: (json?.error?.message || text || '').slice(0, 250), ids: [] };
  }
  const ids = (json?.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => String(m.name || '').replace(/^models\//, ''));
  return { ok: true, status: 200, ids };
}

async function pickGeminiModel(key) {
  const list = await listGeminiModels(key);
  if (!list.ok) return { ok: false, status: list.status, error: list.error, ids: [] };
  const ranked = list.ids
    .map((id) => ({ id, score: scoreGemini(id) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return { ok: true, model: ranked[0]?.id || null, ids: list.ids, ranked: ranked.slice(0, 5) };
}

async function callGemini(key, model, message, history) {
  const contents = [];
  history.slice(-6).forEach((m) => {
    if (m && (m.role === 'user' || m.role === 'assistant') && m.content) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content).slice(0, 1500) }],
      });
    }
  });
  contents.push({ role: 'user', parts: [{ text: String(message).slice(0, 1000) }] });

  const r = await fetch(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const reply = parts.map((p) => p.text || '').join('').trim();
  return {
    ok: r.ok && Boolean(reply),
    status: r.status,
    reply: reply || null,
    error: (json?.error?.message || (r.ok ? 'empty reply' : text) || '').slice(0, 250),
    blocked: json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason || null,
  };
}

// ---------------------------------------------------------------------------
//  Groq (fallback provider)
// ---------------------------------------------------------------------------
const GROQ_PREFERRED = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

async function callGroq(key, model, message, history) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  history.slice(-6).forEach((m) => {
    if (m && (m.role === 'user' || m.role === 'assistant') && m.content) {
      messages.push({ role: m.role, content: String(m.content).slice(0, 1500) });
    }
  });
  messages.push({ role: 'user', content: String(message).slice(0, 1000) });

  const payload = { model, messages, temperature: 0.4, max_tokens: 800 };
  if (model.startsWith('openai/gpt-oss')) payload.reasoning_effort = 'low';

  const r = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  const reply = json?.choices?.[0]?.message?.content?.trim();
  return {
    ok: r.ok && Boolean(reply),
    status: r.status,
    reply: reply || null,
    error: (json?.error?.message || (r.ok ? 'empty reply' : text) || '').slice(0, 250),
  };
}

// ---------------------------------------------------------------------------
//  Health check — GET /api/chat?health=1
// ---------------------------------------------------------------------------
async function health(res) {
  const gem = process.env.GEMINI_API_KEY;
  const groq = process.env.GROQ_API_KEY;
  const out = {
    endpoint: 'ok',
    runtime: 'node ' + process.version,
    providers: {
      gemini: { keyPresent: Boolean(gem), keyLength: gem ? gem.length : 0, keyHasWhitespace: gem ? gem !== gem.trim() : false },
      groq: { keyPresent: Boolean(groq), keyLength: groq ? groq.length : 0, keyHasWhitespace: groq ? groq !== groq.trim() : false },
    },
  };

  if (gem) {
    const picked = await pickGeminiModel(gem.trim());
    if (!picked.ok) {
      out.providers.gemini.status = picked.status;
      out.providers.gemini.error = picked.error;
      out.providers.gemini.diagnosis =
        picked.status === 400 || picked.status === 403
          ? 'Google rejected the key. Check it was copied whole from aistudio.google.com/apikey, that the Generative Language API is enabled for that project, and that you redeployed after adding it.'
          : 'Could not list Gemini models — see error above.';
    } else {
      out.providers.gemini.chosenModel = picked.model;
      out.providers.gemini.topCandidates = picked.ranked;
      out.providers.gemini.availableModels = picked.ids;
      const t = await callGemini(gem.trim(), picked.model, 'Reply with the single word: ok', []);
      out.providers.gemini.testStatus = t.status;
      out.providers.gemini.testOk = t.ok;
      if (!t.ok) out.providers.gemini.error = t.error;
    }
  }

  if (groq) {
    const t = await callGroq(groq.trim(), GROQ_PREFERRED[0], 'Reply with the single word: ok', []);
    out.providers.groq.testStatus = t.status;
    out.providers.groq.testOk = t.ok;
    out.providers.groq.model = GROQ_PREFERRED[0];
    if (!t.ok) out.providers.groq.error = t.error;
  }

  if (out.providers.gemini.testOk) {
    out.activeProvider = 'gemini';
    out.activeModel = out.providers.gemini.chosenModel;
    out.diagnosis = 'Healthy — answering on Gemini (' + out.activeModel + ').';
  } else if (out.providers.groq.testOk) {
    out.activeProvider = 'groq';
    out.activeModel = GROQ_PREFERRED[0];
    out.diagnosis = gem
      ? 'Gemini is configured but not working (see providers.gemini.error); falling back to Groq (' + out.activeModel + ').'
      : 'Healthy — answering on Groq (' + out.activeModel + '). Add GEMINI_API_KEY to use Gemini instead.';
  } else {
    out.activeProvider = null;
    out.diagnosis = (gem || groq)
      ? 'No provider is working — the chatbot is serving built-in answers. See providers above for the exact error.'
      : 'No API key is configured on this deployment. Add GEMINI_API_KEY (or GROQ_API_KEY) in Vercel → Settings → Environment Variables, then REDEPLOY.';
  }
  return res.status(200).json(out);
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    if (url.searchParams.get('health') === '1') return health(res);
    return res.status(405).json({ error: 'Method not allowed. POST {message} here, or GET ?health=1 to diagnose.' });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const message = body.message;
    const history = Array.isArray(body.history) ? body.history : [];
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    const gem = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim();
    const groq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim();
    if (!gem && !groq) {
      return res.status(503).json({ error: 'LLM not configured', reason: 'no_api_key' });
    }

    const errors = {};

    // --- provider 1: Gemini ---
    if (gem) {
      let model = (modelCache.provider === 'gemini' && Date.now() - modelCache.at < CACHE_MS)
        ? modelCache.model : null;
      if (!model) {
        const picked = await pickGeminiModel(gem);
        if (picked.ok && picked.model) {
          model = picked.model;
          modelCache = { provider: 'gemini', model, at: Date.now() };
        } else {
          errors.gemini = 'model list failed (HTTP ' + picked.status + '): ' + picked.error;
        }
      }
      if (model) {
        const r = await callGemini(gem, model, message, history);
        if (r.ok) return res.status(200).json({ reply: r.reply, provider: 'gemini', model });
        errors.gemini = 'HTTP ' + r.status + ': ' + r.error + (r.blocked ? ' [' + r.blocked + ']' : '');
        modelCache = { provider: null, model: null, at: 0 }; // force re-pick next time
      }
    }

    // --- provider 2: Groq ---
    if (groq) {
      for (const model of GROQ_PREFERRED) {
        const r = await callGroq(groq, model, message, history);
        if (r.ok) return res.status(200).json({ reply: r.reply, provider: 'groq', model });
        errors.groq = 'HTTP ' + r.status + ': ' + r.error;
        if (r.status === 401 || r.status === 403) break;
      }
    }

    return res.status(502).json({
      error: 'LLM request failed',
      reason: 'all_providers_failed',
      errors,
      hint: 'Open /api/chat?health=1 for a full diagnosis.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err).slice(0, 200) });
  }
}
