document.addEventListener('DOMContentLoaded', function() {
  var toggle = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');

  // Sidebar toggle (mobile)
  if (toggle && sidebar) {
    toggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show');
    });
    if (overlay) {
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      });
    }
  }

  // Pane switching
  window.switchPane = function(paneId) {
    // Hide all panes
    document.querySelectorAll('.pane').forEach(function(p) { p.classList.remove('active'); });
    // Deactivate all sidebar items
    document.querySelectorAll('.sidebar .nav-item').forEach(function(n) { n.classList.remove('active'); });
    // Show target pane
    var target = document.getElementById('pane-' + paneId);
    if (target) target.classList.add('active');
    // Activate sidebar item
    var navItem = document.querySelector('.sidebar .nav-item[data-pane="' + paneId + '"]');
    if (navItem) navItem.classList.add('active');
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
    }
    history.replaceState(null, '', window.location.pathname + '?pane=' + paneId);
  };

  // Sidebar nav clicks
  document.querySelectorAll('.sidebar .nav-item[data-pane]').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var pane = this.getAttribute('data-pane');
      if (pane) switchPane(pane);
    });
  });

  // Section header collapse
  document.querySelectorAll('.sidebar .sec > .nav-item').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var sec = this.closest('.sec');
      sec.classList.toggle('open');
    });
  });

  // Close mobile sidebar on any nav click
  document.querySelectorAll('.sidebar .nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
      }
    });
  });

  // Open pane from query param on load
  var params = new URLSearchParams(window.location.search);
  var initialPane = params.get('pane');
  if (initialPane && document.getElementById('pane-' + initialPane)) {
    switchPane(initialPane);
    // Open parent section
    var activeItem = document.querySelector('.sidebar .nav-item[data-pane="' + initialPane + '"]');
    if (activeItem) {
      var sec = activeItem.closest('.sec');
      if (sec) sec.classList.add('open');
    }
  } else {
    // Show landing pane by default
    var landing = document.getElementById('pane-landing');
    if (landing) {
      landing.classList.add('active');
      var landingNav = document.querySelector('.sidebar .nav-item[data-pane="landing"]');
      if (landingNav) landingNav.classList.add('active');
    }
  }

  // Copy code blocks
  document.querySelectorAll('pre').forEach(function(block) {
    var btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.style.cssText = 'position:absolute;top:6px;right:6px;background:#343a40;color:#adb5bd;border:1px solid #495057;border-radius:4px;padding:2px 8px;font-size:.7rem;cursor:pointer;font-family:Inter,sans-serif;opacity:0;transition:opacity .15s';
    block.style.position = 'relative';
    block.appendChild(btn);
    block.addEventListener('mouseenter', function() { btn.style.opacity = '1'; });
    block.addEventListener('mouseleave', function() { btn.style.opacity = '0'; });
    btn.addEventListener('click', function() {
      var code = block.querySelector('code');
      var text = code ? code.textContent : block.textContent;
      navigator.clipboard.writeText(text).then(function() {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });
});
