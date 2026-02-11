// === CONFIGURATION ===
const config = {
    width: 0,
    height: 700,
    colors: {
        north: '#E63946',
        central: '#F1FAEE',
        south: '#A8DADC',
        region: {
            north: '#E63946',
            central: '#457B9D',
            south: '#A8DADC'
        }
    },
    forces: {
        charge: -800,
        link: 150,
        collision: 50
    },
    nodeSize: {
        region: 80,
        university: { min: 8, max: 35 }
    }
};

// === GLOBAL VARIABLES ===
let svg, g, simulation, link, node, label;
let data, nodes, links;
let tooltip;
let currentFilter = 'all';
let searchTerm = '';

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data
        const response = await fetch('data/vietnam_university_data_mock.json');
        data = await response.json();
        
        // Initialize
        initializeSVG();
        processData();
        updateStatistics();
        createVisualization();
        setupEventListeners();
        setupTooltip();
        
        console.log('✅ Visualization initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing visualization:', error);
    }
});

// === SVG INITIALIZATION ===
function initializeSVG() {
    const container = document.getElementById('network-graph');
    config.width = container.clientWidth;
    
    svg = d3.select('#network-graph')
        .attr('width', config.width)
        .attr('height', config.height);
    
    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    svg.call(zoom);
    
    // Main group for zooming/panning
    g = svg.append('g');
}

// === DATA PROCESSING ===
function processData() {
    nodes = [];
    links = [];
    
    // Process regions and universities
    data.children.forEach((region) => {
        // Add region node
        const regionNode = {
            id: region.id,
            name: region.name,
            type: 'region',
            color: config.colors.region[region.id.split('_')[1]] || region.color_code,
            size: config.nodeSize.region,
            children: []
        };
        nodes.push(regionNode);
        
        // Add university nodes
        region.children.forEach((university) => {
            const uniNode = {
                id: university.id,
                name: university.name,
                type: 'university',
                students: university.students,
                lecturers: university.lecturers,
                region: region.id,
                regionName: region.name,
                color: region.color_code,
                regionColor: regionNode.color,
                size: calculateNodeSize(university.students)
            };
            nodes.push(uniNode);
            regionNode.children.push(uniNode);
            
            // Add link between university and region
            links.push({
                source: region.id,
                target: university.id,
                type: 'region-university'
            });
        });
    });
}

function calculateNodeSize(students) {
    const minStudents = 6000;
    const maxStudents = 55000;
    const range = maxStudents - minStudents;
    const normalized = (students - minStudents) / range;
    
    return config.nodeSize.university.min + 
           normalized * (config.nodeSize.university.max - config.nodeSize.university.min);
}

function getNodeColor(node) {
    if (node.type === 'region') {
        return node.color;
    } else {
        // Gradient based on lecturers
        const lecturers = node.lecturers;
        const maxLecturers = 2800;
        const intensity = Math.min(lecturers / maxLecturers, 1);
        
        const color = d3.color(node.regionColor);
        color.opacity = 0.5 + (intensity * 0.5);
        return color.toString();
    }
}

// === VISUALIZATION CREATION ===
function createVisualization() {
    // Create force simulation
    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links)
            .id(d => d.id)
            .distance(d => d.type === 'region-university' ? config.forces.link : 100))
        .force('charge', d3.forceManyBody()
            .strength(d => d.type === 'region' ? config.forces.charge * 2 : config.forces.charge))
        .force('center', d3.forceCenter(config.width / 2, config.height / 2))
        .force('collision', d3.forceCollide()
            .radius(d => d.size + config.forces.collision))
        .force('x', d3.forceX(d => {
            if (d.type === 'region') {
                const regions = ['region_north', 'region_central', 'region_south'];
                const index = regions.indexOf(d.id);
                return (config.width / 4) * (index + 1);
            }
            return config.width / 2;
        }).strength(0.1))
        .force('y', d3.forceY(config.height / 2).strength(0.05));
    
    // Create links
    link = g.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('class', 'link')
        .style('stroke-width', 2);
    
    // Create nodes
    node = g.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('class', 'node')
        .attr('r', d => d.size)
        .style('fill', d => getNodeColor(d))
        .call(drag(simulation))
        .on('mouseover', handleNodeMouseOver)
        .on('mousemove', handleNodeMouseMove)
        .on('mouseout', handleNodeMouseOut)
        .on('click', handleNodeClick);
    
    // Create labels
    label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('class', d => d.type === 'region' ? 'region-label' : 'node-label')
        .text(d => d.type === 'region' ? d.name : (d.size > 20 ? d.name : ''))
        .attr('text-anchor', 'middle')
        .attr('dy', d => d.type === 'region' ? 5 : -d.size - 5);
    
    // Update positions on tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        
        label
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });
}

// === DRAG BEHAVIOR ===
function drag(simulation) {
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

// === TOOLTIP ===
function setupTooltip() {
    tooltip = d3.select('#tooltip');
}

function handleNodeMouseOver(event, d) {
    // Highlight node and connected elements
    highlightNode(d);
    
    // Show tooltip
    const tooltipHeader = tooltip.select('.tooltip-header');
    const tooltipContent = tooltip.select('.tooltip-content');
    
    if (d.type === 'region') {
        tooltipHeader.html(`🌍 ${d.name}`);
        const uniCount = d.children.length;
        const totalStudents = d.children.reduce((sum, u) => sum + u.students, 0);
        const totalLecturers = d.children.reduce((sum, u) => sum + u.lecturers, 0);
        
        tooltipContent.html(`
            <p><strong>Số trường:</strong> ${uniCount}</p>
            <p><strong>Tổng sinh viên:</strong> ${totalStudents.toLocaleString()}</p>
            <p><strong>Tổng giảng viên:</strong> ${totalLecturers.toLocaleString()}</p>
            <p><strong>Trung bình SV/trường:</strong> ${Math.round(totalStudents / uniCount).toLocaleString()}</p>
        `);
    } else {
        tooltipHeader.html(`🎓 ${d.name}`);
        const ratio = (d.students / d.lecturers).toFixed(1);
        
        tooltipContent.html(`
            <p><strong>Khu vực:</strong> ${d.regionName}</p>
            <p><strong>Sinh viên:</strong> ${d.students.toLocaleString()}</p>
            <p><strong>Giảng viên:</strong> ${d.lecturers.toLocaleString()}</p>
            <p><strong>Tỷ lệ SV/GV:</strong> ${ratio}</p>
        `);
    }
    
    tooltip.classed('show', true);
    updateTooltipPosition(event);
}

function handleNodeMouseMove(event, d) {
    updateTooltipPosition(event);
}

function updateTooltipPosition(event) {
    const tooltipNode = tooltip.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;
    const offsetX = 2;
    const offsetY = 2;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate initial position (right and below cursor)
    let left = event.clientX + offsetX;
    let top = event.clientY + offsetY;
    
    // Check if tooltip would go off the right edge
    if (left + tooltipWidth > viewportWidth - 10) {
        left = event.clientX - tooltipWidth - offsetX;
    }
    
    // Check if tooltip would go off the bottom edge
    if (top + tooltipHeight > viewportHeight - 10) {
        top = event.clientY - tooltipHeight - offsetY;
    }
    
    // Ensure tooltip doesn't go off left edge
    if (left < 10) {
        left = event.clientX + offsetX;
    }
    
    // Ensure tooltip doesn't go off top edge
    if (top < 10) {
        top = event.clientY + offsetY;
    }
    
    tooltip
        .style('left', left + 'px')
        .style('top', top + 'px');
}

function handleNodeMouseOut() {
    // Remove highlights
    node.classed('highlighted', false).classed('dimmed', false);
    link.classed('highlighted', false).classed('dimmed', false);
    
    // Hide tooltip
    tooltip.classed('show', false);
}

function handleNodeClick(event, d) {
    if (d.type === 'university') {
        // Create a pulsing effect
        d3.select(event.currentTarget)
            .transition()
            .duration(300)
            .attr('r', d.size * 1.5)
            .transition()
            .duration(300)
            .attr('r', d.size);
    }
}

function highlightNode(d) {
    const connectedNodeIds = new Set();
    const connectedLinkIds = new Set();
    
    if (d.type === 'region') {
        // Highlight all universities in this region
        connectedNodeIds.add(d.id);
        d.children.forEach(child => connectedNodeIds.add(child.id));
        
        links.forEach(link => {
            if (link.source.id === d.id || link.target.id === d.id) {
                connectedLinkIds.add(link);
            }
        });
    } else {
        // Highlight university and its region
        connectedNodeIds.add(d.id);
        connectedNodeIds.add(d.region);
        
        links.forEach(link => {
            if (link.source.id === d.id || link.target.id === d.id ||
                link.source.id === d.region || link.target.id === d.region) {
                connectedLinkIds.add(link);
            }
        });
    }
    
    node
        .classed('highlighted', n => connectedNodeIds.has(n.id))
        .classed('dimmed', n => !connectedNodeIds.has(n.id));
    
    link
        .classed('highlighted', l => connectedLinkIds.has(l))
        .classed('dimmed', l => !connectedLinkIds.has(l));
}

// === STATISTICS ===
function updateStatistics() {
    const allUniversities = nodes.filter(n => n.type === 'university');
    const totalUniversities = allUniversities.length;
    const totalStudents = allUniversities.reduce((sum, u) => sum + u.students, 0);
    const totalLecturers = allUniversities.reduce((sum, u) => sum + u.lecturers, 0);
    const avgRatio = (totalStudents / totalLecturers).toFixed(1);
    
    // Animate numbers
    animateValue('totalUniversities', 0, totalUniversities, 1000);
    animateValue('totalStudents', 0, totalStudents, 1500, true);
    animateValue('totalLecturers', 0, totalLecturers, 1500, true);
    
    document.getElementById('avgRatio').textContent = avgRatio;
    
    // Top universities
    const topUniversities = allUniversities
        .sort((a, b) => b.students - a.students)
        .slice(0, 5);
    
    const topList = document.getElementById('topUniversitiesList');
    topList.innerHTML = topUniversities.map((uni, index) => `
        <li>
            <span class="uni-name">${index + 1}. ${uni.name}</span>
            <span class="uni-count">${uni.students.toLocaleString()} SV</span>
        </li>
    `).join('');
}

function animateValue(id, start, end, duration, useLocale = false) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = useLocale ? 
            Math.floor(current).toLocaleString() : 
            Math.floor(current);
    }, 16);
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        filterVisualization();
    });
    
    // Region filter
    document.getElementById('regionFilter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterVisualization();
    });
    
    // Sort
    document.getElementById('sortBy').addEventListener('change', (e) => {
        const sortBy = e.target.value;
        sortNodes(sortBy);
    });
    
    // Reset view
    document.getElementById('resetBtn').addEventListener('click', () => {
        resetView();
    });
    
    // Export
    document.getElementById('exportBtn').addEventListener('click', () => {
        exportToPNG();
    });
}

function filterVisualization() {
    node.style('opacity', d => {
        if (d.type === 'region') return 1;
        
        const matchesFilter = currentFilter === 'all' || d.region === currentFilter;
        const matchesSearch = searchTerm === '' || 
                              d.name.toLowerCase().includes(searchTerm);
        
        return matchesFilter && matchesSearch ? 1 : 0.1;
    });
    
    link.style('opacity', l => {
        const sourceVisible = l.source.type === 'region' || 
                             ((currentFilter === 'all' || l.source.region === currentFilter) &&
                              (searchTerm === '' || l.source.name.toLowerCase().includes(searchTerm)));
        const targetVisible = l.target.type === 'region' ||
                             ((currentFilter === 'all' || l.target.region === currentFilter) &&
                              (searchTerm === '' || l.target.name.toLowerCase().includes(searchTerm)));
        
        return sourceVisible && targetVisible ? 0.6 : 0.05;
    });
    
    label.style('opacity', d => {
        if (d.type === 'region') return 1;
        
        const matchesFilter = currentFilter === 'all' || d.region === currentFilter;
        const matchesSearch = searchTerm === '' || 
                              d.name.toLowerCase().includes(searchTerm);
        
        return matchesFilter && matchesSearch ? 1 : 0.1;
    });
}

function sortNodes(sortBy) {
    const universities = nodes.filter(n => n.type === 'university');
    
    universities.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'students') return b.students - a.students;
        if (sortBy === 'lecturers') return b.lecturers - a.lecturers;
        return 0;
    });
    
    // Visual feedback
    universities.forEach((uni, index) => {
        const delay = index * 20;
        d3.select(`circle[data-id="${uni.id}"]`)
            .transition()
            .delay(delay)
            .duration(500)
            .attr('r', uni.size * 1.2)
            .transition()
            .duration(500)
            .attr('r', uni.size);
    });
}

function resetView() {
    // Reset filters
    currentFilter = 'all';
    searchTerm = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('regionFilter').value = 'all';
    
    // Reset visualization
    filterVisualization();
    
    // Reset zoom
    svg.transition()
        .duration(750)
        .call(d3.zoom().transform, d3.zoomIdentity);
    
    // Restart simulation
    simulation.alpha(1).restart();
}

function exportToPNG() {
    const svgElement = document.getElementById('network-graph');
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = config.width;
    canvas.height = config.height;
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        
        canvas.toBlob(function(blob) {
            const link = document.createElement('a');
            link.download = 'vietnam-universities-network.png';
            link.href = URL.createObjectURL(blob);
            link.click();
        });
    };
    
    img.src = url;
}

// === RESPONSIVE ===
window.addEventListener('resize', () => {
    const container = document.getElementById('network-graph');
    const newWidth = container.clientWidth;
    
    if (Math.abs(newWidth - config.width) > 50) {
        config.width = newWidth;
        svg.attr('width', config.width);
        simulation.force('center', d3.forceCenter(config.width / 2, config.height / 2));
        simulation.alpha(0.3).restart();
    }
});
