function run() {
document.getElementById('year').textContent = new Date().getFullYear();

    // Scroll to nav-anchor if not on index.html
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'index.html' && currentPage !== '') {
      const navAnchor = document.getElementById('nav-anchor');
      if (navAnchor) {
        setTimeout(() => {
          navAnchor.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }

    // Dropdown functionality
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdown = document.querySelector('.dropdown');
    const dropdownLinks = document.querySelectorAll('.dropdown-content a');

    dropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    dropdownLinks.forEach(link => {
      link.addEventListener('click', function() {
        dropdown.classList.remove('active');
      });
    });

    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });

}

document.addEventListener('DOMContentLoaded', run);