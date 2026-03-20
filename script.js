import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
 
const width = 700;
const height = 500;
const circleRadius = 6;
 
// Load and filter data
let data = await d3.csv("assets/nobel-laureates.csv", d => ({
    id: parseInt(d.id),
    category: d["Category"],
    gender: d["Gender"],
}));
data = data.filter(d => d.gender !== "org");
 
const colourScale = d3.scaleOrdinal()
    .domain(["male", "female"])
    .range(["#4e79a7", "#e15759"]);
 
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);
 
// Add toggle button
const button = d3.select("#chart")
    .insert("button", ":first-child")
    .text("Split by gender")
    .style("margin-bottom", "12px")
    .style("padding", "8px 16px")
    .style("cursor", "pointer");
 
const nodes = data.map((d, i) => ({ id: i, r: circleRadius, data: d }));
 
// --- Simulation ---
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(2))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(circleRadius + 1))
    .stop();
 
// Run simulation ahead of time so circles start in position
for (let i = 0; i < 300; i++) simulation.tick();
 
// --- Draw circles ---
const circles = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 0)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("fill", "#ccc")
    .attr("opacity", 0.8);
 
// Entrance animation
circles.transition()
    .delay(() => Math.random() * 500)
    .duration(750)
    .attr("r", circleRadius);
 
// --- Gender labels (hidden initially) ---
const labelData = [
    { gender: "female", label: "Women", x: width * 0.25, y: 40 },
    { gender: "male",   label: "Men",   x: width * 0.75, y: 40 },
];
 
const labels = svg.append("g")
    .selectAll("text")
    .data(labelData)
    .join("text")
    .text(d => d.label)
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", d => colourScale(d.gender))
    .attr("opacity", 0);
 
// --- Toggle state ---
let split = false;
 
button.on("click", () => {
    split = !split;
    button.text(split ? "Bring together" : "Split by gender");
 
    if (split) {
        // Move women left, men right
        nodes.forEach(node => {
            node.targetX = node.data.gender === "female"
                ? width * 0.25
                : width * 0.75;
            node.targetY = height / 2;
        });
    } else {
        // Return to centre
        nodes.forEach(node => {
            node.targetX = width / 2;
            node.targetY = height / 2;
        });
    }
 
    // Re-run simulation with new center forces
    simulation
        .force("center", null)
        .force("x", d3.forceX(d => d.targetX).strength(0.08))
        .force("y", d3.forceY(d => d.targetY).strength(0.08))
        .alpha(0.8)
        .restart();
 
    // Update colours
    circles.transition()
        .duration(600)
        .attr("fill", d => split ? colourScale(d.data.gender) : "#ccc");
 
    // Show/hide labels
    labels.transition()
        .duration(600)
        .attr("opacity", split ? 1 : 0);
});
 
// Tick handler updates circle positions
simulation.on("tick", () => {
    circles
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
});
 
document.querySelector("#chart").prepend(svg.node());
