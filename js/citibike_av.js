var data = [];
var colors = ['#eeeeee', '#DD00FF', '#FF5500', '#00DDCC'];

var tooltip = d3.select("#tooltip");



var x = d3.time.scale.utc()
    .range([0, 230])
    .domain([new Date('2015-01-01T00:00:00.000Z'), new Date('2015-01-02T00:00:00.000Z')]);

var y = d3.scale.linear()
    .range([100, 0])
    .domain([0,100]);

var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(d3.time.hour, 6);
var yAxis = d3.svg.axis()
    .scale(y)
    .ticks(2)
    .orient("right");


var line = d3.svg.line()
      .x(function(d,i) {
        return i*10; })
      .y(function(d,i) { return (100 - d*100); })
      .interpolate("basis");

d3.csv('data/open_matrix.csv', function(csv) {
  csv.forEach(function(r) {
    //import data
    var h = [];
    for(i = 0; i < 24; i++) {
      h.push(Math.round(+r[i]*1000)/1000);
    }
    data[r.sid] = {
      c: +r.cluster,
      h: h,
      id: +r.sid
    };
  });

});

  function getGraph(container, feature, colored) {

      container.text('');

      container.append("div").text("Stations availability each hour");

      var svg = container.append("svg").attr("width", 260).attr("height", 130);
      console.log(feature);



        var f = feature.properties.citibike_id;
        if(data[f]) {
          svg.append("g")
            .append("svg:path")
            .attr("fill", "none")
            .style("stroke", function() {
              if(colored) return colors[data[f].c];
                else return colors[0];
            })
            .style("opacity", 0.7)
            .style("stroke-width", 2)
            .attr("id", "p" + f)
            .attr("transform", "translate(0,10)")
            .attr("d", function() {
              return line(data[f].h) });

          svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0,110)")
            .call(xAxis);

          svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(230,10)")
            .call(yAxis);

        }

  }
