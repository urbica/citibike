
ogr2ogr -f "ESRI Shapefile" trips_200_shp.shp PG:"host=localhost user=karma dbname=citibike" -sql "SELECT * FROM trips_geom WHERE total > 200 and startid != endid"


ogr2ogr -f "ESRI Shapefile" balanced_200_shp.shp PG:"host=localhost user=karma dbname=citibike" -sql "SELECT * FROM balanced_geom WHERE total > 20 and startid != endid"
