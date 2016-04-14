mapboxgl.accessToken = 'pk.eyJ1IjoidXJiaWNhIiwiYSI6ImNpbWppN3h3bzAwMWF3aGttdHNuYmtqN2YifQ.EuxNp68ghSVgWPDqokNCPQ';


var start = { z: 12.2, center: [-73.991226,40.740523], bearing: -61, maxZoom: 17, minZoom: 11 },
    master, left, right,
    masterStyle, leftStyle, rightStyle,
    masterArea = d3.select("#master-area"),
    compareArea = d3.select("#compare-area"),
    panel = d3.select("#panel"),
    panelHeader = d3.select("#panel-header"),
    panelContent = d3.select("#panel-content"),
    panelContentParams = d3.select("#panel-content-params"),
    panelContentGraph = d3.select("#panel-content-graphs"),
    panelClose = d3.select("#panel-close"),
    routesControl = d3.select("#mode-routes"),
    stationsControl = d3.select("#mode-stations"),
    about = d3.select("#about"),
    fade = d3.select("#fade"),
    interval, sliding,
    isCursor,
    routes_layers = ['r_line_1', 'r_line_2', 'r_line_3', 'l_line_1', 'l_line_2', 'l_line_3', 'in_line_1', 'in_line_2', 'in_line_3'],
    stations_layers = ['av_bg', 'av_border_1', 'av_border_2', 'av_border_3', 'av_20', 'av_50', 'av_80', 'av_100'];

var currentMode = { id: "routes", slice: -1 };  //init mode

d3.select('#about-map-button').on('click', function() {
  d3.select('#about').style('display', 'none');
});

d3.select('#about-close').on('click', function() {
  d3.select('#about').style('display', 'none');
});

d3.select('#about').on('click', function() {
  d3.select('#about').style('display', 'none');
});

d3.select('#about-link').on('click', function() {
  d3.select('#about').style('display', 'block');
});




function timeFormatter(t) {
  var dt;
  if(t < 0) dt = 'Average';
  if(t == 0) dt = '12&nbsp;AM';
  if(t > 0 && t < 12) dt = t + '&nbsp;AM';
  if(t == 12) dt = '12&nbsp;PM';
  if(t > 12) dt = (t-12) + '&nbsp;PM';
  return dt;
}

master = new mapboxgl.Map({
    container: 'master',
    style: 'mapbox://styles/urbica/cilqsmyom006zf7m0d1idotot',
    center: start.center,
    zoom: start.z,
    maxZoom: start.maxZoom,
    minZoom: start.minZoom,
    bearing: start.bearing
}).on('load', function(e) {
  masterStyle = e.target.getStyle();
  //make all layers un-intercative
  masterStyle.layers.forEach(function(l) {
    if (l.id.substr(0,2) === 'r_' || l.id.substr(0,2) === 'l_')
      l['interactive'] = true;
      else l['interactive'] = false;
  });

  panelClose.on('click', function() {
    changeMode({id: currentMode.id, slice: currentMode.slice});
  });

  //draw slider
  getSlider();

  routesControl.on('click', function() { changeMode({id: 'routes', slice: currentMode.slice, feature: currentMode.feature ? currentMode.feature : false })});
  stationsControl.on('click', function() { changeMode({id: 'stations', slice: currentMode.slice, feature: currentMode.feature ? currentMode.feature : false })});

  //start application
  changeMode({ id: "routes", slice: -1 });

})
.on('click', function(e) {
  console.log(e.point);
       master.featuresAt(e.point, {radius: 10}, function (err, features) {
           if (err) throw err;
           //filling features array
           var citibike_id, feature;
           features.forEach(function(f,i) {
             if(f.layer.id.substr(0,2) === 's_') {
               citibike_id = f.properties.citibike_id;
               feature = f;
             }
           });
           if(citibike_id) {
             changeMode({id: currentMode.id, slice: currentMode.slice, feature: feature });
           } else {
             changeMode({id: currentMode.id, slice: currentMode.slice});
           }
       });
})
.on('mousemove', function(e){
//
  master.featuresAt(e.point, {radius: 10}, function (err, features) {
    if (err) throw err;
    isCursor = false;
    //filling features array
    features.forEach(function(f,i) {
      if(f.layer.id.substr(0,2) === 's_') {
          isCursor = true;
      }
    });

    if(isCursor) {
      d3.select(".mapboxgl-canvas").style({
        cursor: "pointer"
      });
    } else {
      d3.select(".mapboxgl-canvas").style({
        cursor: "-webkit-grab"
      });
    }
  });


});

function getSlider() {

  d3.select('#slider').call(
    d3.slider()
      .min(-1).max(23).step(1)
      .on("slide", function(evt, value) {
        d3.select("#handle-one").html(timeFormatter(Math.round(value)));
        if(!sliding) {
          sliding = true;
          interval = setInterval(function () {
                changeMode({id: currentMode.id, slice: Math.round(value), feature: currentMode.feature ? currentMode.feature : false });
              clearInterval(interval);
              sliding = false;
          }, 500);

        } else {
          //clearInterval(interval);
        }
      })
      .on("slideend", function(evt, value) {
        sliding = false;
        clearInterval(interval);
          changeMode({id: currentMode.id, slice: Math.round(value), feature: currentMode.feature ? currentMode.feature : false });
      })
  );

  d3.select("#handle-one").text('Average');
}

  function changeMode(mode) {


    var line_filters = {}, stations_filters = {}, slice, slice_st, sliceRate, stationRate, citibike_id;

    //managing legend
    d3.select("#legend-routes").style("display", (mode.id == 'routes') ? "block" : "none");
    d3.select("#legend-stations").style("display", (mode.id == 'stations') ? "block" : "none");

    //managing modes classes
    routesControl.attr("class", (mode.id == 'routes') ? "mode-selected" : "mode");
    stationsControl.attr("class", (mode.id == 'stations') ? "mode-selected" : "mode");


    if(mode.slice < 0) {
      slice = 'total';
      sliceRate = 1;
      slice_st = 't_av';
    } else {
      slice = 'h' + mode.slice;
      sliceRate = 0.12;
      slice_st = 't' + mode.slice;
    }

    if(mode.feature) {
      citibike_id = mode.feature.properties.citibike_id;
      stationRate = 0.5;
    } else {
      stationRate = 1;
    }

    d3.select('#line-incoming').style("display", citibike_id ? "block" : "none");

    line_filters = {
        in_line_1: ["all",[">",slice,0],["<",slice,800*sliceRate*stationRate]],
        in_line_2: ["all",[">=",slice,800*sliceRate*stationRate],["<",slice,1200*sliceRate*stationRate]],
        in_line_3: ["all",[">=",slice,1500*sliceRate*stationRate]],
        l_line_1: ["all",[">",slice,0],["<",slice,800*sliceRate*stationRate]],
        l_line_2: ["all",[">=",slice,800*sliceRate*stationRate],["<",slice,1200*sliceRate*stationRate]],
        l_line_3: ["all",[">=",slice,1500*sliceRate*stationRate]],
        r_line_1: ["all",[">",slice,0],["<",slice,70*sliceRate*stationRate]],
        r_line_2: ["all",[">=",slice,70*sliceRate*stationRate],["<",slice,120*sliceRate*stationRate]],
        r_line_3: ["all",[">=",slice,120*sliceRate*stationRate]]
      };

    stations_filters = {
      av_20: ["all",[">=",slice_st,0.1],["<",slice_st,0.30]],
      av_50: ["all",[">=",slice_st,0.3],["<",slice_st,0.6]],
      av_80: ["all",[">=",slice_st,0.6],["<",slice_st,0.9]],
      av_100: ["all",[">=",slice_st,0.9]]
    }

    console.log(line_filters);

    if(citibike_id) {

      line_filters['in_line_1'].push(["==", "endid", citibike_id]);
      line_filters['in_line_2'].push(["==", "endid", citibike_id]);
      line_filters['in_line_3'].push(["==", "endid", citibike_id]);

      line_filters['l_line_1'].push(["==", "startid", citibike_id]);
      line_filters['l_line_2'].push(["==", "startid", citibike_id]);
      line_filters['l_line_3'].push(["==", "startid", citibike_id]);
      line_filters['r_line_1'].push(["==", "endid", citibike_id]);
      line_filters['r_line_2'].push(["==", "endid", citibike_id]);
      line_filters['r_line_3'].push(["==", "endid", citibike_id]);

      stations_filters['s_selection'] = ["==", "citibike_id", citibike_id];
      stations_filters['s_selection_label'] = ["==", "citibike_id", citibike_id];

    } else {
      stations_filters['s_selection'] = ["==", "citibike_id", 0];
      stations_filters['s_selection_label'] = ["==", "citibike_id", 0];
      line_filters['in_line_1'].push(["==", "endid", 0]);
      line_filters['in_line_2'].push(["==", "endid", 0]);
      line_filters['in_line_3'].push(["==", "endid", 0]);
    }


    if(master) {

      master.batch(function (batch) {
        if(mode.id !== currentMode.id) {
            routes_layers.forEach(function (l) {
              if(mode.id == 'routes')
                batch.setLayoutProperty(l, "visibility", "visible");
                  else
                  batch.setLayoutProperty(l, "visibility", "none");
            });
            stations_layers.forEach(function (l) {
              if(mode.id == 'stations')
                batch.setLayoutProperty(l, "visibility", "visible");
                  else
                  batch.setLayoutProperty(l, "visibility", "none");
            });
        }

        for(lf in line_filters) {
            batch.setFilter(lf, line_filters[lf]);
        }
        for(st in stations_filters) {
          batch.setFilter(st, stations_filters[st]);
          // console.log(st + ': ' + JSON.stringify(stations_filters[st]));
        }
    });
    }



  if(mode.feature) {
    if(master.getZoom() <= 13 && !currentMode.feature) {
      master.flyTo({
        center: [mode.feature.properties.longitude,mode.feature.properties.latitude],
        zoom: 13,
        speed: 0.3
      });
    }
    getPanel(mode.feature, mode);
    panel.style("display", "block");
  } else {
    panel.style("display", "none");
  }

  //setting the currentMode
  currentMode = mode;
}

function getPanel(feature, mode) {


  if(mode.feature) updateParams(mode, feature);

  panelHeader.text('#' + feature.properties.citibike_id + ': '+ feature.properties.label)
  d3.select("#panel-params-trips-total-value").html(feature.properties.outgoing_trips + '&nbsp;/&nbsp;' + feature.properties.incoming_trips);
//  d3.select("#panel-params-trips-incoming-value").text(feature.properties.incoming_trips);
  d3.select("#panel-params-balancing-total-value").text(feature.properties.incoming_balancing);
  d3.select("#panel-params-docks-value").text(feature.properties.totaldocks);


  console.log(feature);

  panelContentGraph.text('');

  getAvailabilityGraph(d3.select("#panel-graph-availability"), feature.properties.citibike_id);
  getRoutesGraph(d3.select("#panel-graph-trips"), feature.properties.citibike_id);
}

function updateParams(mode,feature) {
  var availability, trips, balancing;

      if(mode.slice>=0) {
        availability = dataAvailability[feature.properties.citibike_id].h[mode.slice];
      } else {
        availability = d3.mean(dataAvailability[feature.properties.citibike_id].h);
      }
      availability = Math.round(availability*100) + '%';
      d3.select("#panel-params-availability-value").text(availability);

      if(mode.slice>=0) {
        trips = dataTrips[feature.properties.citibike_id].h[mode.slice];
      } else {
        trips = d3.mean(dataTrips[feature.properties.citibike_id].h);
      }
      trips = Math.round(trips*100)/100;
      d3.select("#panel-params-trips-value").text(trips);

      if(mode.slice>=0) {
        balancing = dataBalancing[feature.properties.citibike_id].h[mode.slice];
      } else {
        balancing = d3.mean(dataBalancing[feature.properties.citibike_id].h);
      }
      balancing = Math.round(balancing*100)/100;
      d3.select("#panel-params-balancing-value").text(balancing);

      d3.select("#time-trips").html(timeFormatter(mode.slice));
      d3.select("#time-balancing").html(timeFormatter(mode.slice));
      d3.select("#time-availability").html(timeFormatter(mode.slice));


}
