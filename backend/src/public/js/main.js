// Sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
  var toggle = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
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

  // Sidebar section collapse (toggle + navigate)
  document.querySelectorAll('.sidebar .sec > .nav-item').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var sec = this.closest('.sec');
      sec.classList.toggle('open');
    });
  });

  // Close sidebar on mobile when any nav link is clicked
  document.querySelectorAll('.sidebar .nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
      }
    });
  });

  // Tab switching
  window.switchTab = function(tabId) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-btn').forEach(function(tb) { tb.classList.remove('active'); });
    // Show target
    var target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');
    // Activate button
    var btn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
    if (btn) btn.classList.add('active');
    // Update URL hash
    history.replaceState(null, '', '#tab-' + tabId);
  };

  // Open tab from hash or query param on load
  var params = new URLSearchParams(window.location.search);
  var queryTab = params.get('tab');
  var hashTab = window.location.hash && window.location.hash.startsWith('#tab-')
    ? window.location.hash.replace('#tab-', '')
    : null;
  var initialTab = queryTab || hashTab;
  if (initialTab) {
    switchTab(initialTab);
    // Activate sidebar sub-item
    var activeSub = document.querySelector('.sidebar .sub .nav-item[data-tab="' + initialTab + '"]');
    if (activeSub) activeSub.classList.add('active');
  } else {
    var firstTab = document.querySelector('.tab-btn');
    if (firstTab) switchTab(firstTab.getAttribute('data-tab'));
  }

  // Sub-tab switching within a tab
  document.querySelectorAll('.sub-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var parent = this.closest('.tab-content');
      var target = this.getAttribute('data-subtab');
      parent.querySelectorAll('.sub-tab-btn').forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');
      parent.querySelectorAll('.sub-tab-pane').forEach(function(p) { p.classList.remove('active'); });
      var pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    });
  });

  // Auto-activate first sub-tab
  document.querySelectorAll('.tab-content').forEach(function(tc) {
    var firstSub = tc.querySelector('.sub-tab-btn');
    if (firstSub) firstSub.click();
  });

  // Copy code blocks
  document.querySelectorAll('pre').forEach(function(block) {
    var btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.className = 'copy-btn';
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
