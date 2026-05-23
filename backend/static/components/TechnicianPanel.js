// static/components/TechnicianPanel.js

export class TechnicianPanel {
  constructor(onTechSelect) {
    this.onTechSelect = onTechSelect;
    this.activeTechId = 'all';
    this.deployments = [];
    this.technicians = [];

    this.setupListeners();
  }

  setupListeners() {
    const backdrop = document.getElementById('drawer-backdrop');
    const clearTechFilterLink = document.getElementById('clear-tech-filter');

    // Drawer backdrop click listener to close
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeDrawer());
    }

    // Escape key listener to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDrawer();
      }
    });

    if (clearTechFilterLink) {
      clearTechFilterLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.selectTechnician('all');
      });
    }
  }

  // Get relative time helper
  getRelativeTime(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  // Extract initials helper
  getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Build ranking list of technicians based on fetched deployments
  render(deployments) {
    this.deployments = deployments;
    const listContainer = document.getElementById('tech-list');
    if (!listContainer) return;

    // Group deployments by technician
    const techGroups = {};
    deployments.forEach(d => {
      const id = d.technician_id;
      if (!id) return;
      if (!techGroups[id]) {
        techGroups[id] = {
          id: id,
          name: d.technician_name || 'Unknown Technician',
          email: d.technician_email || 'Unknown Email',
          count: 0,
          deploymentsList: []
        };
      }
      techGroups[id].count++;
      techGroups[id].deploymentsList.push(d);
    });

    // Convert to sorted array (count descending)
    this.technicians = Object.values(techGroups).sort((a, b) => b.count - a.count);

    // Populate drop-down filter dynamically
    this.populateDropdown();

    if (this.technicians.length === 0) {
      listContainer.innerHTML = '<div class="empty">No active technicians logged</div>';
      return;
    }

    listContainer.innerHTML = '';
    this.technicians.forEach(t => {
      const row = document.createElement('div');
      row.className = `tech-row${this.activeTechId === t.id ? ' active' : ''}`;
      row.dataset.id = t.id;

      const avatar = document.createElement('div');
      avatar.className = 'tech-avatar';
      avatar.textContent = this.getInitials(t.name);

      const info = document.createElement('div');
      info.className = 'tech-info';
      
      const nameEl = document.createElement('div');
      nameEl.className = 'tech-name';
      nameEl.textContent = t.name;

      const emailEl = document.createElement('div');
      emailEl.className = 'tech-email';
      emailEl.textContent = t.email;

      info.appendChild(nameEl);
      info.appendChild(emailEl);

      const badge = document.createElement('div');
      badge.className = 'tech-count';
      badge.textContent = t.count;

      row.appendChild(avatar);
      row.appendChild(info);
      row.appendChild(badge);

      row.addEventListener('click', (e) => {
        // Toggle technician select filter or open drawer
        // If clicked name or avatar, open drawer. Else select filter.
        if (e.target.closest('.tech-avatar') || e.target.closest('.tech-info')) {
          this.openDrawer(t);
        } else {
          const newSelection = this.activeTechId === t.id ? 'all' : t.id;
          this.selectTechnician(newSelection);
        }
      });

      listContainer.appendChild(row);
    });

    // Update clear tech filter link visibility
    const clearTechFilterLink = document.getElementById('clear-tech-filter');
    if (clearTechFilterLink) {
      clearTechFilterLink.style.display = this.activeTechId !== 'all' ? 'inline-block' : 'none';
    }
  }

  // Populate dynamic entries to dropdown
  populateDropdown() {
    const dropdown = document.getElementById('f-tech');
    if (!dropdown) return;

    // Save current selected value
    const currentVal = dropdown.value;

    // Clear old options except the first one
    dropdown.innerHTML = '<option value="all">All technicians</option>';
    
    this.technicians.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${t.email})`;
      dropdown.appendChild(opt);
    });

    // Restore selection
    dropdown.value = currentVal;
  }

  selectTechnician(techId) {
    this.activeTechId = techId;
    
    // Highlight matching row
    document.querySelectorAll('.tech-row').forEach(row => {
      row.classList.toggle('active', row.dataset.id === techId);
    });

    const clearTechFilterLink = document.getElementById('clear-tech-filter');
    if (clearTechFilterLink) {
      clearTechFilterLink.style.display = techId !== 'all' ? 'inline-block' : 'none';
    }

    if (this.onTechSelect) {
      this.onTechSelect(techId);
    }
  }

  // Open slide-in Profile Drawer
  openDrawer(tech) {
    const backdrop = document.getElementById('drawer-backdrop');
    const drawer = document.getElementById('drawer');
    if (!backdrop || !drawer) return;

    // Populate drawer elements
    document.getElementById('d-avatar').textContent = this.getInitials(tech.name);
    document.getElementById('d-name').textContent = tech.name;
    document.getElementById('d-email').textContent = tech.email;
    
    // Member since fallback or computed (hardcoded for now or based on first deployment)
    const firstDeploy = tech.deploymentsList[tech.deploymentsList.length - 1];
    let memberSince = 'Member since March 2025';
    if (firstDeploy && firstDeploy.deployed_at) {
      const date = new Date(firstDeploy.deployed_at);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      memberSince = `Member since ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    document.getElementById('d-created').textContent = memberSince;

    // Drawer Statistics
    document.getElementById('d-stat-total').textContent = tech.count;

    // Deployments in current calendar month
    const now = new Date();
    const currentMonthDeploys = tech.deploymentsList.filter(d => {
      const dDate = new Date(d.deployed_at);
      return dDate.getFullYear() === now.getFullYear() && dDate.getMonth() === now.getMonth();
    }).length;
    document.getElementById('d-stat-month').textContent = currentMonthDeploys;

    // Last Active Relative Time
    const lastActive = tech.deploymentsList[0] ? this.getRelativeTime(tech.deploymentsList[0].deployed_at) : '—';
    document.getElementById('d-stat-active').textContent = lastActive;

    // Drawer History List
    const listContainer = document.getElementById('drawer-list');
    listContainer.innerHTML = '';
    
    tech.deploymentsList.forEach((d, idx) => {
      const row = document.createElement('div');
      row.className = 'drawer-row';

      const indexBadge = document.createElement('div');
      indexBadge.className = 'drawer-idx';
      indexBadge.textContent = String(tech.deploymentsList.length - idx).padStart(2, '0');

      const info = document.createElement('div');
      info.className = 'drawer-info';

      const ssid = document.createElement('div');
      ssid.className = 'drawer-ssid';
      ssid.textContent = d.ssid;

      const loc = document.createElement('div');
      loc.className = 'drawer-loc';
      loc.textContent = `${d.city || '—'}, ${d.region || '—'}`;

      info.appendChild(ssid);
      info.appendChild(loc);

      const time = document.createElement('div');
      time.className = 'drawer-time';
      time.textContent = this.getRelativeTime(d.deployed_at);

      row.appendChild(indexBadge);
      row.appendChild(info);
      row.appendChild(time);

      listContainer.appendChild(row);
    });

    // Open animations
    backdrop.classList.add('open');
    drawer.classList.add('open');
  }

  // Close Profile Drawer
  closeDrawer() {
    const backdrop = document.getElementById('drawer-backdrop');
    const drawer = document.getElementById('drawer');
    if (backdrop) backdrop.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
  }
}
