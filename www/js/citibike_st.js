const stationsData = [];
const sortModes = ['outgoing_trips', 'incoming_balancing', 't_av'];
const fields = [
  'balancing_rate',
  'cluster',
  'incoming_balancing',
  'incoming_trips',
  'outgoing_balancing',
  'outgoing_trips',
  'roundtrips',
  'roundtrips_rate',
  't0',
  't1',
  't2',
  't3',
  't4',
  't5',
  't6',
  't7',
  't8',
  't9',
  't10',
  't11',
  't12',
  't13',
  't14',
  't15',
  't16',
  't17',
  't18',
  't19',
  't20',
  't21',
  't22',
  't23',
  't_av',
  'trips_rate',
  'latitude',
  'longitude'
];

const stationsList = d3.select('#stations-list');

d3.select('#outgoing_trips').on('click', (e) => {
  changeSortOrder('outgoing_trips');
});
d3.select('#incoming_balancing').on('click', (e) => {
  changeSortOrder('incoming_balancing');
});
d3.select('#availability').on('click', (e) => {
  changeSortOrder('availability');
});

function importStations(data) {
  // process
  data.forEach((s) => {
    fields.forEach((f) => {
      s[f] = +s[f];
    });
    s.availability = +s.t_av;
    stationsData.push(s);
  });

  changeSortOrder('outgoing_trips');
}

function changeSortOrder(sortMode) {
  sortModes.forEach((sm) => {
    d3.select(`#${sm}`).attr('class', 'sort-mode');
  });

  d3.select(`#${sortMode}`).attr('class', 'sort-mode-selected');

  getStationList(sortMode);
}

function getStationList(sortBy) {
  stationsList.text('');

  // sort
  stationsData.sort((a, b) => b[sortBy] - a[sortBy]);

  stationsData.forEach((sd) => {
    let value = sd[sortBy];
    const item = stationsList.append('div').attr('class', 'item');

    if (sortBy == 'availability') value = Math.round(sd[sortBy] * 100) / 100;
    item
      .append('div')
      .text(value)
      .attr('class', 'item-value');
    //      item.append('div').text(sd[sortBy]).attr("class", "item-graph");
    item
      .append('div')
      .text(sd.citibike_id)
      .attr('class', 'item-id');
    item
      .append('div')
      .text(sd.label)
      .attr('class', 'item-name');
    item.on('click', (e) => {
      /*
      master.featuresAt([sd.longitude,sd.latitude], {radius: 10}, function (err, features) {
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
      */
    });
  });
}

d3.tsv('data/stations_stats.csv', importStations);
