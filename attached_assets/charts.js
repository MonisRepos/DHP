const API_URL = "/api/temperature";

let allData = [],
    spiralData = [],
    currentIndex = 0,
    timer,
    isPlaying = false,
    raceChart,
    raceYears,
    raceIdx = 0,
    yearlyLineChart = null,
    singleYearChart = null,
    minMaxChart = null;

// Show loading spinner
const loader = document.getElementById("loader");
loader.style.display = "flex";

d3.json(API_URL).then(raw => {
  // Parse data
  allData = raw.map(d => ({
    year: +d.Year,
    month: +d.Month,
    temperature: +d["Temperature (°C)"],
    minTemp: +d["Min_Temp_C"],
    maxTemp: +d["Max_Temp_C"]
  }));
  spiralData = [...allData];

  // Hide loader
  loader.style.display = "none";

  // Chart.js theme defaults
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim();
  const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--subtle').trim();
  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;
  Chart.defaults.font.family = "'Poppins', sans-serif";

  // Render all charts
  renderSpiral(spiralData);
  renderHeatmap(allData);
  renderBarChartRace(allData);
  renderYearlyLine(allData);
  initSingleYearSelector();
  renderSingleYear(allData);
  initMinMaxSelector();
  renderMinMax(allData);

  // Theme toggle logic
  const toggle = document.getElementById("themeToggle");
  const root = document.documentElement;
  const current = localStorage.getItem("theme") || "light";
  root.setAttribute("data-theme", current);
  toggle.textContent = current === "light" ? "🌙" : "☀️";
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    toggle.textContent = next === "light" ? "🌙" : "☀️";
  });
});

/** 1. Interactive Temperature Spiral */
function renderSpiral(data) {
  const svg    = d3.select("#spiralChart"),
        W      = +svg.attr("width"),
        H      = +svg.attr("height"),
        m      = 50,
        innerR = 30,
        outerR = Math.min(W, H) / 2 - m,
        g      = svg.append("g").attr("transform", `translate(${W/2},${H/2})`);

  data.sort((a,b) => a.year*12 + a.month - (b.year*12 + b.month));
  const angle  = d3.scaleLinear().domain([0,12]).range([0,2*Math.PI]);
  const radial = d3.scaleLinear().domain([5,40]).range([innerR,outerR]);

  // Concentric rings & labels
  d3.range(5,45,5).forEach(t => {
    g.append("circle")
      .attr("r", radial(t))
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");
    g.append("text")
      .attr("y", -radial(t))
      .attr("dy", "-4px")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text(`${t}°C`);
  });

  // Month labels
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  monthNames.forEach((mName,i) => {
    g.append("text")
      .attr("x", radial(40) * Math.cos(angle(i) - Math.PI/2))
      .attr("y", radial(40) * Math.sin(angle(i) - Math.PI/2))
      .attr("dy", "4px")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text(mName);
  });

  // Line generator, path, head, and year label
  const line = d3.lineRadial()
    .angle(d => angle(d.month - 1))
    .radius(d => radial(d.temperature))
    .curve(d3.curveCardinal);

  const path = g.append("path")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2);

  const head = g.append("circle")
    .attr("r", 4)
    .attr("fill", "#333");

  const yearLabel = g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", "32px");

  // Controls
  const playBtn     = document.getElementById("playPauseBtn");
  const speedSlider = document.getElementById("speedSlider");
  const timeSlider  = document.getElementById("timeSlider");
  timeSlider.max    = data.length - 1;

  playBtn.onclick     = () => isPlaying ? stop() : play();
  speedSlider.oninput = () => { if (isPlaying) { stop(); play(); } };
  timeSlider.oninput  = () => { currentIndex = +timeSlider.value; update(); };

  function update() {
    const segment = data.slice(0, currentIndex + 1);
    path.datum(segment).attr("d", line);

    const d = data[currentIndex];
    const a = angle(d.month - 1) - Math.PI/2;
    const r = radial(d.temperature);

    head.attr("cx", r * Math.cos(a))
        .attr("cy", r * Math.sin(a));

    yearLabel.text(d.year);
    timeSlider.value = currentIndex;
  }

  function play() {
    isPlaying = true;
    playBtn.textContent = "Pause";
    timer = setInterval(() => {
      if (currentIndex < data.length - 1) {
        currentIndex++;
        update();
      } else stop();
    }, +speedSlider.value);
  }

  function stop() {
    clearInterval(timer);
    isPlaying = false;
    playBtn.textContent = "Play";
  }

  update();
}

/** 2. Yearly Heatmap */
function renderHeatmap(data) {
  const svg    = d3.select("#heatmapChart"),
        m      = {top:30,right:10,bottom:40,left:60},
        W      = +svg.attr("width") - m.left - m.right,
        H      = +svg.attr("height") - m.top - m.bottom,
        g      = svg.append("g").attr("transform", `translate(${m.left},${m.top})`),
        years  = [...new Set(data.map(d=>d.year))].sort((a,b)=>a-b),
        months = d3.range(1,13),
        x      = d3.scaleBand().domain(years).range([0,W]).padding(0.01),
        y      = d3.scaleBand().domain(months).range([0,H]).padding(0.01),
        ext    = d3.extent(data, d=>d.temperature),
        color  = d3.scaleSequential(d3.interpolateInferno).domain([ext[1],ext[0]]),
        monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const cells = g.selectAll("rect").data(data).enter().append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.month))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.temperature))
    .attr("data-tippy-content", d => `${monthNames[d.month-1]} ${d.year}: ${d.temperature.toFixed(1)}°C`);

  // Initialize Tippy tooltips on heatmap cells
  tippy(cells.nodes(), { theme: 'light-border', animation: 'scale' });

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${H})`)
    .call(d3.axisBottom(x).tickValues(years.filter((_,i)=>i%5===0)));
  g.append("g")
    .call(d3.axisLeft(y).tickFormat(d => monthNames[d-1]));

  // Title
  svg.append("text")
    .attr("x", (W + m.left + m.right)/2)
    .attr("y", m.top/2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .text("Heatmap of Average Monthly Temperature");
}

/** 3. Bar Chart Race */
function renderBarChartRace(data) {
  const ctx   = document.getElementById("barRaceChart").getContext("2d"),
        years = [...new Set(data.map(d=>d.year))].sort((a,b)=>a-b),
        monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  raceYears = years;

  const init = data.filter(d=>d.year===years[0]);
  raceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: init.map(d => monthNames[d.month-1]),
      datasets: [{ label: `Year ${years[0]}`, data: init.map(d => d.temperature), backgroundColor: "#444" }]
    },
    options: { indexAxis: "y", responsive: true, animation: { duration: 800 } }
  });

  setInterval(() => {
    raceIdx = (raceIdx + 1) % years.length;
    const yr = years[raceIdx], arr = data.filter(d=>d.year===yr);
    raceChart.data.labels = arr.map(d=>monthNames[d.month-1]);
    raceChart.data.datasets[0].label = `Year ${yr}`;
    raceChart.data.datasets[0].data = arr.map(d=>d.temperature);
    raceChart.update();
  }, 2000);
}

/** 4. Year-by-Year Line */
function renderYearlyLine(data) {
  const ctx   = document.getElementById("yearlyLineChart").getContext("2d"),
        years = [...new Set(data.map(d=>d.year))].sort((a,b)=>a-b);

  const avg = years.map(y => {
    const arr = data.filter(d=>d.year===y).map(d=>d.temperature);
    return arr.reduce((s,v)=>s+v,0)/arr.length;
  });

  if (yearlyLineChart) yearlyLineChart.destroy();
  yearlyLineChart = new Chart(ctx, {
    type: "line",
    data: { labels: years, datasets: [{ label: "Avg Temp (°C)", data: avg, tension: 0.3 }] },
    options: { responsive: true, scales: { x: { title: { display: true, text: "Year" } }, y: { title: { display: true, text: "°C" } } } }
  });
}

/** 5. Single-Year Line */
function initSingleYearSelector() {
  const sel = document.getElementById("yearSelect"), years = [...new Set(allData.map(d=>d.year))].sort((a,b)=>a-b);
  years.forEach(y => sel.appendChild(Object.assign(document.createElement("option"), { value: y, textContent: y })));
  sel.onchange = () => renderSingleYear(allData);
}

function renderSingleYear(data) {
  const year = +document.getElementById("yearSelect").value,
        monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        arr = data.filter(d=>d.year===year).sort((a,b)=>a.month-b.month),
        labels = arr.map(d=>monthNames[d.month-1]),
        temps = arr.map(d=>d.temperature),
        ctx = document.getElementById("singleYearChart").getContext("2d");

  if (singleYearChart) singleYearChart.destroy();
  singleYearChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label: `${year}`, data: temps, fill: false, tension: 0.3, pointRadius: 4 }] },
    options: { responsive: true, scales: { x: { title: { display: true, text: "Month" } }, y: { title: { display: true, text: "°C" } } } }
  });
}

/** 6. Min/Max Single-Year Line */
function initMinMaxSelector() {
  const sel = document.getElementById("minMaxYearSelect"), years = [...new Set(allData.map(d=>d.year))].sort((a,b)=>a-b);
  years.forEach(y => sel.appendChild(Object.assign(document.createElement("option"), { value: y, textContent: y })));
  sel.onchange = () => renderMinMax(allData);
}

function renderMinMax(data) {
  const year = +document.getElementById("minMaxYearSelect").value,
        monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        arr = data.filter(d=>d.year===year).sort((a,b)=>a.month-b.month),
        labels = arr.map(d=>monthNames[d.month-1]),
        minVals = arr.map(d=>d.minTemp),
        maxVals = arr.map(d=>d.maxTemp),
        ctx = document.getElementById("minMaxChart").getContext("2d");

  if (minMaxChart) minMaxChart.destroy();
  minMaxChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Min Temp (°C)", data: minVals, fill: false, tension: 0.3, pointRadius: 4 },
        { label: "Max Temp (°C)", data: maxVals, fill: false, tension: 0.3, pointRadius: 4 }
      ]
    },
    options: { responsive: true, scales: { x: { title: { display: true, text: "Month" } }, y: { title: { display: true, text: "°C" } } } }
  });
}
