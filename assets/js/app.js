(() => {
  const state = {
    data: null,
    user: JSON.parse(localStorage.getItem('mc_user') || 'null'),
    brand: localStorage.getItem('mc_brand') || '',
    selection: JSON.parse(localStorage.getItem('mc_selection') || '[]'),
    filters: { year: '', fileType: '', model: '', language: '', only2026: false, q: '' },
    sidebarOpen: false,
    loading: false
  };

  const roles = {
    trigano_staff: 'Personnel Trigano VDL',
    dealer_agent: 'Distributeur / Agent',
    press_specialized: 'Presse spécialisée',
    press_general: 'Presse généraliste'
  };

  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  function persist() {
    localStorage.setItem('mc_user', JSON.stringify(state.user));
    localStorage.setItem('mc_brand', state.brand || '');
    localStorage.setItem('mc_selection', JSON.stringify(state.selection));
  }

  function toast(text) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1600);
  }

  function canAccessContent(c) {
    return state.user && c.access.includes(state.user.role);
  }

  function brandObj(id = state.brand) {
    return state.data.brands.find(b => b.id === id);
  }

  function visibleBrands() {
    return state.data.brands.filter(b => b.visibleRoles.includes(state.user.role));
  }

  function filteredContents({ brand, category, detailId } = {}) {
    let list = state.data.contents.filter(c => (!brand || c.brand === brand) && (!category || c.category === category));
    if (detailId) return list.find(c => c.id === detailId);
    list = list.filter(canAccessContent);
    if (state.filters.only2026) list = list.filter(c => c.year === 2026);
    if (state.filters.year) list = list.filter(c => String(c.year) === state.filters.year);
    if (state.filters.fileType) list = list.filter(c => c.fileType === state.filters.fileType);
    if (state.filters.model) list = list.filter(c => c.models.includes(state.filters.model));
    if (state.filters.language) list = list.filter(c => c.language === state.filters.language);
    if (state.filters.q) {
      const q = state.filters.q.toLowerCase();
      list = list.filter(c => [c.title, c.description, c.tags.join(' '), c.models.join(' ')].join(' ').toLowerCase().includes(q));
    }
    return list;
  }

  function updateChrome(route) {
    const topbar = $('#topbar');
    const sidebar = $('#sidebar');
    const accent = (brandObj() || {}).accent || '#A81A17';
    document.documentElement.style.setProperty('--accent', accent);
    const user = state.user;

    if (!user) {
      topbar.innerHTML = '<div class="logo">Trigano VDL <span>Media Center</span></div>';
      sidebar.innerHTML = '';
      sidebar.classList.remove('open');
      return;
    }

    const brandSelect = visibleBrands().map(b => `<option value="${b.id}" ${b.id === state.brand ? 'selected' : ''}>${b.name}</option>`).join('');
    topbar.innerHTML = `
      <button class="mobile-menu" id="menuBtn" aria-label="Ouvrir le menu">☰</button>
      <div class="logo">Trigano VDL <span>Media Center</span></div>
      <div class="breadcrumbs">${esc(route.path.replace('/', '').replaceAll('/', ' / ') || 'login')}</div>
      <input id="globalSearch" class="search" placeholder="Recherche globale" value="${esc(state.filters.q)}" />
      <select id="brandQuick"><option value="">Marque</option>${brandSelect}</select>
      <div class="user-badge">${esc(user.name)} · ${esc(roles[user.role])} · Sélection ${state.selection.length}</div>
      <button class="btn ghost" id="logoutBtn">Déconnexion</button>
    `;

    const cats = [...new Set(state.data.contents.filter(c => c.brand === state.brand).map(c => c.category))];
    sidebar.innerHTML = `
      <div class="side-section">
        <h4>Navigation</h4>
        <a href="#/brands">Choix de marque</a>
        <a href="#/dashboard/${state.brand}">Dashboard</a>
        <a href="#/contents/${state.brand}">Tous les contenus</a>
      </div>
      <div class="side-section"><h4>Catégories</h4>${cats.map(c => `<a href="#/contents/${state.brand}?category=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}</div>
      <div class="side-section">
        <h4>Accès rapide</h4>
        <button id="filter2026" class="btn ${state.filters.only2026 ? 'accent' : ''}">Uniquement 2026</button>
        <a href="#/tool/price/${state.brand}">Outil fiche prix 2026</a>
      </div>
    `;

    $('#logoutBtn').onclick = () => { state.user = null; state.brand = ''; persist(); Router.go('/login'); };
    $('#brandQuick').onchange = (e) => { state.brand = e.target.value; persist(); Router.go(`/dashboard/${state.brand}`); };
    $('#globalSearch').onchange = (e) => { state.filters.q = e.target.value.trim(); Router.go(`/contents/${state.brand}`); };
    $('#menuBtn').onclick = () => sidebar.classList.toggle('open');
    const f = $('#filter2026');
    if (f) f.onclick = () => { state.filters.only2026 = !state.filters.only2026; Router.go(`/contents/${state.brand}`); };
  }

  function renderLogin() {
    $('#main').innerHTML = `
      <section class="centered card login-card">
        <h1>Connexion privée Trigano VDL</h1>
        <p>Mode démo sans backend</p>
        <label>Email <input id="email" type="email" value="demo@trigano.local" /></label>
        <label>Mot de passe <input id="pass" type="password" value="password" /></label>
        <label>Rôle
          <select id="role">
            <option value="trigano_staff">Personnel Trigano VDL</option>
            <option value="dealer_agent">Distributeur / Agent</option>
            <option value="press_specialized">Presse spécialisée</option>
            <option value="press_general">Presse généraliste</option>
          </select>
        </label>
        <button id="loginBtn" class="btn accent">Se connecter</button>
      </section>
    `;
    $('#loginBtn').onclick = () => {
      const role = $('#role').value;
      const demo = state.data.users.find(u => u.role === role);
      state.user = { ...demo, email: $('#email').value || demo.email };
      state.brand = visibleBrands()[0]?.id || state.data.brands[0].id;
      persist();
      Router.go('/brands');
    };
  }

  function renderBrands() {
    const items = visibleBrands().map(b => `
      <article class="brand-card" style="--brand:${b.accent}">
        <div class="brand-logo-placeholder" aria-hidden="true">${esc(b.name.slice(0,2).toUpperCase())}</div>
        <h3>${esc(b.name)}</h3>
        <button class="btn" data-brand="${b.id}">Ouvrir</button>
      </article>
    `).join('');
    $('#main').innerHTML = `<section><h1>Choix de marque</h1><div class="grid brands">${items}</div></section>`;
    document.querySelectorAll('[data-brand]').forEach(btn => btn.onclick = () => {
      state.brand = btn.dataset.brand;
      persist();
      Router.go(`/dashboard/${state.brand}`);
    });
  }

  function renderDashboard(brandId) {
    const brand = brandObj(brandId);
    const list = filteredContents({ brand: brandId });
    const grouped = Object.entries(list.reduce((a, c) => ((a[c.category] = (a[c.category] || 0) + 1), a), {}));
    $('#main').innerHTML = `
      <section>
        <h1>Dashboard ${esc(brand.name)}</h1>
        <div class="actions-row">
          <button id="downloadSel" class="btn accent">Télécharger ma sélection</button>
          <button id="clearSel" class="btn ghost">Vider ma sélection</button>
        </div>
        <div id="zipArea" class="zip-area hidden"></div>
        <div class="grid categories">
          ${grouped.map(([cat, count]) => `<article class="cat-card"><h3>${esc(cat)}</h3><p>${count} contenus</p><a class="btn" href="#/contents/${brandId}?category=${encodeURIComponent(cat)}">Voir</a></article>`).join('')}
        </div>
        <aside class="card"><h3>Filtres globaux</h3><p>Année · Type · Modèle · Langue</p></aside>
      </section>
    `;
    $('#downloadSel').onclick = () => {
      const z = $('#zipArea');
      z.classList.remove('hidden');
      z.innerHTML = `<p>Préparation du ZIP simulée…</p><button class="btn" type="button">Téléchargement simulé</button>`;
    };
    $('#clearSel').onclick = () => { state.selection = []; persist(); toast('Sélection vidée'); Router.go(`/dashboard/${brandId}`); };
  }

  function renderContents(brandId, query) {
    state.brand = brandId;
    ['year', 'fileType', 'model', 'language'].forEach(k => state.filters[k] = query[k] || state.filters[k] || '');
    if (query.q !== undefined) state.filters.q = query.q;
    const category = query.category || '';
    $('#main').innerHTML = `<section><h1>Contenus ${esc(brandObj(brandId).name)} ${category ? `· ${esc(category)}` : ''}</h1><div class="card">Chargement…</div></section>`;
    setTimeout(() => {
      const list = filteredContents({ brand: brandId, category });
      const all = state.data.contents.filter(c => c.brand === brandId && (!category || c.category === category) && canAccessContent(c));
      const models = [...new Set(all.flatMap(c => c.models))];
      const tags = [...new Set(all.flatMap(c => c.tags))].slice(0, 15);
      const html = list.length ? list.map(c => `
        <article class="content-card">
          <label><input type="checkbox" data-sel="${c.id}" ${state.selection.includes(c.id) ? 'checked' : ''}></label>
          <div class="file-preview" aria-hidden="true">${c.fileType.toUpperCase()}</div>
          <div>
            <h3><a href="#/content/${c.id}">${esc(c.title)}</a></h3>
            <p>${esc(c.description)}</p>
            <small>${c.fileType.toUpperCase()} · ${esc(c.fileSize)} · ${esc(c.date)} · ${esc(c.language)} · ${c.year}</small>
            <div class="chips">${c.models.map(m => `<button class="chip" data-model="${esc(m)}">${esc(m)}</button>`).join('')}</div>
          </div>
        </article>`).join('') : '<div class="card">Aucun résultat</div>';

      $('#main').innerHTML = `
        <section>
          <h1>Liste des contenus</h1>
          <div class="filters card">
            <input id="q" placeholder="Recherche titre, description, tags, modèle" value="${esc(state.filters.q)}" />
            <select id="year"><option value="">Millésime</option>${[2026,2025,2024,2023,2022].map(y => `<option ${String(y)===state.filters.year?'selected':''}>${y}</option>`).join('')}</select>
            <select id="type"><option value="">Type</option>${['pdf','jpg','mp4','zip','tool'].map(t => `<option value="${t}" ${t===state.filters.fileType?'selected':''}>${t}</option>`).join('')}</select>
            <select id="model"><option value="">Modèle</option>${models.map(m => `<option ${m===state.filters.model?'selected':''}>${esc(m)}</option>`).join('')}</select>
            <select id="lang"><option value="">Langue</option>${['FR','EN','DE','ES','IT','NL','SE','NO','FI'].map(l => `<option ${l===state.filters.language?'selected':''}>${l}</option>`).join('')}</select>
            <button id="apply" class="btn accent">Filtrer</button>
            <button id="only2026" class="btn ${state.filters.only2026?'accent':''}">Uniquement 2026</button>
          </div>
          <div class="chips">${tags.map(t => `<button class="chip" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
          <div class="list">${html}</div>
        </section>`;

      $('#apply').onclick = () => {
        state.filters = { ...state.filters, q: $('#q').value.trim(), year: $('#year').value, fileType: $('#type').value, model: $('#model').value, language: $('#lang').value };
        const q2 = { category, q: state.filters.q, year: state.filters.year, fileType: state.filters.fileType, model: state.filters.model, language: state.filters.language };
        Router.go(`/contents/${brandId}`, q2);
      };
      $('#only2026').onclick = () => { state.filters.only2026 = !state.filters.only2026; Router.go(`/contents/${brandId}`, { category }); };
      document.querySelectorAll('[data-sel]').forEach(chk => chk.onchange = (e) => {
        const id = e.target.dataset.sel;
        state.selection = e.target.checked ? [...new Set([...state.selection, id])] : state.selection.filter(x => x !== id);
        persist();
        toast('Sélection mise à jour');
      });
      document.querySelectorAll('[data-model]').forEach(b => b.onclick = () => { state.filters.model = b.dataset.model; Router.go(`/contents/${brandId}`, { category, model: b.dataset.model }); });
      document.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => { state.filters.q = b.dataset.tag; Router.go(`/contents/${brandId}`, { category, q: b.dataset.tag }); });
    }, 250);
  }

  function renderContentDetail(id) {
    const c = filteredContents({ detailId: id });
    if (!c || !canAccessContent(c)) {
      $('#main').innerHTML = '<section class="card">Contenu non autorisé ou introuvable.</section>';
      return;
    }
    const preview = c.fileType === 'mp4'
      ? `<div class="detail-preview file-preview">VIDÉO</div>`
      : `<div class="detail-preview file-preview">${c.fileType.toUpperCase()}</div>`;
    $('#main').innerHTML = `
      <section>
        <h1>${esc(c.title)}</h1>
        <div class="detail-grid">
          <div class="card">${preview}</div>
          <div class="card">
            <p>${esc(c.description)}</p>
            <ul>
              <li>Marque: ${esc(c.brand)}</li><li>Catégorie: ${esc(c.category)}</li><li>Millésime: ${c.year}</li><li>Langue: ${c.language}</li>
              <li>Modèles: ${esc(c.models.join(', '))}</li><li>Tags: ${esc(c.tags.join(', '))}</li><li>Taille: ${esc(c.fileSize)}</li><li>Date: ${esc(c.date)}</li>
            </ul>
            <button class="btn accent" id="downloadOne">Télécharger</button>
            <button class="btn" id="addSel">Ajouter à la sélection</button>
          </div>
        </div>
      </section>`;
    $('#downloadOne').onclick = () => toast('Téléchargement simulé (pas de fichier binaire)');
    $('#addSel').onclick = () => { if (!state.selection.includes(c.id)) state.selection.push(c.id); persist(); toast('Ajouté à la sélection'); };
  }

  function renderPriceTool(brandId) {
    if (!['trigano_staff', 'dealer_agent'].includes(state.user.role)) {
      $('#main').innerHTML = '<section class="card">Accès non autorisé à l’outil fiche prix.</section>';
      return;
    }
    const opts = ['Pack Confort','Pack Hiver','Toit relevable','Panneau solaire','Multimédia'];
    const modelOptions = state.data.models[brandId] || [];
    $('#main').innerHTML = `
      <section>
        <h1>Outil génération fiche prix 2026</h1>
        <div class="tool-grid">
          <form id="priceForm" class="card">
            <label>Pays <input name="country" value="France" required></label>
            <label>Langue <select name="lang"><option>FR</option><option>EN</option><option>DE</option></select></label>
            <label>Modèle <select name="model">${modelOptions.map(m => `<option>${esc(m)}</option>`)}</select></label>
            <label>Finition <select name="finish"><option>Start</option><option>Premium</option><option>Sport</option></select></label>
            <label>Porteur <select name="carrier"><option>Ford</option><option>Fiat</option><option>Peugeot</option></select></label>
            ${opts.map((o,i)=>`<fieldset><legend>${o}</legend><label>Prix €<input type="number" name="p${i}" value="${(i+1)*950}"></label><label>Poids kg<input type="number" name="w${i}" value="${(i+1)*7}"></label></fieldset>`).join('')}
            <div class="totals">Total TTC: <strong id="tPrice"></strong> · Poids total: <strong id="tWeight"></strong></div>
            <button class="btn accent" type="submit">Générer PDF</button>
          </form>
          <div id="preview" class="card">Aperçu de fiche prix imprimable ici.</div>
        </div>
      </section>`;

    const form = $('#priceForm');
    const calc = () => {
      const fd = new FormData(form);
      const price = opts.reduce((s,_,i)=>s + Number(fd.get(`p${i}`)||0), 0);
      const weight = opts.reduce((s,_,i)=>s + Number(fd.get(`w${i}`)||0), 0);
      $('#tPrice').textContent = `${price.toLocaleString('fr-FR')} €`;
      $('#tWeight').textContent = `${weight} kg`;
      return { fd, price, weight };
    };
    form.oninput = calc;
    calc();
    form.onsubmit = (e) => {
      e.preventDefault();
      const { fd, price, weight } = calc();
      $('#preview').innerHTML = `
        <h3>Fiche prix ${esc(brandObj(brandId).name)} 2026</h3>
        <p>Pays: ${esc(fd.get('country'))} · Langue: ${esc(fd.get('lang'))}</p>
        <p>Modèle: ${esc(fd.get('model'))} · Finition: ${esc(fd.get('finish'))} · Porteur: ${esc(fd.get('carrier'))}</p>
        <p>Total TTC: <strong>${price.toLocaleString('fr-FR')} €</strong></p>
        <p>Poids options: <strong>${weight} kg</strong></p>
        <button class="btn" onclick="window.print()">Télécharger PDF (print)</button>`;
      toast('Aperçu généré');
    };
  }

  function render(route) {
    updateChrome(route);
    if (!state.user && route.path !== '/login') return Router.go('/login');
    const parts = route.path.split('/').filter(Boolean);

    if (route.path === '/login') return renderLogin();
    if (route.path === '/brands') return renderBrands();
    if (parts[0] === 'dashboard') return renderDashboard(parts[1]);
    if (parts[0] === 'contents') return renderContents(parts[1], route.query);
    if (parts[0] === 'content') return renderContentDetail(parts[1]);
    if (parts[0] === 'tool' && parts[1] === 'price') return renderPriceTool(parts[2]);
    $('#main').innerHTML = '<section class="card">Erreur fictive: route introuvable.</section>';
  }

  async function init() {
    state.data = await DataService.load();
    Router.onChange(render);
    if (!location.hash) Router.go(state.user ? '/brands' : '/login');
  }

  init();
})();
