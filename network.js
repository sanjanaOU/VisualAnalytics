const width = 800;
const height = 600;

const svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

const detailsPanel = d3.select("#details");

d3.csv("spotclean.csv").then(data => {
    // Aggregate data by genre and find the top artist in each genre
    const genreData = d3.rollups(data, 
        v => {
            const topSong = v.reduce((a, b) => (+a.popularity > +b.popularity) ? a : b);
            return {
                count: v.length,
                topArtist: topSong.artist,
                topSongTitle: topSong.title
            };
        }, 
        d => d.top_genre
    ).map(d => ({
        genre: d[0],
        count: d[1].count,
        topArtist: d[1].topArtist,
        topSongTitle: d[1].topSongTitle
    }));

    // Scale for bubble sizes (number of songs in each genre)
    const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(genreData, d => d.count)])
        .range([10, 50]);

    // Color scale for light-to-dark blue gradient based on song count
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain([d3.min(genreData, d => d.count), d3.max(genreData, d => d.count)]);

    // Force simulation for improved layout
    const simulation = d3.forceSimulation(genreData)
        .force("charge", d3.forceManyBody().strength(10))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => sizeScale(d.count) + 2))
        .on("tick", ticked);

    function ticked() {
        const u = svg.selectAll("g")
            .data(genreData);

        const gEnter = u.enter().append("g")
            .attr("class", "bubble-group")
            .on("click", function(event, d) {
                showDetails(d);
            });

        gEnter.append("circle")
            .attr("r", d => sizeScale(d.count))
            .attr("fill", d => colorScale(d.count))  // Apply light-to-dark blue based on count
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        gEnter.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .attr("font-size", d => Math.min(sizeScale(d.count) / 3, 12))
            .text(d => d.genre.length > 10 ? d.genre.slice(0, 10) + '...' : d.genre);

        u.attr("transform", d => `translate(${d.x}, ${d.y})`);
        u.exit().remove();
    }

    function showDetails(d) {
        // Display only top artist and top song in the side panel
        detailsPanel.html(`
            <h3>${d.genre}</h3>
            <p><strong>Top Artist:</strong> ${d.topArtist}</p>
            <p><strong>Top Song:</strong> ${d.topSongTitle}</p>
        `);
    }
}).catch(error => console.error("Error loading data:", error));
