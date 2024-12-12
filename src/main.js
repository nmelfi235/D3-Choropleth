import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.skypack.dev/topojson@3.0.2";

const width = 1000;
const height = 600;
const margin = { top: 30, bottom: 30, left: 30, right: 30 };
const legendX = 300;
const legendY = 0;
const colors = d3.schemeBlues[9];

const EDUCATION_DATA =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const COUNTY_DATA =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

const tooltip = d3
  .select("#graph")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute");
const svg = d3
  .select("#graph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

// Fetch data
Promise.all([d3.json(EDUCATION_DATA), d3.json(COUNTY_DATA)]).then((data) => {
  const educationData = data[0];
  const countyData = data[1];

  // Format data
  const minFips = d3.min(educationData.map((datum) => datum.bachelorsOrHigher));
  const maxFips = d3.max(educationData.map((datum) => datum.bachelorsOrHigher));

  // Create legend
  const legend = svg
    .append("g")
    .attr("width", width - legendX)
    .attr("id", "legend")
    .attr("transform", `translate(0, ${margin.top})`);

  // Create legend score scale
  const fipScale = d3
    .scaleLinear()
    .domain([minFips, maxFips])
    .range([width - legendX, width]);

  // Create legend color scale
  const colorScale = d3
    .scaleThreshold()
    .domain(d3.range(minFips, maxFips, (maxFips - minFips) / colors.length))
    .range(colors);

  // Draw legend axis
  const legendAxis = d3
    .axisBottom(fipScale)
    .tickValues(colorScale.domain())
    .tickFormat(d3.format(".1f"));
  legend.append("g").call(legendAxis).attr("transform", `translate(0, ${20})`);

  // Draw legend rectangles
  legend
    .selectAll("rect")
    .data(colorScale.domain())
    .join("rect")
    .attr("x", (datum) => fipScale(datum))
    .attr("y", legendY)
    .attr(
      "width",
      fipScale(colorScale.domain()[1]) - fipScale(colorScale.domain()[0])
    )
    .attr("height", 20)
    .attr("fill", (datum) => colorScale(datum - 0.1));

  // Draw counties
  const path = d3.geoPath();
  svg
    .append("g")
    .selectAll("path")
    .data(topojson.feature(countyData, countyData.objects.counties).features)
    .join("path")
    .attr("d", path)
    // Fill counties based on fips score
    .attr("fill", (datum) =>
      colorScale(
        educationData.filter((d) => datum.id === d.fips)[0].bachelorsOrHigher
      )
    )
    .classed("county", true)
    .attr(
      "data-county",
      (datum) => educationData.filter((d) => datum.id === d.fips)[0].area_name
    )
    .attr(
      "data-education",
      (datum) =>
        educationData.filter((d) => datum.id === d.fips)[0].bachelorsOrHigher
    )
    .attr(
      "data-fips",
      (datum) => educationData.filter((d) => datum.id === d.fips)[0].fips
    )
    // Attach tooltip
    .on("mouseover", (event) => {
      tooltip
        .style("opacity", 0.85)
        .style("top", event.pageY + 10 + "px")
        .style("left", event.pageX + 10 + "px")
        .attr("data-education", d3.select(event.target).attr("data-education"))
        .html(
          d3.select(event.target).attr("data-county") +
            "<br>Score: " +
            d3.select(event.target).attr("data-education")
        );
    })
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);
    });

  // Draw state lines
  svg
    .append("g")
    .append("path")
    .datum(
      topojson.mesh(countyData, countyData.objects.states, (a, b) => a !== b)
    )
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-linejoin", "round");
});
