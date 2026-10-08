// ============================================================================
//  /api/chat.js   —   LLM backend for Yashwanth's portfolio chatbot
//  Runs as a Vercel Serverless Function (Node.js).
//
//  SETUP:
//   1. Get a free Groq API key (no credit card): https://console.groq.com/keys
//   2. In Vercel → Settings → Environment Variables, add:
//          Name:  GROQ_API_KEY       Value: <your key>
//      Tick ALL environments (Production, Preview, Development), then REDEPLOY.
//      Env vars are only picked up by deployments created after they are added.
//
//  DIAGNOSTICS:
//   Open  /api/chat?health=1  in a browser. It reports whether the key is
//   present and what Groq actually replies, without ever exposing the key.
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

// Tried in order. If one is decommissioned or unavailable, the next is used.
// NOTE: the llama-3.x chat models are no longer available on this Groq account
// (they return HTTP 404), which is what silently broke the chatbot before.
// Check /api/chat?health=1 for the live list this key can actually reach.
const MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
];

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroq(key, model, messages, maxTokens) {
  const payload = { model, messages, temperature: 0.4, max_tokens: maxTokens };
  // gpt-oss models reason before answering; keep that budget small so the
  // visible answer isn't truncated and latency stays low.
  if (model.startsWith('openai/gpt-oss')) payload.reasoning_effort = 'low';
  const r = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) { /* non-JSON error page */ }
  return { ok: r.ok, status: r.status, json, text };
}

// ---------------------------------------------------------------------------
//  Health check — GET /api/chat?health=1
//  Reports the real reason the chatbot is or isn't using the LLM.
//  Never returns the key itself.
// ---------------------------------------------------------------------------
async function health(res) {
  const key = process.env.GROQ_API_KEY;
  const out = {
    endpoint: 'ok',
    runtime: 'node ' + process.version,
    keyPresent: Boolean(key),
    keyLength: key ? key.length : 0,
    keyLooksValid: key ? /^gsk_[A-Za-z0-9]{20,}$/.test(key.trim()) : false,
    keyHasWhitespace: key ? key !== key.trim() : false,
    models: {},
  };
  if (!key) {
    out.diagnosis =
      'GROQ_API_KEY is not set on this deployment. Add it in Vercel → Settings → ' +
      'Environment Variables (tick Production), then REDEPLOY — existing deployments ' +
      'do not pick up new variables.';
    return res.status(200).json(out);
  }
  // Which models does this key actually have access to?
  try {
    const lr = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (lr.ok) {
      const lj = await lr.json();
      out.availableModels = (lj?.data || []).map((m) => m.id).sort();
    } else {
      out.availableModels = 'list failed: HTTP ' + lr.status;
    }
  } catch (e) {
    out.availableModels = 'list error: ' + String(e).slice(0, 120);
  }
  for (const model of MODELS) {
    try {
      const r = await callGroq(key, model, [{ role: 'user', content: 'ping' }], 5);
      out.models[model] = {
        httpStatus: r.status,
        ok: r.ok,
        error: r.ok ? null : (r.json?.error?.message || r.text || '').slice(0, 200),
        code: r.ok ? null : (r.json?.error?.code || null),
      };
      if (r.ok) { out.workingModel = model; break; }
    } catch (e) {
      out.models[model] = { httpStatus: 0, ok: false, error: String(e).slice(0, 200) };
    }
  }
  if (out.workingModel) {
    out.diagnosis = 'Healthy — the LLM is reachable and answering on ' + out.workingModel + '.';
  } else {
    const first = Object.values(out.models)[0] || {};
    if (first.httpStatus === 401) {
      out.diagnosis = 'Groq rejected the key (401). It is invalid, revoked or rotated. Create a new key at console.groq.com/keys, update it in Vercel, then redeploy.';
    } else if (first.httpStatus === 429) {
      out.diagnosis = 'Rate limited or out of quota (429) on the Groq free tier. It resets — try later, or use a different key.';
    } else if (first.httpStatus === 404 || first.code === 'model_not_found') {
      out.diagnosis = 'Every model in the list was rejected as unknown/decommissioned. Check the current model names at console.groq.com/docs/models.';
    } else {
      out.diagnosis = 'The key is set but Groq did not accept the request. See models[] above for the exact error.';
    }
  }
  return res.status(200).json(out);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://x');
    if (url.searchParams.get('health') === '1') return health(res);
    return res.status(405).json({ error: 'Method not allowed. POST a {message} here, or GET ?health=1 to diagnose.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const message = body.message;
    const history = Array.isArray(body.history) ? body.history : [];
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      return res.status(503).json({ error: 'LLM not configured', reason: 'no_api_key' });
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    history.slice(-6).forEach((m) => {
      if (m && (m.role === 'user' || m.role === 'assistant') && m.content) {
        messages.push({ role: m.role, content: String(m.content).slice(0, 1500) });
      }
    });
    messages.push({ role: 'user', content: message.slice(0, 1000) });

    let last = null;
    for (const model of MODELS) {
      const r = await callGroq(key, model, messages, 800);
      last = r;
      if (r.ok) {
        const reply = r.json?.choices?.[0]?.message?.content?.trim();
        if (reply) return res.status(200).json({ reply, model });
      }
      // 401 / 403 are key problems — retrying other models cannot help.
      if (r.status === 401 || r.status === 403) break;
    }

    return res.status(502).json({
      error: 'LLM request failed',
      reason: last?.status === 401 ? 'bad_api_key' : 'upstream_error',
      status: last?.status || 0,
      detail: (last?.json?.error?.message || last?.text || '').slice(0, 300),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err).slice(0, 200) });
  }
}
