function scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    // Handle quick genre search
    function handleQuickGenre(genre) {
      sessionStorage.setItem('quickSearchGenre', genre);
      window.location.href = '/pages/movies/';
    }

    // Handle quick filter (top rated, newest)
    function handleQuickFilter(filterType) {
      sessionStorage.setItem('quickSearchFilter', filterType);
      window.location.href = '/pages/movies/';
    }