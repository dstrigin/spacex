import {SpaceX} from "./api/spacex";
import * as d3 from "d3";
import * as Geo from './geo.json'

document.addEventListener("DOMContentLoaded", setup)

function setup(){
    const spaceX = new SpaceX();
    spaceX.launches().then(launches=>{
        const launchpads = extractLaunchpads(launches);
        const listContainer = document.getElementById("listContainer")
        renderLaunches(launches, listContainer);
        drawMap(launchpads);
    })
}

function extractLaunchpads(launches){
    const launchpadsById = new Map();

    launches.forEach(launch => {
        if (launch.pad) {
            launchpadsById.set(launch.pad.id, launch.pad);
        }
    });

    return [...launchpadsById.values()];
}

function renderLaunches(launches, container){
    const list = document.createElement("ul");
    launches.forEach(launch=>{
        const item = document.createElement("li");
        item.innerHTML = launch.name;

        if (launch.pad?.id != null) {
            item.dataset.launchpadId = launch.pad.id;
            item.addEventListener("mouseenter", () => {
                const launchpadPoint = document.querySelector(
                    `.launchpad[data-launchpad-id="${item.dataset.launchpadId}"]`
                );

                if (launchpadPoint) {
                    launchpadPoint.classList.add("launchpad--active");
                    launchpadPoint.parentNode.appendChild(launchpadPoint);
                }
            });
            item.addEventListener("mouseleave", () => {
                const launchpadPoint = document.querySelector(
                    `.launchpad[data-launchpad-id="${item.dataset.launchpadId}"]`
                );

                launchpadPoint?.classList.remove("launchpad--active");
            });
        }

        list.appendChild(item);
    })
    container.replaceChildren(list);
}

function launchpadsToGeoJson(launchpads){
    return {
        type: "FeatureCollection",
        features: launchpads
            .filter(launchpad => launchpad.longitude != null
                && launchpad.latitude != null
                && Number.isFinite(Number(launchpad.longitude))
                && Number.isFinite(Number(launchpad.latitude)))
            .map(launchpad => ({
                type: "Feature",
                properties: {
                    id: launchpad.id,
                    name: launchpad.name
                },
                geometry: {
                    type: "Point",
                    coordinates: [
                        Number(launchpad.longitude),
                        Number(launchpad.latitude)
                    ]
                }
            }))
    };
}

function drawMap(launchpads){
    const launchpadGeoJson = launchpadsToGeoJson(launchpads);

    const width = 640;
    const height = 480;
    const margin = {top: 20, right: 10, bottom: 40, left: 100};
    const svg = d3.select('#map').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    const projection = d3.geoMercator()
        .scale(70)
        .center([0,20])
        .translate([width / 2 - margin.left, height / 2]);
    svg.append("g")
        .selectAll("path")
        .data(Geo.features)
        .enter()
        .append("path")
        .attr("class", "topo")
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        .attr("fill", "#d8e2ec")
        .style("opacity", .7)

    const launchpadPoints = svg.append("g")
        .selectAll("circle")
        .data(launchpadGeoJson.features)
        .enter()
        .append("circle")
        .attr("class", "launchpad")
        .attr("data-launchpad-id", launchpad => launchpad.properties.id)
        .attr("cx", launchpad => projection(launchpad.geometry.coordinates)[0])
        .attr("cy", launchpad => projection(launchpad.geometry.coordinates)[1])
        .attr("r", 3)
        .attr("fill", "#e4572e")
        .attr("stroke", "#ffffff")

    launchpadPoints.append("title")
        .text(launchpad => launchpad.properties.name)
}
