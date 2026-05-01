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

}

document.addEventListener('DOMContentLoaded', run);