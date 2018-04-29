function initializeMap(property, chart_container, canvasSvg, tooltipContainer, valueColumn, colors) {
    var col = colors;

    d3.csv("assets/data/final_out.csv", function (err, fulldata) {
        var data = d3.nest()
            .key(function (d) {
                return d.state;
            })
            .rollup(function (v) {
                return d3.mean(v, function (d) {
                    return d[property];
                });
            })
            .entries(fulldata);

        var config = {
            "color1": col[0],
            "color2": col[1],
            "stateDataColumn": "key",
            "valueDataColumn": "values",
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

        function bc2(property, container, fulldata) {
            var data = d3.nest()
                .key(function (d) {
                    return d.headline;
                })
                .rollup(function (v) {
                    return d3.mean(v, function (d) {
                        return d[property];
                    });
                })
                .entries(fulldata);

            var dataSorted = data.sort(function (x, y) {
                return d3.descending(x.values, y.values);
            });

            data = dataSorted.slice(0, 9);

            var others = dataSorted.slice(9);

            data[9] = {
                key: "Others",
                values: d3.mean(others, function (d) {
                    return +d.values;
                })
            };

            var data = {
                labels: [
                    'resilience'
                ],
                series: data
            };

            var chartWidth = 300,
                barHeight = 35,
                groupHeight = barHeight * data.series.length,
                gapBetweenGroups = 10,
                spaceForLabels = 150,
                spaceForLegend = 150;

            // Zip the series data together (first values, second values, etc.)
            var zippedData = [];
            for (var i = 0; i < data.labels.length; i++) {
                for (var j = 0; j < data.series.length; j++) {
                    zippedData.push(data.series[j].values);
                }
            }

            // Color scale
            var color = d3.scale.category20();
            var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;

            var x = d3.scale.linear()
                .domain([0, d3.max(zippedData)])
                .range([0, chartWidth]);

            var y = d3.scale.linear()
                .range([chartHeight + gapBetweenGroups, 0]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .tickFormat('')
                .tickSize(0)
                .orient("left");

            // Specify the chart area and dimensions
            var chart = d3.select(container).append("svg")
                .attr("width", spaceForLabels + chartWidth + spaceForLegend)
                .attr("height", chartHeight);

            // Create bars
            var bar = chart.selectAll("g")
                .data(data.series)
                .enter().append("g")
                .attr("transform", function (d, i) {
                    return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i / data.series.length))) + ")";
                });

// Create rectangles of the correct width
            bar.append("rect")
                .style("fill", function (d) {
                    if (d.values) {
                        var i = quantize(d.values);
                        var color = colors[i].getColors();
                        return "rgb(" + color.r + "," + color.g +
                            "," + color.b + ")";
                    } else {
                        return "";
                    }
                })
                .attr("class", "bar")
                .attr("width", function (d) {
                    return Math.abs(x(d.values) - x(0));
                })
                .attr("height", barHeight - 1)
                .on("mousemove", function (d) {
                    var html = "";

                    html += "<div class=\"tooltip_kv\">";
                    html += "<span class=\"tooltip_key\">";
                    html += d.key;
                    html += "</span>";
                    html += "<span class=\"tooltip_value\">";
                    html += (valueById.get(d.id) ? d.values : "");
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
                });

// Add text label in bar
            bar.append("text")
                .attr("x", function (d) {
                    return x(d) - 3;
                })
                .attr("y", barHeight / 2)
                .attr("fill", "black")
                .attr("font-size", "14px")
                .attr("dy", ".35em")
                .attr("dx", ".5em")
                .text(function (d) {
                    return d.key;
                })
                .on("mousemove", function (d) {
                    var html = "";

                    html += "<div class=\"tooltip_kv\">";
                    html += "<span class=\"tooltip_key\">";
                    html += d.key;
                    html += "</span>";
                    html += "<span class=\"tooltip_value\">";
                    html += (valueById.get(d.id) ? d.values : "");
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
                });

            chart.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups / 2 + ")")
                .call(yAxis);
        }

        function buildChart(property, container, fulldata) {
            var margin = {top: 20, right: 30, bottom: 40, left: 30},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

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

            var data = d3.nest()
                .key(function (d) {
                    return d.headline;
                })
                .rollup(function (v) {
                    return d3.mean(v, function (d) {
                        return d[property];
                    });
                })
                .entries(fulldata);

            var dataSorted = data.sort(function (x, y) {
                return d3.descending(x.values, y.values);
            });

            data = dataSorted.slice(0, 9);

            var others = dataSorted.slice(9);

            data[9] = {
                key: "Others",
                values: d3.mean(others, function (d) {
                    return +d.values;
                })
            };

            x.domain(d3.extent(data, function (d) {
                return d.values;
            })).nice();
            y.domain(data.map(function (d) {
                return d.key;
            }));

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", function (d) {
                    return "bar bar--" + (d.values < 0 ? "negative" : "positive");
                })
                .attr("x", function (d) {
                    return x(Math.min(0, d.values));
                })
                .attr("y", function (d) {
                    return y(d.key);
                })
                .attr("width", function (d) {
                    return Math.abs(x(d.values) - x(0));
                })
                .attr("height", y.rangeBand())
                .style("fill", function (d) {
                    if (d.values) {
                        var i = quantize(d.values);
                        var color = colors[i].getColors();
                        return "rgb(" + color.r + "," + color.g +
                            "," + color.b + ")";
                    } else {
                        return "";
                    }
                });

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + x(0) + ",0)")
                //.attr("transform", "scale(" + 0.7 + ")")
                .call(yAxis);

            function type(d) {
                d.values = +d.values;
                return d;
            }
        }

        bc2(property, chart_container, fulldata);

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
            $("#topic-toxic").empty();

            var x, y, k;

            if (d && centered !== d) {
                var centroid = path.centroid(d);
                x = centroid[0] * 0.77;
                y = centroid[1] * 0.77;
                k = 4;
                centered = d;

                var state = id_name_map[d.id];

                bc2("toxic", "#topic-toxic", fulldata.filter(function (d) {
                    return d.state == state;
                }));
            } else {
                x = width / 2;
                y = height / 2;
                k = 1;
                centered = null;

                quantize = d3.scale.quantize()
                    .domain([0, 1.0])
                    .range(d3.range(COLOR_COUNTS).map(function (i) {
                        return i
                    }));

                bc2("toxic", "#topic-toxic", fulldata);
            }

            g.selectAll("path")
                .classed("active", centered && function (d) {
                    return d === centered;
                });

            g.transition()
                .duration(750)
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                .style("stroke-width", 1.5 / k + "px");
        };
    });
};

function initializeMaps(property_list, canvas_list, tooltip_con_list, values, colors, topics) {
    $.each(canvas_list, function (index, canvas) {
        initializeMap(property_list[index], topics[index], canvas, tooltip_con_list[index],
            values[index], colors[index]
        );
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
    initializeMaps(["toxic", "severe_toxic", "obscene", "threat",
            "insult", "identity_hate"],
        ["#canvas-svg-toxic", "#canvas-svg-severe", "#canvas-svg-obscene",
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

