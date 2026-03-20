import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Load data
let data = await d3.csv("assets/nobel-laureates.csv", d => ({
  id: +d.id,
  gender: d.Gender
}));

// Keep only male / female
data = data.filter(d => d.gender === "male" || d.gender === "female");

// Chart size
const width = 700;
const height = 400;
const radius = 6;

// SVG
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height);

// Colour scale
const colour = d3.scaleOrdinal()
  .domain(["male", "female"])
  .range(["#4e79a7", "#e15759"]);

// Create circles (start in centre)
const circles = svg.append("g")
  .selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", width / 2)
  .attr("cy", height / 2)
  .attr("r", 0)
  .attr("fill", d => colour(d.gender))
  .attr("opacity", 0.8);

// Step 1: circles appear
circles.transition()
  .duration(800)
  .attr("r", radius);

// Step 2: move to gender positions
circles.transition()
  .delay(800)
  .duration(1000)
  .attr("cx", d => d.gender === "male" ? width * 0.3 : width * 0.7)
  .attr("cy", (d, i) => 60 + (i % 20) * 12); // simple vertical spread

// Labels
svg.append("text")
  .attr("x", width * 0.3)
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .text("Male");

svg.append("text")
  .attr("x", width * 0.7)
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .text("Female");

// Add to page
document.querySelector("#chart").appendChild(svg.node());
