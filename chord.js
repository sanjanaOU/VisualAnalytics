
const width = 800;
const height = 800;
const innerRadius = Math.min(width, height) * 0.4;
const outerRadius = innerRadius * 1.1;


const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);


const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip");


const compatibilityThreshold = 10;
const maxGenres = 15; 


d3.csv("spotclean.csv").then(data => {
    
    const genreCounts = d3.rollups(data, v => v.length, d => d.top_genre)
        .sort((a, b) => d3.descending(a[1], b[1]))
        .slice(0, maxGenres);

    
    const genres = genreCounts.map(d => d[0]);
    const genreIndex = Object.fromEntries(genres.map((g, i) => [g, i]));

    const matrix = Array.from({ length: genres.length }, () => Array(genres.length).fill(0));

    
    data.forEach(d => {
        const genre1 = genreIndex[d.top_genre];
        if (genre1 !== undefined) {
            data.forEach(other => {
                const genre2 = genreIndex[other.top_genre];
                if (d !== other && genre2 !== undefined && Math.abs(d.popularity - other.popularity) <= 10) {
                    matrix[genre1][genre2] += 1;
                    matrix[genre2][genre1] += 1;
                }
            });
        }
    });

    
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] < compatibilityThreshold) {
                matrix[i][j] = 0;
            }
        }
    }

    
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(genres);

    
    const chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);

    
    const chords = chord(matrix);

    
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    svg.append("g")
        .selectAll("path")
        .data(chords.groups)
        .enter()
        .append("path")
        .style("fill", d => color(d.index))
        .style("stroke", d => d3.rgb(color(d.index)).darker())
        .attr("d", arc)
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`${genres[d.index]}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

    
    svg.append("g")
        .selectAll("text")
        .data(chords.groups)
        .enter()
        .append("text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", function(d) {
            return `rotate(${(d.angle * 180 / Math.PI - 90)}) translate(${outerRadius + 10})` +
                   (d.angle > Math.PI ? "rotate(180)" : "");
        })
        .style("text-anchor", d => d.angle > Math.PI ? "end" : "start")
        .text(d => genres[d.index]);

    
    svg.append("g")
        .selectAll("path")
        .data(chords)
        .enter()
        .append("path")
        .attr("d", d3.ribbon().radius(innerRadius))
        .style("fill", d => color(d.target.index))
        .style("stroke", d => d3.rgb(color(d.target.index)).darker())
        .style("opacity", 0.5)  
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`${genres[d.source.index]} ➔ ${genres[d.target.index]}<br>Shared Songs: ${matrix[d.source.index][d.target.index]}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));
}).catch(error => console.log("Error loading data:", error));
