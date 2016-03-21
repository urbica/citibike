mapboxgl.accessToken = 'pk.eyJ1IjoidXJiaWNhIiwiYSI6ImNpamFhZXNkOTAwMnp2bGtxOTFvMTNnNjYifQ.jUuvgnxQCuUBUpJ_k7xtkQ';

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
    routes_layers = ['r_line_1', 'r_line_2', 'r_line_3', 'l_line_1', 'l_line_2', 'l_line_3'],
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
  d3.select("#handle-one").html(dt);
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
        timeFormatter(Math.round(value));
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

  d3.select("#handle-one").text('Total');
}

  function changeMode(mode) {

    console.log(mode);
    var line_filters = {}, stations_filters = {}, slice, slice_st, sliceRate, stationRate, citibike_id;

    console.log('prev:' + mode.id + ' set: ' + currentMode.id);

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
      sliceRate = 0.15;
      slice_st = 't' + mode.slice;
    }

    if(mode.feature) {
      citibike_id = mode.feature.properties.citibike_id;
      stationRate = 0.5;
    } else {
      stationRate = 1;
    }


    line_filters = {
        l_line_1: ["all",[">",slice,0],["<",slice,700*sliceRate*stationRate]],
        l_line_2: ["all",[">=",slice,700*sliceRate*stationRate],["<",slice,1200*sliceRate*stationRate]],
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


    if(citibike_id) {
      line_filters['l_line_1'].push(["==", "startid", citibike_id]);
      line_filters['l_line_2'].push(["==", "startid", citibike_id]);
      line_filters['l_line_3'].push(["==", "startid", citibike_id]);
      line_filters['r_line_1'].push(["==", "endid", citibike_id]);
      line_filters['r_line_2'].push(["==", "endid", citibike_id]);
      line_filters['r_line_3'].push(["==", "endid", citibike_id]);

      /*
      stations_filters['av_20'].push(["==", "citibike_id", citibike_id]);
      stations_filters['av_50'].push(["==", "citibike_id", citibike_id]);
      stations_filters['av_80'].push(["==", "citibike_id", citibike_id]);
      stations_filters['av_100'].push(["==", "citibike_id", citibike_id]);
      */

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



    //setting the currentMode
    currentMode = mode;

  if(mode.feature) {
    getPanel(mode.feature);
    panel.style("display", "block");
  } else {
    panel.style("display", "none");
  }

}

function getPanel(feature) {
  panelHeader.text('#' + feature.properties.citibike_id + ': '+ feature.properties.label)
  console.log(feature.properties);
  panelContentParams.html('Outgoing trips:&nbsp;'+ feature.properties.outgoing_trips + '<br/>Incoming balancing:&nbsp;' + feature.properties.incoming_balancing);
  getGraph(panelContentGraph, feature);

}
