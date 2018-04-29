// function bubbles(svg, centroid) {
//     svg.append("g")
//         .attr("class", "bubble")
//         .selectAll("circle")
//         .data([1])
//         .enter().append("circle")
//         .attr("transform", function (d) {
//             return "translate(" + centroid + ")";
//         })
//         .attr("r", 10)
//         .style("fill", function (d) {
//             return "#ffffff";
//         });
//
//     // svg.append("clipPath")
//     //     .attr("id", function (d) {
//     //         return "clip-" + d.id;
//     //     })
//     //     .append("use")
//     //     .attr("xlink:href", function (d) {
//     //         return "#" + d.id;
//     //     });
//
//     svg.append("text")
//     // .attr("clip-path", function (d) {
//     //     return "url(#clip-" + d.id + ")";
//     // })
//     // .selectAll("tspan")
//     // .data(function (d) {
//     //     return [1];
//     // })
//     // .enter().append("tspan")
//     // .attr("x", 0)
//     // .attr("y", function (d, i, nodes) {
//     //     return 13 + (i - nodes.length / 2 - 0.5) * 10;
//     // })
//         .text(function (d) {
//             return "RES";
//         });
//
//     svg.append("title")
//         .text(function (d) {
//             return "QSO"
//         });
// }
//
// function b2(svg) {
//     var diameter = 960,
//         format = d3.format(",d"),
//         color = d3.scale.category20c();
//
//     var bubble = d3.layout.pack()
//         .sort(null)
//         .size([diameter, diameter])
//         .padding(1.5);
//
//     var tooltip = d3.select("body")
//         .append("div")
//         .style("position", "absolute")
//         .style("z-index", "10")
//         .style("visibility", "hidden")
//         .style("color", "white")
//         .style("padding", "8px")
//         .style("background-color", "rgba(0, 0, 0, 0.75)")
//         .style("border-radius", "6px")
//         .style("font", "12px sans-serif")
//         .text("tooltip");
//
//     d3.json("assets/data/flare.json", function (error, root) {
//         var node = svg.selectAll(".node")
//             .data(bubble.nodes(classes(root))
//                 .filter(function (d) {
//                     return !d.children;
//                 }))
//             .enter().append("g")
//             .attr("class", "node")
//             .attr("transform", function (d) {
//                 return "translate(" + d.x + "," + d.y + ")";
//             });
//
//         node.append("circle")
//             .attr("r", function (d) {
//                 return d.r;
//             })
//             .style("fill", function (d) {
//                 return color(d.packageName);
//             })
//             .on("mouseover", function (d) {
//                 tooltip.text(d.className + ": " + format(d.value));
//                 tooltip.style("visibility", "visible");
//             })
//             .on("mousemove", function () {
//                 return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
//             })
//             .on("mouseout", function () {
//                 return tooltip.style("visibility", "hidden");
//             });
//
//         node.append("text")
//             .attr("dy", ".3em")
//             .style("text-anchor", "middle")
//             .style("pointer-events", "none")
//             .text(function (d) {
//                 return d.className.substring(0, d.r / 3);
//             });
//     });
//
// // Returns a flattened hierarchy containing all leaf nodes under the root.
//     function classes(root) {
//         var classes = [];
//
//         function recurse(name, node) {
//             if (node.children) node.children.forEach(function (child) {
//                 recurse(node.name, child);
//             });
//             else classes.push({packageName: name, className: node.name, value: node.size});
//         }
//
//         recurse(null, root);
//         return {children: classes};
//     }
//
//     d3.select(self.frameElement).style("height", diameter + "px");
// }

function buildChart(container) {
    var margin = {top: 20, right: 30, bottom: 40, left: 30},
        width = 500 - margin.left - margin.right,
        height = 261 - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .range([0, width]);

    var y = d3.scale.ordinal()
        .rangeRoundBands([0, height], 0.1);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(0)
        .tickPadding(6);

    var svg = d3.select(container).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("assets/data/data.tsv", type, function (error, data) {
        x.domain(d3.extent(data, function (d) {
            return d.value;
        })).nice();
        y.domain(data.map(function (d) {
            return d.name;
        }));

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", function (d) {
                return "bar bar--" + (d.value < 0 ? "negative" : "positive");
            })
            .attr("x", function (d) {
                return x(Math.min(0, d.value));
            })
            .attr("y", function (d) {
                return y(d.name);
            })
            .attr("width", function (d) {
                return Math.abs(x(d.value) - x(0));
            })
            .attr("height", y.rangeBand());

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + x(0) + ",0)")
            .call(yAxis);
    });

    function type(d) {
        d.value = +d.value;
        return d;
    }
}

function initializeMap(canvasSvg, tooltipContainer, valueColumn, colors) {
    var col = colors;

    d3.csv("assets/data/final_out.csv", function (err, data) {
        var config = {
            "color1": col[0],
            "color2": col[1],
            "stateDataColumn": "state",
            "valueDataColumn": valueColumn,
        };

        var WIDTH = 960, HEIGHT = 500, centered;

        var COLOR_COUNTS = 9;

        var SCALE = 0.7;

        function Interpolate(start, end, steps, count) {
            var s = start,
                e = end,
                final = s + (((e - s) / steps) * count);
            return Math.floor(final);
        }

        function Color(_r, _g, _b) {
            var r, g, b;
            var setColors = function (_r, _g, _b) {
                r = _r;
                g = _g;
                b = _b;
            };

            setColors(_r, _g, _b);
            this.getColors = function () {
                var colors = {
                    r: r,
                    g: g,
                    b: b
                };
                return colors;
            };
        }

        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        function valueFormat(d) {
            if (d > 1000000000) {
                return Math.round(d / 1000000000 * 10) / 10 + "B";
            } else if (d > 1000000) {
                return Math.round(d / 1000000 * 10) / 10 + "M";
            } else if (d > 1000) {
                return Math.round(d / 1000 * 10) / 10 + "K";
            } else {
                return d;
            }
        }

        var COLOR_FIRST = config.color1, COLOR_LAST = config.color2;

        var rgb = hexToRgb(COLOR_FIRST);

        var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

        rgb = hexToRgb(COLOR_LAST);
        var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

        var MAP_STATE = config.stateDataColumn;
        var MAP_VALUE = config.valueDataColumn;

        var width = WIDTH,
            height = HEIGHT;

        var valueById = d3.map();

        var startColors = COLOR_START.getColors(),
            endColors = COLOR_END.getColors();

        var colors = [];

        for (var i = 0; i < COLOR_COUNTS; i++) {
            var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
            var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
            var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
            colors.push(new Color(r, g, b));
        }

        var quantize = d3.scale.quantize()
            .domain([0, 1.0])
            .range(d3.range(COLOR_COUNTS).map(function (i) {
                return i
            }));

        var projection = d3.geo.albersUsa()
            .scale(1070)
            .translate([width / 2, height / 2]);

        var path = d3.geo.path()
            .projection(projection);

        var svg = d3.select(canvasSvg).append("svg")
            .attr("width", width * SCALE)
            .attr("height", height * SCALE);

        svg.append("rect")
            .attr("class", "background")
            .attr("width", width * SCALE)
            .attr("height", height * SCALE)
            .on("click", clicked);

        var g = svg.append("g");

        d3.tsv("https://s3-us-west-2.amazonaws.com/vida-public/geo/us-state-names.tsv", function (error, names) {
            name_id_map = {};
            id_name_map = {};

            for (var i = 0; i < names.length; i++) {
                name_id_map[names[i].name] = names[i].id;
                id_name_map[names[i].id] = names[i].name;
            }

            data.forEach(function (d) {
                var id = name_id_map[d[MAP_STATE]];
                valueById.set(id, +d[MAP_VALUE]);
            });

            quantize.domain([d3.min(data, function (d) {
                return +d[MAP_VALUE]
            }),
                d3.max(data, function (d) {
                    return +d[MAP_VALUE]
                })]);

            d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/us.json", function (error, us) {
                if (error) throw error;

                g.append("g")
                    .attr("class", "states-choropleth")
                    .selectAll("path")
                    .data(topojson.feature(us, us.objects.states).features)
                    .enter().append("path")
                    .attr("transform", "scale(" + SCALE + ")")
                    .style("fill", function (d) {
                        if (valueById.get(d.id)) {
                            var i = quantize(valueById.get(d.id));
                            var color = colors[i].getColors();
                            return "rgb(" + color.r + "," + color.g +
                                "," + color.b + ")";
                        } else {
                            return "";
                        }
                    })
                    .attr("d", path)
                    .on("mousemove", function (d) {
                        var html = "";

                        html += "<div class=\"tooltip_kv\">";
                        html += "<span class=\"tooltip_key\">";
                        html += id_name_map[d.id];
                        html += "</span>";
                        html += "<span class=\"tooltip_value\">";
                        html += (valueById.get(d.id) ? valueFormat(valueById.get(d.id)) : "");
                        html += "";
                        html += "</span>";
                        html += "</div>";

                        $(tooltipContainer).html(html);
                        $(this).attr("fill-opacity", "0.8");
                        $(tooltipContainer).show();

                        var coordinates = d3.mouse(this);

                        var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;

                        if (d3.event.layerX < map_width / 2) {
                            d3.select(tooltipContainer)
                                .style("top", (d3.event.layerY + 15) + "px")
                                .style("left", (d3.event.layerX + 15) + "px");
                        } else {
                            var tooltip_width = $(tooltipContainer).width();
                            d3.select(tooltipContainer)
                                .style("top", (d3.event.layerY + 15) + "px")
                                .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
                        }
                    })
                    .on("mouseout", function () {
                        $(this).attr("fill-opacity", "1.0");
                        $(tooltipContainer).hide();
                    })
                    .on("click", clicked)

                g.append("path")
                    .datum(topojson.mesh(us, us.objects.states, function (a, b) {
                        return a !== b;
                    }))
                    .attr("class", "states")
                    .attr("transform", "scale(" + SCALE + ")")
                    .attr("d", path);
            });
        });

        function clicked(d) {
            var x, y, k;

            if (d && centered !== d) {
                var centroid = path.centroid(d);
                x = centroid[0] * 0.77;
                y = centroid[1] * 0.77;
                k = 4;
                centered = d;
            } else {
                x = width / 2;
                y = height / 2;
                k = 1;
                centered = null;
            }

            g.selectAll("path")
                .classed("active", centered && function (d) {
                    return d === centered;
                });

            g.transition()
                .duration(750)
                //.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                .style("stroke-width", 1.5 / k + "px");
        };
    });
};

function initializeMaps(canvas_list, tooltip_con_list, values, colors, topics) {
    $.each(canvas_list, function (index, canvas) {
        initializeMap(
            canvas,
            tooltip_con_list[index],
            values[index],
            colors[index]
        );

        buildChart(topics[index]);
    });
};

$(document).ready(function () {
    var offset = 85;

    $('.navbar li a').click(function (event) {
        event.preventDefault();
        $($(this).attr('href'))[0].scrollIntoView();
        scrollBy(0, -offset);
    });

    $("div.card.mb-3").children().hide();
    $("div.card.mb-3").append($("#loading"));
    initializeMaps(["#canvas-svg-toxic",
            "#canvas-svg-severe",
            "#canvas-svg-obscene",
            "#canvas-svg-threat",
            "#canvas-svg-insult",
            "#canvas-svg-hate"],
        ["#tooltip-container-toxic",
            "#tooltip-container-severe",
            "#tooltip-container-obscene",
            "#tooltip-container-threat",
            "#tooltip-container-insult",
            "#tooltip-container-hate"],
        ["toxic",
            "severe_toxic",
            "obscene",
            "threat",
            "insult",
            "identity_hate"],
        [["#f5ccff", "#cc00ff"],
            ["#ffccff", "#4d004d"],
            ["#ffe0b3", "#e68a00"],
            ["#a6a6a6", "#000000"],
            ["#ff6666", "#660000"],
            ["#ccd2ff", "#0017bf"]],
        ["#topic-toxic",
            "#topic-severe",
            "#topic-obscene",
            "#topic-threat",
            "#topic-insult",
            "#topic-hate"]);

    $("div.card.mb-3").children().not(".loading").show();
    $(".loading").hide();
});

