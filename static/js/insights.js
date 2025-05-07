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

// City comparison functionality
function initCityComparisonForm() {
  // Load states for the city comparison dropdowns
  fetch('/api/states')
    .then(response => response.json())
    .then(data => {
      // Populate state dropdowns
      const stateSelects = [
        document.getElementById('firstCityState'),
        document.getElementById('secondCityState')
      ];
      
      stateSelects.forEach(select => {
        select.innerHTML = '<option value="">-- Select State --</option>';
        Object.keys(data).sort().forEach(state => {
          const option = document.createElement('option');
          option.value = state;
          option.textContent = state;
          select.appendChild(option);
        });
      });
      
      // Add event listeners to state dropdowns
      stateSelects.forEach((select, index) => {
        const citySelect = index === 0 ? 
          document.getElementById('firstCity') : 
          document.getElementById('secondCity');
        
        select.addEventListener('change', function() {
          const selectedState = this.value;
          citySelect.innerHTML = '<option value="">-- Select City --</option>';
          
          if (selectedState) {
            citySelect.disabled = false;
            const cities = data[selectedState] || [];
            cities.sort().forEach(city => {
              const option = document.createElement('option');
              option.value = city;
              option.textContent = city;
              citySelect.appendChild(option);
            });
          } else {
            citySelect.disabled = true;
          }
        });
      });
      
      // Load years for the comparison
      fetch('/api/years')
        .then(response => response.json())
        .then(years => {
          const yearSelect = document.getElementById('comparisonYear');
          yearSelect.innerHTML = '<option value="">All Years</option>';
          years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
          });
        })
        .catch(error => console.error('Error loading years:', error));
      
      // Add event listener to compare button
      document.getElementById('compareBtn').addEventListener('click', function() {
        const firstState = document.getElementById('firstCityState').value;
        const firstCity = document.getElementById('firstCity').value;
        const secondState = document.getElementById('secondCityState').value;
        const secondCity = document.getElementById('secondCity').value;
        const year = document.getElementById('comparisonYear').value;
        
        if (!firstState || !firstCity || !secondState || !secondCity) {
          alert('Please select both cities to compare');
          return;
        }
        
        compareCities(firstState, firstCity, secondState, secondCity, year);
      });
    })
    .catch(error => console.error('Error loading states:', error));
}

// Function to compare two cities
function compareCities(firstState, firstCity, secondState, secondCity, year) {
  // Show loading indicator
  const loader = document.getElementById('loader');
  loader.style.display = 'flex';
  
  // Fetch data for both cities
  Promise.all([
    fetch(`/api/temperature?state=${encodeURIComponent(firstState)}&city=${encodeURIComponent(firstCity)}${year ? `&year=${year}` : ''}`).then(res => res.json()),
    fetch(`/api/temperature?state=${encodeURIComponent(secondState)}&city=${encodeURIComponent(secondCity)}${year ? `&year=${year}` : ''}`).then(res => res.json())
  ])
  .then(([firstCityData, secondCityData]) => {
    // Hide loader
    loader.style.display = 'none';
    
    // Parse data
    const parsedFirstCity = firstCityData.map(d => ({
      year: +d.Year,
      month: +d.Month,
      temperature: +d["Temperature (°C)"],
      minTemp: +d.Min_Temp_C,
      maxTemp: +d.Max_Temp_C
    }));
    
    const parsedSecondCity = secondCityData.map(d => ({
      year: +d.Year,
      month: +d.Month,
      temperature: +d["Temperature (°C)"],
      minTemp: +d.Min_Temp_C,
      maxTemp: +d.Max_Temp_C
    }));
    
    // Render comparison charts
    renderCityComparisonChart(parsedFirstCity, parsedSecondCity, firstCity, secondCity, year);
    renderTemperatureRangeChart(parsedFirstCity, parsedSecondCity, firstCity, secondCity, year);
  })
  .catch(error => {
    console.error('Error comparing cities:', error);
    loader.style.display = 'none';
    alert('Error fetching data for city comparison');
  });
}

// Render city comparison chart
function renderCityComparisonChart(firstCityData, secondCityData, firstCity, secondCity, year) {
  // Calculate monthly averages for both cities
  const monthlyAvgFirst = calculateMonthlyAverages(firstCityData);
  const monthlyAvgSecond = calculateMonthlyAverages(secondCityData);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Get context and destroy existing chart if it exists
  const ctx = document.getElementById('cityComparisonChart').getContext('2d');
  if (window.cityCompChart) window.cityCompChart.destroy();
  
  // Create new chart
  window.cityCompChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthNames,
      datasets: [
        {
          label: firstCity,
          data: monthlyAvgFirst,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: secondCity,
          data: monthlyAvgSecond,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
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

// Render temperature range chart
function renderTemperatureRangeChart(firstCityData, secondCityData, firstCity, secondCity, year) {
  // Calculate temperature range data
  const firstCityRanges = calculateTempRanges(firstCityData);
  const secondCityRanges = calculateTempRanges(secondCityData);
  
  // Get context and destroy existing chart if it exists
  const ctx = document.getElementById('temperatureRangeChart').getContext('2d');
  if (window.tempRangeChart) window.tempRangeChart.destroy();
  
  // Create new chart - stacked bar chart
  window.tempRangeChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [firstCity, secondCity],
      datasets: [
        {
          label: 'Minimum Temperature (°C)',
          data: [firstCityRanges.minTemp, secondCityRanges.minTemp],
          backgroundColor: '#3498db'
        },
        {
          label: 'Average Temperature (°C)',
          data: [firstCityRanges.avgTemp, secondCityRanges.avgTemp],
          backgroundColor: '#2ecc71'
        },
        {
          label: 'Maximum Temperature (°C)',
          data: [firstCityRanges.maxTemp, secondCityRanges.maxTemp],
          backgroundColor: '#e74c3c'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: year ? `Temperature Range Comparison (${year})` : 'Temperature Range Comparison (All Years)'
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

// Insight Spiral Chart - based on Ed Hawkins' climate spiral
function renderInsightSpiral(data) {
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
  const spiralData = years.flatMap(year => yearlyData[year]);
  
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
    .domain([1, 12.1])  // months 1-12 (12.1 to make December visible)
    .range([0, 2 * Math.PI]);
  
  const radiusScale = d3.scaleLinear()
    .domain([0, 40])  // temperature range
    .range([innerRadius, outerRadius]);
  
  // Color scale - from cool blues to warm reds
  const colorScale = d3.scaleSequential()
    .domain([15, 35])  // temperature range for coloring
    .interpolator(d3.interpolateRdYlBu);
    
  // Draw temperature reference circles
  const tempRanges = [10, 15, 20, 25, 30, 35];
  tempRanges.forEach(temp => {
    g.append("circle")
      .attr("r", radiusScale(temp))
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .attr("stroke-dasharray", "2,2")
      .attr("opacity", 0.5);
      
    g.append("text")
      .attr("y", -radiusScale(temp))
      .attr("dy", "-0.3em")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#aaa")
      .text(`${temp}°C`);
  });
  
  // Month labels around the circle
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  monthNames.forEach((name, i) => {
    const angle = angleScale(i + 1) - Math.PI / 2;
    const radius = outerRadius + 15;
    g.append("text")
      .attr("x", radius * Math.cos(angle))
      .attr("y", radius * Math.sin(angle))
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text(name);
  });
  
  // Create year groups to hold each year's spiral segment
  const yearGroups = {};
  years.forEach(year => {
    yearGroups[year] = g.append("g")
      .attr("class", `year-${year}`)
      .style("display", "none");  // Initially hide all
  });
  
  // Create the spiral paths for each year
  years.forEach(year => {
    const yearData = yearlyData[year];
    
    // Skip if not enough data points
    if (yearData.length < 2) return;
    
    // Create line generator
    const lineGenerator = d3.lineRadial()
      .angle(d => angleScale(d.month) - Math.PI / 2)
      .radius(d => radiusScale(d.temperature))
      .curve(d3.curveLinear);
    
    // Add the path
    yearGroups[year].append("path")
      .datum(yearData)
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke-width", 2.5)
      .attr("stroke", d => {
        // Use different colors for different years
        const avgTemp = d.reduce((sum, item) => sum + item.temperature, 0) / d.length;
        return d3.interpolateRdYlBu(1 - (avgTemp - 15) / 20);  // Reverse colorScale for RdYlBu
      });
      
    // Add dots for each month
    yearGroups[year].selectAll(".month-dot")
      .data(yearData)
      .enter()
      .append("circle")
      .attr("class", "month-dot")
      .attr("cx", d => radiusScale(d.temperature) * Math.cos(angleScale(d.month) - Math.PI / 2))
      .attr("cy", d => radiusScale(d.temperature) * Math.sin(angleScale(d.month) - Math.PI / 2))
      .attr("r", 3)
      .attr("fill", d => d3.interpolateRdYlBu(1 - (d.temperature - 15) / 20));
  });
  
  // Function to update the display for a specific year
  function updateSpiralYear(yearIndex) {
    // Hide all year groups
    Object.values(yearGroups).forEach(g => g.style("display", "none"));
    
    // Show all years up to the selected year
    for (let i = 0; i <= yearIndex; i++) {
      const year = years[i];
      if (year) yearGroups[year].style("display", "block");
    }
    
    // Update year label
    document.getElementById("spiralYearLabel").textContent = years[yearIndex];
  }
  
  // Set up slider interaction
  const slider = document.getElementById("spiralYearSlider");
  slider.max = years.length - 1;
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
      // Start playback
      let yearIndex = +slider.value;
      this.textContent = "Pause Animation";
      
      playInterval = setInterval(() => {
        yearIndex = (yearIndex + 1) % years.length;
        slider.value = yearIndex;
        updateSpiralYear(yearIndex);
        
        if (yearIndex === years.length - 1) {
          // Optionally stop at the end
          // clearInterval(playInterval);
          // playInterval = null;
          // playBtn.textContent = "Play Animation";
        }
      }, 300);
    }
  });
  
  // Initialize with the first year
  updateSpiralYear(0);
}