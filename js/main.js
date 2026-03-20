// masaCH — main.js

// --- Mobile Nav Toggle ---
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('nav--open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// --- Article Filter (articles.html) ---
const filterBtns = document.querySelectorAll('.filter-btn');
const articleGrid = document.getElementById('articleGrid');

if (filterBtns.length > 0 && articleGrid) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      articleGrid.querySelectorAll('.card').forEach(card => {
        if (filter === 'all' || card.dataset.member === filter) {
          card.classList.remove('is-hidden');
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });

  // Handle URL param ?member=xxx on page load
  const params = new URLSearchParams(window.location.search);
  const memberParam = params.get('member');
  if (memberParam) {
    const matchBtn = document.querySelector(`.filter-btn[data-filter="${memberParam}"]`);
    if (matchBtn) matchBtn.click();
  }
}
