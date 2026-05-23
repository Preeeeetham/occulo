// static/pages/deployments.js

import { fetchDeployments, subscribeDeploymentsRealtime } from '../hooks/useDeployments.js';
import { DeploymentFilter } from '../hooks/useDeploymentFilter.js';
import { DeploymentMap } from '../components/DeploymentMap.js';
import { TechnicianPanel } from '../components/TechnicianPanel.js';
import { DeploymentTable } from '../components/DeploymentTable.js';

let allDeployments = [];
let mapComponent = null;
let panelComponent = null;
let tableComponent = null;
let filterHook = null;

// Helper to format relative time for Card 4 and page updates
function getRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) {
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

// Recalculate metrics from list and draw them on top cards
function updateMetrics(deployments) {
  const totalCount = deployments.length;
  
  const activeTechs = new Set();
  deployments.forEach(d => {
    if (d.technician_id) activeTechs.add(d.technician_id);
  });
  
  const countries = new Set();
  deployments.forEach(d => {
    if (d.country_code && d.country_code.trim() !== '') {
      countries.add(d.country_code.trim().toUpperCase());
    }
  });
  
  let maxTime = null;
  deployments.forEach(d => {
    if (d.deployed_at) {
      const t = new Date(d.deployed_at).getTime();
      if (!maxTime || t > maxTime) {
        maxTime = t;
      }
    }
  });
  
  document.getElementById('m-total').textContent = totalCount;
  document.getElementById('m-active').textContent = activeTechs.size;
  document.getElementById('m-countries').textContent = countries.size;
  document.getElementById('m-last').textContent = maxTime ? getRelativeTime(new Date(maxTime).toISOString()) : '—';
}

// Process a new deployment received in realtime
function handleRealtimeDeployment(newDep) {
  console.log("Realtime deployment received in page component:", newDep);
  
  // 1. Increment total deployments count
  const totalEl = document.getElementById('m-total');
  if (totalEl) {
    const currentVal = parseInt(totalEl.textContent) || 0;
    totalEl.textContent = currentVal + 1;
  }
  
  // 2. Set last deployment to "just now"
  const lastEl = document.getElementById('m-last');
  if (lastEl) {
    lastEl.textContent = "just now";
  }

  // Prepend to memory store
  allDeployments.unshift(newDep);

  // Recalculate active technicians and countries counts
  const activeTechs = new Set();
  const countries = new Set();
  allDeployments.forEach(d => {
    if (d.technician_id) activeTechs.add(d.technician_id);
    if (d.country_code && d.country_code.trim() !== '') {
      countries.add(d.country_code.trim().toUpperCase());
    }
  });
  document.getElementById('m-active').textContent = activeTechs.size;
  document.getElementById('m-countries').textContent = countries.size;

  // 3. Render dynamic panel to update rankings and badges
  panelComponent.render(allDeployments);

  // 4. Pulse on map immediately
  mapComponent.pulseNewMarker(newDep, filterHook.technician, allDeployments);

  // 5. Prepend row to table if it matches currently active search/filters
  const isMatch = filterHook.apply([newDep]).length > 0;
  if (isMatch) {
    tableComponent.prependRealtime(newDep);
  }
}

// Initialise page components on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Deployments Page ESM Initialising...");

  // Init technician leaderboard and panel
  panelComponent = new TechnicianPanel((techId) => {
    filterHook.setTechnician(techId);
  });

  // Init sortable paginated deployments list table
  tableComponent = new DeploymentTable((tech) => {
    panelComponent.openDrawer(tech);
  });

  // Init Leaflet map with DarkMatter tiles
  mapComponent = new DeploymentMap('map');

  // Init filter synchronization
  filterHook = new DeploymentFilter((filter) => {
    // 1. Sync right technician panel highlight to prevent loop
    if (panelComponent.activeTechId !== filter.technician) {
      panelComponent.activeTechId = filter.technician;
      document.querySelectorAll('.tech-row').forEach(row => {
        row.classList.toggle('active', row.dataset.id === filter.technician);
      });
      const clearTechFilterLink = document.getElementById('clear-tech-filter');
      if (clearTechFilterLink) {
        clearTechFilterLink.style.display = filter.technician !== 'all' ? 'inline-block' : 'none';
      }
    }

    // 2. Filter dataset
    const filtered = filter.apply(allDeployments);

    // 3. Render Leaflet markers & apply opacity dimming
    mapComponent.render(filtered);
    mapComponent.applyTechnicianFilter(filter.technician, filtered);

    // 4. Draw filtered data on table
    tableComponent.render(filtered);
  });

  // Load initial deployments database records
  try {
    allDeployments = await fetchDeployments();
    
    // Removed mock data injection. If empty, the table will simply show no rows.
    // Draw metrics and leaderboard
    updateMetrics(allDeployments);
    panelComponent.render(allDeployments);
    
    // Apply filters and draw map & table
    const filtered = filterHook.apply(allDeployments);
    mapComponent.render(filtered);
    tableComponent.render(filtered);
    
  } catch (err) {
    console.error("Deployments initial loading sequence failed:", err);
    const tbody = document.getElementById('table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty">
            <div style="font-size: 14px; font-weight: 500; color: var(--danger);">Failed to load deployments</div>
            <div style="font-size: 12px; margin-top: 4px; color: var(--dim);">${err.message || err}</div>
          </td>
        </tr>
      `;
    }
  }

  subscribeDeploymentsRealtime(null, (newDep) => {
    handleRealtimeDeployment(newDep);
  });
});
