mapboxgl.accessToken = 'pk.eyJ1IjoidXJiaWNhIiwiYSI6ImNpamFhZXNkOTAwMnp2bGtxOTFvMTNnNjYifQ.jUuvgnxQCuUBUpJ_k7xtkQ';

var start = { z: 12.5, center: [-73.991226,40.740523], bearing: -61, maxZoom: 17, minZoom: 11 },
    master, left, right,
    masterStyle, leftStyle, rightStyle,
    masterArea = d3.select("#masterArea"),
    compareArea = d3.select("#compareArea"),
    panel = d3.select("#panel"),
    panelHeader = d3.select("#panelHeader"),
    panelContent = d3.select("#panelContent"),
    interval, sliding,
    isCursor;

var modes = {
  total: { id: "total" },
  hours: { id: "hours", slice: 'h0' },
  station: { id: "station", citibike_id: 0, feature: {} },
  direction: { id: "hours", startid: 0, endid: 0 }
  };

var currentMode = { id: "total" }, //init mode
    prevMode = currentMode;


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

//  leftStyle = processStyle(masterStyle,'r_');
//  rightStyle = processStyle(masterStyle,'l_');
//  loadCompare();


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
             changeMode({id: 'station', citibike_id: citibike_id },feature);
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
      .min(0).max(23).step(1)
      .on("slide", function(evt, value) {
        timeFormatter(Math.round(value));
        if(!sliding) {
          sliding = true;
          interval = setInterval(function () {
              if(value<0) {
                changeMode({id: 'total'});
              } else {
                changeMode({id: 'hours', slice: 'h'+value});
              }



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
        if(value>0) changeMode({id: 'hours', slice: 'h'+Math.random(value)});
          else changeMode({id: 'total'});
      })
  );

  d3.select("#handle-one").text('Total');


}

function processStyle(style, hide) {
  //style;
  var out = JSON.parse(JSON.stringify(style)); //bad bad hack;
  out.name = hide + 'style';
  out.layers.forEach(function(l,i) {
    if (l.id.substr(0,2) === hide) {
      //console.log(l);
      l.layout.visibility = 'none';
    }
  });
  return out;
};

  function changeMode(mode,feature) {

    console.log(mode);
    var line_filters = {}, slice, citibike_id;

    //currentMode = mode;

    console.log(slice);

    if(mode.id == 'total') {
      line_filters = {
        l_line_1: ["all",["<","total",1000]],
        l_line_2: ["all",[">=","total",1000],["<","total",1500]],
        l_line_3: ["all",[">=","total",1500]],
        r_line_1: ["all",["<","total",100]],
        r_line_2: ["all",[">=","total",100],["<","total",150]],
        r_line_3: ["all",[">=","total",150]]
      };
    }

    if(mode.id == 'hours') {
      slice = mode.slice;

      modes['hours'] = mode; //setting the current slice

      line_filters = {
        l_line_1: ["all",["<", slice,50]],
        l_line_2: ["all",[">=",slice,50],["<",slice,100]],
        l_line_3: ["all",[">=",slice,100]],
        r_line_1: ["all",["<",slice,20]],
        r_line_2: ["all",[">=",slice,20],["<",slice,50]],
        r_line_3: ["all",[">=",slice,50]]
        }
    }

    if(mode.id == 'station') {
      slice = "total";
      citibike_id = mode.citibike_id;
      console.log(mode);
      line_filters = {
        l_line_1: ["all",["==", "startid",0]],
        l_line_2: ["all",["<",slice,700],["==", "startid",citibike_id]],
        l_line_3: ["all",[">=",slice,700],["==", "startid",citibike_id]],
        r_line_1: ["all",["==", "startid",0]],
        r_line_2: ["all",["<",slice,70],["==", "startid",citibike_id]],
        r_line_3: ["all",[">=",slice,70],["==", "startid",citibike_id]]
      }

      master.setLayoutProperty("s_stations_selection", "visibility", "visible");
      master.setFilter("s_stations_selection", ["all",["==", "citibike_id",citibike_id]]);

    }

    //apply
    if(master && line_filters) {
      master.batch(function (batch) {
        for(lf in line_filters) {
            batch.setFilter(lf, line_filters[lf]);
      }
    });
    }

    //setting the currentMode
    prevMode = currentMode;
    currentMode = mode;

  if(feature) {
    getPanel(feature);
    panel.style("display", "block");
  } else {
    panel.style("display", "none");
  }

}

function getPanel(feature) {
  panelHeader.text(feature.properties.label)
  panelContent.text('content');


}
