/* Switcher: mémorise la position précédente pour l'animation (glissement du toggle) */
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

/* Persistance du thème + nav active + indicateur mobile + année footer */
(function(){
  const radios = document.querySelectorAll('.switcher input[type="radio"]');
  const ACTIVE_KEY = 'theme-choice';

  // init thème depuis localStorage
  const saved = localStorage.getItem(ACTIVE_KEY);
  if (saved) {
    const el = document.querySelector(`.switcher input[value="${saved}"]`);
    if (el) el.checked = true;
  }

  radios.forEach(r=>{
    r.addEventListener('change', ()=>{
      if(r.checked){
        localStorage.setItem(ACTIVE_KEY, r.value);
      }
    });
  });

  // nav active
  const path = location.pathname.replace(/\/+$/, '').split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a[data-page]').forEach(a=>{
    if(a.dataset.page === path) a.classList.add('is-active');
  });

  // moving indicator (pill)
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

  // 1) Si on a une position précédente stockée (depuis la page d’avant), on l’applique SANS transition,
  // puis on active la transition et on glisse vers la position courante → animation fluide inter-page.
  const prev = (()=>{ try { return JSON.parse(localStorage.getItem(NAV_KEY) || 'null'); } catch(_){ return null } })();
  if (track && indicator && prev && Number.isFinite(prev.left) && Number.isFinite(prev.width)) {
    // poser l'état initial sans transition
    indicator.style.left = prev.left + 'px';
    indicator.style.width = prev.width + 'px';
    // activer l’animation au prochain frame et bouger vers la bonne tab
    requestAnimationFrame(()=>{
      track.classList.add('is-anim');
      positionIndicator();
      // on consomme la valeur (évite réutilisation si reload)
      localStorage.removeItem(NAV_KEY);
    });
  } else {
    // pas de valeur précédente → positionner directement puis activer l’anim pour les prochains clics
    positionIndicator();
    requestAnimationFrame(()=>track && track.classList.add('is-anim'));
  }

  document.querySelectorAll('.nav-tabs a').forEach(a=>{
    a.addEventListener('click', (e)=>{
      // Sauvegarder la position actuelle (celle de l’onglet cliqué) pour la page suivante
      if(track && indicator){
        const left = a.offsetLeft;
        const width = a.offsetWidth;
        try { localStorage.setItem(NAV_KEY, JSON.stringify({left, width})); } catch(_){}
      }
      // Mettre à jour visuel immédiat (optionnel) puis naviguer
      document.querySelectorAll('.nav-tabs a').forEach(x=>x.classList.remove('is-active'));
      a.classList.add('is-active');
      // petite anim locale avant de partir (facultatif)
      requestAnimationFrame(()=>requestAnimationFrame(positionIndicator));
      // navigation réelle
      e.preventDefault();
      window.location.href = a.getAttribute('href');
    });
  });

  window.addEventListener('resize', positionIndicator);

  // année footer
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
})();