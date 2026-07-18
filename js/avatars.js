/* ==========================================================================
   NCSmall.Farm V.2 — Avatars & Persona Pathways
   5 AI virtual assistants: Aggie hero + 4 Cooperative Extension tiers
   ========================================================================== */

window.AVATARS = [
  { id: 'kenji',   name: 'Aggie',   specialty: 'AI Assistant',                        img: 'images/Aggie-Bulldog.png', role: 'navigator',  voiceName: 'Enceladus', desc: 'your friendly AI bulldog assistant powered by ncsmall.farm, here to guide you through NC Cooperative Extension services.',    subtitle: 'Your AI Assistant — ncsmall.farm' },
  { id: 'chris',   name: 'Chris',   specialty: 'Agriculture & Natural Resources',    img: 'images/Chris-NCExt.png',   role: 'agriculture', voiceName: 'Orus',      desc: 'experienced specialist in farming, conservation, livestock, crops, soil health, water resources, and land management.', subtitle: 'Agriculture & Natural Resources' },
  { id: 'nadia',   name: 'Nadia',   specialty: 'Families & Consumers',               img: 'images/Nadia-NCExt.png',   role: 'families',    voiceName: 'Charon',    desc: 'compassionate educator specializing in nutrition, food safety, health & wellness, and financial literacy for families.', subtitle: 'Families & Consumers' },
  { id: 'barbara', name: 'Barbara', specialty: 'Community & Economic Development',   img: 'images/Barbara-NCExt.png', role: 'community',   voiceName: 'Callirrhoe', desc: 'community development specialist focused on partnerships, asset-based design, grants, and economic opportunity.',       subtitle: 'Community & Economic Development' },
  { id: 'justin',  name: 'Justin',  specialty: 'Events & Opportunities',             img: 'images/Justin-NCExt.png',  role: 'events',      voiceName: 'Fenrir',    desc: 'enthusiastic coordinator connecting you to workshops, extension events, public funding, and community opportunities.', subtitle: 'Events & Opportunities' }
];

window.PERSONA_STEPS = {
  navigator: [
    { id: 1, title: 'Welcome',              desc: 'Tell me about your needs. I\'ll connect you with the right specialist.' },
    { id: 2, title: 'Explore Services',      desc: 'Browse our programs, resources, and community tools.' },
    { id: 3, title: 'Get Connected',         desc: 'I\'ll introduce you to the best assistant for your situation.' }
  ],
  agriculture: [
    { id: 1, title: 'Property Assessment',   desc: 'Evaluate your land, soil types, livestock, and current farm operations.' },
    { id: 2, title: 'Conservation Planning',  desc: 'Identify NRCS conservation practices for your property.' },
    { id: 3, title: 'Crop & Livestock Plan',  desc: 'Plan cover crops, rotational grazing, pest management, and animal care.' },
    { id: 4, title: 'Natural Resources',      desc: 'Protect water, wildlife habitat, riparian buffers, and forest land.' },
    { id: 5, title: 'Funding & Implementation', desc: 'Apply for EQIP, CSP, CRP and work with a planner to implement your plan.' }
  ],
  families: [
    { id: 1, title: 'Needs Assessment',      desc: 'Identify your family\'s nutrition, health, food safety, and financial goals.' },
    { id: 2, title: 'Healthy Living Plan',    desc: 'Create meal plans, food budgets, and wellness strategies using local produce.' },
    { id: 3, title: 'Food Safety & Quality',  desc: 'Learn GAP certification, food handling, labeling, and value-added processing.' },
    { id: 4, title: 'Financial Literacy',     desc: 'Build budgets, understand SNAP benefits, and access financial education resources.' },
    { id: 5, title: 'Community Connections',  desc: 'Link with community gardens, farmers markets, clinics, and wellness programs.' }
  ],
  community: [
    { id: 1, title: 'Community Asset Mapping', desc: 'Identify existing strengths — people, associations, institutions, and local knowledge.' },
    { id: 2, title: 'Stakeholder Engagement',  desc: 'Connect with farmers, community leaders, and organizations who share your goals.' },
    { id: 3, title: 'Partnership Development',  desc: 'Build relationships with Cooperative Extension, NRCS, and community coalitions.' },
    { id: 4, title: 'Grant & Funding Strategy', desc: 'Navigate USDA grants, community grants, foundation funding, and budget development.' },
    { id: 5, title: 'Sustainable Action Plan',  desc: 'Develop a community-led implementation roadmap with measurable outcomes.' }
  ],
  events: [
    { id: 1, title: 'Discover Events',       desc: 'Browse upcoming workshops, trainings, field days, and extension programs.' },
    { id: 2, title: 'Funding Opportunities',  desc: 'Explore community grants, foundation funding, and public funding announcements.' },
    { id: 3, title: 'Submit an Event',        desc: 'Share your own workshop, field day, or community event for the calendar.' },
    { id: 4, title: 'Get Registered',         desc: 'Sign up for events, download materials, and add dates to your calendar.' },
    { id: 5, title: 'Stay Connected',         desc: 'Subscribe to alerts for new events and opportunities in your area.' }
  ]
};

window.PERSONA_RESOURCES = {
  navigator: [
    { label: 'USDA Service Center Locator', url: 'https://offices.sc.egov.usda.gov/locator/app', desc: 'Find your local NRCS, FSA & RD offices' },
    { label: 'NRCS Conservation Programs', url: 'https://www.nrcs.usda.gov/programs-initiatives', desc: 'Browse all available conservation programs' },
    { label: 'Login.gov Account Setup', url: 'https://www.login.gov/', desc: 'Required for USDA online services' },
    { label: 'NC Cooperative Extension', url: 'https://www.ces.ncsu.edu/', desc: 'NC State Extension resources & county centers' }
  ],
  agriculture: [
    { label: 'NRCS Practice Standards (EFOTG)', url: 'https://efotg.sc.egov.usda.gov/#/', desc: 'Official conservation practice standards library' },
    { label: 'EQIP Program', url: 'https://www.nrcs.usda.gov/programs-initiatives/eqip-environmental-quality-incentives-program', desc: 'Environmental Quality Incentives Program' },
    { label: 'Web Soil Survey', url: 'https://websoilsurvey.nrcs.usda.gov/', desc: 'USDA soil maps and data for your property' },
    { label: 'NRCS Plant Materials Center', url: 'https://www.nrcs.usda.gov/plant-materials', desc: 'Native plants and cover crop resources' },
    { label: 'SARE Cover Crop Guide', url: 'https://www.sare.org/resources/cover-crops/', desc: 'Cover crop selection and management' },
    { label: 'NC State IPM', url: 'https://ipm.ncsu.edu/', desc: 'Integrated Pest Management resources' },
    { label: 'USDA PLANTS Database', url: 'https://plants.usda.gov/', desc: 'Plant identification and native species data' },
    { label: 'NC DACS Veterinary Programs', url: 'https://www.ncagr.gov/vet/', desc: 'NC animal health programs and resources' },
    { label: 'USDA APHIS Animal Health', url: 'https://www.aphis.usda.gov/livestock-poultry-disease', desc: 'Federal disease monitoring & health resources' },
    { label: 'CPA-1200 Conservation Plan Form', url: 'https://www.nrcs.usda.gov/sites/default/files/2022-09/CPA-1200.pdf', desc: 'Standard NRCS conservation plan document' },
    { label: 'TSP Registry', url: 'https://www.nrcs.usda.gov/getting-assistance/technical-service-providers', desc: 'Find a certified Technical Service Provider' },
    { label: 'NC DEQ Water Resources', url: 'https://www.deq.nc.gov/about/divisions/water-resources', desc: 'NC water quality regulations and programs' }
  ],
  families: [
    { label: 'USDA GAP/GHP Audit Program', url: 'https://www.ams.usda.gov/services/auditing/gap-ghp', desc: 'Good Agricultural Practices certification' },
    { label: 'FDA FSMA Produce Safety Rule', url: 'https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-produce-safety', desc: 'Federal produce safety requirements' },
    { label: 'USDA SNAP-Ed', url: 'https://snaped.fns.usda.gov/', desc: 'Nutrition education and healthy eating resources' },
    { label: 'USDA MyPlate', url: 'https://www.myplate.gov/', desc: 'Federal nutrition guidelines and meal planning' },
    { label: 'NC Extension Nutrition', url: 'https://www.ces.ncsu.edu/family-consumer-sciences/nutrition/', desc: 'NC nutrition education programs' },
    { label: 'Value-Added Producer Grants', url: 'https://www.rd.usda.gov/programs-services/business-programs/value-added-producer-grants', desc: 'USDA funding for value-added products' },
    { label: 'USDA Food Access Research Atlas', url: 'https://www.ers.usda.gov/data-products/food-access-research-atlas/', desc: 'Food desert and access data by county' },
    { label: 'NC DACS Food & Drug Division', url: 'https://www.ncagr.gov/fooddrug/', desc: 'NC food safety programs and licensing' }
  ],
  community: [
    { label: 'ABCD Institute', url: 'https://resources.depaul.edu/abcd-institute/', desc: 'Asset Based Community Development resources and tools' },
    { label: 'USDA Rural Development', url: 'https://www.rd.usda.gov/', desc: 'USDA programs for rural community investment' },
    { label: 'Grants.gov', url: 'https://www.grants.gov/', desc: 'Federal grant listings and applications' },
    { label: 'USDA 2501 Program', url: 'https://www.usda.gov/2501-program', desc: 'Outreach for socially disadvantaged farmers' },
    { label: 'SF-424 Application Package', url: 'https://www.grants.gov/forms/sf-424-family', desc: 'Standard federal grant application forms' },
    { label: 'NC Cooperative Extension', url: 'https://www.ces.ncsu.edu/', desc: 'Local extension centers and community programs' },
    { label: 'USDA Community Food Projects', url: 'https://www.nifa.usda.gov/grants/programs/community-food-projects-competitive-grant-program', desc: 'Grants for community-driven food system projects' }
  ],
  events: [
    { label: 'NC Cooperative Extension Events', url: 'https://www.ces.ncsu.edu/events/', desc: 'Browse upcoming extension workshops and trainings' },
    { label: 'NRCS NC Events Calendar', url: 'https://www.nrcs.usda.gov/events', desc: 'USDA conservation events and field days' },
    { label: 'Grants.gov Search', url: 'https://www.grants.gov/search-grants', desc: 'Search active federal funding opportunities' },
    { label: 'USDA Rural Development Grants', url: 'https://www.rd.usda.gov/programs-services', desc: 'Rural community investment programs' },
    { label: 'NC Foundation Grants', url: 'https://www.nccommunityfoundation.org/', desc: 'NC community foundation funding opportunities' },
    { label: 'Conservation Innovation Grants (CIG)', url: 'https://www.nrcs.usda.gov/programs-initiatives/cig-conservation-innovation-grants', desc: 'USDA funding for ag technology and innovation' }
  ]
};

window.EXTERNAL_LINKS = {
  loginGov:       'https://www.login.gov/',
  registry:       'https://www.nrcs.usda.gov/getting-assistance/technical-service-providers',
  agLearn:        'https://aglearn.usda.gov/',
  efotg:          'https://efotg.sc.egov.usda.gov/#/',
  eqip:           'https://www.nrcs.usda.gov/programs-initiatives/eqip-environmental-quality-incentives-program',
  stress:         'https://ncsmall.farm/',
  coordinatorMap: 'https://www.nrcs.usda.gov/sites/default/files/2025-12/NRCS%20TSP%20Regional%20Coordinator%20Map%20%20-%20Dec-2025_0.pdf'
};

/**
 * Get avatar config by ID.
 * @param {string} id - Avatar ID
 * @returns {Object} Avatar config
 */
window.getAvatar = function(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
};

/**
 * Get avatar config by role.
 * @param {string} role - Role name
 * @returns {Object} Avatar config
 */
window.getAvatarByRole = function(role) {
  return AVATARS.find(a => a.role === role) || AVATARS[0];
};

/**
 * Local keyword-based triage fallback for routing user queries to the right specialist.
 * Routes to one of the 4 Cooperative Extension tiers.
 * @param {string} text - User input
 * @returns {Object} { role, id, name, greeting }
 */
window.localTriage = function(text) {
  const lower = text.toLowerCase();

  // Agriculture & Natural Resources
  if (/plant|crop|seed|soil|pest|weed|fertiliz|compost|harvest|vegetable|fruit|cover crop|rotation|greenhouse|high tunnel|organic|animal|livestock|cattle|poultry|chicken|goat|sheep|pig|horse|pasture|graze|vet|feed|hay|forage|herd|water|stream|wetland|forest|wildlife|habitat|erosion|conservation|buffer|pollinator|watershed|riparian|crp|acep|farm|land|acre|field|terrace|drain|irrig|tech|technology|drone|sensor|precision|mapping/i.test(lower)) {
    return { role: 'agriculture', id: 'chris', name: 'Chris', greeting: 'Welcome! I\'m Chris, your Agriculture & Natural Resources specialist. Whether it\'s crops, livestock, conservation, or land management — I\'m here to help.' };
  }
  // Families & Consumers
  if (/health|nutrition|diet|meal|snap|food|safety|processing|label|fda|gap|haccp|kitchen|value.?added|jam|sauce|preserv|wellness|cooking|recipe|exercise|diabetes|family|consumer|budget|financial|money|literacy|saving/i.test(lower)) {
    return { role: 'families', id: 'nadia', name: 'Nadia', greeting: 'Hello! I\'m Nadia, your Families & Consumers specialist. I can help with nutrition, food safety, health & wellness, and financial education.' };
  }
  // Community & Economic Development
  if (/community|asset.?based|abcd|coalition|partnership|neighborhood|association|civic|cooperat|network|engagement|capacity|grant|funding|proposal|narrative|award|compliance|economic|development|rural|stakeholder/i.test(lower)) {
    return { role: 'community', id: 'barbara', name: 'Barbara', greeting: 'Hello! I\'m Barbara, your Community & Economic Development specialist. Let me help you build partnerships and access funding opportunities.' };
  }
  // Events & Opportunities
  if (/event|calendar|workshop|training|conference|meeting|field day|opportunity|schedule|register|sign.?up|webinar|seminar/i.test(lower)) {
    return { role: 'events', id: 'justin', name: 'Justin', greeting: 'Hey there! I\'m Justin, your Events & Opportunities coordinator. Let me help you find upcoming workshops, funding opportunities, and community events.' };
  }

  // Default: Agriculture & Natural Resources (Chris)
  return { role: 'agriculture', id: 'chris', name: 'Chris', greeting: 'Welcome! I\'m Chris, your Agriculture & Natural Resources specialist. How can I help you with your farm or land today?' };
};
