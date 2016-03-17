mapboxgl.accessToken = 'pk.eyJ1IjoidXJiaWNhIiwiYSI6ImNpamFhZXNkOTAwMnp2bGtxOTFvMTNnNjYifQ.jUuvgnxQCuUBUpJ_k7xtkQ';

var start = { z: 12.5, center: [-73.991226,40.740523], bearing: -61, maxZoom: 17, minZoom: 11 },
    master, left, right,
    masterStyle, leftStyle, rightStyle,
    masterArea = d3.select("#masterArea"),
    compareArea = d3.select("#compareArea"),
    panel = d3.select("#panel"),
    panelHeader = d3.select("#panelHeader"),
    panelContent = d3.select("#panelContent"),
    panelContentParams = d3.select("#panelContentParams"),
    panelContentGraphs = d3.select("#panelContentGraphs"),
    panelClose = d3.select("#panelClose"),
    interval, sliding,
    isCursor;


var currentMode = { id: "total", slice: -1 }; //init mode


function timeFormatter(t) {
  var dt;
  if(t < 0) dt = 'Total';
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
    changeMode({id: 'total', slice: currentMode.slice});
  });

  //draw slider
  getSlider();

  //start application
  changeMode(currentMode);

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
             changeMode({id: 'station', slice: currentMode.slice, feature: feature });
           } else {
             changeMode({id: 'total', slice: currentMode.slice});
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
                changeMode({id: currentMode.id, slice: Math.round(value), feature: (currentMode.id == 'station') ? currentMode.feature : false });
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
          changeMode({id: currentMode.id, slice: Math.round(value), feature: (currentMode.id == 'station') ? currentMode.feature : false });
      })
  );

  d3.select("#handle-one").text('Total');
}

  function changeMode(mode) {

    console.log(mode);
    var line_filters = {}, stations_filters = {}, slice, slice_st, sliceRate, citibike_id;

    //currentMode = mode;

    if(mode.slice < 0) {
      slice = 'total';
      sliceRate = 1;
      slice_st = 't_av';

    } else {
      slice = 'h' + mode.slice;
      sliceRate = 0.15;
      slice_st = 't' + mode.slice;
    }


    line_filters = {
        l_line_1: ["all",[">",slice,0],["<",slice,700*sliceRate]],
        l_line_2: ["all",[">=",slice,700*sliceRate],["<",slice,1200*sliceRate]],
        l_line_3: ["all",[">=",slice,1500*sliceRate]],
        r_line_1: ["all",[">",slice,0],["<",slice,70*sliceRate]],
        r_line_2: ["all",[">=",slice,70*sliceRate],["<",slice,120*sliceRate]],
        r_line_3: ["all",[">=",slice,120*sliceRate]]
      };

    stations_filters = {
      av_20: ["all",[">=",slice_st,0.1],["<",slice_st,0.35]],
      av_50: ["all",[">=",slice_st,0.35],["<",slice_st,0.65]],
      av_80: ["all",[">=",slice_st,0.65],["<",slice_st,0.9]],
      av_100: ["all",[">=",slice_st,0.9]]
    }

    console.log(stations_filters);



    if(mode.id == 'station') {
      citibike_id = mode.feature.properties.citibike_id;
      var stationRate = 0.3;
      line_filters = {
          l_line_1: ["all",["<",slice,500*sliceRate*stationRate], ["==", "startid",citibike_id]],
          l_line_2: ["all",[">=",slice,500*sliceRate*stationRate],["<","total",1000*sliceRate*stationRate], ["==", "startid",citibike_id]],
          l_line_3: ["all",[">=",slice,1000*sliceRate*stationRate], ["==", "startid",citibike_id]],
          r_line_1: ["all",["<",slice,50*sliceRate*stationRate], ["==", "endid",citibike_id]],
          r_line_2: ["all",[">=",slice,50*sliceRate*stationRate],["<","total",100*sliceRate*stationRate], ["==", "endid",citibike_id]],
          r_line_3: ["all",[">=",slice,100*sliceRate*stationRate], ["==", "endid",citibike_id]]
        };



      master.setLayoutProperty("s_stations_selection", "visibility", "visible");
      master.setFilter("s_stations_selection", ["all",["==", "citibike_id",citibike_id]]);
    } else {
      master.setLayoutProperty("s_stations_selection", "visibility", "none");
    }

    //apply
    if(master && line_filters) {
      master.batch(function (batch) {
        for(lf in line_filters) {
            batch.setFilter(lf, line_filters[lf]);
        }
        for(st in stations_filters) {
          batch.setFilter(st, stations_filters[st]);
          console.log(st + ': ' + JSON.stringify(stations_filters[st]));
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
  panelContentParams.html('<span class="trips">Outgoing trips:&nbsp;'+ feature.properties.outgoing_trips + '</span>&nbsp;&nbsp;<span class="balanced">' + feature.properties.incoming_balancing + '</span>');


}
