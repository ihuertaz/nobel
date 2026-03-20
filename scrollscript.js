import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// --------------------------------------------------
// 1. LOAD THE CSV AND CLEAN THE DATA
// --------------------------------------------------
// Load the Nobel laureates CSV file.
// For each row, create a simpler object with just:
// - id
// - category
// - gender
let data = await d3.csv("assets/nobel-laureates.csv", d => {
    return {
        id: parseInt(d.id),   // convert id from text to a number
        category: d["Category"],
        gender: d["Gender"],
    }
});

// Remove organisations, so the dataset only includes people
data = data.filter(d => d.gender !== "org");

// Print the cleaned data to the console for inspection
console.log(data);

// --------------------------------------------------
// 2. CHART SETTINGS
// --------------------------------------------------
// Define the size of the SVG
const width = 700;
const height = 700;

// Each laureate will be shown as a circle of this radius
const circleRadius = 6;

// Store the centre point of the SVG
const center = { x: width / 2, y: height / 2 };

// --------------------------------------------------
// 3. EXTRACT UNIQUE CATEGORIES
// --------------------------------------------------
// Create an array of all unique Nobel Prize categories
// Example result:
// ["Physics", "Chemistry", "Peace", ...]
const categories = Array.from(new Set(data.map(d => d.category)));

// Create an ordinal colour scale
// Each category gets a different colour from D3's Tableau palette
const colourScale = d3.scaleOrdinal(categories, d3.schemeTableau10);

// --------------------------------------------------
// 4. CREATE THE SVG
// --------------------------------------------------
// Create the SVG element in memory
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

// --------------------------------------------------
// 5. CREATE NODES FOR THE VISUALISATION
// --------------------------------------------------
// Turn each data item into a node object
// This is useful because the layout functions will add x and y positions
const nodes = data.map((d, index) => {
    return {
        id: index,          // unique identifier for each node
        r: circleRadius,    // circle radius
        data: d,            // keep the original data attached
    }
});

// Give all nodes an initial position
initialLayout(nodes);

// --------------------------------------------------
// 6. DRAW THE CIRCLES
// --------------------------------------------------
// Create one circle for each node
const circles = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 0)              // start invisible
    .attr("cx", d => d.x)      // horizontal position
    .attr("cy", d => d.y)      // vertical position
    .attr("fill", "#CCC");     // start grey

// --------------------------------------------------
// 7. ENTRANCE ANIMATION
// --------------------------------------------------
// Animate the circles so they grow from radius 0 to their full size
circles.transition()
    .delay(() => Math.random() * 500)
    // random delay makes the entrance feel more organic

    .duration(750)
    .attrTween("r", d => {
        // interpolate smoothly from 0 to the node's radius
        const i = d3.interpolate(0, d.r);

        // as the transition runs, t goes from 0 to 1
        // and the radius is updated gradually
        return t => d.r = i(t);
    });

// --------------------------------------------------
// 8. CREATE CATEGORY LABELS
// --------------------------------------------------
// Create one text label for each Nobel category
// These will only appear when circles are grouped by category
const categoryLabels = svg.append("g")
    .selectAll("text")
    .data(categories)
    .join("text")
    .text(d => d)
    .attr("fill", "#333")
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr(
        "style",
        "filter: drop-shadow(1px 1px 2px rgb(255 255 255)) drop-shadow(-1px -1px 2px rgb(255 255 255)) drop-shadow(-1px 1px 2px rgb(255 255 255)) drop-shadow(1px -1px 2px rgb(255 255 255))"
    )
    // the multiple drop-shadows create a white glow/outline
    // so labels remain readable over the circles

    .attr("opacity", 0);
    // labels start hidden

// --------------------------------------------------
// 9. ADD THE SVG TO THE PAGE
// --------------------------------------------------
// Select the HTML element with id="chart"
const container = d3.select("#chart").node();

// Insert the SVG into that container
container.prepend(svg.node());

// --------------------------------------------------
// 10. SET UP SCROLL OBSERVER
// --------------------------------------------------
// Create an IntersectionObserver that watches the page sections
// and triggers layout changes when the visible section changes
const observer = new IntersectionObserver(callback, {
    rootMargin: "0px",
    threshold: 1,
    // threshold: 1 means the section must be fully visible
});

// Select all <section> elements on the page
const sections = document.querySelectorAll("section");

// Tell the observer to watch each section
sections.forEach(section => observer.observe(section));

// Keep track of which step/section is currently active
let currentStep = 0;

// --------------------------------------------------
// 11. OBSERVER CALLBACK
// --------------------------------------------------
// This runs whenever the observer detects a change
function callback(entries) {
    entries.forEach(entry => {
        // Only act when a section is fully visible
        if (entry.isIntersecting) {
            const section = entry.target;

            // Find the position of this section in the list of sections
            const index = Array.from(sections).indexOf(section);

            // Only update if the active step has changed
            if (index !== currentStep) {
                currentStep = index;
                console.log("step changed", currentStep);
                updateLayoutForStep(currentStep);
            }
        }
    })
}

// --------------------------------------------------
// 12. UPDATE LAYOUT FOR EACH STEP
// --------------------------------------------------
// This function changes the arrangement of the circles
// depending on which section is currently visible
function updateLayoutForStep(step) {
    let fill = "#CCC";
    let centroids;

    switch (step) {
        case 0:
            // --------------------------------------
            // STEP 0: ALL CIRCLES TOGETHER IN CENTRE
            // --------------------------------------
            initialLayout(nodes);
            break;

        case 1:
            // --------------------------------------
            // STEP 1: GROUP BY CATEGORY
            // --------------------------------------
            const layout = clusteredLayout(nodes, "category");
            centroids = layout.centroids;

            // colour each circle according to its category
            fill = d => {
                return colourScale(d.data.category);
            };

            // position each category label at the centroid
            // of its cluster
            categoryLabels
                .attr("x", d => centroids.get(d).x)
                .attr("y", d => centroids.get(d).y);
            break;

        case 2:
            // --------------------------------------
            // STEP 2: GROUP BY GENDER
            // --------------------------------------
            clusteredLayout(nodes, "gender");

            // keep colouring by category even though
            // the layout is now grouped by gender
            fill = d => {
                return colourScale(d.data.category);
            };
            break;
    }

    // Animate circles into their new layout
    circles.transition()
        .duration(750)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .attr("fill", fill);

    // Update label visibility
    showAndHideLabels(step);
}

// --------------------------------------------------
// 13. SHOW OR HIDE LABELS
// --------------------------------------------------
// Only show category labels in step 1
function showAndHideLabels(step) {
    if (step === 1) {
        categoryLabels.transition()
            .duration(750)
            .attr("opacity", 1);
    } else {
        categoryLabels.transition()
            .duration(750)
            .attr("opacity", 0);
    }
}

// --------------------------------------------------
// 14. INITIAL LAYOUT
// --------------------------------------------------
// Place all nodes together near the centre
function initialLayout(nodes) {
    // Remove any old x and y positions
    nodes.forEach(node => {
        delete node.x;
        delete node.y;
    });

    // Create a force simulation and immediately stop it
    // This is a quick way to initialise x and y positions
    d3.forceSimulation(nodes).stop();

    // Shift all nodes so they are centred in the SVG
    nodes.forEach((node) => {
        node.x = node.x + center.x;
        node.y = node.y + center.y;
        node.r = circleRadius;
    });
}

// --------------------------------------------------
// 15. CLUSTERED LAYOUT
// --------------------------------------------------
// Group nodes according to a variable such as:
// - "category"
// - "gender"
function clusteredLayout(nodes, grouping) {
    // Group the nodes by the chosen field
    const grouped = d3.group(nodes, d => d.data[grouping]);

    // Create a pack layout
    // This arranges circles into tidy non-overlapping groups
    const packLayout = d3.pack()
        .size([width, height])
        .padding(10);

    // Convert the grouped data into a hierarchy
    // Each leaf is given equal weight using .sum(d => 1)
    const pack = packLayout(d3.hierarchy(grouped).sum(d => 1));

    // Get the leaf nodes (the individual circles)
    const leaves = pack.leaves();

    // Copy the computed x and y positions from the pack layout
    // back into the original nodes array
    leaves.forEach((leaf) => {
        const node = nodes.find(node => node.id === leaf.data.id);

        if (!node) {
            console.error("node not found", leaf.data.id);
        }

        node.x = leaf.x;
        node.y = leaf.y;
    });

    // Calculate the centroid of each cluster
    // This is used to position the category labels
    const centroids = d3.rollup(leaves, centroid, d => d.parent.data[0]);

    return { nodes, centroids };
}

// --------------------------------------------------
// 16. CENTROID FUNCTION
// --------------------------------------------------
// Calculate the weighted centre of a group of circles
function centroid(nodes) {
    let x = 0;
    let y = 0;
    let z = 0;

    for (const d of nodes) {
        // weight each point by radius squared
        // (roughly proportional to circle area)
        let k = d.r ** 2;
        x += d.x * k;
        y += d.y * k;
        z += k;
    }

    return { x: x / z, y: y / z };
}
