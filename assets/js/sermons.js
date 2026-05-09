
const default_sermon_img = 'assets/img/ccc-impression-church2.png';

function buildCardHTML(item) {
  const title = item.TITLE || 'Untitled Sermon';
  const desc = item.DESCRIPTION || '';
  const img = item.IMG_URL || default_sermon_img;
  const url = item.URL || '#';
  let date = '';
  if (item.DATE) {
    try {
      const d = new Date(item.DATE);
      if (!isNaN(d.getTime())) {
        date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } else {
        date = item.DATE;
      }
    } catch (e) {
      date = item.DATE;
    }
  }

  return (
    '<a class="sermon-link" href="' + url + '" target="_blank" rel="noopener noreferrer"' +
    ' style="text-decoration:none; color:inherit; display:block;">' +
    '<img src="' + img + '" alt="MP3">' +
    '<h3>' + title + '</h3>' +
    '<p>' + desc + '</p>' +
    '<p class="date">' + date + '</p>' +
    '</a>'
  );
}

function createGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'sermons-grid';
  container.appendChild(grid);
  return grid;
}

function createPagination(container) {
  const pagination = document.createElement('div');
  pagination.className = 'pagination';
  container.appendChild(pagination);
  return pagination;
}

function renderCards(gridEl, items) {
  gridEl.innerHTML = '';
  if (!items || items.length === 0) {
    gridEl.innerHTML = '<p class="small">No sermons available.</p>';
    return;
  }

  items.forEach(item => {
    if (item.HIDE && item.HIDE !== '') return; // skip hidden items
    const card = document.createElement('article');
    card.className = 'sermon-card';
    card.innerHTML = buildCardHTML(item);
    gridEl.appendChild(card);
  });
}

function renderPaginationControls(paginationEl, currentPage, totalPages, onPageChange) {
  paginationEl.innerHTML = '';

  if (totalPages <= 1) return;

  // Prev
  const left = document.createElement('div');
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn';
  prevBtn.textContent = '‹ Prev';
  prevBtn.disabled = currentPage <= 1;
  prevBtn.addEventListener('click', function () { onPageChange(currentPage - 1); });
  left.appendChild(prevBtn);

  // Center indicator
  const center = document.createElement('div');
  center.className = 'page-indicator';
  center.textContent = 'Page ' + currentPage + ' of ' + totalPages;

  // Next
  const right = document.createElement('div');
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn';
  nextBtn.textContent = 'Next ›';
  nextBtn.disabled = currentPage >= totalPages;
  nextBtn.addEventListener('click', function () { onPageChange(currentPage + 1); });
  right.appendChild(nextBtn);

  paginationEl.appendChild(left);
  paginationEl.appendChild(center);
  paginationEl.appendChild(right);
}

// Entry point
function renderSermons(sermonsArray, options) {
  console.log('Initializing sermon rendering with options:');
  const opts = Object.assign({ targetId: 'sermons-list', itemsPerPage: 5 }, options || {});
  const container = document.getElementById(opts.targetId);
  if (!container) {
    throw new Error('Container not found: ' + opts.targetId);
  }

  // Clear and create structure
  container.innerHTML = '';
  const grid = createGrid(container);
  const pagination = createPagination(container);

  const state = {
    sermons: Array.isArray(sermonsArray) ? sermonsArray : [],
    itemsPerPage: Number(opts.itemsPerPage) || 5,
    currentPage: 1,
    grid: grid,
    pagination: pagination
  };
  console.log('Sermons data:', state);
  function getTotalPages() {
    return Math.max(1, Math.ceil(state.sermons.length / state.itemsPerPage));
  }

  function renderPage(page) {
    const total = getTotalPages();
    state.currentPage = Math.max(1, Math.min(page, total));

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const pageItems = state.sermons.slice(start, end);

    renderCards(state.grid, pageItems);
    renderPaginationControls(state.pagination, state.currentPage, total, renderPage);
  }

  // initial render
  renderPage(1);

  // return control helpers
  return {
    goToPage: function (n) { renderPage(n); },
    next: function () { renderPage(state.currentPage + 1); },
    prev: function () { renderPage(state.currentPage - 1); },
    totalPages: function () { return getTotalPages(); }
  };
}


async function sha256(text) {

  const data = new TextEncoder().encode(text);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}


function saveSermonsCache(sermons) {

  const cacheData = {
    sermons: sermons,
    expiresAt: Date.now() + (1000 * 60 * 5)
    // 5 minutes
  };

  localStorage.setItem(
    'sermonsCache',
    JSON.stringify(cacheData)
  );
}

function getSermonsCache() {

  const raw = localStorage.getItem('sermonsCache');

  if (!raw) {
    return null;
  }

  const cacheData = JSON.parse(raw);

  // Expired
  if (Date.now() > cacheData.expiresAt) {

    localStorage.removeItem('sermonsCache');

    return null;
  }

  return cacheData.sermons;
}


function checkAndRefreshPage() {
  const lastRefreshTime = localStorage.getItem('page_refresh');
  const now = Date.now();
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

  if (lastRefreshTime) {
    const timeSinceRefresh = now - parseInt(lastRefreshTime);
    if (timeSinceRefresh > TWELVE_HOURS_MS) {
      localStorage.setItem('page_refresh', now.toString());
      location.reload();
      return;
    }
  } else {
    localStorage.setItem('page_refresh', now.toString());
  }
}


function showLoginForm() {
  const container = document.getElementById('sermons-list');
  container.innerHTML =
    '<div class="login-form-container">' +
    '<h2>Enter Passcode</h2>' +
    '<input type="password" id="passcode-input" placeholder="passcode" class="login-input" />' +
    '<button id="login-btn" class="login-btn">Login</button>' +
    '<div id="login-error" class="login-error" style="display: none;"></div>' +
    '</div>';

  const loginBtn = document.getElementById('login-btn');
  const passcodeInput = document.getElementById('passcode-input');

  loginBtn.addEventListener('click', handleLogin);
  passcodeInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  });
}


async function handleLogin() {
  const passcodeInput = document.getElementById('passcode-input');
  const loginBtn = document.getElementById('login-btn');
  const errorDiv = document.getElementById('login-error');
  const container = document.getElementById('sermons-list');
  
  const passcode = passcodeInput.value.trim();
  
  if (!passcode) {
    errorDiv.textContent = 'Please enter a passcode';
    errorDiv.style.display = 'block';
    return;
  }

  loginBtn.disabled = true;
  errorDiv.style.display = 'none';
  
  try {
    alert('Starting login process...');
    const hash = await sha256(passcode);
    alert('Hashed passcode: ' + hash);
    
    container.innerHTML =
      '<img src="assets/img/loading.gif" alt="Loading..." style="max-width: 25%; height: auto; margin: auto; display: block;">';

    const response = await fetch(
      'APP_SCRIPT_URL' + encodeURIComponent(hash)
    );
    alert('Fetch response status: ' + response.status);
    
    const data = await response.json();
    alert('Response data: ' + JSON.stringify(data));
    
    console.log('Sermons data loaded:', data);

    if (!data.success) {
      showLoginForm();
      const newErrorDiv = document.getElementById('login-error');
      newErrorDiv.textContent = data.message || 'Invalid passcode';
      newErrorDiv.style.display = 'block';
      return;
    }

    saveSermonsCache(data.sermons);
    renderSermons(data.sermons);
  } catch (error) {
    alert('Error during login: ' + error.message);
    console.error('Error during login:', error);
    showLoginForm();
    const newErrorDiv = document.getElementById('login-error');
    newErrorDiv.textContent = 'Sorry, an error occurred. Please try again.';
    newErrorDiv.style.display = 'block';
  }
}


document.addEventListener('DOMContentLoaded', function () {
  checkAndRefreshPage();
  const container = document.getElementById('sermons-list');
  
  // Try cache first
  const cachedSermons = getSermonsCache();

  if (cachedSermons) {
    console.log('Loaded sermons from cache');
    renderSermons(cachedSermons);
    return;
  }

  // Show login form if no valid cache
  showLoginForm();
});


