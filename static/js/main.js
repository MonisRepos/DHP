document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const startBtn = document.getElementById('startBtn');
    const introSection = document.getElementById('intro');
    const mainContent = document.getElementById('mainContent');
    const infoBtn = document.getElementById('infoBtn');
    const teamBtn = document.getElementById('teamBtn');
    const homeBtn = document.getElementById('homeBtn');
    const infoModal = document.getElementById('infoModal');
    const teamModal = document.getElementById('teamModal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const stateSelect = document.getElementById('stateSelect');
    const citySelect = document.getElementById('citySelect');
    const searchBtn = document.getElementById('searchBtn');
    const graphArea = document.getElementById('graphArea');

    // Navigation functionality
    homeBtn.addEventListener('click', function() {
        introSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
        infoModal.classList.add('hidden');
        teamModal.classList.add('hidden');
    });

    // Start button
    startBtn.addEventListener('click', function() {
        introSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        loadStates();
    });

    // Modal buttons
    infoBtn.addEventListener('click', function() {
        infoModal.classList.remove('hidden');
    });

    teamBtn.addEventListener('click', function() {
        teamModal.classList.remove('hidden');
    });

    // Close buttons
    closeBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            infoModal.classList.add('hidden');
            teamModal.classList.add('hidden');
        });
    });

    // Close modals when clicking outside content
    window.addEventListener('click', function(event) {
        if (event.target === infoModal) {
            infoModal.classList.add('hidden');
        }
        if (event.target === teamModal) {
            teamModal.classList.add('hidden');
        }
    });

    // Load states from API
    function loadStates() {
        fetch('/api/states')
            .then(response => response.json())
            .then(data => {
                // Clear existing options except the placeholder
                stateSelect.innerHTML = '<option value="">-- Select State --</option>';
                
                // Add states to dropdown
                Object.keys(data).sort().forEach(state => {
                    const option = document.createElement('option');
                    option.value = state;
                    option.textContent = state;
                    stateSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error loading states:', error));
    }

    // State change event - populate cities
    stateSelect.addEventListener('change', function() {
        const selectedState = this.value;
        
        if (selectedState) {
            fetch(`/api/states`)
                .then(response => response.json())
                .then(data => {
                    // Enable city dropdown
                    citySelect.disabled = false;
                    
                    // Clear existing options except the placeholder
                    citySelect.innerHTML = '<option value="">-- Select City --</option>';
                    
                    // Add cities to dropdown for the selected state
                    const cities = data[selectedState] || [];
                    cities.sort().forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        citySelect.appendChild(option);
                    });
                })
                .catch(error => console.error('Error loading cities:', error));
        } else {
            // Clear and disable city dropdown if no state is selected
            citySelect.innerHTML = '<option value="">-- First Select a State --</option>';
            citySelect.disabled = true;
        }
    });

    // Search button functionality
    searchBtn.addEventListener('click', function() {
        const selectedState = stateSelect.value;
        const selectedCity = citySelect.value;
        
        if (!selectedState || !selectedCity) {
            alert('Please select both a state and a city.');
            return;
        }
        
        // Update graph area, showing loading state
        graphArea.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p>Loading weather data...</p>
            </div>
        `;
        
        // Load years for the temperature data visualization
        fetch('/api/years')
            .then(response => response.json())
            .then(years => {
                graphArea.innerHTML = '';
                
                // Create year filter
                const yearFilterContainer = document.createElement('div');
                yearFilterContainer.className = 'year-filter mb-3';
                yearFilterContainer.innerHTML = `
                    <label for="yearFilter">Filter by Year:</label>
                    <select id="yearFilter" class="form-control">
                        <option value="">All Years</option>
                        ${years.map(year => `<option value="${year}">${year}</option>`).join('')}
                    </select>
                `;
                graphArea.appendChild(yearFilterContainer);
                
                // Create chart containers
                const chartsContainer = document.createElement('div');
                chartsContainer.className = 'charts-container';
                chartsContainer.innerHTML = `
                    <div class="chart-card">
                        <h3>Temperature Trends (${selectedCity}, ${selectedState})</h3>
                        <canvas id="yearlyTemperatureChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h3>Monthly Temperature (${selectedCity}, ${selectedState})</h3>
                        <canvas id="monthlyTemperatureChart"></canvas>
                    </div>
                    <div class="chart-card">
                        <h3>Min/Max Temperature (${selectedCity}, ${selectedState})</h3>
                        <canvas id="minMaxTemperatureChart"></canvas>
                    </div>
                `;
                graphArea.appendChild(chartsContainer);
                
                // Load data and render charts
                fetchTemperatureData(selectedState, selectedCity);
                
                // Add event listener for year filter
                document.getElementById('yearFilter').addEventListener('change', function() {
                    fetchTemperatureData(selectedState, selectedCity, this.value);
                });
            })
            .catch(error => {
                console.error('Error loading years:', error);
                graphArea.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle fa-3x"></i>
                        <p>Error loading data. Please try again later.</p>
                    </div>
                `;
            });
    });

    // Function to fetch temperature data and render charts
    function fetchTemperatureData(state, city, year = '') {
        const url = `/api/temperature?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}${year ? `&year=${year}` : ''}`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                renderYearlyTemperatureChart(data);
                renderMonthlyTemperatureChart(data);
                renderMinMaxTemperatureChart(data);
            })
            .catch(error => {
                console.error('Error fetching temperature data:', error);
                graphArea.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle fa-3x"></i>
                        <p>Error loading temperature data. Please try again later.</p>
                    </div>
                `;
            });
    }

    // Chart rendering functions
    function renderYearlyTemperatureChart(data) {
        const ctx = document.getElementById('yearlyTemperatureChart').getContext('2d');
        
        // Group data by year and calculate average
        const yearlyData = {};
        data.forEach(item => {
            if (!yearlyData[item.Year]) {
                yearlyData[item.Year] = {
                    sum: 0,
                    count: 0
                };
            }
            yearlyData[item.Year].sum += item['Temperature (°C)'];
            yearlyData[item.Year].count += 1;
        });
        
        const years = Object.keys(yearlyData).sort();
        const avgTemps = years.map(year => yearlyData[year].sum / yearlyData[year].count);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Avg. Temperature (°C)',
                    data: avgTemps,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Yearly Average Temperature Trends'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                }
            }
        });
    }

    function renderMonthlyTemperatureChart(data) {
        const ctx = document.getElementById('monthlyTemperatureChart').getContext('2d');
        
        // If only one year is selected, show monthly data for that year
        // Otherwise, calculate monthly averages across all years
        let monthlySeries;
        const latestYear = Math.max(...data.map(item => item.Year));
        
        if (data.every(item => item.Year === data[0].Year)) {
            // One year selected - show that year's data
            const monthlyData = Array(12).fill(null);
            
            data.forEach(item => {
                if (item.Month >= 1 && item.Month <= 12) {
                    monthlyData[item.Month - 1] = item['Temperature (°C)'];
                }
            });
            
            monthlySeries = [{
                label: `Monthly Temperature ${data[0].Year}`,
                data: monthlyData,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true,
                tension: 0.4
            }];
        } else {
            // Multiple years - show latest year and 50-year average
            const latestYearData = Array(12).fill(null);
            const allYearsSum = Array(12).fill(0);
            const allYearsCount = Array(12).fill(0);
            
            data.forEach(item => {
                const monthIndex = item.Month - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    if (item.Year === latestYear) {
                        latestYearData[monthIndex] = item['Temperature (°C)'];
                    }
                    
                    allYearsSum[monthIndex] += item['Temperature (°C)'];
                    allYearsCount[monthIndex]++;
                }
            });
            
            const avgData = allYearsSum.map((sum, i) => 
                allYearsCount[i] > 0 ? sum / allYearsCount[i] : null
            );
            
            monthlySeries = [
                {
                    label: `${latestYear}`,
                    data: latestYearData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: '50-Year Average',
                    data: avgData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ];
        }
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: monthlySeries
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Temperature Distribution'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    }

    function renderMinMaxTemperatureChart(data) {
        const ctx = document.getElementById('minMaxTemperatureChart').getContext('2d');
        
        // If a single year is selected, show monthly min/max for that year
        // Otherwise, show the overall min/max ranges
        let selectedYear = null;
        
        if (data.length > 0 && data.every(item => item.Year === data[0].Year)) {
            selectedYear = data[0].Year;
        }
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyMin = Array(12).fill(null);
        const monthlyMax = Array(12).fill(null);
        
        // Process data for min/max
        data.forEach(item => {
            const monthIndex = item.Month - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                if (selectedYear === null || item.Year === selectedYear) {
                    // Initialize with first value or compare with existing
                    if (monthlyMin[monthIndex] === null || item.Min_Temp_C < monthlyMin[monthIndex]) {
                        monthlyMin[monthIndex] = item.Min_Temp_C;
                    }
                    
                    if (monthlyMax[monthIndex] === null || item.Max_Temp_C > monthlyMax[monthIndex]) {
                        monthlyMax[monthIndex] = item.Max_Temp_C;
                    }
                }
            }
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: 'Maximum Temperature (°C)',
                        data: monthlyMax,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Minimum Temperature (°C)',
                        data: monthlyMin,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: selectedYear ? `Min/Max Temperatures (${selectedYear})` : 'Min/Max Temperature Range'
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    }
});