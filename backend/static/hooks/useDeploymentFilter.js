// static/hooks/useDeploymentFilter.js

export class DeploymentFilter {
  constructor(onFilterChange) {
    this.search = '';
    this.technician = 'all';
    this.dateFrom = '';
    this.dateTo = '';
    this.onFilterChange = onFilterChange;
    
    this.setupListeners();
  }

  setupListeners() {
    const searchInput = document.getElementById('f-search');
    const techSelect = document.getElementById('f-tech');
    const dateFromInput = document.getElementById('f-from');
    const dateToInput = document.getElementById('f-to');
    const clearLink = document.getElementById('f-clear');
    const clearTechLink = document.getElementById('clear-tech-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.search = e.target.value.trim().toLowerCase();
        this.changed();
      });
    }

    if (techSelect) {
      techSelect.addEventListener('change', (e) => {
        this.technician = e.target.value;
        this.changed();
      });
    }

    if (dateFromInput) {
      dateFromInput.addEventListener('change', (e) => {
        this.dateFrom = e.target.value;
        this.changed();
      });
    }

    if (dateToInput) {
      dateToInput.addEventListener('change', (e) => {
        this.dateTo = e.target.value;
        this.changed();
      });
    }

    const performClear = (e) => {
      if (e) e.preventDefault();
      this.search = '';
      this.technician = 'all';
      this.dateFrom = '';
      this.dateTo = '';

      if (searchInput) searchInput.value = '';
      if (techSelect) techSelect.value = 'all';
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';

      this.changed();
    };

    if (clearLink) {
      clearLink.addEventListener('click', performClear);
    }
    if (clearTechLink) {
      clearTechLink.addEventListener('click', performClear);
    }
  }

  setTechnician(techId) {
    this.technician = techId;
    const techSelect = document.getElementById('f-tech');
    if (techSelect) {
      techSelect.value = techId;
    }
    this.changed();
  }

  isActive() {
    return this.search !== '' || this.technician !== 'all' || this.dateFrom !== '' || this.dateTo !== '';
  }

  changed() {
    const clearLink = document.getElementById('f-clear');
    const clearTechLink = document.getElementById('clear-tech-filter');
    
    const active = this.isActive();
    if (clearLink) clearLink.style.display = active ? 'inline-block' : 'none';
    if (clearTechLink) clearTechLink.style.display = this.technician !== 'all' ? 'inline-block' : 'none';

    if (this.onFilterChange) {
      this.onFilterChange(this);
    }
  }

  apply(deployments) {
    return deployments.filter(d => {
      // 1. Search filter (SSID, City, Technician name/email)
      if (this.search) {
        const ssid = (d.ssid || '').toLowerCase();
        const city = (d.city || '').toLowerCase();
        const region = (d.region || '').toLowerCase();
        const techName = (d.technician_name || '').toLowerCase();
        const techEmail = (d.technician_email || '').toLowerCase();
        const match = ssid.includes(this.search) || 
                      city.includes(this.search) || 
                      region.includes(this.search) ||
                      techName.includes(this.search) || 
                      techEmail.includes(this.search);
        if (!match) return false;
      }

      // 2. Technician filter
      if (this.technician !== 'all') {
        if (d.technician_id !== this.technician) return false;
      }

      // 3. Date range filter
      if (d.deployed_at) {
        const dDate = new Date(d.deployed_at);
        if (this.dateFrom) {
          const fromDate = new Date(this.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (dDate < fromDate) return false;
        }
        if (this.dateTo) {
          const toDate = new Date(this.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (dDate > toDate) return false;
        }
      }

      return true;
    });
  }
}
