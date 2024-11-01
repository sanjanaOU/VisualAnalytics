// Set the dimensions and margins of the graph
const margin = {top: 20, right: 30, bottom: 50, left: 60},
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// Append the SVG object to the body of the page
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse the data from CSV
d3.csv("spotclean.csv").then(data => {
    // Convert year and energy to numbers and check the column names
    data.forEach(d => {
        d.year = +d.year;
        d.energy = +d.energy;
        console.log("Row:", d);  // Debugging: Print each row to verify data format
    });

    // Group by year, calculate the average energy, and collect unique genres
    const aggregatedData = Array.from(d3.rollup(
        data,
        v => ({
            energy: d3.mean(v, d => d.energy),
            genres: Array.from(new Set(v.map(d => d.top_genre || "Unknown"))).join(", ")  // Ensure top_genre is not undefined
        }),
        d => d.year
    ), ([year, values]) => ({year, ...values}));

    console.log("Aggregated Data:", aggregatedData);  // Debugging: Print the aggregated data

    // Add X axis
    const x = d3.scaleLinear()
        .domain(d3.extent(aggregatedData, d => d.year))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d.energy) + 10])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add the line
    svg.append("path")
        .datum(aggregatedData)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => x(d.year))
            .y(d => y(d.energy))
        );

    // Tooltip div for genre display
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

    // Add dots and interactivity
    svg.selectAll("dot")
        .data(aggregatedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.energy))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Year: ${d.year}<br>Average Energy: ${d.energy.toFixed(2)}<br>Genres: ${d.genres}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}).catch(error => console.log("Error loading or processing data:", error));
