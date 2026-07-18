/* ==========================================================================
   NCSmall.Farm V.2 — Static Pages
   About, FAQ, Contact (compliance content), Resources
   ========================================================================== */

(function() {

  /* ─── Page shell helpers ─── */

  function pageShell(title, ...sections) {
    return h('div', { className: 'w-full mx-auto fade-in', style: { maxWidth: '900px' } },
      h('h1', { style: { fontSize: '2.25rem', fontWeight: '900', color: 'var(--aggie-blue)', marginBottom: '1.5rem', textAlign: 'center' } }, title),
      ...sections
    );
  }

  function card(heading, ...children) {
    return h('div', { className: 'glass rounded-2xl p-6 shadow-md border border-light mb-6' },
      heading ? h('h2', { style: { fontSize: '1.3rem', fontWeight: '800', color: 'var(--aggie-blue)', marginBottom: '0.75rem' } }, heading) : null,
      ...children
    );
  }

  function p(text) {
    return h('p', { style: { fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' } }, text);
  }

  /* ─── About ─── */

  window.renderAbout = function() {
    const coreServices = [
      { icon: 'eco', title: 'Agriculture & Natural Resources', desc: 'Conservation planning, crop and livestock guidance, soil health, water resources, wildlife habitat, and NRCS practice recommendations.' },
      { icon: 'family_restroom', title: 'Families & Consumers', desc: 'Nutrition education, food safety, GAP certification, healthy eating plans, financial literacy, and SNAP-Ed resources.' },
      { icon: 'handshake', title: 'Community & Economic Development', desc: 'Asset-based community design, grant writing, partnership development, economic opportunity, and community coalition building.' },
      { icon: 'event', title: 'Events & Opportunities', desc: 'Workshops, extension trainings, field days, public funding announcements, and community events calendar.' },
      { icon: 'map', title: 'Geoscope Farm Analysis', desc: 'Satellite-based property analysis with zone mapping, conservation recommendations, and downloadable reports.' },
      { icon: 'smartphone', title: 'Mobile Field Tools (PPGIS)', desc: 'GPS-enabled participatory mapping tools for field surveys, photo documentation, and offline data collection.' },
      { icon: 'smart_toy', title: 'AI Assistant', desc: 'Aggie, your AI assistant powered by ncsmall.farm, provides instant guidance across all NC Cooperative Extension program areas.' }
    ];

    return pageShell('About SFRIC',
      card('Our Mission',
        p('The Small Farm Research and Innovation Center (SFRIC) at North Carolina Agricultural and Technical State University supports small, limited-resource, and socially disadvantaged farmers through research, education, and community engagement.'),
        p('As part of NC A&T\'s Cooperative Extension Program, SFRIC serves as a bridge between USDA Natural Resources Conservation Service (NRCS) programs and the farming communities that need them most.')
      ),
      card('NC Cooperative Extension',
        p('NC Cooperative Extension is a partnership between NC A&T State University, NC State University, and 100 county governments. Together we serve North Carolina through three core program areas: Agriculture & Natural Resources, Families & Consumers, and Community & Economic Development.'),
        p('Our Digital Navigator platform uses an AI-powered assistant named Aggie to make extension services more accessible. Aggie helps you navigate all our program areas — agriculture, families, community development, and events — from a single conversation.')
      ),
      card('Our Partnership Ecosystem',
        p('SFRIC operates at the intersection of higher education, federal conservation policy, and community development. Key partners include USDA NRCS, NC Cooperative Extension, and local farming cooperatives across North Carolina.'),
        p('Our Digital Land-Grant initiative leverages NC A&T\'s 1890 land-grant mission to create open, accessible technology platforms that serve underrepresented agricultural communities.')
      ),
      card('Small Farm & Business Development',
        p('SFRIC supports small, limited-resource, and socially disadvantaged farmers through hands-on business development services. From developing farm business plans and accessing USDA programs to building cooperative marketing networks, we help farmers build sustainable agricultural enterprises.'),
        p('Services include farm financial planning, record-keeping workshops, cooperative formation assistance, and connections to USDA Farm Service Agency resources for beginning and underserved farmers.')
      ),
      card('Agricultural Market Development',
        p('Through partnerships with NC Cooperative Extension and local agricultural networks, SFRIC helps small farmers access profitable market channels. We provide training on direct-to-consumer sales, farmers market participation, Community Supported Agriculture (CSA) programs, and value-added product development.'),
        p('Our market development team connects producers with institutional buyers, restaurant partnerships, and regional food hub networks to expand market access for North Carolina\'s small farm community.')
      ),
      h('h2', { style: { fontSize: '1.75rem', fontWeight: '900', color: 'var(--aggie-blue)', margin: '2rem 0 1rem', textAlign: 'center' } }, 'Core Work'),
      h('div', { className: 'grid gap-5', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' } },
        ...coreServices.map(s =>
          h('div', { className: 'glass rounded-xl p-5 shadow-md border border-light card-hover' },
            h('div', { className: 'material-icons-round', style: { fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--nrcs-green)' } }, s.icon),
            h('h3', { style: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--aggie-blue)', marginBottom: '0.5rem' } }, s.title),
            h('p', { style: { fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' } }, s.desc)
          )
        )
      )
    );
  };

  /* ─── FAQ ─── */

  window.renderFAQ = function() {
    const faqs = [
      { q: 'What is NC Cooperative Extension?', a: 'NC Cooperative Extension is a partnership between NC A&T State University, NC State University, and 100 county governments. We deliver research-based programs in Agriculture & Natural Resources, Families & Consumers, and Community & Economic Development.' },
      { q: 'How does the AI assistant work?', a: 'Aggie is your AI assistant powered by ncsmall.farm. Just type your question or describe your situation, and Aggie will provide guidance across Agriculture & Natural Resources, Families & Consumers, Community & Economic Development, and Events & Opportunities.' },
      { q: 'How do I access USDA assistance?', a: 'USDA provides a wide range of assistance through local Service Centers. Contact your local NRCS office to discuss conservation programs, or visit your local Farm Service Agency (FSA) to establish a farm number. You can also connect with your local Cooperative Extension Service for technical education and hands-on support.' },
      { q: 'What is a farm?', a: 'The definition is broken down by the following criteria:\n\n• The $1,000 Rule: Agricultural sales must meet or exceed $1,000. This includes crops, livestock, poultry, and nursery products.\n\n• "Normally Would Have" (Point System): Operations with less than $1,000 in sales can still be classified as farms using a point system. The USDA assigns values to specific acreages and livestock heads to determine if an operation has the potential to generate $1,000 in a typical year.\n\n• Government Payments: Farms that receive $1,000 or more in U.S. government agricultural payments automatically qualify, even if they currently have no sales.' },
      { q: 'Is this platform available in other languages?', a: 'Yes! We support 8 languages: English, Spanish, French, Chinese, Vietnamese, Korean, Haitian Creole, and Arabic. Use the language selector in the header.' },
      { q: 'Is my data private?', a: 'Yes, ncsmall.farm stores none of your personal data.' },
      { q: 'How do I connect with a real person?', a: 'Use the Contact page or ask any virtual assistant to help locate your local NRCS service center or Cooperative Extension county center. You can also visit offices.sc.egov.usda.gov.' }
    ];

    return pageShell('Frequently Asked Questions',
      ...faqs.map((faq, i) =>
        card(null,
          h('h3', { style: { fontSize: '1.05rem', fontWeight: '800', color: 'var(--aggie-blue)', marginBottom: '0.5rem' } }, `${i + 1}. ${faq.q}`),
          p(faq.a)
        )
      )
    );
  };

  /* ─── Contact ─── */

  window.renderContact = function() {
    return pageShell('Contact Us',
      card('Small Farm Research and Innovation Center',
        h('div', { className: 'grid gap-4', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' } },
          h('div', null,
            h('h3', { className: 'flex items-center gap-1', style: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--nrcs-green)', textTransform: 'uppercase', marginBottom: '0.5rem' } }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'place'), 'Address'),
            p('CH Moore Agricultural Research Station\nNorth Carolina Agricultural and Technical State University\n421 Beech Street\nGreensboro, NC 27411')
          ),
          h('div', null,
            h('h3', { className: 'flex items-center gap-1', style: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--nrcs-green)', textTransform: 'uppercase', marginBottom: '0.5rem' } }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'phone'), 'Phone'),
            p('336-285-3115')
          ),
          h('div', null,
            h('h3', { className: 'flex items-center gap-1', style: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--nrcs-green)', textTransform: 'uppercase', marginBottom: '0.5rem' } }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'language'), 'Website'),
            h('a', { href: 'https://ncsmall.farm', target: '_blank', style: { color: 'var(--aggie-blue)', fontWeight: '600' } }, 'ncsmall.farm')
          ),
          h('div', null,
            h('h3', { className: 'flex items-center gap-1', style: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--nrcs-green)', textTransform: 'uppercase', marginBottom: '0.5rem' } }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'schedule'), 'Office Hours'),
            p('Monday – Friday\n8:00 AM – 5:00 PM EST')
          )
        )
      ),
      card('Find Your Local USDA Office',
        p('For in-person assistance, visit the USDA Service Center Locator.'),
        h('a', {
          href: 'https://offices.sc.egov.usda.gov/locator/app',
          target: '_blank',
          className: 'btn-federal inline-block px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 max-w-fit',
          style: { textDecoration: 'none', marginTop: '0.5rem' }
        }, h('span', { className: 'material-icons-round' }, 'account_balance'), 'USDA Service Center Locator')
      ),
      card('Find Your Local Cooperative Extension Center',
        p('For in-person assistance, visit your local Cooperative Extension Center.'),
        h('a', {
          href: 'https://www.ces.ncsu.edu/local-county-center/',
          target: '_blank',
          className: 'btn-federal inline-block px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 max-w-fit',
          style: { textDecoration: 'none', marginTop: '0.5rem', backgroundColor: 'var(--nrcs-green)' }
        }, h('span', { className: 'material-icons-round' }, 'park'), 'Find Your Cooperative Extension Center')
      )
    );
  };

  /* ─── Resources ─── */
  
  window.renderResources = function() {
    return pageShell('Resources',
      ...Object.keys(window.PERSONA_RESOURCES).map(role => {
        const title = window.getAvatarByRole(role).subtitle || role;
        return card(title,
          h('ul', { className: 'space-y-3' },
            ...window.PERSONA_RESOURCES[role].map(res => 
              h('li', { className: 'flex flex-col' },
                h('a', { href: res.url, target: '_blank', className: 'font-bold text-aggie-blue flex items-center gap-1' }, h('span', { className: 'material-icons-round', style: { fontSize: '1rem' } }, 'link'), res.label),
                h('span', { className: 'text-sm text-text-muted ml-5' }, res.desc)
              )
            )
          )
        );
      })
    );
  };

})();
