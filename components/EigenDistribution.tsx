import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface EigenDistributionProps {
  rank: number;
}

const EigenDistribution: React.FC<EigenDistributionProps> = ({ rank }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 300;
    const height = 150;
    
    // Clear previous
    svg.selectAll("*").remove();

    // Data Generation logic mimicking Marchenko-Pastur law or similar spectral densities
    // Rank Low: Very few non-zero eigenvalues (Sparsity)
    // Rank High: Heavy tail, massive outliers (Explosion)
    // Rank Stable: Smooth decay
    
    const dataPoints = 50;
    const data = Array.from({ length: dataPoints }, (_, i) => {
        const x = i;
        let y = 0;

        if (rank < 30) {
            // Collapse: Only first few dimensions matter
            if (i < 5) y = 100 - (i * 20); 
            else y = Math.random() * 2; // Noise
        } else if (rank > 70) {
            // Explosion: Random spikes everywhere, heavy tail
            y = (Math.random() * rank) + (rank - 70) * 2;
        } else {
            // Stable: Power law decay
            y = 80 * Math.pow(0.9, i) + Math.random() * 5;
        }
        return { x, y: Math.max(0, y) };
    });

    const xScale = d3.scaleLinear()
        .domain([0, dataPoints - 1])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, 150]) // Fixed domain to show explosion clipping
        .range([height, 0]);

    const line = d3.line<{x: number, y: number}>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveMonotoneX);

    const path = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Color logic
    if (rank < 30) path.attr("stroke", "#64748b"); // Slate
    else if (rank > 70) path.attr("stroke", "#f43f5e"); // Rose
    else path.attr("stroke", "#22d3ee"); // Cyan

    // Area fill
    const area = d3.area<{x: number, y: number}>()
        .x(d => xScale(d.x))
        .y0(height)
        .y1(d => yScale(d.y))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("fill", rank < 30 ? "#64748b" : rank > 70 ? "#f43f5e" : "#22d3ee")
        .attr("fill-opacity", 0.2)
        .attr("d", area);

  }, [rank]);

  return (
    <div className="flex flex-col items-center">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Eigenvalue Spectrum</h3>
        <svg 
            ref={svgRef} 
            viewBox="0 0 300 150" 
            className="w-full h-auto overflow-visible border-b border-slate-800"
        />
    </div>
  );
};

export default EigenDistribution;