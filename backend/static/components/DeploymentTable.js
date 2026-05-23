// static/components/DeploymentTable.js

export class DeploymentTable {
  constructor(onTechClick) {
    this.onTechClick = onTechClick;
    this.deployments = [];
    this.filteredDeployments = [];
    this.pageSize = 25;
    this.currentPage = 1;
    this.sortColumn = 'deployed_at';
    this.sortAscending = false;

    this.setupSortListeners();
  }

  // Helper to format relative time
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

  // Setup click listeners for headers to handle sorting
  setupSortListeners() {
    const mappings = {
      'sort-ssid': 'ssid',
      'sort-tech': 'technician_name',
      'sort-loc': 'city',
      'sort-sec': 'security',
      'sort-time': 'deployed_at',
      'sort-ver': 'app_version',
      'sort-src': 'location_source'
    };

    Object.entries(mappings).forEach(([id, col]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          if (this.sortColumn === col) {
            this.sortAscending = !this.sortAscending;
          } else {
            this.sortColumn = col;
            this.sortAscending = true;
          }
          this.sortAndRender();
        });
      }
    });
  }

  // Update header arrow icons
  updateHeadersUI() {
    const mappings = {
      'ssid': 'sort-ssid',
      'technician_name': 'sort-tech',
      'city': 'sort-loc',
      'security': 'sort-sec',
      'deployed_at': 'sort-time',
      'app_version': 'sort-ver',
      'location_source': 'sort-src'
    };

    // Remove active sort classes and arrows
    Object.values(mappings).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active-sort');
        // Strip existing arrow if any
        el.innerHTML = el.innerHTML.replace(/\s*[↑↓]/g, '');
      }
    });

    // Add active styling & arrow indicator to currently sorted column
    const activeId = mappings[this.sortColumn];
    const activeEl = document.getElementById(activeId);
    if (activeEl) {
      activeEl.classList.add('active-sort');
      const arrow = this.sortAscending ? ' ↑' : ' ↓';
      activeEl.innerHTML += arrow;
    }
  }

  // Perform sorting on filtered array and draw table
  sortAndRender() {
    this.updateHeadersUI();

    // Sort client-side
    this.filteredDeployments.sort((a, b) => {
      let valA = a[this.sortColumn] || '';
      let valB = b[this.sortColumn] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortAscending ? -1 : 1;
      if (valA > valB) return this.sortAscending ? 1 : -1;
      return 0;
    });

    this.drawTable();
  }

  // Render method called by filter changes
  render(deployments) {
    this.filteredDeployments = [...deployments];
    this.currentPage = 1;
    this.sortAndRender();
  }

  // Draw current page content
  drawTable() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;

    if (this.filteredDeployments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty">
            <div style="font-size: 14px; font-weight: 500; color: var(--dim);">No deployments found</div>
            <div style="font-size: 12px; margin-top: 4px; color: var(--dim); opacity: 0.85;">Adjust your filters or wait for the first O Link deployment.</div>
          </td>
        </tr>
      `;
      this.drawPagination(0);
      return;
    }

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, this.filteredDeployments.length);
    const paginated = this.filteredDeployments.slice(startIdx, endIdx);

    tbody.innerHTML = '';
    paginated.forEach((d, index) => {
      const tr = document.createElement('tr');
      tr.id = `row-${d.id}`;

      // 1. Index Column
      const tdIdx = document.createElement('td');
      tdIdx.style.textAlign = 'right';
      tdIdx.style.color = 'var(--dim)';
      tdIdx.textContent = startIdx + index + 1;

      // 2. SSID
      const tdSsid = document.createElement('td');
      tdSsid.style.fontWeight = '700';
      tdSsid.textContent = d.ssid;

      // 3. Technician full name + email stacked
      const tdTech = document.createElement('td');
      const nameDiv = document.createElement('div');
      nameDiv.style.fontWeight = '700';
      nameDiv.style.fontSize = '13px';
      nameDiv.style.cursor = 'pointer';
      nameDiv.style.color = 'var(--p)';
      nameDiv.textContent = d.technician_name || 'Unknown Technician';
      
      // Bind click to open drawer
      nameDiv.addEventListener('click', () => {
        if (this.onTechClick) {
          // Construct technician object format expected by panel drawer
          // (Find all matching deployments for this technician)
          const techDeploys = this.deployments.filter(item => item.technician_id === d.technician_id);
          this.onTechClick({
            id: d.technician_id,
            name: d.technician_name,
            email: d.technician_email,
            count: techDeploys.length,
            deploymentsList: techDeploys
          });
        }
      });

      const emailDiv = document.createElement('div');
      emailDiv.style.color = 'var(--dim)';
      emailDiv.style.fontSize = '11px';
      emailDiv.textContent = d.technician_email || '—';
      tdTech.appendChild(nameDiv);
      tdTech.appendChild(emailDiv);

      // 4. Location
      const tdLoc = document.createElement('td');
      const parts = [d.city, d.region, d.country_code].filter(p => p && p.trim() !== '');
      const prefix = d.location_source === 'ip' ? '~ ' : '';
      tdLoc.textContent = parts.length > 0 ? prefix + parts.join(', ') : '—';

      // 5. Security Badge
      const tdSec = document.createElement('td');
      const secBadge = document.createElement('span');
      secBadge.className = 'badge security';
      secBadge.textContent = d.security || 'WPA2';
      tdSec.appendChild(secBadge);

      // 6. Deployed At Relative time + hover title
      const tdTime = document.createElement('td');
      tdTime.setAttribute('title', d.deployed_at);
      tdTime.textContent = this.getRelativeTime(d.deployed_at);

      // 7. App Version
      const tdVer = document.createElement('td');
      tdVer.className = 'mono';
      tdVer.style.color = 'var(--dim)';
      tdVer.textContent = d.app_version || '—';

      // 8. Source Badge (GPS or IP)
      const tdSrc = document.createElement('td');
      const srcBadge = document.createElement('span');
      const isIp = d.location_source === 'ip';
      srcBadge.className = `badge ${isIp ? 'ip' : 'gps'}`;
      srcBadge.innerHTML = isIp ? '&bull; IP' : '&bull; GPS';
      tdSrc.appendChild(srcBadge);

      // Assemble row
      tr.appendChild(tdIdx);
      tr.appendChild(tdSsid);
      tr.appendChild(tdTech);
      tr.appendChild(tdLoc);
      tr.appendChild(tdSec);
      tr.appendChild(tdTime);
      tr.appendChild(tdVer);
      tr.appendChild(tdSrc);

      tbody.appendChild(tr);
    });

    this.drawPagination(this.filteredDeployments.length);
  }

  // Render pagination bar
  drawPagination(totalItems) {
    const container = document.getElementById('pagination');
    if (!container) return;

    if (totalItems <= this.pageSize) {
      container.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(totalItems / this.pageSize);
    
    container.innerHTML = '';

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pag-btn';
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.addEventListener('click', () => {
      this.currentPage--;
      this.drawTable();
    });

    // Info Label
    const info = document.createElement('span');
    info.style.fontWeight = '600';
    info.textContent = `Page ${this.currentPage} of ${totalPages}`;

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pag-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = this.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      this.currentPage++;
      this.drawTable();
    });

    container.appendChild(prevBtn);
    container.appendChild(info);
    container.appendChild(nextBtn);
  }

  // Prepend a new realtime deployment with fadeout animation
  prependRealtime(d) {
    // 1. Add to arrays
    this.filteredDeployments.unshift(d);
    
    // 2. Re-render table if on page 1
    if (this.currentPage === 1) {
      this.drawTable();
      
      // Highlight the first row immediately
      const firstRow = document.getElementById(`row-${d.id}`);
      if (firstRow) {
        firstRow.style.transition = 'background-color 2s ease';
        firstRow.style.backgroundColor = 'rgba(44, 107, 222, 0.08)';
        
        // Fadeout highlight
        setTimeout(() => {
          firstRow.style.backgroundColor = 'transparent';
        }, 100);
      }
    }
  }
}
