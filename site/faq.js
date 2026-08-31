// Everyday Agent FAQ interactions: external script so the public CSP can disallow inline JavaScript.
document.querySelectorAll('.faq-question').forEach(function (button) {
  button.addEventListener('click', function () {
    var item = button.closest('.faq-item');
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function (openItem) {
      openItem.classList.remove('open');
    });
    if (!wasOpen) item.classList.add('open');
  });
});

var categoryButtons = document.querySelectorAll('.faq-cat-btn');
var faqItems = document.querySelectorAll('.faq-item');
var emptyState = document.getElementById('faqEmpty');
var searchInput = document.getElementById('faqSearch');

function filterFAQ() {
  var activeButton = document.querySelector('.faq-cat-btn.active');
  var activeCategory = activeButton ? activeButton.dataset.cat : 'all';
  var query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  var visible = 0;

  faqItems.forEach(function (item) {
    var categoryMatches = activeCategory === 'all' || item.dataset.cat === activeCategory;
    var searchMatches = !query || item.textContent.toLowerCase().indexOf(query) !== -1;
    var shouldShow = categoryMatches && searchMatches;
    item.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visible += 1;
  });

  if (emptyState) emptyState.classList.toggle('visible', visible === 0);
}

categoryButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    categoryButtons.forEach(function (item) { item.classList.remove('active'); });
    button.classList.add('active');
    filterFAQ();
  });
});

if (searchInput) searchInput.addEventListener('input', filterFAQ);
filterFAQ();
