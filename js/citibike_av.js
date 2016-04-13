var dataAvailability = [], dataTrips = [], dataTripsIn = [], dataBalancing = [];
var colors = ['#eeeeee', '#DD00FF', '#FF5500', '#00DDCC'];


var tooltip = d3.select("#tooltip");
var offsetX = 30,
    offsetY = 15,
    height = 80,
    step = 10;


var x = d3.time.scale.utc()
    .range([0, 230])
    .domain([new Date('2015-01-01T00:00:00.000Z'), new Date('2015-01-02T00:00:00.000Z')]),

    yAvailability = d3.scale.linear()
    .range([height, 0])
    .domain([0,100]),

    xAxis = d3.svg.axis()
    .scale(x)
    .ticks(d3.time.hour, 6),

    yAxisAvailabilityR = d3.svg.axis()
    .scale(yAvailability)
    .ticks(2)
    .orient("right"),

    yAxisAvailabilityL = d3.svg.axis()
    .scale(yAvailability)
    .ticks(2)
    .orient("left");

var line = d3.svg.line()
      .x(function(d,i) {
        return i*10; })
      .y(function(d,i) { return (height - d*height); })
      .interpolate("basis");

d3.csv('data/open_matrix.csv', function(csv) {
  csv.forEach(function(r) {
    //import data
    var h = [];
    for(i = 0; i < 24; i++) {
      h.push(Math.round(+r[i]*1000)/1000);
    }
    dataAvailability[r.sid] = {
      c: +r.cluster,
      h: h,
      id: +r.sid
    };
  });
});

d3.csv('data/outgoing_mean.csv', function(csv) {
  csv.forEach(function(r) {
    //import data
    var h = [];
    for(i = 0; i < 24; i++) {
      h.push((r[i] !== 'NA') ? +r[i] : 0);
    }
    dataTrips[r.sid] = {
      h: h,
      id: +r.sid
    };
  });
});

d3.csv('data/incoming_mean.csv', function(csv) {
  csv.forEach(function(r) {
    //import data
    var h = [];
    for(i = 0; i < 24; i++) {
      h.push((r[i] !== 'NA') ? +r[i] : 0);
    }
    dataTripsIn[r.sid] = {
      h: h,
      id: +r.sid
    };
  });
});

d3.csv('data/mean_rb.csv', function(csv) {
  csv.forEach(function(r) {
    //import data
    var h = [];
    for(i = 0; i < 24; i++) {
      h.push((r[i] !== 'NA') ? +r[i] : 0);
    }
    dataBalancing[r.sid] = {
      h: h,
      id: +r.sid
    };
  });
});



  function getAvailabilityGraph(container, f) {

      container.append("div").text("Average availability over 24-hours");

      var svg = container.append("svg").attr("width", offsetX*2+step*23).attr("height", (height+offsetY*2+10));


        if(dataAvailability[f]) {
          svg.append("g")
            .append("svg:path")
            .attr("fill", "none")
            .style("stroke", "#fff")
            .style("opacity", 0.7)
            .style("stroke-width", 2)
            .attr("id", "p" + f)
            .attr("transform", "translate(" + offsetX + "," + offsetY + ")")
            .attr("d", function() {
              return line(dataAvailability[f].h) });

          svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + offsetX + ", "+ (offsetY+height) +")")
            .call(xAxis);


          svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate("+ offsetX + "," + offsetY + ")")
            .call(yAxisAvailabilityL);

          svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate("+ (offsetX+step*23) + "," + offsetY + ")")
            .call(yAxisAvailabilityR);
        }
  }

  function getRoutesGraph(container, f) {

      if(dataTrips[f]) {

      container.append("div").text("Trips vs. rebalanced bicycles (x10) per hour");
      var svg = container.append("svg").attr("width", offsetX*2+step*23).attr("height", height+(offsetY*2+10));

      var maxTrips = (d3.max(dataTrips[f].h) > d3.max(dataTripsIn[f].h)) ? d3.max(dataTrips[f].h) : d3.max(dataTripsIn[f].h),
          maxBalancing = d3.max(dataBalancing[f].h),
          max = (maxTrips >= maxBalancing*10) ? maxTrips : maxBalancing*10;

      var yTrips = d3.scale.linear()
      .range([height, 0])
      .domain([0,max]),

      yBalancing = d3.scale.linear()
      .range([height, 0])
      .domain([0,max/10]),

      yAxisTrips = d3.svg.axis()
      .scale(yTrips)
      .ticks(4)
      .orient("left"),

      yAxisBalancing = d3.svg.axis()
      .scale(yBalancing)
      .ticks(4)
      .orient("right"),

      lineTrips = d3.svg.line()
        .x(function(d,i) {
          return i*step; })
        .y(function(d,i) { return (height - height*(d/max)); })
        .interpolate("basis"),

      lineBalancing = d3.svg.line()
        .x(function(d,i) {
          return i*step; })
        .y(function(d,i) { return (height - height*((d*10)/max)); })
        .interpolate("basis");

      svg.append("g")
            .append("svg:path")
            .attr("fill", "none")
            .style("stroke", "#0cf")
            .style("opacity", 0.7)
            .style("stroke-width", 2)
            .attr("id", "p" + f)
            .attr("transform", "translate(" + offsetX + "," + offsetY+ ")")
            .attr("d", function() {
              return lineTrips(dataTrips[f].h) });

      if(dataTripsIn[f]) {
      svg.append("g")
            .append("svg:path")
            .attr("fill", "none")
            .style("stroke", "#f0f")
            .style("opacity", 0.7)
            .style("stroke-width", 2)
            .attr("id", "p" + f)
            .attr("transform", "translate(" + offsetX + "," + offsetY+ ")")
            .attr("d", function() {
            return lineTrips(dataTripsIn[f].h) });
      }

      svg.append("g")
            .append("svg:path")
            .attr("fill", "none")
            .style("stroke", "#f50")
            .style("opacity", 0.7)
            .style("stroke-width", 2)
            .attr("id", "p" + f)
            .attr("transform", "translate(" + offsetX + "," + offsetY + ")")
            .attr("d", function() {
            return lineBalancing(dataBalancing[f].h) });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + offsetX + ", "+ (offsetY+height) +")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis-trips")
            .attr("transform", "translate("+ offsetX + "," + offsetY + ")")
            .call(yAxisTrips);

        svg.append("g")
            .attr("class", "y axis-balancing")
            .attr("transform", "translate("+ (offsetX+step*23) + "," + offsetY + ")")
            .call(yAxisBalancing);

      }
  }
