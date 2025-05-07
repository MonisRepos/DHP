// Main JavaScript for Weather Analysis Web App

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // State and city dropdown linkage
  const stateSelect = document.getElementById('stateSelect');
  const citySelect = document.getElementById('citySelect');
  
  if (stateSelect && citySelect) {
    // Load states and cities
    fetch('/api/states')
      .then(response => response.json())
      .then(data => {
        // Populate state dropdown
        stateSelect.innerHTML = '';
        data.states.forEach(state => {
          const option = document.createElement('option');
          option.value = state.name;
          option.textContent = state.name;
          stateSelect.appendChild(option);
          
          // Set initial selected state if provided in URL
          const urlParams = new URLSearchParams(window.location.search);
          const selectedState = urlParams.get('state');
          if (selectedState) {
            stateSelect.value = selectedState;
          }
        });
        
        // Initial city population
        updateCities();
      })
      .catch(error => {
        console.error('Error loading states:', error);
      });
    
    // When state changes, update cities
    stateSelect.addEventListener('change', updateCities);
    
    function updateCities() {
      fetch('/api/states')
        .then(response => response.json())
        .then(data => {
          const selectedState = stateSelect.value;
          const stateData = data.states.find(state => state.name === selectedState);
          
          // Clear city dropdown
          citySelect.innerHTML = '';
          
          if (stateData && stateData.cities) {
            // Populate city dropdown
            stateData.cities.forEach(city => {
              const option = document.createElement('option');
              option.value = city;
              option.textContent = city;
              citySelect.appendChild(option);
            });
            
            // Set initial selected city if provided in URL
            const urlParams = new URLSearchParams(window.location.search);
            const selectedCity = urlParams.get('city');
            if (selectedCity && stateData.cities.includes(selectedCity)) {
              citySelect.value = selectedCity;
            }
          }
        })
        .catch(error => {
          console.error('Error loading cities:', error);
        });
    }
  }
  
  // Years dropdown
  const yearSelect = document.getElementById('yearSelect');
  
  if (yearSelect) {
    // Load available years
    fetch('/api/years')
      .then(response => response.json())
      .then(years => {
        // Populate year dropdown
        yearSelect.innerHTML = '';
        years.forEach(year => {
          const option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          yearSelect.appendChild(option);
        });
        
        // Set initial selected year if provided in URL
        const urlParams = new URLSearchParams(window.location.search);
        const selectedYear = urlParams.get('year');
        if (selectedYear && years.includes(parseInt(selectedYear))) {
          yearSelect.value = selectedYear;
        } else if (years.length > 0) {
          // Default to most recent year
          yearSelect.value = years[years.length - 1];
        }
      })
      .catch(error => {
        console.error('Error loading years:', error);
      });
  }
  
  // Apply filter button
  const applyFilterBtn = document.getElementById('applyFilter');
  
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', function() {
      const state = stateSelect.value;
      const city = citySelect.value;
      const year = yearSelect.value;
      const month = document.getElementById('monthSelect').value;
      
      // Build URL with selected filters
      let url = `/analysis?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`;
      if (year) url += `&year=${encodeURIComponent(year)}`;
      if (month) url += `&month=${encodeURIComponent(month)}`;
      
      // Navigate to filtered view
      window.location.href = url;
    });
  }
  
  // Theme toggle logic
  const themeToggle = document.getElementById('themeToggle');
  
  if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-bs-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-bs-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });
  }
});
