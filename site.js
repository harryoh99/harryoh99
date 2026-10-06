/* 화면을 만드는 코드. 일반적인 내용 수정은 content.js에서 하세요. */
(() => {
  "use strict";
  const s = window.SITE;
  if (!s) return;
  const esc = (v = "") => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = value => {
    const str = String(value ?? "").trim();
    if (!str || /^(?:javascript|data|vbscript):/i.test(str)) return "";
    return /^(?:https?:|mailto:|#|\.?\.?\/|[a-zA-Z0-9_-]+(?:\/|\.[a-zA-Z]))/.test(str) ? str : "";
  };
  const link = (label, url, cls = "") => {
    const href = safeUrl(url);
    return href ? `<a href="${esc(href)}"${cls ? ` class="${esc(cls)}"` : ""}>${esc(label)}</a>` : esc(label);
  };
  const imageUrl = value => /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value || "") ? value : safeUrl(value);
  const resources = (items = []) => items.length ? `<div class="resource-links">${items.map(i => link(i.label, i.url)).join("")}</div>` : "";
  function mentors(value, className = "mentors", heading = "") {
    const list = Array.isArray(value) ? value : String(value || "").split(/,\s*(?:and\s+)?|\s+and\s+|\n/);
    const people = list.map(person => typeof person === "string" ? {label: person.trim(), url: ""} : {label: String(person?.label ?? person?.name ?? "").trim(), url: person?.url || ""}).filter(person => person.label);
    return people.length ? `<p class="${esc(className)}"><span class="mentor-label">${esc(heading || (people.length === 1 ? "Mentor:" : "Mentors:"))}</span> ${people.map(person => link(person.label, person.url)).join(" · ")}</p>` : "";
  }
  const validSections = (s.sections || []).filter(x => x.visible !== false && /^[a-z][a-z0-9-]*$/.test(x.id));
  const p = s.profile;
  const layout = s.layout || {};
  const isHomeSection = section => (section.placement || (section.id === 'news' ? 'home' : 'tab')) === 'home';
  const tabSections = validSections.filter(section => !isHomeSection(section));
  document.body.dataset.portrait = ["left", "right", "none"].includes(layout.portraitSide) ? layout.portraitSide : "left";
  document.body.dataset.publications = layout.publications === "grid" ? "grid" : "list";
  document.body.dataset.sticky = String(layout.stickyHeader !== false);
  document.body.dataset.sectionNumbers = String(layout.showSectionNumbers !== false);
  document.body.dataset.researchColumns = String(Math.max(1, Math.min(3, Number(layout.researchColumns) || 1)));
  document.documentElement.style.setProperty("--research-columns", Math.max(1, Math.min(3, Number(layout.researchColumns) || 1)));
  const themeKeys = { paper: "--paper", surface: "--surface", warmAccent: "--warm-accent", nameFont: "--name-font", accent: "--accent", accentHover: "--accent-hover", accentSoft: "--accent-soft", researchBackground: "--research-background", pageWidth: "--page-width", sectionGap: "--section-gap", bodySize: "--body-size", portraitWidth: "--portrait-width", nameSize: "--name-size" };
  for (const [key, variable] of Object.entries(themeKeys)) if (s.design?.[key]) document.documentElement.style.setProperty(variable, s.design[key]);
  document.title = s.meta.title;
  const setMeta = (selector, attr, value) => document.querySelector(selector)?.setAttribute(attr, value);
  setMeta('meta[name="description"]', "content", s.meta.description);
  setMeta('meta[property="og:title"]', "content", s.meta.title);
  setMeta('meta[property="og:description"]', "content", s.meta.description);
  setMeta('meta[property="og:url"]', "content", s.meta.url);
  setMeta('link[rel="canonical"]', "href", s.meta.url);

  document.getElementById("header").innerHTML = `<div class="header-inner">
    <div class="identity">
      <h1 id="name">${link(p.name, '#about', 'brand')}</h1>
      <p class="identity-role"><span>${esc(p.role)}</span><span>${esc(p.affiliation)}</span></p>
    </div>
    <figure class="profile-photo"><div class="portrait-frame"><img src="${esc(imageUrl(p.portrait))}" alt="${esc(p.portraitAlt)}" width="1280" height="1201" fetchpriority="high"></div>${p.portraitCaption ? `<figcaption class="photo-caption">${esc(p.portraitCaption)}</figcaption>` : ''}</figure>
    <div class="identity-details">
      <div class="profile-meta">${link(p.lab, p.labUrl, 'lab')}<span class="location">${esc(p.location)}</span>${link(p.email, `mailto:${p.email}`)}</div>
      <div class="profile-links" aria-label="Academic and social profiles">${(p.links || []).map(i => link(i.label, i.url)).join('')}${p.cv?.url ? link(p.cv.label || 'CV', p.cv.url, 'cv-link') : ''}</div>
    </div>
    <nav class="nav" id="navigation" role="tablist" aria-orientation="vertical" aria-label="Profile sections"><a href="#about" id="tab-about" role="tab" aria-controls="view-about" aria-selected="true">About</a>${tabSections.filter(x => x.nav !== false).map(x => `<a href="#${x.id}" id="tab-${x.id}" role="tab" aria-controls="${x.id}" aria-selected="false" tabindex="-1">${esc(x.navLabel || x.title)}</a>`).join('')}</nav>
  </div>`;

  function highlights() {
    const experienceById = new Map((s.experience || []).map(e => [e.id,e]));
    const papersById = new Map((s.publications || []).map(paper => [paper.id,paper]));
    const entries = (s.highlights || []).filter(entry => entry.visible !== false);
    if (!entries.length) return '';
    const limit=Math.max(0,Math.floor(Number(layout.highlightsVisible ?? 5)));
    const scrollable=limit>0 && entries.length>limit;
    return `<div class="intro-highlights" aria-label="Internships and collaborations"><h2>${esc(p.highlightsTitle || 'Internships & collaborations')}</h2><div class="highlights-scroll"${scrollable ? ' tabindex="0" role="region" aria-label="Internships and collaborations; scroll for earlier experience"' : ''}><ul>${entries.map(entry => {
      const institution = experienceById.get(entry.experienceId);
      const papers = (entry.publicationIds || []).map(id => papersById.get(id)).filter(Boolean);
      return `<li class="highlight-row"><div class="highlight-institution">${institution?.image ? `<img src="${esc(imageUrl(institution.image))}" alt="" width="28" height="28">` : ''}<div>${link(entry.label || institution?.organization || '',institution ? '#experience-'+institution.id : '')}${entry.context ? `<span>${esc(entry.context)}</span>` : ''}</div></div><div class="highlight-work">${papers.length ? `<div class="highlight-papers">${papers.map(paper => `<span class="highlight-paper"><a href="#paper-${esc(paper.id)}" title="${esc(paper.title)}">${esc(paper.shortTitle || paper.title)}</a><small class="highlight-venue">${esc([paper.venue,paper.year].filter(Boolean).join(' '))}${/spotlight/i.test(paper.badge || '') ? ' · '+esc(paper.badge) : ''}</small></span>`).join('')}</div>` : ''}${entry.summary ? `<p class="highlight-summary">${esc(entry.summary)}</p>` : ''}${mentors(institution?.mentors, "highlight-mentors")}</div></li>`;
    }).join('')}</ul></div>${scrollable ? '<p class="highlights-scroll-hint">Scroll for earlier experience ↓</p>' : ''}</div>`;
  }

  const hero = `<section class="hero" id="about" aria-labelledby="about-heading">
    <div class="intro">
      <h2 id="about-heading">About</h2>
      ${p.lead ? `<p class="profile-lead">${esc(p.lead)}</p>` : ''}
      <div class="bio">${(p.biography || []).map(t => `<p>${t}</p>`).join('')}</div>
      <div class="interests">${(p.interests || []).map(i => `<span>${esc(i)}</span>`).join('')}</div>
      ${highlights()}
    </div></section>`;

  function expandable(items, limit, render, className, label) {
    const count = Number(limit) > 0 ? Math.floor(Number(limit)) : items.length;
    const list = values => `<div class="${className}">${values.map(render).join("")}</div>`;
    return list(items.slice(0, count)) + (items.length > count ? `<details class="more"><summary>${esc(label)} <span>(${items.length - count})</span></summary>${list(items.slice(count))}</details>` : "");
  }
  function publication(item) {
    const authors = (item.authors || []).map(name => name.replace(/\*/g, "") === p.name ? `<strong>${esc(name)}</strong>` : esc(name)).join(", ");
    return `<article class="publication${item.featured ? " featured" : ""}"${item.id ? ` id="paper-${esc(item.id)}"` : ""}><div class="pub-meta">${item.shortTitle ? `<span class="pub-short-title">${esc(item.shortTitle)}</span>` : ""}<span class="pub-venue">${esc(item.venue)}</span><span class="pub-year">${esc(item.year)}</span>${item.note ? `<span class="pub-note">${esc(item.note)}</span>` : ""}${item.badge ? `<span class="badge${/spotlight/i.test(item.badge) ? " spotlight" : ""}">${esc(item.badge)}</span>` : ""}</div>
      <div class="pub-content"><h3>${link(item.title, item.links?.[0]?.url)}</h3>${item.previousTitle ? `<p class="pub-previous-title">Previous title: ${link(item.previousTitle, item.previousTitleUrl)}</p>` : ""}<p class="authors">${authors}</p>${item.summary ? `<p class="pub-summary">${esc(item.summary)}</p>` : ""}${resources(item.links)}</div></article>`;
  }
  function experience(e) {
    const initials = e.organization.split(/\s+/).map(w => w[0]).slice(0, 2).join("");
    const papers = (e.publicationIds || []).map(id => (s.publications || []).find(paper => paper.id === id)).filter(Boolean);
    const work = papers.length ? `<p class="experience-papers">${papers.map(paper => `<a href="#paper-${esc(paper.id)}" title="${esc(paper.title)}">${esc(paper.shortTitle || paper.title)}</a>`).join(' <span aria-hidden="true">·</span> ')}</p>` : (e.description ? `<p class="detail">${esc(e.description)}</p>` : "");
    return `<article class="timeline-row"${e.id ? ` id="experience-${esc(e.id)}"` : ""}><div class="experience-meta"><div class="experience-image${e.image ? " has-image" : ""}">${e.image ? `<img src="${esc(imageUrl(e.image))}" alt="${esc(e.imageAlt || e.organization)}" loading="lazy" width="84" height="68" style="object-fit:${e.imageFit === "cover" ? "cover" : "contain"}">` : `<span aria-hidden="true">${esc(initials)}</span>`}</div><p class="period">${esc(e.period)}</p><p class="place">${esc(e.location)}</p></div><div><h3>${esc(e.organization)}</h3><p class="role">${esc(e.role)}</p>${e.team ? `<p class="team">${esc(e.team)}</p>` : ""}${work}${mentors(e.mentors)}</div></article>`;
  }
  function projectOrigin(e) {
    return `<li class="project-origin${e.collaborationOnly ? ' collaboration-origin' : ''}"><div class="origin-heading">${e.image ? `<img src="${esc(imageUrl(e.image))}" alt="${esc(e.imageAlt || e.organization)}" loading="lazy">` : ""}<div><a class="origin-name" href="#experience-${esc(e.id)}">${esc(e.organization)}</a>${!e.collaborationOnly ? `<span class="origin-team">${esc(e.team)}</span>` : ""}</div></div><p class="origin-role">${e.collaborationOnly ? 'Research collaboration' : esc(e.role)}</p>${!e.collaborationOnly ? `<p class="origin-period">${esc(e.period)}</p>${mentors(e.mentors, "origin-mentors", "Mentored by")}` : ""}</li>`;
  }
  function projectPaper(paper) {
    return `<article class="project-paper"><div class="project-venue">${esc(paper.venue)} <span>· ${esc(paper.year)}</span>${paper.badge ? `<span class="project-badge">${esc(paper.badge)}</span>` : ""}</div><h4>${link(paper.shortTitle || paper.title,paper.links?.[0]?.url)}</h4><p class="project-paper-title">${esc(paper.title)}</p><p class="project-summary">${esc(paper.summary)}</p><div class="project-resources">${paper.links?.[0]?.url ? link("Read paper ↗",paper.links[0].url) : ""}${link("Full citation",`#paper-${paper.id}`)}</div></article>`;
  }
  function projectMap() {
    const experienceById = new Map((s.experience || []).map(e => [e.id,e]));
    const papersById = new Map((s.publications || []).map(paper => [paper.id,paper]));
    return `<div class="project-map">${(s.projects || []).map((project,index) => {
      const origins = (project.experienceIds || []).map(id => experienceById.get(id)).filter(Boolean);
      for (const id of project.collaborationIds || []) {
        const institution=experienceById.get(id);
        if (institution && !origins.some(e=>e.id===id)) origins.push({...institution,collaborationOnly:true});
      }
      const papers = (project.publicationIds || []).map(id => papersById.get(id)).filter(Boolean);
      if (!papers.length && !project.customTitle) return "";
      return `<article class="project-branch"><div class="project-branch-heading"><span class="project-index">${String(index+1).padStart(2,"0")}</span><h3>${esc(project.title)}</h3></div><div class="project-flow"><ul class="project-origins">${origins.length ? origins.map(projectOrigin).join("") : '<li class="project-origin"><p class="origin-name">Independent research</p></li>'}</ul><div class="project-wire" aria-hidden="true"><span></span></div><div class="project-outcomes" data-count="${papers.length+(project.customTitle?1:0)}">${papers.map(projectPaper).join("")}${project.customTitle ? `<article class="project-paper"><div class="project-venue">${esc(project.customVenue)}</div><h4>${esc(project.customTitle)}</h4><p class="project-summary">${esc(project.customSummary)}</p>${resources(project.customLinks || [])}</article>` : ""}</div></div>${project.note ? `<p class="project-context">${esc(project.note)}</p>` : ""}</article>`;
    }).join("")}</div>`;
  }
  function news() {
    const entries=s.news || [],limit=Number(layout.newsVisible ?? 5),scrollable=limit>0&&entries.length>limit;
    return `<div class="news-frame"><div class="news-scroll"${scrollable ? ' tabindex="0" role="region" aria-label="Latest news; scroll for earlier entries"' : ''}><ol class="news-list">${entries.map(n => `<li class="news-row"><span class="news-date">${esc(n.date)}</span><div>${n.html}</div></li>`).join("")}</ol></div>${scrollable ? '<div class="news-scroll-tools"><span>Scroll for earlier news</span><div><button type="button" data-news-direction="-1" aria-label="Scroll to newer news">↑</button><button type="button" data-news-direction="1" aria-label="Scroll to older news">↓</button></div></div>' : ''}</div>`;
  }
  const renderers = {
    projects: projectMap,
    research: () => `<div class="research-grid">${(s.research || []).map(r => `<article class="research-item"><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p>${resources(r.links)}</article>`).join("")}</div>`,
    news,
    publications: () => `<div class="publication-list">${(s.publications || []).map(publication).join("")}</div>`,
    experience: () => expandable(s.experience || [], layout.initialExperience, experience, "timeline", "Earlier experience"),
    education: () => `<div class="education-grid">${(s.education || []).map(e => `<article class="education-item${e.image ? ' has-education-image' : ''}">${e.image ? `<figure class="education-image"><img src="${esc(imageUrl(e.image))}" alt="${esc(e.imageAlt || e.institution)}" loading="lazy" width="160" height="128" style="object-fit:${e.imageFit === 'cover' ? 'cover' : 'contain'}"></figure>` : ''}<div class="education-content"><div class="education-heading"><h3>${esc(e.institution)}</h3><span class="period">${esc(e.period)}</span></div><p class="degree">${esc(e.degree)}</p>${e.detail ? `<p class="detail">${esc(e.detail)}</p>` : ""}</div></article>`).join("")}</div>`,
    service: () => `<div class="service-grid"><div>${(s.service || []).map(g => `<div class="service-group"><h3>${esc(g.role)}</h3><ul class="plain-list">${g.entries.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div><div><h3>Invited talks</h3>${(s.talks || []).map(t => `<article class="talk"><p class="talk-title">${esc(t.title)}</p><ul class="plain-list">${t.events.map(e => `<li>${esc(e)}</li>`).join("")}</ul></article>`).join("")}</div></div>${!validSections.some(section=>section.id==='teaching') && (s.teaching || []).length ? `<section id="teaching" class="service-teaching" aria-labelledby="heading-teaching"><h3 id="heading-teaching">Teaching</h3>${renderers.teaching()}</section>` : ''}${!validSections.some(section=>section.id==='honors') && (s.honors || []).length ? `<section id="honors" class="service-honors" aria-labelledby="heading-honors"><h3 id="heading-honors">Honors</h3>${renderers.honors()}</section>` : ''}`,
    teaching: () => `<div class="teaching-list">${(s.teaching || []).map(item => `<article class="teaching-row"><div><h4>${esc(item.title)}</h4><p class="teaching-meta">${esc([item.role,item.institution].filter(Boolean).join(' · '))}</p></div><p class="period">${(item.terms || []).map(esc).join('<br>')}</p></article>`).join('')}</div>`,
    honors: () => `<div class="honors-list">${(s.honors || []).map(h => `<article class="honor-row"><span class="period">${esc(h.year)}</span><div><h3>${esc(h.title)}</h3><p>${esc(h.detail)}</p></div></article>`).join("")}</div>`,
  };
  const sectionMarkup = (section, i, panel = false) => `<section id="${section.id}" class="content-section${panel ? ' view-panel' : ''}"${panel ? ` data-view="${section.id}" role="tabpanel" hidden` : ''} aria-labelledby="${panel && section.nav !== false ? 'tab-' : 'heading-'}${section.id}">
    <div class="section-heading"><span class="section-number" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h2 id="heading-${section.id}">${esc(section.title)}</h2>${section.id === "publications" ? `<span class="section-extra">Papers & preprints</span>` : ""}</div>
    ${section.description ? `<p class="section-description">${esc(section.description)}</p>` : ""}${renderers[section.id] ? renderers[section.id]() : `<div class="custom-section">${section.html || ""}</div>`}</section>`;
  document.getElementById("main").innerHTML = `<div id="view-about" data-view="about" role="tabpanel" aria-labelledby="tab-about">${hero}${validSections.filter(isHomeSection).map((section,i) => sectionMarkup(section,i)).join('')}</div>${tabSections.map((section,i) => sectionMarkup(section,i,true)).join('')}`;
  const highlightsViewport=document.querySelector('.highlights-scroll');
  let fitHighlights=()=>{};
  if(highlightsViewport){
    const list=highlightsViewport.querySelector('ul');
    fitHighlights=()=>{if(!highlightsViewport.getClientRects().length)return;const rows=[...list.children],limit=Math.max(0,Math.floor(Number(layout.highlightsVisible ?? 5)));highlightsViewport.style.maxHeight=limit&&rows.length>limit ? (rows[limit-1].offsetTop+rows[limit-1].offsetHeight+highlightsViewport.offsetHeight-highlightsViewport.clientHeight)+'px' : 'none';};
    fitHighlights();
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitHighlights).observe(list);
    document.fonts?.ready.then(fitHighlights);
  }
  const newsViewport=document.querySelector('.news-scroll');
  let fitNews=()=>{};
  if(newsViewport){
    const newsList=newsViewport.querySelector('.news-list');
    fitNews=()=>{if(!newsViewport.getClientRects().length)return;const rows=[...newsList.children],limit=Math.max(0,Math.floor(Number(layout.newsVisible ?? 5)));newsViewport.style.maxHeight=limit&&rows.length>limit ? (rows[limit-1].offsetTop+rows[limit-1].offsetHeight)+'px' : 'none';};
    fitNews();
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(fitNews).observe(newsList);
    document.fonts?.ready.then(fitNews);
    document.querySelectorAll('[data-news-direction]').forEach(button=>button.addEventListener('click',()=>newsViewport.scrollBy({top:Number(button.dataset.newsDirection)*newsViewport.clientHeight*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})));
  }
  document.getElementById("footer").innerHTML = `<div class="footer-inner"><div><span class="footer-brand">${esc(p.name)}</span>${esc(p.lab)} · ${esc(p.affiliation)}</div><div class="footer-right">${link("Back to top", "#top")}<br>Updated ${esc(s.meta.updated)}</div></div>`;

  const nav = document.getElementById("navigation");
  const narrowNav = matchMedia('(max-width: 860px)');
  const orientNav = () => nav.setAttribute('aria-orientation', narrowNav.matches ? 'horizontal' : 'vertical');
  orientNav();
  narrowNav.addEventListener('change', orientNav);
  const navLinks = [...nav.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('[role="tabpanel"][data-view]')];
  let currentView = 'about';
  function navigate(fragment = '#about', options = {}) {
    let id;
    try { id = decodeURIComponent(fragment.replace(/^#/,'')); } catch (_) { id = 'about'; }
    const target = document.getElementById(id);
    const panel = target?.closest('[data-view]');
    const view = ['top','main'].includes(id) ? currentView : panel?.dataset.view || 'about';
    currentView = view;
    panels.forEach(item => { item.hidden = item.dataset.view !== view; });
    navLinks.forEach(tab => {
      const selected = tab.getAttribute('href') === '#'+view;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.body.dataset.activeView = view;
    fitNews();
    fitHighlights();
    if(options.history !== false && !window.JIO_PREVIEW && location.hash !== fragment) history.pushState(null,'',fragment);
    if(options.scroll !== false) {
      if(target && panel && target !== panel && id !== 'about') target.scrollIntoView({behavior:'instant',block:'start'});
      else window.scrollTo({top:0,behavior:'instant'});
    }
    window.dispatchEvent(new CustomEvent('jio:viewchange',{detail:{view,hash:fragment}}));
  }
  document.addEventListener('click',event => {
    const anchor = event.target.closest('a[href^="#"]');
    if(!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(anchor.getAttribute('href'));
  });
  nav.addEventListener('keydown',event => {
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    const index = navLinks.indexOf(event.target);
    if(index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? navLinks.length-1 : (index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+navLinks.length)%navLinks.length;
    navLinks[next].focus();
    navigate(navLinks[next].getAttribute('href'));
  });
  window.addEventListener('hashchange',()=>navigate(location.hash || '#about',{history:false}));
  window.JIO_NAVIGATE = navigate;
  navigate(location.hash || '#about',{history:false,scroll:Boolean(location.hash)});
})();
