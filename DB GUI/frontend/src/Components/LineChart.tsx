import * as d3 from "d3";
import {useEffect, useRef} from "react";
import {DataHistory} from "../Types/Data";

const D3LineChart = ({data, width, height, minY, maxY, unit}: {
    data: DataHistory<number>;
    unit: string;
    width: number;
    height: number;
    minY: number;
    maxY: number;
}) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        // Set up margins
        const margin = {top: 10, right: 40, bottom: 20, left: 40};
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // X-axis scale (time)
        const xScale = d3
            .scaleTime()
            .domain(
                d3.extent(data, d => new Date(d.x)
                ) as [Date, Date]
            )
            .range([0, innerWidth]);

        // Y-axis scale (linear)
        const yScale = d3
            .scaleLinear()
            .domain([minY, maxY])
            .range([innerHeight, 0]);

        // Define the line generator
        const line = d3
            .line<{
                x: number;
                y: number;
            }>()
            .x(d => xScale(new Date(d.x)))  // Map the second tuple value (time) to X
            .y(d => yScale(d.y))            // Map the first tuple value (y-value) to Y
            .curve(d3.curveLinear);

        // Create SVG and group elements
        const svg = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);


        const tooltip = d3.select(".tooltip").attr("class", "tooltip");
        // Dynamically determine the number of X-axis ticks based on available width
        const xTickCount = Math.floor(innerWidth / 80); // Roughly 80 pixels per tick to avoid overlap
        // Dynamically determine the number of Y-axis ticks based on available height
        const yTickCount = Math.floor(innerHeight / 40); // Roughly 40 pixels per tick on Y-axis


        // Add X-axis
        svg
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale)
                .ticks(xTickCount)
                .tickFormat(d => new Date(d as number).toLocaleTimeString()));

        // Add Y-axis
        svg.append("g").call(d3.axisLeft(yScale).ticks(yTickCount));

        svg
            .append("g")
            .attr("class", "grid")
            .call(
                d3.axisLeft(yScale)
                    .ticks(yTickCount)
                    .tickSize(-innerWidth)  // Extend the grid lines horizontally
                    .tickFormat((v) => "")         // Remove the tick labels
            );

        svg
            .append("g")
            .attr("class", "grid")
            .call(
                d3.axisBottom(xScale)
                    .ticks(xTickCount)
                    .tickSize(innerHeight)  // Extend the grid lines vertically
                    .tickFormat((v) => "")
            )// Remove the tick labels

        // Add the line path
        svg
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line)

        svg
            .selectAll(".mark")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "mark")
            .attr("cx", d => xScale(new Date(d.x)))  // Second tuple value (time)
            .attr("cy", d => yScale(d.y))           // First tuple value (y-value)
            .attr("r", 2)
            .attr("fill", "steelblue");

        let t:NodeJS.Timeout;

        svg
            .on("mousemove", (event) => {
                const [mouseX,mouseY] = d3.pointer(event); // Get the mouse x position in SVG
                const mouseTime = xScale.invert(mouseX); // Convert mouse x position to a time using the scale

                // Find the nearest data point by comparing only time (x-direction)
                const nearestDataPoint = data.reduce((a, b) => {
                    const distA = Math.abs(mouseTime.getTime() - a.x); // Difference in time
                    const distB = Math.abs(mouseTime.getTime() - b.x);
                    return distA < distB ? a : b;
                });
                clearTimeout(t);
                t = setTimeout(() => {
                    tooltip.style("opacity", 0);
                },1000);
                tooltip
                    .style("opacity", 1)
                    .html(`X: ${new Date(nearestDataPoint.x).toLocaleTimeString()}<br>Y: ${nearestDataPoint.y.toFixed(2)} ${unit}`)
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY + 20) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0); // Hide tooltip when mouse leaves the SVG
            })

    }, [data, width, height, minY, maxY]);

    return <>
        <svg ref={svgRef}></svg>
        <div className={"tooltip"}/>
    </>;
};

export default D3LineChart;
