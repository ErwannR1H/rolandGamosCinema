import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function NetworkVisualization({ data, width = 1000, height = 700 }) {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || !data.actors || data.actors.length === 0) return;

        // Nettoyer le SVG existant
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Préparer les données pour D3
        const nodes = data.actors.map(a => ({ ...a }));
        const links = data.connections.map(c => ({
            source: c.actor1,
            target: c.actor2,
            movies: c.movies
        }));

        // Créer une simulation de force
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => 5 + Math.sqrt(d.degree) * 2));

        // Dessiner les liens
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.4)
            .attr('stroke-width', d => Math.min(Math.sqrt(d.movies.length), 5));

        // Dessiner les nœuds
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
            .attr('r', d => 5 + Math.sqrt(d.degree) * 2)
            .attr('fill', d => {
                // Couleur basée sur le degré
                const maxDegree = d3.max(nodes, n => n.degree);
                const scale = d3.scaleSequential(d3.interpolateViridis)
                    .domain([0, maxDegree]);
                return scale(d.degree);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .call(drag(simulation))
            .on('mouseover', function(event, d) {
                // Afficher le label au survol
                d3.select(this).attr('stroke', '#ff0000').attr('stroke-width', 3);
                tooltip.style('display', 'block')
                    .html(`<strong>${d.label}</strong><br/>Films: ${d.movieCount}<br/>Connexions: ${d.degree}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1.5);
                tooltip.style('display', 'none');
            });

        // Ajouter les labels pour les acteurs importants (top 10%)
        const topActors = nodes.sort((a, b) => b.degree - a.degree).slice(0, Math.max(10, Math.floor(nodes.length * 0.1)));
        const label = svg.append('g')
            .selectAll('text')
            .data(topActors)
            .join('text')
            .text(d => d.label)
            .attr('font-size', 10)
            .attr('font-weight', 'bold')
            .attr('dx', 12)
            .attr('dy', 4)
            .attr('fill', '#333');

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .style('position', 'absolute')
            .style('display', 'none')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', 1000);

        // Mettre à jour les positions à chaque tick
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

        // Fonction de drag
        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended);
        }

        // Cleanup
        return () => {
            simulation.stop();
            tooltip.remove();
        };
    }, [data, width, height]);

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
            <svg ref={svgRef}></svg>
        </div>
    );
}

export default NetworkVisualization;
