// ============================================================================
//  /api/chat.js   —   LLM backend for "Yashwanth's AI" (portfolio chatbot)
//  Vercel Serverless Function (Node.js).
//
//  PROVIDER: Google Gemini only — env var GEMINI_API_KEY
//    Free key: https://aistudio.google.com/apikey
//    By explicit choice this backend talks to Google and nothing else. If
//    Gemini is unavailable, the site falls back to its built-in answers
//    rather than routing the question to another vendor.
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
//    The function now lists the Gemini models the key can actually reach and
//    picks the best, so a deprecation degrades gracefully instead of going
//    dead quiet.
// ============================================================================

const SYSTEM_PROMPT = `You are "Yashwanth's AI" — a general-purpose AI assistant embedded on Yashwanth Ravi's personal portfolio website.

You are a FULL assistant, not a scripted FAQ bot. Answer ANY question a visitor asks — maths, code, science, history, current affairs, writing help, advice, casual conversation, anything — with the same competence and care as any capable AI assistant. Never refuse a question merely because it is not about Yashwanth, and never say you are "focused on Yashwanth" or can only discuss him.

You additionally know Yashwanth's background, set out below. When a question IS about him, use ONLY those facts: never invent employers, dates, numbers or projects, and say plainly if something is not covered there. For everything else, answer from your own general knowledge.

Style: warm, direct and concise — usually 1-4 sentences, longer only when the question genuinely needs it. Show working for maths. You may use **bold** for emphasis.

You HAVE live web access through Google Search grounding. For anything current or fast-moving — weather, news, prices, sports, "today", "latest", "right now" — search and answer from what you find, and say what the information is as of. Never tell a visitor you cannot access live data or ask them to go and check a weather app or search engine themselves: look it up and answer. Only if a search genuinely returns nothing useful should you say so plainly.

If a visitor wants to contact, hire or work with Yashwanth, tell them they can click the "Email Yashwanth" button in this chat to send him a message directly, or reach him at yashwanthgangur@gmail.com or on LinkedIn.

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

const NO_SEARCH_NOTE = '\n\nIMPORTANT FOR THIS REQUEST: live web search is NOT available right now, so you cannot look anything up. If the question needs current information (weather, news, prices, scores, anything "today"), say plainly that you cannot access live data at the moment and answer from general knowledge where that still helps. Never claim or imply that you searched.';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Warm-lambda cache so we don't list models on every request.
let modelCache = { provider: null, models: null, at: 0 };
// Remember the model that last answered: if the newest one is congested,
// stop leading with it on every request.
let lastGood = { model: null, at: 0 };

// Every Gemini model has its OWN free-tier quota bucket (the Flash models get
// ~5 RPM / 20 RPD each; the Flash-Lite models ~15 RPM / 50 RPD). Hammering the
// newest model first wastes a request on a bucket that is already empty and
// leaves the roomier models untouched. So remember what just failed and skip
// it until its bucket plausibly refills.
const cooldown = new Map();              // model -> timestamp to skip until
const COOLDOWN_QUOTA = 60 * 60 * 1000;   // 429: daily/minute bucket spent
const COOLDOWN_BUSY = 90 * 1000;         // 503/504: transient congestion

function coolingDown(model) {
  const until = cooldown.get(model);
  if (!until) return false;
  if (Date.now() > until) { cooldown.delete(model); return false; }
  return true;
}
function markFailure(model, status) {
  if (status === 429) cooldown.set(model, Date.now() + COOLDOWN_QUOTA);
  else if (RETRYABLE.has(status)) cooldown.set(model, Date.now() + COOLDOWN_BUSY);
}

// Whether this key may use the google_search tool. Null = not yet known.
let groundingOK = { allowed: null, at: 0 };
const LAST_GOOD_MS = 10 * 60 * 1000;

function orderModels(models) {
  let list = models.slice();
  if (lastGood.model && Date.now() - lastGood.at < LAST_GOOD_MS && list.includes(lastGood.model)) {
    list = [lastGood.model].concat(list.filter((m) => m !== lastGood.model));
  }
  // Models known to be out of quota go last rather than being dropped — if
  // everything is cooling down we would rather try than refuse.
  const fresh = list.filter((m) => !coolingDown(m));
  const cold = list.filter((m) => coolingDown(m));
  return fresh.concat(cold);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CACHE_MS = 30 * 60 * 1000;

// Transient upstream conditions — worth trying the next model rather than
// abandoning the provider. 503 "high demand" is common on the newest model.
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

// Serverless functions have a hard wall-clock limit. Bound every upstream call
// so a slow Google response fails fast enough for the next model to be tried,
// instead of hanging until the whole function is killed.
function timeoutSignal(ms) {
  try { return AbortSignal.timeout(ms); } catch (_) { return undefined; }
}

// ---------------------------------------------------------------------------
//  Gemini
// ---------------------------------------------------------------------------

// Higher score wins. Favours newest stable Flash: best quality-per-free-quota
// for a site chatbot (Pro has a far lower daily cap on the free tier).
function scoreGemini(id) {
  if (!/^gemini-/.test(id)) return -1;
  // Exclude non-chat and specialised variants.
  if (/embedding|aqa|image|vision-only|tts|audio|live|native-audio|computer-use|robotics|guard|transcribe|omni|nano-banana|lyria|veo|imagen|deep-research|customtools/.test(id)) return -1;
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
  let r, text;
  try {
    r = await fetch(`${GEMINI_BASE}/models?key=${encodeURIComponent(key)}&pageSize=200`, { signal: timeoutSignal(8000) });
    text = await r.text();
  } catch (e) {
    return { ok: false, status: 504, error: 'model list unreachable: ' + String(e).slice(0, 150), ids: [] };
  }
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
  return {
    ok: true,
    model: ranked[0]?.id || null,
    // Deep failover chain: with no second vendor, resilience has to come
    // from breadth within Google's own catalogue.
    models: ranked.slice(0, 10).map((x) => x.id),
    ids: list.ids,
    ranked: ranked.slice(0, 5),
  };
}

async function callGemini(key, model, message, history, timeoutMs, useSearch) {
  timeoutMs = timeoutMs || 15000;
  if (useSearch === undefined) useSearch = true;
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

  let r, text;
  try {
    r = await fetch(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT + (useSearch ? '' : NO_SEARCH_NOTE) }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      }, useSearch ? { tools: [{ google_search: {} }] } : {})),
      signal: timeoutSignal(timeoutMs),
    });
    text = await r.text();
  } catch (e) {
    // Timeout or network failure. Report as retryable so the chain continues.
    const timedOut = String(e && e.name) === 'TimeoutError' || String(e && e.name) === 'AbortError';
    return {
      ok: false,
      status: timedOut ? 504 : 0,
      reply: null,
      error: timedOut ? ('no response within ' + timeoutMs + 'ms') : String(e).slice(0, 200),
      blocked: null,
    };
  }
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const reply = parts.map((p) => p.text || '').join('').trim();
  const gm = json?.candidates?.[0]?.groundingMetadata || null;
  const sources = (gm?.groundingChunks || [])
    .map((c) => ({ title: c?.web?.title || '', uri: c?.web?.uri || '' }))
    .filter((x) => x.uri)
    .slice(0, 3);
  return {
    ok: r.ok && Boolean(reply),
    status: r.status,
    reply: reply || null,
    searched: Boolean(gm && (gm.webSearchQueries || gm.groundingChunks)),
    queries: gm?.webSearchQueries || [],
    sources,
    error: (json?.error?.message || (r.ok ? 'empty reply' : text) || '').slice(0, 250),
    blocked: json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason || null,
  };
}

// One call, with the grounded -> ungrounded fallback built in. Everything
// that talks to Gemini goes through here, so the diagnostics can never
// disagree with what the chatbot actually does.
async function generate(key, model, message, history, timeoutMs, allowSearch) {
  const trySearch = allowSearch !== false &&
    !(groundingOK.allowed === false && Date.now() - groundingOK.at < 60 * 60 * 1000);
  let r = await callGemini(key, model, message, history, timeoutMs, trySearch);
  if (!r.ok && trySearch && (r.status === 400 || r.status === 429)) {
    groundingOK = { allowed: false, at: Date.now() };
    const r2 = await callGemini(key, model, message, history, timeoutMs, false);
    if (r2.ok) { r2.searchUnavailable = true; return r2; }
    r = r2.status ? r2 : r;
  } else if (r.ok && trySearch) {
    groundingOK = { allowed: true, at: Date.now() };
  }
  return r;
}

// ---------------------------------------------------------------------------
//  Health check — GET /api/chat?health=1
// ---------------------------------------------------------------------------
async function health(res, full, probe) {
  const gem = process.env.GEMINI_API_KEY;
  const out = {
    endpoint: 'ok',
    runtime: 'node ' + process.version,
    policy: 'Google Gemini only — no other LLM vendor is called.',
    providers: {
      gemini: { keyPresent: Boolean(gem), keyLength: gem ? gem.length : 0, keyHasWhitespace: gem ? gem !== gem.trim() : false },
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
      out.providers.gemini.preferredModel = orderModels(picked.models)[0];
      out.providers.gemini.cooledDown = Array.from(cooldown.entries())
        .filter(([, until]) => until > Date.now())
        .map(([m, until]) => ({ model: m, secondsLeft: Math.round((until - Date.now()) / 1000) }));
      out.providers.gemini.groundingAllowed = groundingOK.allowed;
      out.providers.gemini.failoverChain = picked.models;
      out.providers.gemini.topCandidates = picked.ranked;
      out.providers.gemini.availableModels = picked.ids;
      out.providers.gemini.attempts = [];
      // Probe the failover chain the chat path actually uses, but under a
      // wall-clock budget so this endpoint can never outlive the function.
      // Default stops at 2 models; ?full=1 walks up to 4.
      // By default we do NOT generate: listing models already proves the key
      // works and shows what is reachable, and it returns in well under a
      // second. Add ?test=1 to actually send a prompt (?full=1 for the chain).
      const maxModels = full ? 4 : (probe ? 2 : 0);
      const deadline = Date.now() + (full ? 20000 : 12000);
      let budgetHit = false;
      for (const model of picked.models.slice(0, maxModels)) {
        const left = deadline - Date.now();
        if (left < 2500) { budgetHit = true; break; }
        const t = await generate(gem.trim(), model, 'Reply with the single word: ok', [], Math.min(6000, left));
        out.providers.gemini.attempts.push({ model, status: t.status, ok: t.ok, error: t.ok ? null : t.error });
        if (t.ok) {
          out.providers.gemini.chosenModel = model;
          out.providers.gemini.testStatus = t.status;
          out.providers.gemini.testOk = true;
          break;
        }
        if (!RETRYABLE.has(t.status)) break;
      }
      if (!probe && !full) {
        out.providers.gemini.testOk = null;
        out.providers.gemini.diagnosis =
          'Key verified and ' + picked.ids.length + ' models reachable; preferred model is ' + picked.model +
          '. No prompt was sent — add &test=1 to send one, or &full=1 to probe the whole failover chain.';
      } else if (!out.providers.gemini.testOk) {
        const last = out.providers.gemini.attempts[out.providers.gemini.attempts.length - 1] || {};
        const untested = picked.models.length - out.providers.gemini.attempts.length;
        out.providers.gemini.testStatus = last.status || 0;
        out.providers.gemini.testOk = false;
        out.providers.gemini.error = last.error || 'all candidate models failed';
        out.providers.gemini.untestedFallbacks = untested > 0 ? picked.models.slice(-untested) : [];
        if (RETRYABLE.has(last.status)) {
          out.providers.gemini.diagnosis = untested > 0
            ? 'The models probed here (' + out.providers.gemini.attempts.map((a) => a.model).join(', ') +
              ') are temporarily busy or rate-limited on Google\'s side — HTTP ' + last.status + '. This is capacity, not your key. ' +
              (budgetHit ? 'The probe stopped at its time budget, so ' : 'This check did not probe ') +
              untested + ' further fallback model(s): ' + picked.models.slice(-untested).join(', ') +
              '. A real chat message still tries those, so the chatbot may well be answering normally — send it one to confirm, or use ?health=1&full=1.'
            : 'Every candidate Gemini model is temporarily busy or rate-limited (HTTP ' + last.status + '). This is Google-side capacity, not your key — it usually clears on its own. The site serves its built-in answers until it does.';
        } else {
          out.providers.gemini.diagnosis = 'Gemini rejected the request — see error above.';
        }
      }
    }
  }

  if (out.providers.gemini.testOk) {
    out.activeProvider = 'gemini';
    out.activeModel = out.providers.gemini.chosenModel;
    out.diagnosis = 'Healthy — answering on Gemini (' + out.activeModel + ').';
  } else if (out.providers.gemini.testOk === null) {
    // Key and model list verified, no prompt sent.
    out.activeProvider = 'gemini';
    out.activeModel = out.providers.gemini.preferredModel;
    out.diagnosis = 'Configured and reachable — Gemini key valid, preferred model ' +
      out.activeModel + '. Add &test=1 to send a live prompt.';
  } else {
    out.activeProvider = null;
    const untested = (out.providers.gemini.untestedFallbacks || []).length;
    out.diagnosis = gem
      ? (untested > 0
          ? 'The Gemini models probed here were busy, but ' + untested + ' fallback model(s) were not probed and a real chat message still tries them — so the chatbot may be answering normally. See providers.gemini.diagnosis.'
          : 'Gemini is configured but not answering — the chatbot is serving built-in answers. See providers.gemini for the exact error.')
      : 'No GEMINI_API_KEY is configured on this deployment. Add it in Vercel → Settings → Environment Variables, then REDEPLOY.';
  }
  return res.status(200).json(out);
}

// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
   try {
    const url = new URL(req.url, 'http://x');
    if (url.searchParams.get('health') === '1') {
      const full = url.searchParams.get('full') === '1';
      return health(res, full, full || url.searchParams.get('test') === '1');
    }

    // Grounding check: does live Google Search actually work on this key?
    if (url.searchParams.get('grounded') === '1') {
      const gkey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim();
      if (!gkey) return res.status(200).json({ error: 'no key' });
      const q = url.searchParams.get('q') || 'What is the weather in Bengaluru, India right now?';
      // &search=0 isolates whether it is GENERATION quota or the search tool.
      const useSearch = url.searchParams.get('search') !== '0';
      const picked = await pickGeminiModel(gkey);
      const chain = orderModels((picked.models || ['gemini-3.8-flash'])).slice(0, 8);
      // Walk the same chain the chat path uses, so this reflects reality.
      const attempts = [];
      let good = null, usedModel = null;
      const deadline = Date.now() + 40000;
      for (const m of chain) {
        if (deadline - Date.now() < 8000) break;
        const r = await generate(gkey, m, q, [], 8000, useSearch);
        attempts.push({ model: m, httpStatus: r.status, ok: r.ok, searched: r.searched,
                        error: r.ok ? null : (r.error || '').slice(0, 120) });
        if (!r.ok) { markFailure(m, r.status); continue; }
        good = r; usedModel = m; break;
      }
      const out = {
        searchRequested: useSearch,
        chain,
        attempts,
        model: usedModel,
        withSearch: good ? {
          httpStatus: good.status, ok: true, searched: good.searched,
          queries: good.queries, sources: good.sources,
          reply: (good.reply || '').slice(0, 500),
        } : null,
      };
      out.verdict = good && good.searched
        ? 'Live web search IS working — ' + usedModel + ' ran a real Google query for this answer.'
        : good
          ? 'The model answered on ' + usedModel + ' but chose not to search for this question.'
          : (attempts.some((a) => a.httpStatus === 400)
              ? 'The google_search tool was rejected (HTTP 400) — grounding likely needs billing enabled.'
              : 'Every model in the chain is out of quota or busy right now. See attempts above.');
      return res.status(200).json(out);
    }

    // Lightweight provider/model info for the chat header. Lists models but
    // never generates, so it costs no generation quota.
    if (url.searchParams.get('info') === '1') {
      const gem = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim();
      if (gem) {
        let models = (modelCache.provider === 'gemini' && Date.now() - modelCache.at < CACHE_MS)
          ? modelCache.models : null;
        if (!models) {
          const picked = await pickGeminiModel(gem);
          if (picked.ok && picked.models && picked.models.length) {
            models = picked.models;
            modelCache = { provider: 'gemini', models, at: Date.now() };
          }
        }
        if (models && models.length) {
          return res.status(200).json({ provider: 'gemini', model: orderModels(models)[0] });
        }
      }
      return res.status(200).json({ provider: null, model: null });
    }

    return res.status(405).json({ error: 'Method not allowed. POST {message} here, or GET ?health=1 to diagnose.' });
   } catch (e) {
    return res.status(500).json({ error: 'Diagnostic failed', detail: String(e).slice(0, 300) });
   }
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
    if (!gem) {
      return res.status(503).json({ error: 'LLM not configured', reason: 'no_api_key' });
    }

    const errors = {};

    if (gem) {
      let models = (modelCache.provider === 'gemini' && Date.now() - modelCache.at < CACHE_MS)
        ? modelCache.models : null;
      if (!models) {
        const picked = await pickGeminiModel(gem);
        if (picked.ok && picked.models && picked.models.length) {
          models = picked.models;
          modelCache = { provider: 'gemini', models, at: Date.now() };
        } else {
          errors.gemini = 'model list failed (HTTP ' + picked.status + '): ' + picked.error;
        }
      }
      // Walk the chain, preferring whichever model last answered. A 503 from
      // Google is usually a momentary spike, so each model gets one quick
      // retry before we move on — that alone recovers most transient failures.
      // Budget must stay inside the function's maxDuration (60s, set in
      // vercel.json). Without that header room the platform kills the
      // function mid-chain and the browser just sees a failed request.
      const chain = orderModels(models || []).slice(0, 8);
      const tried = [];
      const PER_CALL = 8000;
      const deadline = Date.now() + 45000;
      for (const model of chain) {
        if (deadline - Date.now() < PER_CALL) break;
        let r = await generate(gem, model, message, history, PER_CALL);
        // Retry only transient congestion. A 429 means this model's bucket is
        // empty — retrying it just burns another request against the limit.
        if (!r.ok && r.status !== 429 && RETRYABLE.has(r.status) && deadline - Date.now() > PER_CALL + 1000) {
          await sleep(400);
          r = await generate(gem, model, message, history, PER_CALL);
        }
        if (!r.ok) markFailure(model, r.status);
        if (r.ok) {
          lastGood = { model, at: Date.now() };
          return res.status(200).json({
            reply: r.reply, provider: 'gemini', model,
            searched: Boolean(r.searched), sources: r.sources || [],
            searchUnavailable: Boolean(r.searchUnavailable),
          });
        }
        tried.push(model + ':' + r.status);
        errors.gemini = model + ' → HTTP ' + r.status + ': ' + r.error + (r.blocked ? ' [' + r.blocked + ']' : '');
        // Key/permission or safety problems won't be fixed by another model.
        if (!RETRYABLE.has(r.status)) break;
      }
      if (tried.length) errors.tried = tried.join(', ');
    }

    return res.status(502).json({
      error: 'LLM request failed',
      reason: 'gemini_unavailable',
      errors,
      hint: 'Open /api/chat?health=1 for a full diagnosis.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err).slice(0, 200) });
  }
}
