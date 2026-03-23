import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// --------------------------------------------------
// 1. CHART SETTINGS
// --------------------------------------------------
// Define the size of the SVG drawing area
const width = 700;
const height = 500;

// Define the radius of each circle
const circleRadius = 6;

// --------------------------------------------------
// 2. LOAD AND PREPARE THE DATA
// --------------------------------------------------
// Load the CSV file and convert each row into a simpler object
let data = await d3.csv("assets/nobel-laureates.csv", d => ({
    id: parseInt(d.id),        // convert the id from text to number
    category: d["Category"],   // store the Nobel Prize category
    gender: d["Gender"],       // store the gender
}));

// Remove organisations, so we only keep people
data = data.filter(d => d.gender !== "org");

// --------------------------------------------------
// 3. COLOUR SCALE
// --------------------------------------------------
// Create a colour scale that assigns one colour to each gender
const colourScale = d3.scaleOrdinal()
    .domain(["male", "female"])
    .range(["#4e79a7", "#e15759"]);

// --------------------------------------------------
// 4. CREATE THE SVG
// --------------------------------------------------
// Create an SVG element in memory
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

// --------------------------------------------------
// 5. ADD A BUTTON
// --------------------------------------------------
// Insert a button above the chart
// This button will let us toggle between:
// - all circles together
// - circles split by gender
const button = d3.select("#chart")
    .insert("button", ":first-child")
    .text("Split by gender")
    .style("margin-bottom", "12px")
    .style("padding", "8px 16px")
    .style("cursor", "pointer");

// --------------------------------------------------
// 6. CREATE NODES FOR THE SIMULATION
// --------------------------------------------------
// Turn each data item into a node object used by the force simulation
const nodes = data.map((d, i) => ({
    id: i,              // give each node a unique id
    r: circleRadius,    // store the radius
    data: d             // keep the original data attached
}));

// --------------------------------------------------
// 7. CREATE THE FORCE SIMULATION
// --------------------------------------------------
// A force simulation helps position circles so that they do not overlap
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(2))
    // A very small positive charge spreads nodes slightly apart

    .force("center", d3.forceCenter(width / 2, height / 2))
    // Pull all nodes towards the middle of the chart

    .force("collision", d3.forceCollide(circleRadius + 1))
    // Prevent circles from overlapping by giving each one collision space

    .stop();
// Stop the simulation so it does not run automatically yet

// Run the simulation manually 300 times
// This gives the circles starting positions before drawing them
for (let i = 0; i < 300; i++) simulation.tick();

// --------------------------------------------------
// 8. DRAW THE CIRCLES
// --------------------------------------------------
// Create one circle per node
const circles = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 0)
    // start with radius 0 so the circles can animate in

    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    // use the x and y positions calculated by the simulation

    .attr("fill", "#ccc")
    // start with a neutral grey colour

    .attr("opacity", 0.8);

// --------------------------------------------------
// 9. ENTRANCE ANIMATION
// --------------------------------------------------
// Animate the circles so they grow into view
circles.transition()
    .delay(() => Math.random() * 500)
    // give each circle a random delay for a softer entrance effect

    .duration(750)
    .attr("r", circleRadius);

// --------------------------------------------------
// 10. CREATE LABELS FOR THE SPLIT VIEW
// --------------------------------------------------
// These labels will appear when the chart is split by gender
const labelData = [
    { gender: "female", label: "Women", x: width * 0.25, y: 40 },
    { gender: "male",   label: "Men",   x: width * 0.75, y: 40 },
];

// Draw one text label for each gender
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
// labels start hidden

// --------------------------------------------------
// 11. TOGGLE STATE
// --------------------------------------------------
// This variable remembers the current view:
// false = all circles together
// true = split by gender
let split = false;

// --------------------------------------------------
// 12. BUTTON CLICK INTERACTION
// --------------------------------------------------
// When the button is clicked, switch between the two views
button.on("click", () => {
    split = !split;

    // Update the button text depending on the current state
    button.text(split ? "Bring together" : "Split by gender");

    if (split) {
        // ------------------------------------------
        // SPLIT VIEW
        // ------------------------------------------
        // Move women to the left and men to the right
        nodes.forEach(node => {
            node.targetX = node.data.gender === "female"
                ? width * 0.25
                : width * 0.75;
            node.targetY = height / 2;
        });
    } else {
        // ------------------------------------------
        // TOGETHER VIEW
        // ------------------------------------------
        // Move all circles back to the centre
        nodes.forEach(node => {
            node.targetX = width / 2;
            node.targetY = height / 2;
        });
    }

    // Reconfigure the simulation so circles move
    // towards their new target positions
    simulation
        .force("center", null)
        // remove the original centre force

        .force("x", d3.forceX(d => d.targetX).strength(0.08))
        // pull each node horizontally towards targetX

        .force("y", d3.forceY(d => d.targetY).strength(0.08))
        // pull each node vertically towards targetY

        .alpha(0.8)
        // give the simulation energy again so it starts moving

        .restart();

    // Update circle colours
    circles.transition()
        .duration(600)
        .attr("fill", d => split ? colourScale(d.data.gender) : "#ccc");
    // when split: colour by gender
    // when together: return to grey

    // Show or hide the gender labels
    labels.transition()
        .duration(600)
        .attr("opacity", split ? 1 : 0);
});

// --------------------------------------------------
// 13. UPDATE CIRCLE POSITIONS DURING THE SIMULATION
// --------------------------------------------------
// Every time the simulation "ticks", update the SVG circles
simulation.on("tick", () => {
    circles
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
});

// --------------------------------------------------
// 14. ADD THE SVG TO THE PAGE
// --------------------------------------------------
// Insert the chart into the HTML container
document.querySelector("#chart").prepend(svg.node());

// --------------------------------------------------
// 15. SECOND CHART (Observable Plot)
// --------------------------------------------------
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot/+esm";

// Create the second chart
const chart2 = Plot.plot({
  color: { legend: true },
  marginLeft: 150,
  insetLeft: 0,
  x: { grid: true },
  marks: [
    Plot.dot(
      data,
      Plot.group(
        { r: "count" },
        { x: "category", y: "gender", stroke: "gender", tip: true }
      )
    )
  ]
});

// Append it to the second container
document.querySelector("#chart2").append(chart2);
