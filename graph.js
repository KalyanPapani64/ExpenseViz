import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxrrCCCZzGS2jsAUdPiJKWqpfq79MhRpk",
  authDomain: "d3-kalyan.firebaseapp.com",
  projectId: "d3-kalyan",
  storageBucket: "d3-kalyan.firebasestorage.app",
  messagingSenderId: "493985455848",
  appId: "1:493985455848:web:19c4e6022e0166c445335d",
  measurementId: "G-N5RBB6YS4E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dims = {height: 350, width: 350, radius:150};
const cent = {x: (dims.width/2 + 5), y: (dims.height/2 + 5)};
const svg = d3.select(".canvas")
    .append("svg")
    .attr("width", dims.width + 150)
    .attr("height", dims.height + 150);
const graph = svg.append("g")
    .attr("transform", `translate(${cent.x}, ${cent.y})`);
const legendGroup = svg.append("g")
    .attr("transform", `translate(${dims.width + 60}, 10)`);

const pie = d3.pie()
    .sort(null)
    .value(d => d.cost);
const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius / 2);
const hoverArcPath = d3.arc()
    .outerRadius(dims.radius + 10) 
    .innerRadius((dims.radius / 2) +10);
const color = d3.scaleOrdinal(d3['schemeDark2']);
const legend = d3.legendColor()
    .shape("rect")
    .shapePadding(10)
    .scale(color);

const tip = d3.tip()
    .attr('class', 'tip card')
    .direction('s')
    .offset([10, 0])
    .html(d => {
        let card1 = `<div class="name">${d.data.name}</div>`;
        card1 += `<div class="cost">₹${d.data.cost}</div>`;
        card1 += `<div class="delete">Click to delete</div>`;
        return card1;
    });
graph.call(tip);

const update = (data1) => {
    // Calculate total cost
    const totalCost = data1.reduce((sum, item) => sum + item.cost, 0);

    // Remove existing total cost text
    graph.selectAll(".total-cost").remove();

    // Add total cost in the center
    graph.append("text")
        .attr("class", "total-cost")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .text(`Total: ₹${totalCost}`);

    // Update color domain based on the names in our data
    color.domain(data1.map(d => d.name));

    // Update legend
    legendGroup.call(legend);
    legendGroup.selectAll("text").attr("fill", "white");

    // Join pie data to path elements
    const paths = graph.selectAll("path")
        .data(pie(data1));

    // Handle exit selection
    paths.exit()
        .transition().duration(750)
        .attrTween("d", arcTweenExit)
        .remove();

    // Handle update selection
    paths.attr("d", arcPath)
        .transition().duration(750)
        .attrTween("d", arcTweenUpdate);

    // Handle enter selection
    paths.enter()
        .append("path")
        .attr("class", "arc")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("fill", d => color(d.data.name))
        .each(function(d){ this._current = d })
        .transition().duration(750)
        .attrTween("d", arcTweenEnter);

    // Handle labels
    const labels = graph.selectAll("text.slice-label")
        .data(pie(data1));

    // Handle exit selection for labels
    labels.exit().remove();

    // Handle update selection for labels
    labels
        .attr("transform", d => `translate(${arcPath.centroid(d)})`)
        .text(d => d.data.name);

    // Handle enter selection for labels
    labels.enter()
        .append("text")
        .attr("class", "slice-label")
        .attr("transform", d => `translate(${arcPath.centroid(d)})`)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(d => d.data.name)
        .style("fill", "white")
        .style("font-size", "12px")
        .style("pointer-events", "none");

    // Updated event handlers for slices
    graph.selectAll("path")
        .on("mouseover", (event, d) => {
            tip.show(d, event.currentTarget);
            d3.select(event.currentTarget)
                .transition("popSlice").duration(300)
                .attr("d", hoverArcPath);
        })
        .on("mouseout", (event, d) => {
            tip.hide();
            d3.select(event.currentTarget)
                .transition("popSlice").duration(300)
                .attr("d", arcPath);
        })
        .on("click", (event, d) => handleClick(event, d));
};

const arcTweenEnter = (d) => {
    var i = d3.interpolate(d.endAngle, d.startAngle);
    return function(t){
        d.startAngle = i(t);
        return arcPath(d);
    }
};

const arcTweenExit = (d) => {
    var i = d3.interpolate(d.startAngle, d.endAngle);
    return function(t){
        d.startAngle = i(t);
        return arcPath(d);
    }
};

function arcTweenUpdate(d){
    var i = d3.interpolate(this._current, d);
    this._current = d;
    return function(t){
        return arcPath(i(t));
    }
}

// Click handler for deleting items
const handleClick = async (event, d) => {
  const id = d.data.id;
  try {
    await deleteDoc(doc(db, "expenses", id));
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
};

// Fetch data from Firestore
var data1 = [];
const fetchData = async () => {
  try {
    const dbCollection = collection(db, "expenses");
    const dbSnapshot = onSnapshot(dbCollection, (result1) => {
        result1.docChanges().forEach(change1 => {
            const doc1 = {...change1.doc.data(), id: change1.doc.id};
            switch (change1.type){
                case 'added':
                    data1.push(doc1);
                    break;
                case 'modified':
                    const index = data1.findIndex(item => item.id == doc1.id);
                    data1[index] = doc1;
                    break;
                case 'removed':
                    data1 = data1.filter(item => item.id !== doc1.id);
                    break;
                default:
                    break;
            }
        });
        
        // Update the visualization with the latest data
        update(data1);
    }); 
  } catch (error) {
    console.error("Error getting documents:", error);
  }
};
// Start fetching data
fetchData();