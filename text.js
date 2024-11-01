// Set dimensions and margins
const margin = {top: 20, right: 30, bottom: 50, left: 60},
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// Append the SVG object to the body
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip div for interactivity
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");

// Load data from CSV
d3.csv("spotclean.csv").then(data => {
    // Parse numerical values
    data.forEach(d => {
        d.energy = +d.energy;
        d.loudness_db = +d.loudness_db;
    });

    // Set scales for X (Loudness) and Y (Energy) axes
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.loudness_db))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.energy))
        .range([height, 0]);

    // Add X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width)
        .attr("y", -10)
        .attr("fill", "black")
        .style("text-anchor", "end")
        .text("Loudness (dB)");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("x", -10)
        .attr("y", -10)
        .attr("fill", "black")
        .style("text-anchor", "end")
        .text("Energy");

    // Add dots
    svg.selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.loudness_db))
        .attr("cy", d => y(d.energy))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .style("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`Title: ${d.title}<br>Artist: ${d.artist}<br>Genre: ${d.top_genre}<br>Energy: ${d.energy}<br>Loudness: ${d.loudness_db}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Zoom and Pan functionality
    const zoom = d3.zoom()
        .scaleExtent([1, 5])
        .extent([[0, 0], [width, height]])
        .on("zoom", (event) => {
            svg.selectAll("circle")
                .attr("transform", event.transform);
            svg.select("g.x-axis").call(d3.axisBottom(x).scale(event.transform.rescaleX(x)));
            svg.select("g.y-axis").call(d3.axisLeft(y).scale(event.transform.rescaleY(y)));
        });

    svg.call(zoom);

}).catch(error => console.log("Error loading data:", error));
