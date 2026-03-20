import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Load and clean data
let data = await d3.csv("assets/nobel-laureates.csv", d => ({
  id: +d.id,
  gender: d.Gender
}));

// Keep only male and female entries
data = data.filter(d => d.gender === "male" || d.gender === "female");

// Chart size
const width = 700;
const height = 400;
const radius = 6;

// SVG
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height);

// Gender positions
const genderPositions = {
  male: width * 0.3,
  female: width * 0.7
};

// Colour scale
const colour = d3.scaleOrdinal()
  .domain(["male", "female"])
  .range(["#4e79a7", "#e15759"]);

// Create nodes with starting position in the middle
const nodes = data.map(d => ({
  ...d,
  x: width / 2,
  y: height / 2
}));

// Draw circles
const circles = svg.append("g")
  .selectAll("circle")
  .data(nodes)
  .join("circle")
  .attr("cx", width / 2)
  .attr("cy", height / 2)
  .attr("r", 0)
  .attr("fill", d => colour(d.gender))
  .attr("opacity", 0.8);

// Animate circles appearing
circles.transition()
  .duration(800)
  .attr("r", radius);

// Force simulation to separate by gender
const simulation = d3.forceSimulation(nodes)
  .force("x", d3.forceX(d => genderPositions[d.gender]).strength(0.1))
  .force("y", d3.forceY(height / 2).strength(0.1))
  .force("collide", d3.forceCollide(radius + 1))
  .stop();

// Run the simulation for a bit before drawing final positions
for (let i = 0; i < 200; i++) simulation.tick();

// Transition circles into grouped positions
circles.transition()
  .delay(900)
  .duration(1200)
  .attr("cx", d => d.x)
  .attr("cy", d => d.y);

// Add labels
svg.append("text")
  .attr("x", genderPositions.male)
  .attr("y", 40)
  .attr("text-anchor", "middle")
  .attr("font-size", "20px")
  .attr("font-weight", "bold")
  .text("Male");

svg.append("text")
  .attr("x", genderPositions.female)
  .attr("y", 40)
  .attr("text-anchor", "middle")
  .attr("font-size", "20px")
  .attr("font-weight", "bold")
  .text("Female");

// Add SVG to page
document.querySelector("#chart").appendChild(svg.node());
