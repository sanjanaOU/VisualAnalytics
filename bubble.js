
const margin = {top: 20, right: 30, bottom: 50, left: 60},
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;


const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");


const binSizeLoudness = 2; // Bin size for loudness (dB)
const binSizeEnergy = 10;  // Bin size for energy


d3.csv("spotclean.csv").then(data => {
    
    data.forEach(d => {
        d.energy = +d.energy;
        d.loudness_db = +d.loudness_db;
        d.popularity = +d.popularity;
    });

    // Group data into bins
    const binnedData = d3.rollups(data, v => ({
        avgLoudness: d3.mean(v, d => d.loudness_db),
        avgEnergy: d3.mean(v, d => d.energy),
        avgPopularity: d3.mean(v, d => d.popularity),
        count: v.length
    }), 
    d => Math.floor(d.loudness_db / binSizeLoudness) * binSizeLoudness,
    d => Math.floor(d.energy / binSizeEnergy) * binSizeEnergy);

    // Flatten binned data and set bubble properties
    const flattenedData = binnedData.flatMap(([loudnessBin, energyBins]) => {
        return energyBins.map(([energyBin, stats]) => ({
            loudness: stats.avgLoudness,
            energy: stats.avgEnergy,
            popularity: stats.avgPopularity,
            count: stats.count
        }));
    });

    
    const x = d3.scaleLinear()
        .domain(d3.extent(flattenedData, d => d.loudness))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain(d3.extent(flattenedData, d => d.energy))
        .range([height, 0]);
    
    // Scale for bubble size (based on number of songs in bin)
    const size = d3.scaleSqrt()
        .domain([0, d3.max(flattenedData, d => d.count)])
        .range([5, 20]);

    
    const color = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(flattenedData, d => d.popularity));

    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width)
        .attr("y", -10)
        .attr("fill", "black")
        .style("text-anchor", "end")
        .text("Loudness (dB)");

    
    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("x", -10)
        .attr("y", -10)
        .attr("fill", "black")
        .style("text-anchor", "end")
        .text("Energy");

    
    svg.selectAll("bubble")
        .data(flattenedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.loudness))
        .attr("cy", d => y(d.energy))
        .attr("r", d => size(d.count))
        .style("fill", d => color(d.popularity))
        .style("opacity", 0.7)  // Adjust opacity for clarity
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`Avg Loudness: ${d.loudness.toFixed(2)}<br>Avg Energy: ${d.energy.toFixed(2)}<br>Avg Popularity: ${d.popularity.toFixed(2)}<br>Song Count: ${d.count}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

}).catch(error => console.log("Error loading data:", error));
