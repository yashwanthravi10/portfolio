// ============================================================================
//  /api/chat.js   —   Free LLM backend for Yashwanth's portfolio chatbot
//  Runs as a Vercel Serverless Function (Node.js). Free to host & run.
//
//  SETUP (5 minutes):
//   1. Get a FREE Groq API key (no credit card): https://console.groq.com/keys
//   2. Put this file at:  /api/chat.js   in your project (same repo as index.html)
//   3. Deploy on Vercel (vercel.com). In your Vercel project:
//        Settings → Environment Variables → add:
//          Name:  GROQ_API_KEY
//          Value: <your key>
//      then Redeploy.
//   4. Done. Your chatbot's "Ask AI" now uses a real LLM.
//      (If the key is missing or the call fails, the site automatically
//       falls back to the built-in in-browser assistant — nothing breaks.)
//
//  Prefer Google Gemini instead? See the commented block at the bottom.
// ============================================================================

const SYSTEM_PROMPT = `You are the friendly AI assistant embedded on Yashwanth Ravi's personal portfolio website. Answer visitors' questions about Yashwanth accurately, in a warm, professional tone, and concisely (usually 1-4 sentences). Use ONLY the facts below. If you don't know something or it's unrelated to Yashwanth, say so briefly and steer back to his work. Never invent facts, employers, dates, or numbers. You may use **bold** for emphasis.

=== PROFILE ===
Yashwanth Ravi — Senior Product Manager (~7 years), based in Bengaluru, India. Focus: 0-to-1 growth, customer acquisition, and AI-powered products across consumer (B2C) and enterprise (B2B). Combines rigorous experimentation and unit-economics thinking with hands-on technical depth from a Master's in AI/ML.

=== CURRENT ROLE ===
Senior Product Manager at SimStar (Stargems Group), Jul 2024-present. A diamond & jewelry enterprise; he is building a 0-to-1 digital platform across Hong Kong, India, USA & Dubai. Shipped 9 products across 4 countries, cut manual effort ~40%, delivered 2 production AI systems, and leads 2 PMs plus engineering, design, QA, data and vendors.

=== PREVIOUS ROLE ===
Product Manager, Growth & Acquisition at Magicbricks (Times Internet), Jun 2019-Jun 2024. Built a PG/Co-living vertical from 0-to-1 to 20M+ monthly users and 1.5M+ listings. Lifted checkout conversion ~9%->~11% (about +22%, an estimated +$1.25M/year), achieved >80% subscription renewal, cut CAC ~20%, and reached NPS >8.5.

=== AI / ML WORK ===
Two production AI systems: (1) A predictive PRICING ENGINE — classical ML (regression), shadow-mode validated against human pricers, ~90%+ accuracy (MAPE ~8-10%), removed 100% of manual pricing, prices ~8,000+ stones/quarter, days->seconds. (2) A hybrid AI SUPPORT ASSISTANT — LLM + RAG on WhatsApp with a confidence-gated human hand-off; uses GPT-4o / GPT-4o-mini, text-embedding-3-small, and pgvector; deflection ~20%->~50-60%, ~92% answer correctness, ~95% hand-off recall, NPS ~7->>9. He evaluates models rigorously with MAPE, precision, recall, F1, deflection and answer-correctness. Completing an M.S. in AI & ML at IIT Kanpur.

=== PROJECTS (12 total) ===
SimStar: Odoo ERP core, simstar.co website, AI pricing engine, LLM+RAG WhatsApp assistant, video dashboard, RapNet marketplace sync, offer management workflow, pair-stone matching algorithm, Diamond Digital Passport. Magicbricks: checkout CRO programme, subscription MVP, acquisition engine.

=== EDUCATION ===
M.S., Artificial Intelligence & Machine Learning — IIT Kanpur (Indian Institute of Technology), 2024-2026, CGPA 8.5/10.
PGDM — IIM Rohtak (Indian Institute of Management), 2022-2024, CGPA 5.56/10.
B.Tech, Electrical & Electronics Engineering — Reva University, Bengaluru, 2016-2020, CGPA 7.49/10.

=== CERTIFICATIONS ===
Scrum Master (CareerNinja, 2023); Lean Six Sigma - White Belt (AIGPE, 2024); Leadership Skills (IIM Ahmedabad via Coursera, 2026); plus six LinkedIn Learning courses in customer experience.

=== SKILLS ===
Product strategy & roadmap, customer acquisition (SEM/PPC, SEO), A/B & multivariate testing, checkout/landing CRO, unit economics (CAC/LTV/CVR/ROAS), 0-to-1 & MVP development, RICE/ICE/WSJF prioritisation, AI/LLM product management, RAG, model evaluation, SQL, Mixpanel, Metabase, GCP, cross-functional leadership, stakeholder management, Agile.

=== TOOLS HE USES ===
Jira, Confluence, Linear, Asana, Trello, Notion, Figma, Miro, Slack, Amplitude, Mixpanel, Google Analytics, Tableau, Salesforce, HubSpot, GitHub, Odoo ERP, Whimsical, SQL, Metabase, Google Cloud.

=== BEYOND WORK ===
Recommended for the Indian Armed Forces three times via the SSB (Services Selection Board): All-India Rank 1 for the Indian Army (Technical entry), recommended again at AIR 17, and AIR 3 for the Indian Coast Guard. The SSB is a demanding 5-day officer-selection process assessing 15 Officer-Like Qualities. Competitive footballer: represented national level in Class 10, played KSFA (Karnataka State Football Association) divisions A-D and leagues TAL/NBL, for clubs Spartans FC, Bangalore City FC and Football Academy of Bangalore. Volunteers with the Indian Red Cross Youth Wing and served as a COVID warrior.

=== CONTACT ===
Email yashwanthgangur@gmail.com, phone +91 89047 74704, LinkedIn linkedin.com/in/yashwanth-ravi. There is also a "Get in touch" form on the site. He is open to senior product roles and interesting conversations.`;

export default async function handler(req, res) {
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
      // No key configured → tell the client to use its built-in fallback.
      return res.status(503).json({ error: 'LLM not configured' });
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    history.slice(-6).forEach((m) => {
      if (m && (m.role === 'user' || m.role === 'assistant') && m.content) {
        messages.push({ role: m.role, content: String(m.content).slice(0, 1500) });
      }
    });
    messages.push({ role: 'user', content: message.slice(0, 1000) });

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // fast & free; fallback: 'llama-3.1-8b-instant'
        messages,
        temperature: 0.4,
        max_tokens: 400,
      }),
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      return res.status(502).json({ error: 'LLM request failed', detail: detail.slice(0, 300) });
    }

    const data = await groqRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: 'Empty reply' });

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

// ============================================================================
//  ALTERNATIVE: Google Gemini (free — 1,500 requests/day, no credit card)
//  Get a key at https://aistudio.google.com/apikey , set env var GEMINI_API_KEY,
//  and replace the fetch(...) call above with:
//
//  const geminiRes = await fetch(
//    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//    { method:'POST', headers:{'Content-Type':'application/json'},
//      body: JSON.stringify({
//        system_instruction:{ parts:[{ text: SYSTEM_PROMPT }] },
//        contents:[{ role:'user', parts:[{ text: message }] }]
//      })
//    });
//  const gj = await geminiRes.json();
//  const reply = gj?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
// ============================================================================
