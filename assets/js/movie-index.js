// Fallback-safe initialization for Movies Page
window.currentFilters = window.currentFilters || {
  search: '',
  genre: '',
  sort: 'popular',
  yearFrom: '',
  yearTo: '',
  rating: '',
  duration: '',
  director: '',
  cast: ''
};

// Use debounce from movies.js if available, otherwise create our own
const getDebounce = () => {
  if (window.debounce) return window.debounce;
  
  return function(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  };
};

// Update genre chips UI function
function updateGenreChipsUI(activeGenre) {
  document.querySelectorAll('.genre-chip').forEach(chip => {
    const isActive = chip.dataset.genre === activeGenre;
    chip.classList.remove('active', 'bg-primary', 'text-white', 'bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    
    if (isActive) {
      chip.classList.add('active', 'bg-primary', 'text-white');
    } else {
      chip.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
    }
  });
}

// Load movies with filters function
function loadMoviesWithFilters() {
  if (typeof loadMovies === 'function') {
    loadMovies(currentFilters, 1);
  }
}

window.addEventListener('load', () => {
  // Read URL parameters like ?search= or ?genre=
  const urlParams = new URLSearchParams(window.location.search);
  let needsLoading = false;

  if (urlParams.has('search')) {
    const search = urlParams.get('search');
    currentFilters.search = decodeURIComponent(search);
    const input = document.getElementById('search-input');
    if (input) input.value = decodeURIComponent(search);
    needsLoading = true;
  }

  if (urlParams.has('genre')) {
    const genre = urlParams.get('genre');
    currentFilters.genre = genre;
    const select = document.getElementById('genre-filter');
    if (select) select.value = genre;
    updateGenreChipsUI(genre);
    needsLoading = true;
  }

  if (urlParams.has('sort')) {
    const sort = urlParams.get('sort');
    currentFilters.sort = sort;
    const select = document.getElementById('sort-by');
    if (select) select.value = sort;
    needsLoading = true;
  }

  // Finally load the filtered movies
  if (needsLoading) {
    loadMoviesWithFilters();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure movies.js is loaded
  setTimeout(() => {
    initializeSearch();
  }, 100);
});

function initializeSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');

  if (!searchForm || !searchInput) {
    console.warn('Search elements not found');
    return;
  }

  // Remove any existing event listeners by cloning elements
  const newSearchForm = searchForm.cloneNode(true);
  const newSearchInput = newSearchForm.querySelector('#search-input');
  searchForm.parentNode.replaceChild(newSearchForm, searchForm);

  // Handle form submission
  newSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch(newSearchInput.value.trim());
  });

  // Add debounced input handler for real-time search
  const debounceFunc = getDebounce();
  const debouncedSearch = debounceFunc(() => {
    performSearch(newSearchInput.value.trim());
  }, 500);

  newSearchInput.addEventListener('input', debouncedSearch);
}

function performSearch(query) {
  // Prevent page refresh
  event?.preventDefault();
  
  // Update URL without reloading the page
  const urlParams = new URLSearchParams(window.location.search);
  if (query) {
    urlParams.set('search', encodeURIComponent(query));
  } else {
    urlParams.delete('search');
  }
  
  // Only update URL if it's different
  const newUrl = `?${urlParams.toString()}`;
  if (window.location.search !== newUrl) {
    window.history.pushState({}, '', newUrl);
  }
  
  // Update filters and load movies
  if (window.currentFilters) {
    window.currentFilters.search = query;
  } else {
    currentFilters.search = query;
  }
  
  // Reset to first page when searching
  if (typeof window.currentPage !== 'undefined') {
    window.currentPage = 1;
  }
  
  // Load movies if the function is available
  if (typeof loadMovies === 'function') {
    loadMovies(window.currentFilters || currentFilters, 1);
  }
  
  // Update active filters if function is available
  if (typeof updateActiveFilters === 'function') {
    updateActiveFilters();
  }
}

// Make functions globally available
window.updateGenreChipsUI = updateGenreChipsUI;
window.loadMoviesWithFilters = loadMoviesWithFilters;
window.performSearch = performSearch;