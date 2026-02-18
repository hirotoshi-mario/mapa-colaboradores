const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("svg");
const tooltip = d3.select("#tooltip");

const MIN_DISTANCE = 150;
const MAX_DISTANCE = 800;


d3.json("data.json").then(data => {

  const nodes = data.nodes;
  const maxScore = d3.max(nodes, d => d.score);

  const centerNode = nodes.find(n => n.id === "mario");

  const defs = svg.append("defs");

  const radiusScale = d3.scaleLinear()
    .domain([0, maxScore])
    .range([20, 60]); // mínimo e máximo do tamanho


nodes.forEach(d => {
  const size = radiusScale(d.score) * 2;

  const pattern = defs.append("pattern")
    .attr("id", `img-${d.id}`)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternContentUnits", "userSpaceOnUse")
    .attr("width", size)
    .attr("height", size)
    .attr("x", -size / 2)
    .attr("y", -size / 2);

  pattern.append("image")
    .attr("href", d.image)
    .attr("width", size)
    .attr("height", size)
    .attr("x", 0)
    .attr("y", 0)
    .attr("preserveAspectRatio", "xMidYMid slice");
});

  const links = [];

  nodes.forEach(node => {
    node.connections.forEach(conn => {
      links.push({
        source: node.id,
        target: conn.target,
        strength: conn.strength
      });
    });
  });

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
    .id(d => d.id)
    .distance(d => 600 - d.strength * 30)
    .strength(d => d.strength / 8)
  )
  .force("charge", d3.forceManyBody().strength(-160))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide()
    .radius(d => radiusScale(d.score) + 15)
    .strength(1)
  )
  .alphaDecay(0.01)
  .force("radial", d3.forceRadial(
  d => {
    const normalized = d.score / maxScore;
    return MAX_DISTANCE - normalized * (MAX_DISTANCE - MIN_DISTANCE);
  },
  width / 2,
  height / 2
).strength(0.08));


  const link = svg.append("g")
  .selectAll("line")
  .data(links)
  .enter()
  .append("line")
  .attr("stroke", "#cfd8ff")
  .attr("stroke-opacity", 0.15)
  .attr("stroke-width", 1);

  const node = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g");

const circles = node.append("circle")
  .attr("r", d => radiusScale(d.score))
  .attr("fill", d => `url(#img-${d.id})`)
  .attr("stroke", "#ffffffcc")
  .attr("stroke-width", 1.5);

  circles
  .on("mouseover", (event, d) => {
    tooltip
      .style("opacity", 1)
      .html(`<strong>${d.name}</strong><br>${d.role}`);
  })
  .on("mousemove", (event) => {
    tooltip
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY + 15) + "px");
  })
  .on("mouseout", () => {
    tooltip
      .style("opacity", 0);
  });

  node.append("text")
  .attr("text-anchor", "middle")
  .attr("dy", d => radiusScale(d.score) + 18)
  .attr("fill", "#cfd8ff99")
  .style("font-size", "11px")
  .style("pointer-events", "none")
  .text(d => d.name);

  simulation.on("tick", () => {

  // fixa você no centro
  centerNode.fx = width / 2;
  centerNode.fy = height / 2;

  // atualiza linhas
  link
  .attr("x1", d => d.source.x)
  .attr("y1", d => d.source.y)
  .attr("x2", d => d.target.x)
  .attr("y2", d => d.target.y)
  .attr("stroke-opacity", d => {
    const dx = d.source.x - d.target.x;
    const dy = d.source.y - d.target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0.05, 0.25 - distance / 1500);
  });

  link.attr("stroke-linecap", "round");


  // atualiza posição dos nós
  node
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
});
  });
