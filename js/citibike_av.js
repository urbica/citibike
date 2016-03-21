var data = [];
var colors = ['#eeeeee', '#DD00FF', '#FF5500', '#00DDCC'];

var tooltip = d3.select("#tooltip");



var xAxis = d3.svg.axis()
    .scale(24)
    .tickValues([1, 2, 3, 5, 8, 13, 21]);




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

  function getGraph(container, feature) {

      container.text('');

      var svg = container.append("svg").attr("width", 220).attr("height", 100);
      console.log(feature);

        var f = feature.properties.citibike_id;
        if(data[f]) {
          svg.append("svg:path")
            .attr("fill", "none")
            .style("stroke", colors[data[f].c])
            .style("opacity", 0.7)
            .style("stroke-width", 2)
            .attr("id", "p" + f)
            .attr("d", function() {
              return line(data[f].h) })
        }

  }
