// Knowledge Graph — D3.js force-directed visualization
const KnowledgeGraph = {
  svg: null,
  simulation: null,

  async init() {
    const container = document.getElementById('graph-container');
    if (!container || typeof d3 === 'undefined') return;

    container.innerHTML = '';

    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      if (!data.nodes || data.nodes.length === 0) {
        container.innerHTML = '<p style="padding:2rem;color:var(--text-muted)">No graph data available.</p>';
        return;
      }
      this.render(container, data);
    } catch (err) {
      console.error('Graph load error:', err);
    }
  },

  render(container, data) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Zoom behavior
    const g = svg.append('g');
    svg.call(d3.zoom()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Build valid edges (both source and target must exist)
    const nodeIds = new Set(data.nodes.map(n => n.id));
    const validEdges = data.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    // Force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(validEdges).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(validEdges)
      .join('line')
      .attr('stroke', 'var(--text-dim)')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    node.append('circle')
      .attr('r', d => {
        const connections = validEdges.filter(e =>
          (e.source.id || e.source) === d.id || (e.target.id || e.target) === d.id
        ).length;
        return Math.max(6, Math.min(16, 6 + connections * 2));
      })
      .attr('fill', d => d.color || '#71717a')
      .attr('stroke', 'var(--bg)')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Node labels
    node.append('text')
      .text(d => d.label.length > 22 ? d.label.substring(0, 20) + '...' : d.label)
      .attr('dx', 14)
      .attr('dy', 4)
      .attr('font-size', '10px')
      .attr('font-family', "'Space Grotesk', sans-serif")
      .attr('fill', 'var(--text-muted)')
      .attr('pointer-events', 'none');

    // Click to navigate
    node.on('click', (event, d) => {
      router.navigate('/article/' + d.id);
    });

    // Hover highlight
    node.on('mouseenter', (event, d) => {
      const connected = new Set();
      validEdges.forEach(e => {
        const s = e.source.id || e.source;
        const t = e.target.id || e.target;
        if (s === d.id) connected.add(t);
        if (t === d.id) connected.add(s);
      });
      connected.add(d.id);

      node.attr('opacity', n => connected.has(n.id) ? 1 : 0.15);
      link.attr('stroke-opacity', l => {
        const s = l.source.id || l.source;
        const t = l.target.id || l.target;
        return (s === d.id || t === d.id) ? 0.6 : 0.05;
      });
    }).on('mouseleave', () => {
      node.attr('opacity', 1);
      link.attr('stroke-opacity', 0.3);
    });

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Build legend
    const categories = {};
    const catLabels = {
      'graphics-fundamentals': 'Graphics Fundamentals',
      'game-engines/unity': 'Unity',
      'game-engines/unreal': 'Unreal Engine',
      'blender': 'Blender',
      'photography': 'Photography',
      'photo-editing': 'Photo Editing',
      'digital-twin': 'Digital Twin',
      'algorithms': 'Algorithms & Data Structures',
      'frontier': 'Frontier Research',
      'concepts': 'Core Concepts',
    };
    data.nodes.forEach(n => {
      if (!categories[n.category]) {
        categories[n.category] = n.color;
      }
    });

    const legend = document.getElementById('graph-legend');
    if (legend) {
      legend.innerHTML = Object.entries(categories).map(([cat, color]) =>
        `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div>${catLabels[cat] || cat}</div>`
      ).join('');
    }

    this.simulation = simulation;
    this.svg = svg;
  },

  destroy() {
    if (this.simulation) this.simulation.stop();
    const container = document.getElementById('graph-container');
    if (container) container.innerHTML = '';
  }
};
