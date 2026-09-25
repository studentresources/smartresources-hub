/* ========================================================
   Live Search & Category Filter for SmartResources Hub
   ======================================================== */
document.addEventListener('DOMContentLoaded', function () {
  // Grab the search input and all resource cards
  const searchInput = document.querySelector('.nav-search input');
  const cards = document.querySelectorAll('.rec-card, .resource-card');
  const filterPills = document.querySelectorAll('[data-category]');

  let activeCategory = 'all';

  function filterResources() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    cards.forEach(card => {
      const cardCategory = card.getAttribute('data-category') || '';
      const textContent = card.innerText.toLowerCase();

      // Check if matches category
      const matchesCategory = (activeCategory === 'all' || cardCategory === activeCategory);

      // Check if matches search text
      const matchesSearch = !query || textContent.includes(query);

      // Show or hide
      if (matchesCategory && matchesSearch) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // 1. Live search as user types
  if (searchInput) {
    searchInput.addEventListener('input', filterResources);
  }

  // 2. Category pill clicks
  filterPills.forEach(pill => {
    pill.addEventListener('click', function () {
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      activeCategory = this.getAttribute('data-category');
      filterResources();
    });
  });
});