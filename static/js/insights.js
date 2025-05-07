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
      renderUrbanRuralChart(tempData);
      renderRegionalVariationChart(tempData);
      renderInsightSpiral(tempData);
    })
    .catch(error => {
      console.error('Error fetching insight data:', error);
    });
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

// Chart 3: Urban vs Rural Warming
function renderUrbanRuralChart(data) {
  // Simulated urban vs rural data based on our temperature dataset
  // In a real scenario, this would come from comparing actual urban and rural stations
  const urbanData = [23.2, 23.5, 24.1, 24.6, 25.2, 25.9];
  const ruralData = [22.8, 22.9, 23.2, 23.5, 23.9, 24.2];
  const decades = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
  
  const ctx = document.getElementById('urbanRuralChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: decades,
      datasets: [
        {
          label: 'Urban Areas',
          data: urbanData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Rural Areas',
          data: ruralData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
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