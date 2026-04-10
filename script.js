const switcher = document.querySelector('.switcher');
(function trackPrevious(el){
  if(!el) return;
  const radios = el.querySelectorAll('input[type="radio"]');
  let previousValue = null;
  const initiallyChecked = el.querySelector('input[type="radio"]:checked');
  if (initiallyChecked) {
    previousValue = initiallyChecked.getAttribute("c-option");
    el.setAttribute('c-previous', previousValue);
  }
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        el.setAttribute('c-previous', previousValue ?? '');
        previousValue = radio.getAttribute("c-option");
      }
    });
  });
})(switcher);

(function(){
  const radios = document.querySelectorAll('.switcher input[type="radio"]');
  const ACTIVE_KEY = 'theme-choice';

  const saved = localStorage.getItem(ACTIVE_KEY);
  if (saved) {
    const el = document.querySelector(`.switcher input[value="${saved}"]`);
    if (el) {
      el.checked = true;
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }

  radios.forEach(r=>{
    r.addEventListener('change', ()=>{
      if(r.checked){
        localStorage.setItem(ACTIVE_KEY, r.value);
      }
    });
  });

  const path = location.pathname.replace(/\/+$/, '').split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a[data-page]').forEach(a=>{
    const aliases = (a.dataset.aliases || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
    const isActive = a.dataset.page === path || aliases.includes(path);
    a.classList.toggle('is-active', isActive);
    if (isActive) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  });

  const track = document.querySelector('.nav-tabs');
  const indicator = document.querySelector('.nav-indicator');
  const NAV_KEY = 'nav-indicator-prev';

  function positionIndicator(){
    if(!track || !indicator) return;
    const active = track.querySelector('a.is-active') || track.querySelector('a');
    if(!active) return;
    const left = active.offsetLeft;
    const width = active.offsetWidth;
    indicator.style.left = left + 'px';
    indicator.style.width = width + 'px';
  }

  const prev = (()=>{ try { return JSON.parse(localStorage.getItem(NAV_KEY) || 'null'); } catch(_){ return null } })();
  if (track && indicator && prev && Number.isFinite(prev.left) && Number.isFinite(prev.width)) {
    indicator.style.left = prev.left + 'px';
    indicator.style.width = prev.width + 'px';
    requestAnimationFrame(()=>{
      track.classList.add('is-anim');
      positionIndicator();
      localStorage.removeItem(NAV_KEY);
    });
  } else {
    positionIndicator();
    requestAnimationFrame(()=>track && track.classList.add('is-anim'));
  }

  document.querySelectorAll('.nav-tabs a').forEach(a=>{
    a.addEventListener('click', (e)=>{
      if(track && indicator){
        const left = a.offsetLeft;
        const width = a.offsetWidth;
        try { localStorage.setItem(NAV_KEY, JSON.stringify({left, width})); } catch(_){}
      }
      const isPlainNavigation = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
      if (!isPlainNavigation) return;
      document.querySelectorAll('.nav-tabs a').forEach(x=>{
        x.classList.remove('is-active');
        x.removeAttribute('aria-current');
      });
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'page');
      requestAnimationFrame(()=>requestAnimationFrame(positionIndicator));
    });
  });

  window.addEventListener('resize', positionIndicator);

  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();

// RSS Feeds integration
async function fetchRSS(url) {
  try {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.status === 'ok') {
      return data.items.map(item => ({
        title: item.title || '',
        link: item.link || '',
        description: item.description || '',
        pubDate: item.pubDate || ''
      }));
    } else {
      console.error('RSS API error:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching RSS:', error);
    return [];
  }
}

async function loadRSSFeeds() {
  const feeds = [
    { name: 'Formula 1 Latest', url: 'https://www.formula1.com/en/latest/all.xml' },
    { name: 'Formula E + AI', url: 'https://news.google.com/rss/search?q=Formula+E+AI&hl=en-US&gl=US&ceid=US:en' },
    { name: 'Formula 1 + AWS + AI', url: 'https://news.google.com/rss/search?q=Formula+1+AWS+AI&hl=en-US&gl=US&ceid=US:en' },
    { name: 'Autonomous Racing AI', url: 'https://news.google.com/rss/search?q=autonomous+racing+AI&hl=en-US&gl=US&ceid=US:en' },
    { name: 'IA + Sport Automobile (FR)', url: 'https://news.google.com/rss/search?q=intelligence+artificielle+sport+automobile&hl=fr&gl=FR&ceid=FR:fr' }
  ];

  const container = document.getElementById('rss-feeds');
  if (!container) return;

  // Clear loading
  container.innerHTML = '';

  for (const feed of feeds) {
    const items = await fetchRSS(feed.url);
    if (items.length > 0) {
      const article = document.createElement('article');
      article.className = 'source-card';
      article.innerHTML = `
        <h3>${feed.name}</h3>
        <ul class="clean rss-items">
          ${items.slice(0, 3).map(item => {
            const date = new Date(item.pubDate);
            const dateStr = isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleDateString();
            return `
            <li>
              <a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
              <small>${dateStr}</small>
            </li>
          `;
          }).join('')}
        </ul>
      `;
      container.appendChild(article);
    } else {
      // If no items, show a message
      const article = document.createElement('article');
      article.className = 'source-card';
      article.innerHTML = `
        <h3>${feed.name}</h3>
        <p>Impossible de charger le flux RSS.</p>
      `;
      container.appendChild(article);
    }
  }
}

// Load RSS feeds if on veille page
if (document.getElementById('rss-feeds')) {
  loadRSSFeeds();
}
