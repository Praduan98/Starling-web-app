/* ==========================================================================
   Starling demo data — Nexora (fictional AI workflow SaaS company, Bengaluru)
   Deterministic (seeded) and relative to today, so the prototype always looks live.
   Mutable collections (posts, conversations, assets) persist in localStorage.
   ========================================================================== */
window.SL = window.SL || {};
(function (SL) {
  'use strict';

  /* ---------- Seeded PRNG ---------- */
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s += 0x6D2B79F5;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  SL.rng = rng;

  const DAY = 86400000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  SL.today = today;
  function at(dayOffset, h, m) {
    const d = new Date(today.getTime() + dayOffset * DAY);
    d.setHours(h, m || 0, 0, 0);
    return d.toISOString();
  }
  SL.at = at;
  const T = function (n) { return 'assets/media/t' + n + '.webp'; };
  const A = function (n) { return 'assets/media/a' + n + '.webp'; };

  /* ---------- Workspace brand ---------- */
  const brand = {
    name: 'Nexora', initials: 'NX', handle: '@nexorahq', slug: 'nexorahq',
    site: 'nexora.io', location: 'Bengaluru, India',
    tagline: 'The AI workflow platform for modern teams'
  };

  const user = { id: 'u1', name: 'Arjun Mehta', first: 'Arjun', role: 'Head of Social', email: 'arjun@nexora.io', avatar: A(4) };

  const team = [
    user,
    { id: 'u2', name: 'Meera Kapoor', role: 'Content Lead', email: 'meera@nexora.io', avatar: A(1), access: 'Editor' },
    { id: 'u3', name: 'Rohan Desai', role: 'Community Manager', email: 'rohan@nexora.io', avatar: A(2), access: 'Editor' },
    { id: 'u4', name: 'Priya Nair', role: 'Brand Director', email: 'priya@nexora.io', avatar: A(10), access: 'Approver' },
    { id: 'u5', name: 'Siddharth Rao', role: 'Designer', email: 'siddharth@nexora.io', avatar: A(9), access: 'Contributor' }
  ];
  team[0].access = 'Admin';

  const channels = [
    { id: 'li', net: 'linkedin', name: 'Nexora', handle: 'Company page', followers: 86420, delta: 2.6, connected: true },
    { id: 'x', net: 'x', name: 'Nexora', handle: '@nexorahq', followers: 41280, delta: 1.1, connected: true },
    { id: 'ig', net: 'instagram', name: 'Nexora', handle: '@nexorahq', followers: 27950, delta: 4.2, connected: true },
    { id: 'yt', net: 'youtube', name: 'Nexora', handle: '@nexorahq', followers: 12360, delta: 6.8, connected: true },
    { id: 'tt', net: 'tiktok', name: 'Nexora', handle: '@nexorahq', followers: 9140, delta: 14.2, connected: true },
    { id: 'fb', net: 'facebook', name: 'Nexora', handle: 'facebook.com/nexorahq', followers: 6710, delta: 0.3, connected: true },
    { id: 'pin', net: 'pinterest', name: 'Nexora', handle: '@nexorahq', followers: 920, delta: -0.4, connected: true },
    { id: 'th', net: 'threads', name: 'Nexora', handle: '@nexorahq', followers: 3480, delta: 18.5, connected: false }
  ];

  const limits = { instagram: 2200, tiktok: 2200, linkedin: 3000, x: 280, facebook: 63206, youtube: 5000, pinterest: 500, threads: 500 };

  const campaigns = ['Flow 3.0 Launch', 'Life at Nexora', 'Nexora Summit 2026', 'Hiring', 'Thought Leadership'];

  /* ---------- Caption pool ---------- */
  const captions = [
    { t: 'Flow 3.0 launch week, day 2: AI agents now plug into Slack, Teams and 40 other tools you already use. #Flow3 #AIAgents', m: [7], c: 'Flow 3.0 Launch' },
    { t: 'Build Week 2026: 48 hours, 62 teams, one rule: ship something real. Here are our favourite hacks. #LifeAtNexora', m: [1], c: 'Life at Nexora' },
    { t: 'Our new Pune office is open! Floor-to-ceiling light, a lot of whiteboards and room to grow. Come say hello. #LifeAtNexora', m: [12], c: 'Life at Nexora' },
    { t: 'Nexora is now SOC 2 Type II certified. Our CISO, Lakshmi Iyer, on what a year of quiet, careful work looks like.', m: [15], c: 'Thought Leadership' },
    { t: 'Meet Ananya, Staff Engineer on our AI platform team, and the reason our agents can reason over 10 million events a day. #WomenInTech', m: [3], c: 'Life at Nexora' },
    { t: 'Hybrid, by design: three anchor days together, the rest wherever you do your best work. Here is what a year of it taught us. #FutureOfWork', m: [14], c: 'Thought Leadership' },
    { t: 'Registration for Nexora Summit 2026 is open. Two days, 40 sessions and one big keynote in Bengaluru. Early-bird pricing ends Friday. #NexoraSummit', m: [9], c: 'Nexora Summit 2026' },
    { t: 'How Brightline Logistics cut manual reporting by 72% with Nexora Flow. Read the full customer story.', m: [5], c: 'Flow 3.0 Launch' },
    { t: 'We’re hiring across engineering, design and go-to-market. 38 open roles in Bengaluru, Pune and Hyderabad. #WeAreHiring', m: [4], c: 'Hiring' },
    { t: 'Our 2026 intern cohort just wrapped their first sprint demo. The future is in very good hands.', m: [10], c: 'Life at Nexora' },
    { t: 'The State of AI at Work 2026: 1,200 leaders, 5 big shifts. Download the full report. #FutureOfWork', m: [6], c: 'Thought Leadership' },
    { t: 'Thank you to our 10,000 customers. Ten thousand teams that decided work could feel lighter. We celebrated in style.', m: [11], c: 'Life at Nexora' },
    { t: 'Inside the stack: how our engineers run AI agents on 4 billion tokens a week without breaking the bank. New on the engineering blog.', m: [8], c: 'Thought Leadership' },
    { t: 'Design sprint, day 3: two hundred sticky notes, one clear direction. #LifeAtNexora', m: [2], c: 'Life at Nexora' },
    { t: 'Hello, Hyderabad! Our third office opens next month, and we are hiring 60 people to build there. #WeAreHiring', m: [13], c: 'Hiring' },
    { t: 'Offsite season: the product team swapped standups for sunsets in Goa this week. Back on Monday with a notebook full of ideas. #LifeAtNexora', m: [16], c: 'Life at Nexora' },
    { t: 'Lights, rangoli and a lot of mithai: Diwali at the Bengaluru office. Wishing everyone a bright year ahead. #Diwali #LifeAtNexora', m: [17], c: 'Life at Nexora' },
    { t: 'New in Nexora Insights: dashboards that explain themselves. Ask a question in plain English, get a chart.', m: [6], c: 'Flow 3.0 Launch' },
    { t: 'Please welcome Nandini Rao, our new VP of People. Fifteen years of building teams people never want to leave. #LifeAtNexora', m: [20], c: 'Life at Nexora' },
    { t: 'Wellness Wednesday: 30 minutes of yoga on the terrace before standup. Easily our most-attended meeting of the week. #LifeAtNexora', m: [18], c: 'Life at Nexora' },
    { t: 'Nexora Cricket League, final over: Platform beat Product by two runs. The rematch is already on the calendar. #LifeAtNexora', m: [19], c: 'Life at Nexora' },
    { t: 'Our most colourful day of the year: Holi at the Bengaluru office. Already counting down to the next one. #LifeAtNexora', m: [21], c: 'Life at Nexora' },
    { t: 'Thali Thursday: once a month the whole team eats together. No laptops, no shop talk, extra papad. #LifeAtNexora', m: [22], c: 'Life at Nexora' },
    { t: 'Family Day at Nexora: 120 kids, one bouncy castle and a lot of parents who finally got to show where they work. #LifeAtNexora', m: [23], c: 'Life at Nexora' }
  ];

  /* ---------- Posts ---------- */
  function buildPosts() {
    const r = rng(42);
    const slots = [[8, 15], [9, 30], [11, 0], [12, 30], [15, 45], [17, 30], [19, 0]];
    const chanSets = [['li'], ['li', 'x'], ['x', 'th'], ['ig'], ['tt'], ['ig', 'tt'], ['li', 'x', 'fb'], ['yt'], ['li'], ['ig', 'fb']];
    const authors = ['u1', 'u2', 'u3', 'u5'];
    const posts = [];
    const now = Date.now();
    const reserved = { 0: [0], 1: [3], 2: [6], 3: [14] };   // captions used by the hand-placed posts below
    let k = 0;
    for (let d = -21; d <= 24; d++) {
      const n = d === 0 ? 4 : 1 + Math.floor(r() * 3);
      const used = {}, usedCap = (reserved[d] || []).slice();
      for (let i = 0; i < n; i++) {
        let s = slots[Math.floor(r() * slots.length)];
        if (used[s[0]]) s = slots[(slots.indexOf(s) + 2) % slots.length];
        used[s[0]] = 1;
        while (usedCap.indexOf(k % captions.length) > -1) k++;
        usedCap.push(k % captions.length);
        const cap = captions[k % captions.length];
        const set = chanSets[Math.floor(r() * chanSets.length)];
        let status;
        if (new Date(at(d, s[0], s[1])).getTime() < now) status = r() < 0.04 ? 'failed' : 'published';
        else if (d <= 6) status = r() < 0.16 ? 'approval' : (r() < 0.12 ? 'draft' : 'scheduled');
        else status = r() < 0.35 ? 'draft' : 'scheduled';
        const reach = Math.round(2000 + r() * 26000);
        posts.push({
          id: 'p' + (k + 1),
          channels: set.slice(),
          text: cap.t,
          media: cap.m.map(T),
          date: at(d, s[0], s[1]),
          status: status,
          author: authors[Math.floor(r() * authors.length)],
          campaign: cap.c,
          metrics: status === 'published' ? {
            reach: reach,
            impressions: Math.round(reach * (1.3 + r() * 0.8)),
            likes: Math.round(reach * (0.03 + r() * 0.05)),
            comments: Math.round(reach * (0.002 + r() * 0.006)),
            shares: Math.round(reach * (0.001 + r() * 0.004)),
            clicks: Math.round(reach * (0.004 + r() * 0.012))
          } : null
        });
        k++;
      }
    }
    // Hand-placed posts that the demo story relies on
    const heroAt = new Date(Math.max(new Date(at(0, 16, 0)).getTime(), Math.ceil((now + 3600000) / 900000) * 900000));
    posts.push({ id: 'p-hero', channels: ['li', 'x', 'ig'], text: 'Flow 3.0 is here. AI agents that plan, run and report on your workflows, so your team can focus on the work only people can do. #Flow3 #AIAgents', media: [T(7), T(5)], date: heroAt.toISOString(), status: 'scheduled', author: 'u2', campaign: 'Flow 3.0 Launch', metrics: null });
    posts.push({ id: 'p-appr1', channels: ['li'], text: 'Big milestone: Nexora is SOC 2 Type II certified. Our CISO, Lakshmi Iyer, on what it means for your data and the three things the audit taught us.', media: [T(15)], date: at(1, 9, 30), status: 'approval', author: 'u2', campaign: 'Thought Leadership', metrics: null, note: 'Legal needs to confirm we can name the auditor before this goes out.' });
    posts.push({ id: 'p-appr2', channels: ['ig', 'tt'], text: 'Summit speakers announced: 40 sessions from the teams at Brightline, Meridian Health and Arcadia Bank. Who is joining us in Bengaluru? #NexoraSummit', media: [T(9)], date: at(2, 17, 30), status: 'approval', author: 'u3', campaign: 'Nexora Summit 2026', metrics: null, note: 'Can we add the early-bird code in the first comment?' });
    posts.push({ id: 'p-appr3', channels: ['x', 'th'], text: 'Growing fast: teams in Bengaluru, Pune and now Hyderabad. 60 roles open across all three. #WeAreHiring', media: [T(13)], date: at(3, 8, 15), status: 'approval', author: 'u5', campaign: 'Hiring', metrics: null });
    return posts;
  }

  /* ---------- Inbox conversations ---------- */
  function buildConversations() {
    return [
      { id: 'c1', name: 'Kavya Reddy', handle: '@kavyareddy', avatar: A(5), net: 'instagram', type: 'Comment', sentiment: 'positive', unread: true, priority: false, assignee: null, status: 'open', time: at(0, 9, 42), tags: ['Product question'],
        context: { text: 'Flow 3.0 is here. AI agents that plan, run…', media: T(7) },
        messages: [{ from: 'them', text: 'Flow 3.0 looks amazing! Does it support SSO with Okta? Our IT team will ask on day one.', time: at(0, 9, 42) }],
        profile: { followers: 2840, location: 'Hyderabad, Telangana', since: 'Customer since 2024 · Fieldwell', seats: 120, notes: 'Workspace admin at Fieldwell. Renewal in March.' } },
      { id: 'c2', name: 'Vikram Singh', handle: '@vikramsingh', avatar: A(7), net: 'x', type: 'Mention', sentiment: 'negative', unread: true, priority: true, assignee: 'u3', status: 'open', time: at(0, 9, 5), tags: ['Incident'],
        messages: [{ from: 'them', text: '@nexorahq the API has been returning 503s for 20 minutes and our nightly sync is failing. Is there a status update?', time: at(0, 9, 5) }],
        profile: { followers: 1210, location: 'Gurugram, Haryana', since: 'Customer since 2023 · Polar Freight', seats: 300, notes: 'Enterprise plan. Escalate API incidents to the on-call SRE.' } },
      { id: 'c3', name: 'Neha Sharma', handle: 'Neha Sharma', avatar: A(3), net: 'linkedin', type: 'Message', sentiment: 'positive', unread: true, priority: false, assignee: null, status: 'open', time: at(0, 8, 18), tags: ['Enterprise lead'],
        messages: [{ from: 'them', text: 'Hi team, I lead operations at Meridian Health. We are evaluating workflow automation for about 300 people across four hospitals. Who is the right person to talk to about an enterprise pilot?', time: at(0, 8, 18) }],
        profile: { followers: 3410, location: 'Mumbai, Maharashtra', since: 'New contact · Meridian Health', seats: 0, notes: '' } },
      { id: 'c4', name: 'Aditya Kumar', handle: '@adityabuilds', avatar: A(6), net: 'tiktok', type: 'Comment', sentiment: 'neutral', unread: false, priority: false, assignee: 'u1', status: 'open', time: at(-1, 19, 40), tags: ['Developer'],
        context: { text: 'Build Week 2026: 48 hours, 62 teams…', media: T(1) },
        messages: [
          { from: 'them', text: 'What stack do you use for the agents? Asking for a friend (me).', time: at(-1, 19, 40) },
          { from: 'us', text: 'Great question! Mostly TypeScript and Python, with our own orchestration layer on top. We wrote it all up on the engineering blog; the link is in our bio.', time: at(-1, 20, 5), by: 'u1' },
          { from: 'them', text: 'Read it this morning. Super clear, thank you!', time: at(0, 7, 55) }
        ],
        profile: { followers: 18200, location: 'Bengaluru, Karnataka', since: 'Creator · 18.2K followers', seats: 0, notes: 'Developer creator. Potential partner for Flow 3.0 tutorials.' } },
      { id: 'c5', name: 'Pooja Menon', handle: 'Pooja Menon', avatar: A(8), net: 'facebook', type: 'Review', sentiment: 'positive', unread: false, priority: false, assignee: null, status: 'open', time: at(-1, 15, 12), tags: ['Review'],
        messages: [{ from: 'them', text: 'Five stars. Onboarding took a day, not a quarter, and support answered every question within the hour.', time: at(-1, 15, 12) }],
        profile: { followers: 640, location: 'Kochi, Kerala', since: 'Customer since 2022 · Arcadia Bank', seats: 85, notes: '' } },
      { id: 'c6', name: 'Karan Malhotra', handle: '@karanmalhotra', avatar: A(11), net: 'instagram', type: 'DM', sentiment: 'neutral', unread: false, priority: false, assignee: 'u3', status: 'open', time: at(-1, 11, 3), tags: ['Hiring'],
        messages: [{ from: 'them', text: 'Hi! Is the Staff Designer role open to candidates in Pune, or is it Bengaluru only? Happy to relocate for the right team.', time: at(-1, 11, 3) }],
        profile: { followers: 920, location: 'Pune, Maharashtra', since: 'Candidate', seats: 0, notes: '' } },
      { id: 'c7', name: 'Ishita Banerjee', handle: '@ishitab', avatar: A(12), net: 'instagram', type: 'Mention', sentiment: 'positive', unread: false, priority: false, assignee: null, status: 'open', time: at(-2, 10, 30), tags: ['Webinar'],
        messages: [{ from: 'them', text: 'Loved the “AI agents in the enterprise” webinar from @nexorahq. Is the recording available anywhere?', time: at(-2, 10, 30) }],
        profile: { followers: 6730, location: 'Kolkata, West Bengal', since: 'Customer since 2021 · Arcadia Bank', seats: 40, notes: 'Speaks at ops conferences. Potential Summit speaker.' } },
      { id: 'c8', name: 'Rahul Verma', handle: '@rahulverma', avatar: A(13), net: 'x', type: 'Mention', sentiment: 'negative', unread: false, priority: false, assignee: null, status: 'resolved', time: at(-3, 13, 20), tags: ['Support'],
        messages: [
          { from: 'them', text: 'Waited two days for a reply on a billing question from @nexorahq support. Not great.', time: at(-3, 13, 20) },
          { from: 'us', text: 'Sorry, Rahul. That is slower than we aim for. We have answered your ticket and refunded this month’s overage. DM sent!', time: at(-3, 13, 48), by: 'u3' }
        ],
        profile: { followers: 410, location: 'New Delhi, Delhi', since: 'Customer since 2025 · Fieldwell', seats: 12, notes: 'Refunded one month of overage.' } }
    ];
  }

  /* ---------- Streams ---------- */
  const people = [
    { name: 'Kavya Reddy', handle: '@kavyareddy', avatar: A(5) }, { name: 'Vikram Singh', handle: '@vikramsingh', avatar: A(7) },
    { name: 'Neha Sharma', handle: '@nehasharma', avatar: A(3) }, { name: 'Aditya Kumar', handle: '@adityabuilds', avatar: A(6) },
    { name: 'Pooja Menon', handle: '@poojamenon', avatar: A(8) }, { name: 'Karan Malhotra', handle: '@karanmalhotra', avatar: A(11) },
    { name: 'Ishita Banerjee', handle: '@ishitab', avatar: A(12) }, { name: 'Rahul Verma', handle: '@rahulverma', avatar: A(13) },
    { name: 'Sneha Pillai', handle: '@snehapillai', avatar: A(14) }, { name: 'Imran Qureshi', handle: '@imranq', avatar: A(15) }
  ];
  const streamTexts = {
    mentions: [
      'Flow 3.0 agents just automated our weekly ops report. Took fifteen minutes to set up. @nexorahq',
      '@nexorahq any plans for a native Salesforce connector in Flow?',
      'Watching the @nexorahq Summit keynote from Pune. The live agent demo was wild.',
      'Shoutout to @nexorahq support for fixing our SSO setup on a Sunday morning.',
      '@nexorahq publishing your SOC 2 report made our security review painless. More vendors should do this.'
    ],
    comments: [
      'This is exactly what our team needed.', 'Is this available on the Starter plan?', 'The new dashboard looks so clean.', 'Rolled it out to 40 people already.', 'What time does the webinar start?'
    ],
    hashtag: [
      'Built my first multi-step agent today. It drafts, reviews and files the weekly report. #AIAgents',
      'Hot take: the best AI agent is the one your team forgets is there. #AIAgents #FutureOfWork',
      'Agents plus human review is the sweet spot. #AIAgents',
      'Notes from tonight’s AI meetup: evals, evals, evals. #AIAgents'
    ],
    linkedin: [
      'Nexora is now SOC 2 Type II certified. Thank you to our security team for a year of quiet, careful work.',
      'We are hiring: Staff Product Designer, Bengaluru. Join a team that cares about craft and clarity.',
      'Ten thousand customers, three continents, one mission: make work feel lighter.'
    ],
    competitor: [
      'Introducing Vantage Agents, now in public beta for all Business plans.',
      'We have raised a $120M Series C to build the future of autonomous work.',
      'New: two-way integrations with Slack and Microsoft Teams.'
    ]
  };
  function streamItems(kind, net, n, seed) {
    const r = rng(seed); const texts = streamTexts[kind]; const out = [];
    for (let i = 0; i < n; i++) {
      const p = people[Math.floor(r() * people.length)];
      const comp = kind === 'competitor';
      out.push({
        id: kind + i, name: comp ? 'Vantage AI' : p.name, handle: comp ? '@vantageai' : p.handle,
        avatar: comp ? null : p.avatar, initials: comp ? 'VA' : null, net: net,
        text: texts[i % texts.length],
        time: new Date(Date.now() - (i * 47 + Math.floor(r() * 40) + 3) * 60000).toISOString(),
        media: (kind === 'hashtag' && i % 2 === 0) ? T([8, 6, 1, 13][i % 4]) : (kind === 'comments' && i === 1 ? T(5) : null),
        likes: Math.floor(r() * 240), replies: Math.floor(r() * 18), liked: false
      });
    }
    return out;
  }
  const boards = [
    { id: 'b1', name: 'Brand monitoring', streams: [
      { id: 's1', title: 'Mentions', net: 'x', handle: '@nexorahq', kind: 'mentions', items: streamItems('mentions', 'x', 6, 11) },
      { id: 's2', title: 'Comments', net: 'linkedin', handle: 'Company page', kind: 'comments', items: streamItems('comments', 'linkedin', 6, 12) },
      { id: 's3', title: '#AIAgents', net: 'instagram', handle: 'Hashtag', kind: 'hashtag', items: streamItems('hashtag', 'instagram', 5, 13) },
      { id: 's4', title: 'Company page', net: 'linkedin', handle: 'Nexora', kind: 'linkedin', items: streamItems('linkedin', 'linkedin', 3, 14) },
      { id: 's5', title: 'Scheduled', net: null, handle: 'All channels', kind: 'scheduled', items: [] }
    ] },
    { id: 'b2', name: 'Customer care', streams: [
      { id: 's6', title: 'Mentions', net: 'x', handle: '@nexorahq', kind: 'mentions', items: streamItems('mentions', 'x', 5, 21) },
      { id: 's7', title: 'Comments', net: 'facebook', handle: 'Nexora', kind: 'comments', items: streamItems('comments', 'facebook', 5, 22) },
      { id: 's8', title: 'Comments', net: 'instagram', handle: '@nexorahq', kind: 'comments', items: streamItems('comments', 'instagram', 5, 23) }
    ] },
    { id: 'b3', name: 'Competitors', streams: [
      { id: 's9', title: 'Vantage AI', net: 'linkedin', handle: 'Competitor', kind: 'competitor', items: streamItems('competitor', 'linkedin', 3, 31) },
      { id: 's10', title: '“workflow automation”', net: 'x', handle: 'Keyword', kind: 'hashtag', items: streamItems('hashtag', 'x', 4, 32) }
    ] }
  ];

  /* ---------- Analytics time series ---------- */
  SL.series = function (days, base, vol, trend, seed) {
    const r = rng(seed); const out = []; let v = base;
    for (let i = 0; i < days; i++) {
      const dow = new Date(today.getTime() - (days - 1 - i) * DAY).getDay();
      const weekly = (dow === 0 || dow === 6) ? 0.78 : 1.06;   // B2B audience: quieter weekends
      v = v * (1 + trend) + (r() - 0.5) * vol * base * 0.25;
      out.push(Math.max(0, Math.round(v * weekly * (1 + (r() - 0.5) * vol))));
    }
    return out;
  };
  SL.dayLabels = function (days) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) out.push(new Date(today.getTime() - i * DAY));
    return out;
  };

  /* ---------- Listening ---------- */
  const listening = {
    topics: [
      { id: 't1', name: 'Nexora', query: 'Nexora OR @nexorahq OR #Flow3' },
      { id: 't2', name: 'AI automation', query: '"workflow automation" OR #AIAgents OR "AI at work"' },
      { id: 't3', name: 'Competitors', query: '"Vantage AI" OR Corelink OR Stackwise' }
    ],
    terms: [
      { term: 'flow 3.0', count: 1284, growth: 212 }, { term: 'ai agents', count: 862, growth: 64 },
      { term: 'soc 2', count: 541, growth: 38 }, { term: 'nexora summit', count: 497, growth: 12 },
      { term: 'api status', count: 344, growth: -9 }, { term: 'okta sso', count: 318, growth: 21 },
      { term: 'pricing', count: 207, growth: 47 }
    ],
    sov: [
      { name: 'Nexora', value: 38 }, { name: 'Vantage AI', value: 29 },
      { name: 'Corelink', value: 21 }, { name: 'Stackwise', value: 12 }
    ],
    sentiment: { positive: 64, neutral: 27, negative: 9 }
  };

  /* ---------- Library ---------- */
  const assets = [
    { id: 'a1', name: 'Flow 3.0 launch', src: T(7), type: 'Image', tags: ['Flow 3.0 Launch', 'Product'], uses: 8 },
    { id: 'a2', name: 'Customer success team', src: T(5), type: 'Image', tags: ['Customers'], uses: 12 },
    { id: 'a3', name: 'Build Week', src: T(1), type: 'Video', tags: ['Life at Nexora'], uses: 3, duration: '0:42' },
    { id: 'a4', name: 'Pune office', src: T(12), type: 'Image', tags: ['Offices'], uses: 5 },
    { id: 'a5', name: 'Design sprint', src: T(2), type: 'Image', tags: ['Life at Nexora'], uses: 4 },
    { id: 'a6', name: 'Ananya, Staff Engineer', src: T(3), type: 'Image', tags: ['Spotlight'], uses: 2 },
    { id: 'a7', name: 'Engineering team', src: T(8), type: 'Image', tags: ['Thought Leadership'], uses: 6 },
    { id: 'a8', name: 'Summit session', src: T(9), type: 'Video', tags: ['Summit 2026'], uses: 7, duration: '0:58' },
    { id: 'a9', name: 'All-hands', src: T(6), type: 'Image', tags: ['Thought Leadership'], uses: 4 },
    { id: 'a10', name: '10,000 customers party', src: T(11), type: 'Image', tags: ['Life at Nexora'], uses: 9 },
    { id: 'a11', name: 'Hiring: Bengaluru', src: T(4), type: 'Image', tags: ['Hiring', 'Offices'], uses: 6 },
    { id: 'a12', name: 'Intern workshop', src: T(10), type: 'Video', tags: ['Life at Nexora'], uses: 1, duration: '0:31' },
    { id: 'a13', name: 'Hybrid work', src: T(14), type: 'Image', tags: ['Thought Leadership'], uses: 3 },
    { id: 'a14', name: 'Lakshmi Iyer, CISO', src: T(15), type: 'Image', tags: ['Spotlight', 'Security'], uses: 2 },
    { id: 'a15', name: 'Goa offsite', src: T(16), type: 'Image', tags: ['Lifestyle'], uses: 5 },
    { id: 'a16', name: 'Diwali at the office', src: T(17), type: 'Image', tags: ['Lifestyle'], uses: 4 },
    { id: 'a17', name: 'Wellness Wednesday', src: T(18), type: 'Video', tags: ['Lifestyle'], uses: 6, duration: '0:24' },
    { id: 'a18', name: 'Cricket league', src: T(19), type: 'Image', tags: ['Lifestyle'], uses: 3 },
    { id: 'a19', name: 'Nandini Rao, VP of People', src: T(20), type: 'Image', tags: ['Spotlight'], uses: 2 },
    { id: 'a20', name: 'Holi', src: T(21), type: 'Image', tags: ['Lifestyle'], uses: 7 },
    { id: 'a21', name: 'Thali Thursday', src: T(22), type: 'Image', tags: ['Lifestyle'], uses: 3 },
    { id: 'a22', name: 'Family Day', src: T(23), type: 'Image', tags: ['Lifestyle'], uses: 4 },
    { id: 'a23', name: 'Hyderabad team', src: T(13), type: 'Image', tags: ['Hiring'], uses: 2 }
  ];
  const templates = [
    { id: 'tp1', name: 'Product launch', text: 'Introducing [feature]. [One-line benefit]. Available today on [plans]. Learn more: [link]', uses: 14 },
    { id: 'tp2', name: 'Event announcement', text: '[Event] is on [date] in [city]. [What to expect]. Register at [link].', uses: 9 },
    { id: 'tp3', name: 'Customer story', text: 'How [customer] [result] with [product]. [One detail that makes it real]. Read the full story: [link]', uses: 6 },
    { id: 'tp4', name: 'Employee spotlight', text: 'Meet [name], [role] on our [team] team. [One surprising fact]. #LifeAtNexora', uses: 11 },
    { id: 'tp5', name: 'Incident update', text: 'We are aware of [issue] affecting [scope]. Our engineers are on it; next update in [time]. Live status: [link]', uses: 23 },
    { id: 'tp6', name: 'Hiring', text: 'We are hiring: [role] in [location]. [Why this team is special]. Apply: [link] #WeAreHiring', uses: 4 }
  ];
  const hashtagSets = [
    { id: 'h1', name: 'Core brand', tags: ['#Nexora', '#Flow3', '#AIAgents', '#FutureOfWork'] },
    { id: 'h2', name: 'Life at Nexora', tags: ['#LifeAtNexora', '#TeamCulture', '#HybridWork', '#TechCareers', '#BengaluruTech'] },
    { id: 'h3', name: 'Summit 2026', tags: ['#NexoraSummit', '#AIatWork', '#SaaS', '#Keynote'] },
    { id: 'h4', name: 'Hiring', tags: ['#WeAreHiring', '#TechJobs', '#EngineeringJobs'] }
  ];

  /* ---------- Notifications ---------- */
  const notifications = [
    { id: 'n1', icon: 'badge-check', text: '<b>Priya Nair</b> approved “Build Week 2026: 48 hours, 62 teams”', time: at(0, 9, 50), unread: true },
    { id: 'n2', icon: 'message-circle', text: '<b>Vikram Singh</b> mentioned Nexora on X: API returning 503 errors', time: at(0, 9, 5), unread: true, href: '#/inbox/c2' },
    { id: 'n3', icon: 'trending-up', text: 'Your LinkedIn post “Flow 3.0 is here” is trending: <b>4.1× usual reach</b>', time: at(0, 8, 40), unread: true, href: '#/analytics' },
    { id: 'n4', icon: 'triangle-alert', text: 'A post to <b>Facebook</b> failed: the access token expired', time: at(-1, 17, 0), unread: true, href: '#/settings/channels' },
    { id: 'n5', icon: 'user-plus', text: '<b>Siddharth Rao</b> joined the workspace as Contributor', time: at(-2, 10, 0), unread: false }
  ];

  /* ---------- Persistence ---------- */
  const VERSION = 6;
  function load(key, build) {
    const saved = SL.store.get('data:' + key, null);
    if (saved && saved.v === VERSION) return saved.items;
    const items = build();
    SL.store.set('data:' + key, { v: VERSION, items: items });
    return items;
  }

  SL.data = {
    brand: brand,
    user: user, team: team, channels: channels, limits: limits, campaigns: campaigns,
    posts: load('posts', buildPosts),
    conversations: load('conversations', buildConversations),
    boards: boards, listening: listening,
    assets: load('assets', function () { return assets; }),
    templates: templates, hashtagSets: hashtagSets, notifications: notifications,
    captions: captions,
    save: function (key) { SL.store.set('data:' + key, { v: VERSION, items: SL.data[key] }); },
    reset: function () {
      ['posts', 'conversations', 'assets'].forEach(function (k) { SL.store.del('data:' + k); });
      location.reload();
    },
    channel: function (id) { return channels.find(function (c) { return c.id === id; }); },
    member: function (id) { return team.find(function (m) { return m.id === id; }) || user; },
    postsOn: function (date) {
      const d0 = new Date(date); d0.setHours(0, 0, 0, 0);
      const d1 = d0.getTime() + DAY;
      return SL.data.posts.filter(function (p) { const t = new Date(p.date).getTime(); return t >= d0.getTime() && t < d1; })
        .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    }
  };
  SL.DAY = DAY;

  /* ---------- Shared render helpers ---------- */
  SL.statusMeta = {
    scheduled: { label: 'Scheduled', icon: 'clock', cls: 'st-scheduled' },
    published: { label: 'Published', icon: 'circle-check', cls: 'st-published' },
    draft: { label: 'Draft', icon: 'pencil', cls: 'st-draft' },
    approval: { label: 'Needs approval', icon: 'hourglass', cls: 'st-approval' },
    failed: { label: 'Failed', icon: 'triangle-alert', cls: 'st-failed' }
  };
  SL.statusLabel = function (s) {
    const m = SL.statusMeta[s];
    return '<span class="status ' + m.cls + '">' + SL.icon(m.icon, 14) + m.label + '</span>';
  };
  SL.channelBadges = function (ids, size) {
    return '<span class="net-row">' + ids.map(function (id) { const c = SL.data.channel(id); return c ? SL.netBadge(c.net, size || 18) : ''; }).join('') + '</span>';
  };
  /* Brand avatar used in previews and the workspace switcher */
  SL.brandMark = function (size) {
    return '<span class="brand-chip" style="--bs:' + (size || 34) + 'px" aria-hidden="true">' + brand.initials + '</span>';
  };
})(window.SL);
