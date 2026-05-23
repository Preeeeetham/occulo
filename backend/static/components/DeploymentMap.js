// static/components/DeploymentMap.js

export class DeploymentMap {
  constructor(containerId) {
    this.map = L.map(containerId, { zoomControl: false }).setView([20, 0], 2);
    
    // Add CartoDB Voyager Tile Layer for consistency with overview map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);
    
    // Re-position zoom controls to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    
    this.markersMap = new Map(); // Map from deployment ID to Leaflet marker
    this.currentFilterTechId = 'all';
  }

  // Format relative time helper
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

  // Plot/refresh map markers
  render(deployments) {
    // 1. Remove all existing markers
    this.markersMap.forEach(marker => this.map.removeLayer(marker));
    this.markersMap.clear();

    // 2. Add markers for each deployment with valid lat/lng
    deployments.forEach(d => {
      if (d.lat === null || d.lng === null || d.lat === undefined || d.lng === undefined) {
        return;
      }

      const isIp = d.location_source === 'ip';
      
      // Determine standard styling
      const markerStyle = {
        radius: 7,
        fillColor: '#2c6bde',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
        className: isIp ? 'approx-marker' : 'gps-marker'
      };

      // Set dashed border for IP locations
      if (isIp) {
        markerStyle.dashArray = '4, 4';
      }

      // Create Leaflet CircleMarker
      const marker = L.circleMarker([d.lat, d.lng], markerStyle);

      // Create Custom Popup Card
      const absoluteTime = new Date(d.deployed_at).toLocaleString();
      const relativeTime = this.getRelativeTime(d.deployed_at);
      const isGpsBadge = d.location_source === 'gps' 
        ? '<span class="popup-badge gps">GPS</span>' 
        : '<span class="popup-badge ip">~ Approx</span>';

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 180px;">
          <div class="popup-title">${d.ssid}</div>
          <div class="popup-tech">${d.technician_name} (${d.technician_email})</div>
          <div class="popup-loc" style="font-size: 0.8rem; font-weight: 600;">
            ${d.city || '—'}, ${d.region || '—'}, ${d.country_code || '—'}
          </div>
          <div class="popup-time" title="${d.deployed_at}">Deployed ${relativeTime} (${absoluteTime})</div>
          <div style="margin-top: 6px;">${isGpsBadge}</div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(this.map);

      // Save marker reference
      this.markersMap.set(d.id, marker);
    });

    // Reapply technician opacity filters
    this.filterTechnician(this.currentFilterTechId);
  }

  // Filter markers opacity based on active technician
  filterTechnician(techId) {
    this.currentFilterTechId = techId;

    this.markersMap.forEach((marker, depId) => {
      // Find matching deployment record
      const markerElement = marker.getElement();
      if (!markerElement) return;

      // Dim non-matching markers to 20% opacity (0.2)
      // Highlight selected technician's markers at 100% opacity (1.0)
      const matches = (techId === 'all');
      
      // Leaflet CircleMarkers can be dimmed using setStyle
      if (techId === 'all') {
        marker.setStyle({ opacity: 1, fillOpacity: 0.85 });
      } else {
        // We find the matching technician ID
        // To do this, we can store technician ID on the marker or query it
      }
    });
  }

  // Set filter by scanning actual deployments list
  applyTechnicianFilter(techId, deployments) {
    this.currentFilterTechId = techId;
    
    this.markersMap.forEach((marker, depId) => {
      const dep = deployments.find(item => item.id === depId);
      if (!dep) return;

      const isMatch = (techId === 'all' || dep.technician_id === techId);
      
      if (isMatch) {
        marker.setStyle({
          opacity: 1,
          fillOpacity: 0.85
        });
      } else {
        marker.setStyle({
          opacity: 0.2,
          fillOpacity: 0.1
        });
      }
    });
  }

  // Add a new marker with realtime pulse animation
  pulseNewMarker(d, activeFilterTechId, deployments) {
    if (d.lat === null || d.lng === null || d.lat === undefined || d.lng === undefined) {
      return;
    }

    const isIp = d.location_source === 'ip';
    const isMatch = (activeFilterTechId === 'all' || d.technician_id === activeFilterTechId);

    const markerStyle = {
      radius: 7,
      fillColor: '#2c6bde',
      color: '#ffffff',
      weight: 2,
      opacity: isMatch ? 1.0 : 0.2,
      fillOpacity: isMatch ? 0.85 : 0.1,
      className: isIp ? 'approx-marker' : 'gps-marker'
    };

    if (isIp) {
      markerStyle.dashArray = '4, 4';
    }

    const marker = L.circleMarker([d.lat, d.lng], markerStyle);
    
    const absoluteTime = new Date(d.deployed_at).toLocaleString();
    const relativeTime = this.getRelativeTime(d.deployed_at);
    const isGpsBadge = d.location_source === 'gps' 
      ? '<span class="popup-badge gps">GPS</span>' 
      : '<span class="popup-badge ip">~ Approx</span>';

    const popupHtml = `
      <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 180px;">
        <div class="popup-title">${d.ssid}</div>
        <div class="popup-tech">${d.technician_name} (${d.technician_email})</div>
        <div class="popup-loc" style="font-size: 0.8rem; font-weight: 600;">
          ${d.city || '—'}, ${d.region || '—'}, ${d.country_code || '—'}
        </div>
        <div class="popup-time" title="${d.deployed_at}">Deployed ${relativeTime} (${absoluteTime})</div>
        <div style="margin-top: 6px;">${isGpsBadge}</div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.addTo(this.map);
    this.markersMap.set(d.id, marker);

    // Trigger Leaflet CSS transition pulse animation
    setTimeout(() => {
      const path = marker.getElement();
      if (path) {
        path.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        
        // Pulse: Scale Up (Radius to 18)
        marker.setStyle({ radius: 18 });
        
        // Scale Down (Radius back to 7) after 300ms
        setTimeout(() => {
          marker.setStyle({ radius: 7 });
        }, 300);
      }
    }, 100);

    // Pan map to show the new deployment
    this.map.panTo([d.lat, d.lng]);
  }
}
