import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Load data
let data = await d3.csv("assets/nobel-laureates.csv", d => ({
  id: +d.id,
  gender: d.Gender
}));

data = data.filter(d => d.gender === "male" || d.gender === "female");

// Chart setup
const width = 700;
const height = 400;
const radius = 6;

const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height);

// Colour scale
const colour = d3.scaleOrdinal()
  .domain(["male", "female"])
  .range(["#4e79a7", "#e15759"]);

// Circles (start in centre)
const circles = svg.append("g")
  .selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", width / 2)
  .attr("cy", height / 2)
  .attr("r", 0)
  .attr("fill", d => colour(d.gender))
  .attr("opacity", 0.8);

// Appear animation
circles.transition()
  .duration(800)
  .attr("r", radius);

// Labels
const maleLabel = svg.append("text")
  .attr("x", width * 0.3)
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .attr("opacity", 0)
  .text("Male");

const femaleLabel = svg.append("text")
  .attr("x", width * 0.7)
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .attr("font-weight", "bold")
  .attr("opacity", 0)
  .text("Female");

// State
let split = false;

// Click interaction (on SVG)
svg.on("click", () => {
  split = !split;

  if (split) {
    // 👉 Split by gender
    circles.transition()
      .duration(1000)
      .attr("cx", d => d.gender === "male" ? width * 0.3 : width * 0.7)
      .attr("cy", (d, i) => 60 + (i % 20) * 12);

    maleLabel.transition().duration(500).attr("opacity", 1);
    femaleLabel.transition().duration(500).attr("opacity", 1);

  } else {
    // 👉 Back to centre
    circles.transition()
      .duration(1000)
      .attr("cx", width / 2)
      .attr("cy", height / 2);

    maleLabel.transition().duration(500).attr("opacity", 0);
    femaleLabel.transition().duration(500).attr("opacity", 0);
  }
});

// Add SVG to page
document.querySelector("#chart").appendChild(svg.node());
