'use strict';

// ── Prompt Enhancement Engine ────────────────────────────────────────────────

const ACTION_MAP = {
  // Writing
  write:      { verb: 'Compose',   category: 'writing' },
  draft:      { verb: 'Draft',     category: 'writing' },
  email:      { verb: 'Write',     category: 'email'   },
  letter:     { verb: 'Write',     category: 'writing' },
  essay:      { verb: 'Write',     category: 'writing' },
  blog:       { verb: 'Write',     category: 'writing' },
  article:    { verb: 'Write',     category: 'writing' },
  report:     { verb: 'Write',     category: 'writing' },
  message:    { verb: 'Compose',   category: 'writing' },
  post:       { verb: 'Write',     category: 'writing' },
  // Technical
  code:       { verb: 'Write',     category: 'code'    },
  program:    { verb: 'Build',     category: 'code'    },
  script:     { verb: 'Write',     category: 'code'    },
  function:   { verb: 'Write',     category: 'code'    },
  debug:      { verb: 'Debug',     category: 'code'    },
  fix:        { verb: 'Fix',       category: 'code'    },
  build:      { verb: 'Build',     category: 'technical' },
  create:     { verb: 'Create',    category: 'creative' },
  make:       { verb: 'Create',    category: 'creative' },
  develop:    { verb: 'Develop',   category: 'technical' },
  design:     { verb: 'Design',    category: 'design'  },
  // Analysis
  analyze:    { verb: 'Analyze',   category: 'analysis' },
  analyse:    { verb: 'Analyze',   category: 'analysis' },
  compare:    { verb: 'Compare',   category: 'analysis' },
  evaluate:   { verb: 'Evaluate',  category: 'analysis' },
  review:     { verb: 'Review',    category: 'analysis' },
  audit:      { verb: 'Audit',     category: 'analysis' },
  assess:     { verb: 'Assess',    category: 'analysis' },
  // Explanation
  explain:    { verb: 'Explain',   category: 'explanation' },
  describe:   { verb: 'Describe',  category: 'explanation' },
  define:     { verb: 'Define',    category: 'explanation' },
  clarify:    { verb: 'Clarify',   category: 'explanation' },
  simplify:   { verb: 'Simplify',  category: 'explanation' },
  teach:      { verb: 'Teach',     category: 'explanation' },
  // Planning
  plan:       { verb: 'Create a detailed plan for', category: 'planning' },
  strategy:   { verb: 'Develop a strategy for',    category: 'planning' },
  roadmap:    { verb: 'Create a roadmap for',       category: 'planning' },
  outline:    { verb: 'Create a structured outline for', category: 'planning' },
  // Creative
  generate:   { verb: 'Generate',  category: 'creative' },
  brainstorm: { verb: 'Brainstorm',category: 'creative' },
  suggest:    { verb: 'Suggest',   category: 'creative' },
  story:      { verb: 'Write',     category: 'creative' },
  poem:       { verb: 'Write',     category: 'creative' },
  idea:       { verb: 'Generate',  category: 'creative' },
  // Summarization
  summarize:  { verb: 'Summarize', category: 'summary' },
  summarise:  { verb: 'Summarize', category: 'summary' },
  summary:    { verb: 'Create a summary of', category: 'summary' },
  // Translation
  translate:  { verb: 'Translate', category: 'translation' },
  convert:    { verb: 'Convert',   category: 'conversion' },
  // Improvement
  improve:    { verb: 'Improve',   category: 'improvement' },
  optimize:   { verb: 'Optimize',  category: 'improvement' },
  enhance:    { verb: 'Enhance',   category: 'improvement' },
  rewrite:    { verb: 'Rewrite',   category: 'improvement' },
  refactor:   { verb: 'Refactor',  category: 'code'    },
  // Questions
  how:        { verb: 'Explain how to', category: 'explanation' },
  what:       { verb: 'Explain what',   category: 'explanation' },
  why:        { verb: 'Explain why',    category: 'explanation' },
  when:       { verb: 'Explain when',   category: 'explanation' },
  where:      { verb: 'Explain where',  category: 'explanation' },
  who:        { verb: 'Explain who',    category: 'explanation' },
  list:       { verb: 'List',      category: 'list'    },
  give:       { verb: 'Provide',   category: 'list'    },
  provide:    { verb: 'Provide',   category: 'list'    },
  show:       { verb: 'Show',      category: 'explanation' },
  help:       { verb: 'Help me',   category: 'general' },
  find:       { verb: 'Find',      category: 'research' },
  research:   { verb: 'Research',  category: 'research' },
};

const CATEGORY_REQUIREMENTS = {
  writing: {
    pro: [
      'Use a clear, professional, and engaging tone throughout',
      'Include a compelling opening and a strong conclusion',
      'Structure the content with logical flow and smooth transitions',
      'Ensure proper grammar, punctuation, and spelling',
    ],
    expert: [
      'Adapt the tone and register to the target audience',
      'Use rhetorical techniques to enhance persuasiveness',
      'Include specific examples, data, or anecdotes where appropriate',
      'Optimize for clarity, conciseness, and impact',
      'Provide multiple variations if the context calls for it',
    ],
  },
  email: {
    pro: [
      'Write a clear, informative subject line',
      'Open with a professional greeting appropriate to the relationship',
      'State the purpose clearly in the opening paragraph',
      'Keep the body concise with one main idea per paragraph',
      'End with a professional closing and appropriate sign-off',
    ],
    expert: [
      'Adapt tone based on the recipient relationship (formal/semi-formal/informal)',
      'Anticipate and address potential questions or objections proactively',
      'Include a clear call-to-action with a specific deadline if needed',
      'Keep total length under 200 words for maximum readability',
      'Suggest 2-3 alternative subject lines for A/B testing',
    ],
  },
  code: {
    pro: [
      'Write clean, readable, and well-structured code',
      'Follow best practices and idiomatic patterns for the language',
      'Include meaningful variable and function names',
      'Handle edge cases and potential errors appropriately',
      'Add brief inline comments only where logic is non-obvious',
    ],
    expert: [
      'Optimize for performance and memory efficiency',
      'Write unit-testable code with clear separation of concerns',
      'Consider security implications and input validation',
      'Provide time and space complexity analysis (Big-O notation)',
      'Suggest alternative implementations and explain trade-offs',
      'Include example usage and sample output',
    ],
  },
  analysis: {
    pro: [
      'Structure the analysis with clear sections and headings',
      'Support all claims with specific evidence or reasoning',
      'Present findings in order of importance',
      'Identify strengths, weaknesses, opportunities, and risks',
    ],
    expert: [
      'Apply a systematic analytical framework (e.g., SWOT, root-cause, first-principles)',
      'Compare multiple perspectives and acknowledge counterarguments',
      'Distinguish between correlation and causation',
      'Quantify impact where possible with metrics or data',
      'Provide prioritized, actionable recommendations',
      'Identify assumptions and their potential impact on conclusions',
    ],
  },
  explanation: {
    pro: [
      'Start with a concise, high-level definition or summary',
      'Use the Feynman technique — explain as if to a smart non-expert',
      'Include concrete, real-world analogies and examples',
      'Build complexity progressively from fundamentals to nuances',
    ],
    expert: [
      'Layer the explanation: ELI5 → intermediate → expert-level',
      'Use diagrams, bullet breakdowns, or step-by-step walkthroughs',
      'Address common misconceptions explicitly',
      'Connect the concept to related ideas or broader contexts',
      'Anticipate follow-up questions and answer them preemptively',
    ],
  },
  planning: {
    pro: [
      'Break the plan into clear, sequential phases or milestones',
      'Assign realistic timeframes to each step',
      'Identify required resources, dependencies, and prerequisites',
      'Include success metrics to measure progress',
    ],
    expert: [
      'Define SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)',
      'Map dependencies and critical-path items explicitly',
      'Build in contingency plans for top risks',
      'Include a quick-wins section for early momentum',
      'Add a stakeholder communication or review cadence',
    ],
  },
  creative: {
    pro: [
      'Be original, creative, and engaging',
      'Tailor the style and tone to the intended audience',
      'Use vivid, specific details rather than generic descriptions',
      'Ensure internal consistency and logical coherence',
    ],
    expert: [
      'Generate multiple distinct variations with different creative angles',
      'Experiment with structure, voice, or format to maximize impact',
      'Infuse personality and a unique perspective',
      'Explain the creative rationale behind each major choice',
    ],
  },
  summary: {
    pro: [
      'Capture the core message in the first sentence',
      'Cover the key points without omitting critical information',
      'Use plain, direct language — no jargon or filler',
      'Maintain the original tone and intent of the source',
    ],
    expert: [
      'Provide three layers: one-sentence TL;DR, 3-bullet overview, full summary',
      'Highlight the most surprising or counter-intuitive points',
      'Note any gaps, caveats, or open questions',
    ],
  },
  list: {
    pro: [
      'Organize items in a logical order (importance, chronology, or category)',
      'Make each item specific, actionable, and self-contained',
      'Aim for exhaustiveness without redundancy',
    ],
    expert: [
      'Group items by theme with brief headers',
      'Prioritize items and mark the top 3 as highest impact',
      'Add one-line explanations for any non-obvious items',
    ],
  },
  improvement: {
    pro: [
      'Identify specific weaknesses and address each one directly',
      'Preserve the original intent and voice while improving quality',
      'Explain what you changed and why for each major revision',
    ],
    expert: [
      'Rate the original on key dimensions (clarity, structure, tone) and show improvement scores',
      'Provide a clean improved version plus annotated diff of major changes',
      'Suggest further enhancements beyond the immediate request',
    ],
  },
  research: {
    pro: [
      'Cover the topic comprehensively from multiple credible angles',
      'Distinguish between established facts and emerging/disputed views',
      'Cite the types of sources you\'re drawing from (academic, industry, etc.)',
    ],
    expert: [
      'Map the current state of knowledge and key open questions',
      'Highlight conflicting findings and explain the debate',
      'Suggest primary sources, tools, or experts for deeper investigation',
    ],
  },
  translation: {
    pro: [
      'Produce a natural, idiomatic translation — not word-for-word',
      'Preserve the original tone, register, and intent',
      'Flag culturally specific references that may not translate directly',
    ],
    expert: [
      'Provide the primary translation plus one alternative for different contexts',
      'Note any ambiguities in the source and how you resolved them',
    ],
  },
  general: {
    pro: [
      'Be thorough, accurate, and directly relevant to the request',
      'Structure your response clearly with headers or bullet points',
      'Provide actionable, specific guidance rather than general advice',
    ],
    expert: [
      'Approach the problem from first principles',
      'Consider edge cases, exceptions, and nuances',
      'Give an expert-level answer calibrated to an informed professional',
    ],
  },
};

const PERSONA_MAP = {
  writing:     'You are a professional writer and communication expert with 15+ years of experience crafting compelling content.',
  email:       'You are a business communication specialist who has written thousands of high-impact professional emails.',
  code:        'You are a senior software engineer and technical architect with expertise in writing clean, production-ready code.',
  analysis:    'You are a strategic analyst with deep expertise in structured problem-solving and evidence-based reasoning.',
  explanation: 'You are a world-class educator known for making complex topics accessible without sacrificing depth or accuracy.',
  planning:    'You are a strategic planning expert who has designed execution roadmaps for Fortune 500 companies and startups alike.',
  creative:    'You are a creative director and award-winning writer with a talent for original, audience-specific content.',
  summary:     'You are a research synthesizer skilled at distilling complex information into clear, accurate takeaways.',
  list:        'You are a knowledge curator who builds comprehensive, well-organized reference lists.',
  improvement: 'You are an expert editor and coach who elevates work to its highest potential while preserving the author\'s voice.',
  research:    'You are a thorough researcher with expertise in finding, evaluating, and synthesizing credible information.',
  translation: 'You are a professional translator with native-level fluency and cultural expertise in multiple languages.',
  technical:   'You are a senior engineer and technical expert with broad experience across modern software systems.',
  design:      'You are a UX/UI design expert with a portfolio spanning consumer apps and enterprise systems.',
  conversion:  'You are a technical specialist skilled in accurate, efficient format and data conversions.',
  general:     'You are a knowledgeable expert assistant with broad expertise across technology, business, and creative domains.',
};

const FORMAT_MAP = {
  basic: '',
  pro: '\n\nFormat your response clearly. Use headers, bullet points, or numbered steps where they aid readability. Be concise — every sentence should add value.',
  expert: '\n\nFormat your response with clear sections and headings. Use bullet points for lists, numbered steps for processes, and code blocks for any code. Start with a brief executive summary, then dive into detail. Length should match complexity — no padding, no unnecessary repetition.',
};

// ── Core Enhancement Function ────────────────────────────────────────────────

function enhancePrompt(rawInput, level) {
  const input = rawInput.trim();
  if (!input) return '';

  const lower = input.toLowerCase();
  const tokens = lower.split(/\s+/);

  // Detect primary action
  let detected = null;
  let actionKey = '';
  let topicStart = 0;

  for (let i = 0; i < Math.min(tokens.length, 4); i++) {
    const token = tokens[i].replace(/[^a-z]/g, '');
    if (ACTION_MAP[token]) {
      detected = ACTION_MAP[token];
      actionKey = token;
      topicStart = i + 1;
      break;
    }
  }

  // Fallback: scan for keywords in subject position
  if (!detected) {
    for (const [key, val] of Object.entries(ACTION_MAP)) {
      if (lower.includes(key)) {
        detected = val;
        actionKey = key;
        // Extract topic as everything after the keyword
        const idx = lower.indexOf(key);
        topicStart = tokens.slice(0, idx).length;
        break;
      }
    }
  }

  if (!detected) {
    detected = { verb: 'Help me with', category: 'general' };
    topicStart = 0;
  }

  const topic = tokens.slice(topicStart).join(' ') || input;
  const category = detected.category;

  // Select persona
  const persona = PERSONA_MAP[category] || PERSONA_MAP.general;

  // Build core instruction
  const coreInstruction = buildCoreInstruction(detected.verb, topic, category, input);

  // Get requirements
  const reqs = getRequirements(category, level);

  // Get format instruction
  const format = FORMAT_MAP[level] || '';

  // Assemble prompt
  if (level === 'basic') {
    return `${coreInstruction}\n\nRequirements:\n${reqs.map(r => `- ${r}`).join('\n')}${format}`;
  }

  if (level === 'pro') {
    return `${persona}\n\n${coreInstruction}\n\nRequirements:\n${reqs.map(r => `- ${r}`).join('\n')}${format}`;
  }

  // Expert
  return `${persona}\n\n${coreInstruction}\n\nRequirements:\n${reqs.map(r => `- ${r}`).join('\n')}\n\nQuality bar: Respond as you would for a high-stakes deliverable. Prioritize depth, accuracy, and actionability over brevity.${format}`;
}

function buildCoreInstruction(verb, topic, category, original) {
  const qualifiers = {
    writing:     'comprehensive, well-structured, and professionally written',
    email:       'clear, professional, and effective',
    code:        'clean, efficient, and production-ready',
    analysis:    'thorough, evidence-based, and insightful',
    explanation: 'clear, accurate, and appropriately detailed',
    planning:    'detailed, actionable, and realistic',
    creative:    'original, engaging, and audience-appropriate',
    summary:     'concise yet comprehensive',
    list:        'comprehensive and well-organized',
    improvement: 'significantly improved',
    research:    'thorough and well-sourced',
    translation: 'accurate, natural, and contextually appropriate',
    technical:   'well-architected and technically sound',
    design:      'user-centered, intuitive, and visually compelling',
    general:     'detailed, accurate, and genuinely helpful',
    conversion:  'accurate and properly formatted',
  };

  const qualifier = qualifiers[category] || qualifiers.general;
  const capitalTopic = topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : original;

  return `Please provide a ${qualifier} ${topic ? `response to the following request:\n\n"${verb} ${capitalTopic}"` : `response to: "${original}"`}`;
}

function getRequirements(category, level) {
  const catReqs = CATEGORY_REQUIREMENTS[category] || CATEGORY_REQUIREMENTS.general;
  const proReqs = catReqs.pro || CATEGORY_REQUIREMENTS.general.pro;
  const expertExtra = catReqs.expert || CATEGORY_REQUIREMENTS.general.expert;

  if (level === 'basic') return proReqs.slice(0, 2);
  if (level === 'pro')    return proReqs;
  return [...proReqs, ...expertExtra];
}

// ═══════════════════════════════════════════════════════════════════════════
//  DEVELOPER CONFIG  ← fill in after deploying apps-script.gs
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG = {
  // Paste your Google Apps Script web app URL here after deploying apps-script.gs
  appsScriptUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  // Paste your Razorpay payment link URLs here (create at razorpay.com/payment-links)
  razorpayLinks: {
    pro:    'https://rzp.io/l/YOUR-PRO-LINK-HERE',
    expert: 'https://rzp.io/l/YOUR-EXPERT-LINK-HERE',
  },

  upiId:    'hassainn.mcsa@okicici',
  devEmail: 'support.alphaone@gmail.com',
};
// ═══════════════════════════════════════════════════════════════════════════

// Free tier limits
const FREE_LIMITS = { weeklyPrompts: 10, historySize: 3, canSaveLibrary: false };

const TIER_CONFIG = {
  pro: {
    name:   'Pro',
    icon:   '✨',
    price:  '₹79',
    amount: 79,
    label:  '₹79 / month',
    prefix: 'NZP',
    features: [
      { text: 'Unlimited enhanced prompts — no weekly cap',           hi: true  },
      { text: 'Full Prompt History — unlimited saves',                hi: true  },
      { text: 'Prompt Library — bookmark your best prompts',          hi: true  },
      { text: 'All 3 levels: Basic, Pro & Expert enhancement',        hi: true  },
      { text: 'Language-aware prompts (English, Hindi, Hinglish)',    hi: false },
      { text: 'Auto-inject into ChatGPT, Claude, Gemini & more',     hi: false },
    ],
  },
  expert: {
    name:   'Expert',
    icon:   '🚀',
    price:  '₹149',
    amount: 149,
    label:  '₹149 / month',
    prefix: 'NZE',
    features: [
      { text: 'Everything in Pro ✨',                                  hi: false },
      { text: 'Maximum depth — expert-level frameworks & analysis',   hi: true  },
      { text: 'Library Folders — organise prompts by category',       hi: true  },
      { text: 'Conversational Memory hints for AI context',           hi: true  },
      { text: 'Multiple perspectives, edge cases & trade-offs',       hi: true  },
      { text: 'Priority support & early access to new features',      hi: false },
    ],
  },
};

// ── Shared HMAC secret — must match admin.html ───────────────────────────────
// Change this once in BOTH files. Keep it private.
const HMAC_SECRET = 'SP-NAZEER-KEY-2025';

// ── Local HMAC-SHA256 validation (works without any server) ──────────────────
// Code format generated by admin.html:  NZP-YYMM-SSSS-CCCC
//   NZP/NZE = tier prefix
//   YYMM    = 2-digit year + 2-digit month  (e.g. 2605 = May 2026)
//   SSSS    = 4-digit serial (0001–9999)
//   CCCC    = first 4 hex chars of HMAC-SHA256(secret, prefix+YYMM+serial)

async function validateLocalCode(code, tier) {
  const parts = code.trim().toUpperCase().split('-');
  if (parts.length !== 4) return false;

  const [prefix, yymm, serial, checksum] = parts;
  const cfg = TIER_CONFIG[tier];
  if (!cfg || prefix !== cfg.prefix) return false;
  if (!/^\d{4}$/.test(yymm) || !/^\d{4}$/.test(serial)) return false;

  // Check YYMM is current or previous month
  function toYYMM(d) {
    return String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, '0');
  }
  const now  = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (yymm !== toYYMM(now) && yymm !== toYYMM(prev)) return false;

  // Recompute HMAC and compare first 4 hex chars
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(HMAC_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(prefix + yymm + serial));
    const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 4).toUpperCase() === checksum;
  } catch {
    return false;
  }
}

// ── API: Verify code against Google Apps Script database ─────────────────────

async function verifyCodeWithAPI(code) {
  const url = `${CONFIG.appsScriptUrl}?action=verify&code=${encodeURIComponent(code)}`;
  try {
    const res  = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('API verify failed:', err);
    return null;
  }
}

// ── Storage Helpers ───────────────────────────────────────────────────────────

function getActivations() {
  return new Promise(resolve => {
    chrome.storage.local.get('activations', ({ activations }) => {
      resolve(activations || {});
    });
  });
}

function saveActivation(tier, code) {
  return new Promise(resolve => {
    getActivations().then(acts => {
      acts[tier] = { code, date: Date.now() };
      chrome.storage.local.set({ activations: acts }, resolve);
    });
  });
}

async function isTierUnlocked(tier) {
  if (tier === 'basic') return true;
  const acts = await getActivations();
  return Boolean(acts[tier]);
}

// ── UI State ──────────────────────────────────────────────────────────────────

let currentLevel  = 'pro';
let currentPrompt = '';
let currentLang   = 'en';
let pendingTier   = null;

// DOM references
const simpleInput    = document.getElementById('simpleInput');
const charCount      = document.getElementById('charCount');
const generateBtn    = document.getElementById('generateBtn');
const outputSection  = document.getElementById('outputSection');
const aiSection      = document.getElementById('aiSection');
const outputBox      = document.getElementById('outputBox');
const copyBtn        = document.getElementById('copyBtn');
const saveLibBtn     = document.getElementById('saveLibBtn');
const clearBtn       = document.getElementById('clearBtn');
const copyFeedback   = document.getElementById('copyFeedback');
const themeToggle    = document.getElementById('themeToggle');
const pills          = document.querySelectorAll('.pill');
const langPills      = document.querySelectorAll('.lang-pill');
const usageBar       = document.getElementById('usageBar');
const usageText      = document.getElementById('usageText');
const usageFill      = document.getElementById('usageFill');

// Modal DOM
const modalOverlay    = document.getElementById('modalOverlay');
const modalTierIcon   = document.getElementById('modalTierIcon');
const modalTierName   = document.getElementById('modalTierName');
const modalPriceBadge = document.getElementById('modalPriceBadge');
const modalFeatures   = document.getElementById('modalFeatures');
const btnPayRazorpay  = document.getElementById('btnPayRazorpay');
const btnCopyUpi      = document.getElementById('btnCopyUpi');
const activationInput = document.getElementById('activationInput');
const btnActivate     = document.getElementById('btnActivate');
const activateMsg     = document.getElementById('activateMsg');
const modalCancel     = document.getElementById('modalCancel');

// ── Theme ─────────────────────────────────────────────────────────────────────

function loadTheme() {
  chrome.storage.local.get('theme', ({ theme }) => {
    if (theme === 'dark') applyTheme('dark');
  });
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
});

// ── Tabs ──────────────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'history') renderHistory();
    if (tab.dataset.tab === 'library') renderLibrary();
  });
});

// ── Language Pills ────────────────────────────────────────────────────────────

langPills.forEach(lp => {
  lp.addEventListener('click', () => {
    langPills.forEach(p => p.classList.remove('active'));
    lp.classList.add('active');
    currentLang = lp.dataset.lang;
    chrome.storage.local.set({ lang: currentLang });
  });
});

function loadLang() {
  chrome.storage.local.get('lang', ({ lang }) => {
    if (!lang) return;
    currentLang = lang;
    langPills.forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
  });
}

function getLangInstruction(lang) {
  return {
    hi:  '\n\nPlease respond in Hindi (हिन्दी में उत्तर दें).',
    mix: '\n\nYou may use Hinglish (natural mix of Hindi and English) in your response.',
    en:  '',
  }[lang] || '';
}

// ── Usage Counter (free tier) ─────────────────────────────────────────────────

function getWeekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

async function getWeeklyUsage() {
  const { usage = {} } = await new Promise(r => chrome.storage.local.get('usage', r));
  return usage[getWeekKey()] || 0;
}

async function incrementUsage() {
  const { usage = {} } = await new Promise(r => chrome.storage.local.get('usage', r));
  const key = getWeekKey();
  usage[key] = (usage[key] || 0) + 1;
  chrome.storage.local.set({ usage });
}

async function refreshUsageBar() {
  const isPro = await isTierUnlocked('pro') || await isTierUnlocked('expert');
  if (isPro) { usageBar.style.display = 'none'; return; }

  const used = await getWeeklyUsage();
  const pct  = Math.min(100, (used / FREE_LIMITS.weeklyPrompts) * 100);
  usageBar.style.display  = 'flex';
  usageText.textContent   = `${used} / ${FREE_LIMITS.weeklyPrompts} prompts used this week`;
  usageFill.style.width   = pct + '%';
  usageFill.classList.toggle('warning', pct >= 80);
}

document.getElementById('usageUpgrade').addEventListener('click', () => {
  showPaymentModal('pro');
});

// ── Pill Badges ───────────────────────────────────────────────────────────────

async function refreshPillBadges() {
  const proUnlocked  = await isTierUnlocked('pro');
  const expUnlocked  = await isTierUnlocked('expert');
  const proBadge     = document.getElementById('proBadge');
  const expBadge     = document.getElementById('expBadge');
  const pillPro      = document.getElementById('pillPro');
  const pillExpert   = document.getElementById('pillExpert');

  if (proUnlocked) {
    proBadge.textContent = '✓ Active';
    proBadge.classList.add('unlocked');
    pillPro.classList.remove('locked');
  } else {
    proBadge.textContent = '₹79/mo';
    proBadge.classList.remove('unlocked');
    pillPro.classList.add('locked');
  }
  if (expUnlocked) {
    expBadge.textContent = '✓ Active';
    expBadge.classList.add('unlocked');
    pillExpert.classList.remove('locked');
  } else {
    expBadge.textContent = '₹149/mo';
    expBadge.classList.remove('unlocked');
    pillExpert.classList.add('locked');
  }
}

// ── Enhancement Level ─────────────────────────────────────────────────────────

pills.forEach(pill => {
  pill.addEventListener('click', async () => {
    const level = pill.dataset.level;
    if (level === 'basic') { selectLevel('basic'); return; }
    const unlocked = await isTierUnlocked(level);
    if (unlocked) selectLevel(level);
    else showPaymentModal(level);
  });
});

function selectLevel(level) {
  currentLevel = level;
  pills.forEach(p => p.classList.toggle('active', p.dataset.level === level));
  chrome.storage.local.set({ level });
  if (currentPrompt && simpleInput.value.trim()) runEnhancement();
}

async function loadLevel() {
  const { level } = await new Promise(r => chrome.storage.local.get('level', r));
  if (!level) return;
  const unlocked = await isTierUnlocked(level);
  selectLevel(unlocked ? level : 'basic');
}

// ── Payment Modal ─────────────────────────────────────────────────────────────

function showPaymentModal(tier) {
  const cfg = TIER_CONFIG[tier];
  if (!cfg) return;
  pendingTier = tier;

  modalTierIcon.textContent   = cfg.icon;
  modalTierName.textContent   = cfg.name;
  modalPriceBadge.textContent = cfg.label;
  btnPayRazorpay.textContent  = `💳  Pay ${cfg.price}/month — Get Instant Code`;
  btnPayRazorpay.dataset.url  = CONFIG.razorpayLinks[tier];

  modalFeatures.innerHTML = cfg.features.map(f =>
    `<li class="${f.hi ? 'highlight' : ''}">
       <span class="fi">${f.hi ? '⭐' : '✅'}</span>${f.text}
     </li>`
  ).join('');

  activationInput.value       = '';
  activateMsg.textContent     = '';
  activateMsg.className       = 'activate-msg';
  activationInput.placeholder = `e.g. ${cfg.prefix}-2605-0001-A3F7`;

  document.body.classList.add('modal-open');
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  pendingTier = null;
}

modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
btnPayRazorpay.addEventListener('click', () => { window.open(btnPayRazorpay.dataset.url, '_blank'); });
btnCopyUpi.addEventListener('click', async () => {
  await copyToClipboard(CONFIG.upiId);
  btnCopyUpi.textContent = 'Copied!';
  setTimeout(() => { btnCopyUpi.textContent = 'Copy'; }, 2000);
});

// ── Activate Code ─────────────────────────────────────────────────────────────

async function handleActivation() {
  const raw = activationInput.value.trim();
  if (!raw) { showActivateMsg('Please enter your activation code.', 'error'); return; }
  if (!pendingTier) return;

  const code = raw.toUpperCase().replace(/\s/g, '');
  const cfg  = TIER_CONFIG[pendingTier];

  if (!code.startsWith(cfg.prefix + '-') || code.length < 10) {
    showActivateMsg(`Code must start with ${cfg.prefix}-  e.g. ${cfg.prefix}-2605-0001-A3F7`, 'error');
    return;
  }

  setActivateLoading(true);
  showActivateMsg('Verifying your code…', 'checking');

  let result = null;
  const apiConfigured = !CONFIG.appsScriptUrl.includes('YOUR_SCRIPT_ID');
  if (apiConfigured) result = await verifyCodeWithAPI(code);

  if (result === null) {
    const localValid = await validateLocalCode(code, pendingTier);
    result = localValid ? { valid: true, tier: pendingTier } : { valid: false, reason: 'not_found' };
  }

  setActivateLoading(false);

  if (!result.valid) {
    const reasons = {
      not_found:     `Invalid code. Contact ${CONFIG.devEmail}`,
      revoked:       `This code has been revoked. Contact ${CONFIG.devEmail}`,
      invalid_format:'Invalid code format. Check your email for the full code.',
    };
    showActivateMsg(reasons[result.reason] || 'Invalid code. Please try again.', 'error');
    activationInput.select();
    return;
  }

  if (result.tier && result.tier !== pendingTier) {
    showActivateMsg(`This is a ${TIER_CONFIG[result.tier]?.name || result.tier} code, not ${cfg.name}.`, 'error');
    return;
  }

  await saveActivation(pendingTier, code);
  showActivateMsg(`✅ ${cfg.name} activated! Enjoy your upgrade.`, 'success');
  await refreshPillBadges();
  await refreshUsageBar();
  setTimeout(() => { closeModal(); selectLevel(pendingTier); }, 1400);
}

function setActivateLoading(on) {
  btnActivate.disabled     = on;
  btnActivate.textContent  = on ? '⏳ Checking…' : 'Activate';
  activationInput.disabled = on;
}
function showActivateMsg(msg, type) {
  activateMsg.textContent = msg;
  activateMsg.className   = `activate-msg ${type}`;
}
btnActivate.addEventListener('click', handleActivation);
activationInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleActivation(); });

// ── Character Count ───────────────────────────────────────────────────────────

simpleInput.addEventListener('input', () => {
  const len = simpleInput.value.length;
  charCount.textContent = `${len} / 500`;
  charCount.style.color = len > 450 ? '#ef4444' : '';
});

// ── Generate ──────────────────────────────────────────────────────────────────

async function runEnhancement() {
  const raw = simpleInput.value.trim();
  if (!raw) {
    simpleInput.focus();
    simpleInput.style.borderColor = '#ef4444';
    setTimeout(() => { simpleInput.style.borderColor = ''; }, 1500);
    return;
  }

  // Free tier weekly limit check
  const isPaid = await isTierUnlocked('pro') || await isTierUnlocked('expert');
  if (!isPaid) {
    const used = await getWeeklyUsage();
    if (used >= FREE_LIMITS.weeklyPrompts) {
      showToast('⚠️ Weekly limit reached. Upgrade to Pro for unlimited prompts!');
      showPaymentModal('pro');
      return;
    }
  }

  generateBtn.classList.add('loading');
  generateBtn.querySelector('.btn-icon').textContent = '⏳';

  setTimeout(async () => {
    const langSuffix = getLangInstruction(currentLang);
    currentPrompt = enhancePrompt(raw, currentLevel) + langSuffix;

    outputBox.textContent        = currentPrompt;
    outputSection.style.display  = 'flex';
    aiSection.style.display      = 'flex';
    generateBtn.classList.remove('loading');
    generateBtn.querySelector('.btn-icon').textContent = '✨';

    // Reset save button
    saveLibBtn.textContent = '⭐ Save';
    saveLibBtn.classList.remove('saved');

    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Track usage + save to history
    if (!isPaid) await incrementUsage();
    await refreshUsageBar();
    await addToHistory(raw, currentPrompt, currentLevel, currentLang);
  }, 180);
}

generateBtn.addEventListener('click', runEnhancement);
simpleInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runEnhancement();
});

// ── Copy ──────────────────────────────────────────────────────────────────────

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta); return ok;
  }
}

function showCopyFeedback() {
  copyFeedback.classList.add('show');
  setTimeout(() => copyFeedback.classList.remove('show'), 2000);
}

copyBtn.addEventListener('click', async () => {
  if (!currentPrompt) return;
  await copyToClipboard(currentPrompt);
  showCopyFeedback();
  copyBtn.textContent = '✅ Copied!';
  setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
});

// ── Clear ─────────────────────────────────────────────────────────────────────

clearBtn.addEventListener('click', () => {
  simpleInput.value            = '';
  charCount.textContent        = '0 / 500';
  currentPrompt                = '';
  outputSection.style.display  = 'none';
  aiSection.style.display      = 'none';
  simpleInput.focus();
});

// ── Save to Library ───────────────────────────────────────────────────────────

saveLibBtn.addEventListener('click', async () => {
  if (!currentPrompt) return;

  const isPaid = await isTierUnlocked('pro') || await isTierUnlocked('expert');
  if (!isPaid) { showPaymentModal('pro'); return; }

  await addToLibrary(simpleInput.value.trim(), currentPrompt, currentLevel, currentLang);
  saveLibBtn.textContent = '✅ Saved!';
  saveLibBtn.classList.add('saved');
  showToast('⭐ Saved to Library!');
  setTimeout(() => { saveLibBtn.textContent = '⭐ Save'; saveLibBtn.classList.remove('saved'); }, 2500);
});

// ── History ───────────────────────────────────────────────────────────────────

async function addToHistory(input, output, level, lang) {
  const { history = [] } = await new Promise(r => chrome.storage.local.get('history', r));
  history.unshift({ id: Date.now(), input, output, level, lang, date: fmtDate(new Date()) });

  const isPaid = await isTierUnlocked('pro') || await isTierUnlocked('expert');
  if (!isPaid) history.splice(FREE_LIMITS.historySize);

  chrome.storage.local.set({ history });
}

async function renderHistory() {
  const { history = [] } = await new Promise(r => chrome.storage.local.get('history', r));
  const isPaid   = await isTierUnlocked('pro') || await isTierUnlocked('expert');
  const list     = document.getElementById('historyList');
  const gate     = document.getElementById('historyGate');

  list.innerHTML = '';
  if (history.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🕐</div><div class="empty-text">No history yet.<br>Generate a prompt to start.</div></div>';
    gate.style.display = 'none';
    return;
  }

  history.forEach(item => {
    const card = makePromptCard(item, [
      { label: '📋 Copy', cls: '', action: () => { copyToClipboard(item.output); showToast('📋 Copied!'); } },
      { label: '↩ Restore', cls: '', action: () => {
          simpleInput.value = item.input;
          charCount.textContent = `${item.input.length} / 500`;
          document.querySelector('[data-tab="generate"]').click();
          runEnhancement();
      }},
      { label: '✕', cls: 'del', action: () => deleteHistoryItem(item.id) },
    ]);
    list.appendChild(card);
  });

  gate.style.display = !isPaid && history.length >= FREE_LIMITS.historySize ? 'flex' : 'none';
}

async function deleteHistoryItem(id) {
  const { history = [] } = await new Promise(r => chrome.storage.local.get('history', r));
  chrome.storage.local.set({ history: history.filter(h => h.id !== id) });
  renderHistory();
}

document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
  if (!confirm('Clear all history?')) return;
  chrome.storage.local.set({ history: [] });
  renderHistory();
});

// ── Library ───────────────────────────────────────────────────────────────────

async function addToLibrary(input, output, level, lang) {
  const { library = [] } = await new Promise(r => chrome.storage.local.get('library', r));
  library.unshift({ id: Date.now(), input, output, level, lang, date: fmtDate(new Date()) });
  chrome.storage.local.set({ library });
}

async function renderLibrary() {
  const { library = [] } = await new Promise(r => chrome.storage.local.get('library', r));
  const isPaid  = await isTierUnlocked('pro') || await isTierUnlocked('expert');
  const list    = document.getElementById('libraryList');
  const gate    = document.getElementById('libraryGate');
  const empty   = document.getElementById('libraryEmpty');

  if (!isPaid) {
    list.innerHTML     = '';
    gate.style.display = 'flex';
    empty.style.display = 'none';
    return;
  }

  gate.style.display = 'none';
  list.innerHTML = '';

  if (library.length === 0) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  library.forEach(item => {
    const card = makePromptCard(item, [
      { label: '📋 Copy', cls: '', action: () => { copyToClipboard(item.output); showToast('📋 Copied!'); } },
      { label: '↩ Use', cls: '', action: () => {
          simpleInput.value = item.input;
          charCount.textContent = `${item.input.length} / 500`;
          document.querySelector('[data-tab="generate"]').click();
          runEnhancement();
      }},
      { label: '✕', cls: 'del', action: () => deleteLibraryItem(item.id) },
    ]);
    list.appendChild(card);
  });
}

async function deleteLibraryItem(id) {
  const { library = [] } = await new Promise(r => chrome.storage.local.get('library', r));
  chrome.storage.local.set({ library: library.filter(l => l.id !== id) });
  renderLibrary();
}

document.getElementById('clearLibraryBtn').addEventListener('click', async () => {
  if (!confirm('Clear all saved prompts?')) return;
  chrome.storage.local.set({ library: [] });
  renderLibrary();
});

// ── Prompt Card Builder ───────────────────────────────────────────────────────

function makePromptCard(item, actions) {
  const div = document.createElement('div');
  div.className = 'prompt-card';
  const langLabel = { en: '🇬🇧 EN', hi: '🇮🇳 HI', mix: '🤝 MIX' }[item.lang] || '🇬🇧 EN';
  div.innerHTML = `
    <div class="prompt-card-meta">
      <span class="card-badge ${item.level}">${item.level.toUpperCase()}</span>
      <span class="card-lang">${langLabel}</span>
      <span class="card-date">${item.date}</span>
    </div>
    <div class="prompt-card-input">${escHtml(item.input)}</div>
    <div class="prompt-card-output">${escHtml(item.output)}</div>
    <div class="prompt-card-actions"></div>`;

  const actRow = div.querySelector('.prompt-card-actions');
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = `card-action-btn ${a.cls}`;
    btn.textContent = a.label;
    btn.addEventListener('click', a.action);
    actRow.appendChild(btn);
  });
  return div;
}

// ── AI Tool Buttons ───────────────────────────────────────────────────────────

document.querySelectorAll('.ai-btn').forEach(btn => {
  btn.addEventListener('click', async e => {
    e.preventDefault();
    if (!currentPrompt) { chrome.tabs.create({ url: btn.dataset.url, active: true }); return; }

    const toolName = btn.querySelector('.ai-icon').nextSibling.textContent.trim();
    const origHTML = btn.innerHTML;
    btn.innerHTML = `<span class="ai-icon">⏳</span> Opening…`;
    btn.style.opacity = '0.75';
    btn.style.pointerEvents = 'none';

    await copyToClipboard(currentPrompt);
    chrome.runtime.sendMessage({ type: 'OPEN_AI_TOOL', url: btn.dataset.url, prompt: currentPrompt });
    showToast(`✅ Opening ${toolName} — prompt loading automatically`);

    setTimeout(() => {
      btn.innerHTML = origHTML;
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    }, 3000);
  });
});

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg) {
  let t = document.getElementById('spToast');
  if (!t) {
    t = document.createElement('div'); t.id = 'spToast';
    t.style.cssText = 'position:fixed;bottom:54px;left:50%;transform:translateX(-50%) translateY(10px);background:#1a1523;color:#fff;font-size:12px;font-weight:600;padding:8px 16px;border-radius:20px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.35);z-index:9999;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; });
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)'; }, 3500);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmtDate(d) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

(async () => {
  loadTheme();
  loadLang();
  await refreshPillBadges();
  await loadLevel();
  await refreshUsageBar();
  simpleInput.focus();

  const { lastInput } = await new Promise(r => chrome.storage.local.get('lastInput', r));
  if (lastInput) {
    simpleInput.value = lastInput;
    charCount.textContent = `${lastInput.length} / 500`;
  }
})();

simpleInput.addEventListener('input', () => {
  chrome.storage.local.set({ lastInput: simpleInput.value });
});
