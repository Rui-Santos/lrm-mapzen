var L = require('leaflet');
var ValhallaRouter = require('./valhallaRouter');
var ValhallaLine = require('./valhallaLine');
var ValhallaFormatter = require('./valhallaFormatter');
var ValhallaWaypoint = require('./valhallaWaypoint');

L.Routing = L.Routing || {};
L.routing = L.routing || {};

L.Routing.Valhalla = ValhallaRouter;
L.Routing.ValhallaLine = ValhallaLine;
L.Routing.ValhallaFormatter = ValhallaFormatter;
L.Routing.ValhallaWaypoint = ValhallaWaypoint;


L.routing.valhalla = function(key, options) {
  return new ValhallaRouter(key, options);
}

L.routing.valhallaLine = function(route, options) {
  return new ValhallaLine(route, options);
}

L.routing.valhallaFormatter = function(options) {
  return new ValhallaFormatter(options);
}

L.routing.valhallaWaypoint = function(latLng, name, options) {
  return new ValhallaWaypoint(latLng, name, options);
}

// deperecate these parts later

L.Routing.valhalla = L.routing.valhalla;
L.Routing.valhallaLine = L.routing.valhallaLine;
L.Routing.valhallaFormatter = L.routing.valhallaFormatter;
L.Routing.valhallaWaypoint = L.routing.valhallaWaypoint;
