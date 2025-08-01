document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchForm = document.getElementById('search-form');
  
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      doSearch(searchInput.value.trim());
    });
    
    let timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        doSearch(searchInput.value.trim());
      }, 500);
    });
  }
});

function doSearch(query) {
    console.log('Searching for:', query);
    
    // Show loading state
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.classList.add('search-loading');
    }
    
    // Update the global filters
    if (window.currentFilters) {
        window.currentFilters.search = query;
        window.currentFilters.genre = document.getElementById('genre-filter')?.value || '';
        
        // Call loadMovies directly
        if (window.loadMovies) {
            window.loadMovies(window.currentFilters, 1).finally(() => {
                // Remove loading state after search completes
                if (searchInput) {
                    searchInput.classList.remove('search-loading');
                }
            });
        }
    }
}