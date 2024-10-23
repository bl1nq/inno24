import * as d3 from "d3";
import {useEffect, useRef} from "react";

export function Gauge({
                          width,
                          height,
                          startAngle,
                          endAngle,
                          minValue,
                          maxValue,
                          value,
                          unit
                      }: {
    width: number,
    height: number,
    startAngle: number,
    endAngle: number,
    minValue: number,
    maxValue: number,
    value: number,
    unit: string
}) {
    const svgRef = useRef(null);
     const margin = {top: 20, right: 0, bottom: 0, left: 0};

    const toRadians = (angle: number) => angle * Math.PI / 180;

    useEffect(() => {
        if (!svgRef.current) return;
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3
            .select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create a scale to map the current value to the gauge arc
        const scale = d3.scaleLinear()
            .domain([minValue, maxValue])  // The range of the input data
            .range([startAngle, endAngle]);  // The corresponding arc range

        //Draw the gauge background
        svg.append("path")
            .attr("transform", `translate(${width / 2},${height / 2})`)
            .attr("d", d3.arc()({
                innerRadius: height / 2  - 10,
                outerRadius: height / 2,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(endAngle)
            }))
            .attr("stroke", "grey")
            .attr("fill", "grey");

        // Draw the gauge arc
        svg.append("path")
            .attr("transform", `translate(${width / 2},${height / 2})`)
            .attr("d", d3.arc()({
                innerRadius: height / 2  - 10,
                outerRadius: height / 2,
                startAngle: toRadians(startAngle),
                endAngle: toRadians(scale(value))
            }))
            .attr("stroke", `var(--main-color)`)
            .attr("fill", `var(--main-color)`);

        // Draw the gauge label
        svg.append("text")
            .attr("class", "gauge-label")
            .attr("x", width / 2 + 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .text(`${value.toFixed(2)}${unit}`);


    }, [value, minValue, maxValue, startAngle, endAngle, unit]);

    console.log("Rendering Gauge", value);

    return (
        <>
            <svg ref={svgRef}></svg>
        </>
    );
}