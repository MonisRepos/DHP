// Insights.js - Handles the visualization of key insights based on temperature data

// Function to initialize all insight charts
function initInsightsCharts() {
  // Fetch temperature data from API
  fetch('/api/temperature')
    .then(response => response.json())
    .then(data => {
      // Parse the data
      const tempData = data.map(d => ({
        year: +d.Year,
        month: +d.Month,
        temperature: +d["Temperature (°C)"],
        minTemp: +d.Min_Temp_C,
        maxTemp: +d.Max_Temp_C
      }));
      
      // Initialize each chart with the data
      renderTempIncreaseChart(tempData);
      renderHotDaysChart(tempData);
      renderSeasonalShiftChart(tempData);
      renderRegionalVariationChart(tempData);
    })
    .catch(error => {
      console.error('Error fetching insight data:', error);
    });
}

// Function to initialize visualization charts
function initVisualizations() {
  // Fetch temperature data from API
  fetch('/api/temperature')
    .then(response => response.json())
    .then(data => {
      // Parse the data
      const tempData = data.map(d => ({
        year: +d.Year,
        month: +d.Month,
        temperature: +d["Temperature (°C)"],
        minTemp: +d.Min_Temp_C,
        maxTemp: +d.Max_Temp_C
      }));
      
      // Initialize the spiral chart
      renderInsightSpiral(tempData);
      
      // Initialize the heatmap
      renderVizHeatmap(tempData);
      
      // Initialize the bar chart race
      renderVizBarChartRace(tempData);
      
      // Initialize city comparison form
      initCityComparisonForm();
    })
    .catch(error => {
      console.error('Error fetching visualization data:', error);
    });
}

// Enhanced Multi-City Comparison Functionality
function initCityComparisonForm() {
  // Global variables
  let cityCounter = 2; // Start with 2 cities
  const maxCities = 6;  // Maximum number of cities to compare
  let statesData = {}; // Store states data globally
  let cityData = {}; // Store fetched city data
  
  // Show loading indicator initially
  const loader = document.getElementById('loader');
  
  // Load states and years data
  Promise.all([
    fetch('/api/states').then(res => res.json()),
    fetch('/api/years').then(res => res.json())
  ])
  .then(([states, years]) => {
    // Store states data in global variable
    statesData = states;
    
    // Populate year dropdown
    const yearSelect = document.getElementById('comparisonYear');
    yearSelect.innerHTML = '<option value="">All Years</option>';
    years.sort((a, b) => b - a).forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
    
    // Set up state/city selectors for initial cities
    setupStateSelectors();
    
    // Setup event handlers
    setupEventHandlers();
  })
  .catch(error => {
    console.error('Error initializing city comparison form:', error);
    alert('Failed to load location data. Please try again later.');
  });
  
  // Function to set up state selectors for all cities
  function setupStateSelectors() {
    // Get all state selects
    const stateSelects = document.querySelectorAll('.city-state-select');
    
    // Populate state dropdowns
    stateSelects.forEach(select => {
      // Clear existing options and add default
      select.innerHTML = '<option value="">-- Select State --</option>';
      
      // Add all states
      Object.keys(statesData).sort().forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        select.appendChild(option);
      });
      
      // Add change event listener
      select.addEventListener('change', handleStateChange);
    });
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-city').forEach(button => {
      button.addEventListener('click', handleRemoveCity);
      
      // Show remove buttons if we have more than 2 cities
      if (document.querySelectorAll('.city-selector').length > 2) {
        button.style.display = 'block';
      }
    });
  }
  
  // Handle state selection change
  function handleStateChange() {
    const stateSelect = this;
    const cityIndex = stateSelect.closest('.city-selector').dataset.cityIndex;
    const citySelect = document.getElementById(`cityName-${cityIndex}`);
    
    // Reset city dropdown
    citySelect.innerHTML = '<option value="">-- Select City --</option>';
    
    const selectedState = stateSelect.value;
    if (selectedState) {
      // Enable city dropdown and populate with cities for the selected state
      citySelect.disabled = false;
      
      const cities = statesData[selectedState] || [];
      cities.sort().forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    } else {
      // Disable city dropdown if no state is selected
      citySelect.disabled = true;
    }
  }
  
  // Handle removing a city
  function handleRemoveCity() {
    const cityCard = this.closest('.city-selector');
    
    // Only allow removal if we have more than 2 cities
    if (document.querySelectorAll('.city-selector').length > 2) {
      cityCard.remove();
      
      // Hide remove buttons if we're back to only 2 cities
      if (document.querySelectorAll('.city-selector').length <= 2) {
        document.querySelectorAll('.remove-city').forEach(btn => {
          btn.style.display = 'none';
        });
      }
    }
  }
  
  // Setup all event handlers
  function setupEventHandlers() {
    // Add City button
    document.getElementById('addCityBtn').addEventListener('click', function() {
      if (document.querySelectorAll('.city-selector').length >= maxCities) {
        alert(`Maximum ${maxCities} cities can be compared at once.`);
        return;
      }
      
      // Increment counter
      cityCounter++;
      
      // Create new city selector
      const citySelectors = document.getElementById('citySelectors');
      const newCityCard = document.createElement('div');
      newCityCard.className = 'city-selector city-card';
      newCityCard.dataset.cityIndex = cityCounter;
      newCityCard.style.backgroundColor = 'var(--background)';
      newCityCard.style.padding = '15px';
      newCityCard.style.borderRadius = 'var(--border-radius)';
      
      newCityCard.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5>City ${cityCounter}</h5>
          <span class="remove-city" style="cursor: pointer;"><i class="fas fa-times"></i></span>
        </div>
        <div class="form-group mb-2">
          <label for="cityState-${cityCounter}">State:</label>
          <select id="cityState-${cityCounter}" class="form-control city-state-select">
            <option value="">-- Select State --</option>
            <!-- Will be populated by JS -->
          </select>
        </div>
        <div class="form-group">
          <label for="cityName-${cityCounter}">City:</label>
          <select id="cityName-${cityCounter}" class="form-control city-name-select" disabled>
            <option value="">-- First Select a State --</option>
            <!-- Will be populated after state selection -->
          </select>
        </div>
      `;
      
      citySelectors.appendChild(newCityCard);
      
      // Setup selectors for the new city
      const newStateSelect = document.getElementById(`cityState-${cityCounter}`);
      
      // Populate states
      Object.keys(statesData).sort().forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        newStateSelect.appendChild(option);
      });
      
      // Add event listeners
      newStateSelect.addEventListener('change', handleStateChange);
      newCityCard.querySelector('.remove-city').addEventListener('click', handleRemoveCity);
      
      // Show all remove buttons
      document.querySelectorAll('.remove-city').forEach(btn => {
        btn.style.display = 'block';
      });
    });
    
    // Compare button
    document.getElementById('compareBtn').addEventListener('click', function() {
      // Get all selected cities
      const selectedCities = [];
      const cityCards = document.querySelectorAll('.city-selector');
      
      cityCards.forEach(card => {
        const index = card.dataset.cityIndex;
        const state = document.getElementById(`cityState-${index}`).value;
        const city = document.getElementById(`cityName-${index}`).value;
        
        if (state && city) {
          selectedCities.push({ state, city, index });
        }
      });
      
      // Need at least 2 cities for comparison
      if (selectedCities.length < 2) {
        alert('Please select at least 2 cities to compare');
        return;
      }
      
      // Get selected year and month
      const year = document.getElementById('comparisonYear').value;
      const month = document.getElementById('comparisonMonth').value;
      
      // Compare cities
      compareMultipleCities(selectedCities, year, month);
    });
  }
  
  // Function to compare multiple cities
  function compareMultipleCities(cities, year, month) {
    // Show loading indicator
    loader.style.display = 'flex';
    document.getElementById('comparisonResults').style.display = 'none';
    
    // Create array of promises to fetch data for each city
    const fetchPromises = cities.map(city => {
      let url = `/api/temperature?state=${encodeURIComponent(city.state)}&city=${encodeURIComponent(city.city)}`;
      if (year) url += `&year=${year}`;
      
      return fetch(url)
        .then(res => res.json())
        .then(data => {
          // Parse data
          const parsedData = data.map(d => ({
            city: city.city,
            state: city.state,
            index: city.index,
            year: +d.Year,
            month: +d.Month,
            temperature: +d["Temperature (°C)"],
            minTemp: +d.Min_Temp_C,
            maxTemp: +d.Max_Temp_C
          }));
          
          // Filter by month if specified
          if (month) {
            return parsedData.filter(d => d.month === parseInt(month));
          }
          
          return parsedData;
        });
    });
    
    // Fetch all data and render comparison charts
    Promise.all(fetchPromises)
      .then(results => {
        // Hide loader
        loader.style.display = 'none';
        
        // Store city data for future use
        cityData = {};
        results.forEach((cityResult, i) => {
          const cityInfo = cities[i];
          cityData[`${cityInfo.city}, ${cityInfo.state}`] = cityResult;
        });
        
        // Check if we have data
        const hasData = results.every(cityResult => cityResult.length > 0);
        
        if (!hasData) {
          alert('No data available for the selected cities/time period');
          return;
        }
        
        // Render comparison charts
        renderMultiCityComparisonChart(results, year, month);
        renderMultiCityTemperatureRangeChart(results, year, month);
        renderYearlyTrendsChart(results, year);
        
        // Show results container
        document.getElementById('comparisonResults').style.display = 'block';
      })
      .catch(error => {
        console.error('Error comparing cities:', error);
        loader.style.display = 'none';
        alert('Error fetching data for city comparison');
      });
  }
  
  // Render multi-city comparison chart
  function renderMultiCityComparisonChart(cityDataArray, year, month) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get context and destroy existing chart if it exists
    const ctx = document.getElementById('cityComparisonChart').getContext('2d');
    if (window.cityCompChart) window.cityCompChart.destroy();
    
    // If month is selected, create a different chart type
    if (month) {
      // For single month, create a bar chart comparing average temps
      const cityLabels = [];
      const avgTemps = [];
      const bgColors = [];
      
      // Generate colors for each city
      const colorPalette = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
      ];
      
      cityDataArray.forEach((cityData, index) => {
        if (cityData.length === 0) return;
        
        const cityName = `${cityData[0].city}, ${cityData[0].state}`;
        cityLabels.push(cityName);
        
        // Calculate average temperature for the month
        const avgTemp = cityData.reduce((sum, d) => sum + d.temperature, 0) / cityData.length;
        avgTemps.push(avgTemp);
        
        // Assign color
        bgColors.push(colorPalette[index % colorPalette.length]);
      });
      
      // Create bar chart
      window.cityCompChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: cityLabels,
          datasets: [{
            label: `Average Temperature for ${monthNames[parseInt(month) - 1]}`,
            data: avgTemps,
            backgroundColor: bgColors,
            borderColor: bgColors.map(c => c.replace('1)', '0.8)')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: year ? `Temperature Comparison for ${monthNames[parseInt(month) - 1]} ${year}` : `Temperature Comparison for ${monthNames[parseInt(month) - 1]} (All Years)`
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Average Temperature (°C)'
              }
            }
          }
        }
      });
    } else {
      // For all months, create a line chart showing monthly averages
      const datasets = [];
      
      // Generate colors for each city
      const colorPalette = [
        { border: '#3498db', bg: 'rgba(52, 152, 219, 0.1)' },
        { border: '#e74c3c', bg: 'rgba(231, 76, 60, 0.1)' },
        { border: '#2ecc71', bg: 'rgba(46, 204, 113, 0.1)' },
        { border: '#f39c12', bg: 'rgba(243, 156, 18, 0.1)' },
        { border: '#9b59b6', bg: 'rgba(155, 89, 182, 0.1)' },
        { border: '#1abc9c', bg: 'rgba(26, 188, 156, 0.1)' }
      ];
      
      cityDataArray.forEach((cityData, index) => {
        if (cityData.length === 0) return;
        
        const cityName = `${cityData[0].city}, ${cityData[0].state}`;
        const monthlyAvg = calculateMonthlyAverages(cityData);
        
        datasets.push({
          label: cityName,
          data: monthlyAvg,
          borderColor: colorPalette[index % colorPalette.length].border,
          backgroundColor: colorPalette[index % colorPalette.length].bg,
          tension: 0.3,
          fill: true
        });
      });
      
      // Create line chart
      window.cityCompChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthNames,
          datasets: datasets
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: year ? `Monthly Temperature Comparison (${year})` : 'Monthly Temperature Comparison (All Years)'
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'Average Temperature (°C)'
              }
            }
          }
        }
      });
    }
  }
  
  // Render temperature range chart for multiple cities
  function renderMultiCityTemperatureRangeChart(cityDataArray, year, month) {
    // Get context and destroy existing chart if it exists
    const ctx = document.getElementById('temperatureRangeChart').getContext('2d');
    if (window.tempRangeChart) window.tempRangeChart.destroy();
    
    // Calculate range data for each city
    const labels = [];
    const minTemps = [];
    const avgTemps = [];
    const maxTemps = [];
    
    cityDataArray.forEach(cityData => {
      if (cityData.length === 0) return;
      
      const cityName = `${cityData[0].city}, ${cityData[0].state}`;
      labels.push(cityName);
      
      // Calculate temperature ranges
      const ranges = calculateTempRanges(cityData);
      minTemps.push(ranges.minTemp);
      avgTemps.push(ranges.avgTemp);
      maxTemps.push(ranges.maxTemp);
    });
    
    // Create stacked bar chart
    window.tempRangeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Minimum Temperature (°C)',
            data: minTemps,
            backgroundColor: '#3498db'
          },
          {
            label: 'Average Temperature (°C)',
            data: avgTemps,
            backgroundColor: '#2ecc71'
          },
          {
            label: 'Maximum Temperature (°C)',
            data: maxTemps,
            backgroundColor: '#e74c3c'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: year 
              ? (month 
                ? `Temperature Range (${year}, ${getMonthName(month)})` 
                : `Temperature Range (${year})`)
              : (month 
                ? `Temperature Range (All Years, ${getMonthName(month)})` 
                : 'Temperature Range (All Years)')
          }
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Temperature (°C)'
            }
          }
        }
      }
    });
  }
  
  // Render yearly trends chart
  function renderYearlyTrendsChart(cityDataArray, selectedYear) {
    // Get context and destroy existing chart if it exists
    const ctx = document.getElementById('yearlyTrendsChart').getContext('2d');
    if (window.yearlyTrendsChart) window.yearlyTrendsChart.destroy();
    
    // If a specific year is selected, don't render this chart
    if (selectedYear) {
      document.querySelector('.additional-charts').style.display = 'none';
      return;
    } else {
      document.querySelector('.additional-charts').style.display = 'block';
    }
    
    // Generate datasets for each city
    const datasets = [];
    const colorPalette = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
    ];
    
    cityDataArray.forEach((cityData, index) => {
      if (cityData.length === 0) return;
      
      // Calculate yearly averages
      const yearlyData = {};
      cityData.forEach(d => {
        if (!yearlyData[d.year]) {
          yearlyData[d.year] = { sum: 0, count: 0 };
        }
        yearlyData[d.year].sum += d.temperature;
        yearlyData[d.year].count++;
      });
      
      // Convert to array of points for chart
      const years = Object.keys(yearlyData).sort();
      const avgTemps = years.map(year => ({
        x: parseInt(year),
        y: yearlyData[year].sum / yearlyData[year].count
      }));
      
      const cityName = `${cityData[0].city}, ${cityData[0].state}`;
      
      datasets.push({
        label: cityName,
        data: avgTemps,
        backgroundColor: colorPalette[index % colorPalette.length],
        borderColor: colorPalette[index % colorPalette.length],
        tension: 0.3,
        pointRadius: 3
      });
    });
    
    // Create scatter chart with lines for yearly trends
    window.yearlyTrendsChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Year-over-Year Temperature Trends'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const point = context.raw;
                return `${context.dataset.label}: ${point.y.toFixed(1)}°C (${point.x})`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: 'Year'
            },
            ticks: {
              stepSize: 5
            }
          },
          y: {
            title: {
              display: true,
              text: 'Average Temperature (°C)'
            }
          }
        }
      }
    });
  }
  
  // Helper function to get month name
  function getMonthName(month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[parseInt(month) - 1];
  }
}

// Helper function to calculate monthly averages
function calculateMonthlyAverages(data) {
  const monthlySums = Array(12).fill(0);
  const monthlyCounts = Array(12).fill(0);
  
  data.forEach(d => {
    if (d.month >= 1 && d.month <= 12) {
      monthlySums[d.month - 1] += d.temperature;
      monthlyCounts[d.month - 1]++;
    }
  });
  
  return monthlySums.map((sum, i) => 
    monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : null
  );
}

// Helper function to calculate temperature ranges
function calculateTempRanges(data) {
  let sumTemp = 0;
  let count = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  
  data.forEach(d => {
    sumTemp += d.temperature;
    count++;
    minTemp = Math.min(minTemp, d.minTemp);
    maxTemp = Math.max(maxTemp, d.maxTemp);
  });
  
  return {
    avgTemp: count > 0 ? sumTemp / count : null,
    minTemp: minTemp !== Infinity ? minTemp : null,
    maxTemp: maxTemp !== -Infinity ? maxTemp : null
  };
}

// Additional visualization functions
function renderVizHeatmap(data) {
  // Set up SVG and dimensions
  const svg = d3.select("#vizHeatmapChart");
  svg.selectAll("*").remove(); // Clear any existing content
  
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = {top: 30, right: 10, bottom: 40, left: 60};
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Get unique years and set up scales
  const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
  const months = d3.range(1, 13);
  
  const x = d3.scaleBand()
    .domain(years)
    .range([0, innerWidth])
    .padding(0.01);
  
  const y = d3.scaleBand()
    .domain(months)
    .range([0, innerHeight])
    .padding(0.01);
  
  // Get extent for color scale
  const extent = d3.extent(data, d => d.temperature);
  const colorScale = d3.scaleSequential(d3.interpolateInferno)
    .domain([extent[1], extent[0]]);
  
  // Draw cells
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const cells = g.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.month))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => colorScale(d.temperature))
    .attr("data-tippy-content", d => `${monthNames[d.month-1]} ${d.year}: ${d.temperature.toFixed(1)}°C`);
  
  // Add tooltips
  tippy(cells.nodes(), { theme: 'light-border', animation: 'scale' });
  
  // Add axes
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % 5 === 0)));
  
  g.append("g")
    .call(d3.axisLeft(y).tickFormat(d => monthNames[d-1]));
  
  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .text("Heatmap of Average Monthly Temperature");
}

function renderVizBarChartRace(data) {
  // Get unique years and set up the chart
  const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Get the canvas context
  const ctx = document.getElementById("vizBarRaceChart").getContext("2d");
  
  // Destroy existing chart if it exists
  if (window.vizRaceChart) window.vizRaceChart.destroy();
  
  // Get initial data
  const initialYear = years[0];
  const initialData = data.filter(d => d.year === initialYear);
  
  // Create the chart
  window.vizRaceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: initialData.map(d => monthNames[d.month - 1]),
      datasets: [{
        label: `Year ${initialYear}`,
        data: initialData.map(d => d.temperature),
        backgroundColor: "#2c3e50"
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      animation: { duration: 800 },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Temperature (°C)'
          }
        }
      }
    }
  });
  
  // Set up animation
  let yearIndex = 0;
  setInterval(() => {
    yearIndex = (yearIndex + 1) % years.length;
    const year = years[yearIndex];
    const yearData = data.filter(d => d.year === year);
    
    window.vizRaceChart.data.labels = yearData.map(d => monthNames[d.month - 1]);
    window.vizRaceChart.data.datasets[0].label = `Year ${year}`;
    window.vizRaceChart.data.datasets[0].data = yearData.map(d => d.temperature);
    window.vizRaceChart.update();
  }, 2000);
}

// Chart 1: Temperature Increase over decades
function renderTempIncreaseChart(data) {
  // Group data by decade and calculate average temperature
  const decadeData = {};
  data.forEach(d => {
    const decade = Math.floor(d.year / 10) * 10;
    if (!decadeData[decade]) {
      decadeData[decade] = { sum: 0, count: 0 };
    }
    decadeData[decade].sum += d.temperature;
    decadeData[decade].count++;
  });
  
  const decades = Object.keys(decadeData).sort();
  const avgTemps = decades.map(decade => ({
    decade: decade + 's',
    avgTemp: decadeData[decade].sum / decadeData[decade].count
  }));
  
  const ctx = document.getElementById('tempIncreaseChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: avgTemps.map(d => d.decade),
      datasets: [{
        label: 'Average Temperature (°C)',
        data: avgTemps.map(d => d.avgTemp),
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(75, 192, 192, 0.3)',
          'rgba(75, 192, 192, 0.4)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Average Temperature (°C)'
          }
        }
      }
    }
  });
}

// Chart 2: Hot Days Increase
function renderHotDaysChart(data) {
  // Calculate number of hot days (temp > 35°C) by decade
  const hotDaysByDecade = {};
  const totalDaysByDecade = {};
  
  data.forEach(d => {
    const decade = Math.floor(d.year / 10) * 10;
    if (!hotDaysByDecade[decade]) {
      hotDaysByDecade[decade] = 0;
      totalDaysByDecade[decade] = 0;
    }
    
    totalDaysByDecade[decade]++;
    if (d.maxTemp > 35) {
      hotDaysByDecade[decade]++;
    }
  });
  
  const decades = Object.keys(hotDaysByDecade).sort();
  const hotDaysPercentage = decades.map(decade => ({
    decade: decade + 's',
    percentage: (hotDaysByDecade[decade] / totalDaysByDecade[decade]) * 100
  }));
  
  const ctx = document.getElementById('hotDaysChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: hotDaysPercentage.map(d => d.decade),
      datasets: [{
        label: 'Hot Days (>35°C) Percentage',
        data: hotDaysPercentage.map(d => d.percentage),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Percentage of Days'
          }
        }
      }
    }
  });
}

// Chart 3: Seasonal Temperature Shift
function renderSeasonalShiftChart(data) {
  // Group data by decade and month
  const decadeData = {};
  data.forEach(d => {
    const decade = Math.floor(d.year / 10) * 10;
    if (!decadeData[decade]) {
      decadeData[decade] = Array(12).fill({ sum: 0, count: 0 });
    }
    
    // Create a new object to avoid reference issues
    const monthData = { ...decadeData[decade][d.month - 1] };
    monthData.sum += d.temperature;
    monthData.count += 1;
    decadeData[decade][d.month - 1] = monthData;
  });
  
  // Calculate average temperatures by month for each decade
  const decades = Object.keys(decadeData).sort();
  const monthlyAverages = {};
  
  decades.forEach(decade => {
    monthlyAverages[decade] = decadeData[decade].map(d => 
      d.count > 0 ? d.sum / d.count : null
    );
  });
  
  // Get the earliest and latest decades for comparison
  const earliestDecade = decades[0];
  const latestDecade = decades[decades.length - 1];
  
  const ctx = document.getElementById('seasonalShiftChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: `${earliestDecade}s`,
          data: monthlyAverages[earliestDecade],
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: `${latestDecade}s`,
          data: monthlyAverages[latestDecade],
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Average Temperature (°C)'
          }
        }
      }
    }
  });
}

// Chart 4: Regional Variation
function renderRegionalVariationChart(data) {
  // Simulated regional data
  const regions = ['North', 'South', 'East', 'West', 'Central', 'Northeast'];
  const warmingRates = [1.6, 1.2, 1.4, 1.5, 1.3, 1.1]; // °C over 50 years
  
  const ctx = document.getElementById('regionalVariationChart').getContext('2d');
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: regions,
      datasets: [{
        label: 'Temperature Increase (°C over 50 years)',
        data: warmingRates,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0,
          suggestedMax: 2
        }
      }
    }
  });
}

// Enhanced Spiral Chart - based on Ed Hawkins' climate spiral visualization
function renderInsightSpiral(data) {
  // Clear any existing content
  d3.select("#insightSpiralChart").selectAll("*").remove();
  document.getElementById("spiralYearLabel").textContent = "";
  
  // Sort data by time
  data.sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
  
  // Group the data by year for the spiral visualization
  const yearlyData = {};
  data.forEach(d => {
    if (!yearlyData[d.year]) {
      yearlyData[d.year] = [];
    }
    yearlyData[d.year].push(d);
  });
  
  const years = Object.keys(yearlyData).sort();
  
  // Set up SVG and dimensions
  const svg = d3.select("#insightSpiralChart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = 50;
  const innerRadius = 20;
  const outerRadius = Math.min(width, height) / 2 - margin;
  
  // Create the main group element and center it
  const g = svg.append("g")
    .attr("transform", `translate(${width/2}, ${height/2})`);
  
  // Set up scales
  const angleScale = d3.scaleLinear()
    .domain([1, 13])  // months 1-12 with a bit extra to make December complete
    .range([0, 2 * Math.PI]);
  
  // Find temperature range from data
  let minTemp = d3.min(data, d => d.temperature) || 15;
  let maxTemp = d3.max(data, d => d.temperature) || 35;
  
  // Pad the range for better visualization
  minTemp = Math.max(0, Math.floor(minTemp) - 5);
  maxTemp = Math.ceil(maxTemp) + 5;
  
  const radiusScale = d3.scaleLinear()
    .domain([minTemp, maxTemp])  // dynamic temperature range
    .range([innerRadius, outerRadius]);
  
  // Color scale - more vibrant rainbow temperature scale (blue=cold, red=hot)
  const tempColorScale = d3.scaleSequential()
    .domain([minTemp, maxTemp])
    .interpolator(d3.interpolateRdYlBu);
  
  // Month color scale for visual distinction
  const monthColorScale = d3.scaleSequential()
    .domain([1, 12])
    .interpolator(d3.interpolateRainbow);
  
  // Draw temperature reference circles
  const tempRanges = [];
  const tempStep = (maxTemp - minTemp) / 5;
  for (let temp = minTemp; temp <= maxTemp; temp += tempStep) {
    tempRanges.push(Math.round(temp));
  }
  
  // Add the reference circles
  tempRanges.forEach(temp => {
    g.append("circle")
      .attr("r", radiusScale(temp))
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.4);
      
    g.append("text")
      .attr("y", -radiusScale(temp))
      .attr("dy", "-0.3em")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#bbb")
      .text(`${temp}°C`);
  });
  
  // Month labels around the circle
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthAngles = [];
  
  monthNames.forEach((name, i) => {
    const monthIndex = i + 1;
    const angle = angleScale(monthIndex) - Math.PI / 2;
    monthAngles.push(angle);
    
    const radius = outerRadius + 15;
    
    // Month names
    g.append("text")
      .attr("x", radius * Math.cos(angle))
      .attr("y", radius * Math.sin(angle))
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", monthColorScale(monthIndex))
      .text(name);
    
    // Draw lines from center to month positions
    g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (outerRadius + 5) * Math.cos(angle))
      .attr("y2", (outerRadius + 5) * Math.sin(angle))
      .attr("stroke", monthColorScale(monthIndex))
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.3);
  });
  
  // Create a group for all year paths
  const spiralGroup = g.append("g").attr("class", "spiral-group");
  
  // Create continuous line generator for the spiral
  const lineGenerator = d3.lineRadial()
    .angle(d => angleScale(d.month) - Math.PI / 2)
    .radius(d => radiusScale(d.temperature))
    .curve(d3.curveCardinalClosed);
  
  // Create array to hold all year paths
  const yearPaths = [];
  
  // Draw each year's path
  years.forEach(year => {
    // Get complete monthly data for this year
    const yearData = yearlyData[year];
    
    // Make sure we have enough data points
    if (yearData.length < 3) return;
    
    // Sort by month
    yearData.sort((a, b) => a.month - b.month);
    
    // Create a path for this year
    const yearPath = spiralGroup.append("path")
      .datum(yearData)
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke-width", 2.5)
      .attr("stroke", "#fff") // Initial color will be overridden
      .attr("opacity", 0)  // Start hidden
      .attr("class", `year-${year}`);
      
    yearPaths.push({ year, path: yearPath, data: yearData });
  });
  
  // Function to highlight specific years with vivid colors
  function updateSpiralYear(yearIndex) {
    // Get the selected year
    const selectedYear = years[yearIndex];
    
    // Update the year label
    document.getElementById("spiralYearLabel").textContent = selectedYear;
    
    // Update each year path
    yearPaths.forEach(({ year, path, data }) => {
      const yearNum = parseInt(year);
      const selectedYearNum = parseInt(selectedYear);
      
      // Calculate opacity and width based on how close this year is to the selected year
      let opacity = 0;
      let strokeWidth = 2.5;
      
      if (yearNum <= selectedYearNum) {
        // Years before or equal to selected year are visible
        if (yearNum === selectedYearNum) {
          // Current year is fully opaque and thicker
          opacity = 1;
          strokeWidth = 4;
          
          // Apply a gradient color pattern along the path
          const gradientId = `temp-gradient-${year}`;
          
          // Create gradient for current year (temperature-based)
          const gradient = svg.append("linearGradient")
            .attr("id", gradientId)
            .attr("gradientUnits", "userSpaceOnUse");
            
          // Add color stops based on monthly temperatures
          const sortedData = [...data].sort((a, b) => a.temperature - b.temperature);
          sortedData.forEach((d, i) => {
            gradient.append("stop")
              .attr("offset", `${(i / (sortedData.length - 1)) * 100}%`)
              .attr("stop-color", tempColorScale(d.temperature));
          });
          
          // Apply gradient to path
          path.attr("stroke", `url(#${gradientId})`);
        } else {
          // Past years get faded effect based on how far back they are
          const yearDiff = selectedYearNum - yearNum;
          opacity = Math.max(0.05, 1 - (yearDiff / 10));
          strokeWidth = 2;
          
          // Apply a static color based on average temperature
          const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
          path.attr("stroke", tempColorScale(avgTemp));
        }
      }
      
      // Apply updated styles
      path.transition()
        .duration(200)
        .attr("opacity", opacity)
        .attr("stroke-width", strokeWidth);
    });
  }
  
  // Set up slider interaction
  const slider = document.getElementById("spiralYearSlider");
  slider.max = years.length - 1;
  slider.value = 0;
  
  slider.addEventListener("input", function() {
    updateSpiralYear(+this.value);
  });
  
  // Auto-play functionality
  let playInterval;
  const playBtn = document.getElementById("spiralPlayBtn");
  
  playBtn.addEventListener("click", function() {
    if (playInterval) {
      // Stop playback
      clearInterval(playInterval);
      playInterval = null;
      this.textContent = "Play Animation";
    } else {
      // Start playback from current position
      let yearIndex = +slider.value;
      this.textContent = "Pause Animation";
      
      playInterval = setInterval(() => {
        yearIndex = (yearIndex + 1) % years.length;
        slider.value = yearIndex;
        updateSpiralYear(yearIndex);
        
        if (yearIndex === years.length - 1) {
          // Loop back to beginning after a slight pause
          setTimeout(() => {
            if (playInterval) {
              yearIndex = 0;
              slider.value = 0;
              updateSpiralYear(0);
            }
          }, 1000);
        }
      }, 300);
    }
  });
  
  // Initialize with the first year
  updateSpiralYear(0);
}