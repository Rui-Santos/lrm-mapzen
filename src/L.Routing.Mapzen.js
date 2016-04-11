(function() {
  'use strict';

  var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
  var corslite = require('corslite');
  var polyline = require('polyline');

  L.Routing = L.Routing || {};

  L.Routing.Mapzen = L.Class.extend({


    initialize: function(accessToken, transitmode, costingOptions, otherOptions, options) {
      L.Util.setOptions(this, options || {
        timeout: 30 * 1000
      });

      this._accessToken = accessToken;
      this._transitmode = transitmode;
      this._costingOptions = costingOptions;
      this._hints = {
        locations: {}
      };
    },

    route: function(waypoints, callback, context, options) {
      var timedOut = false,
        wps = [],
        url,
        timer,
        wp,
        i;

      options = options || {};
      //waypoints = options.waypoints || waypoints;
      url = this.buildRouteUrl(waypoints, options);


      timer = setTimeout(function() {
                timedOut = true;
                callback.call(context || callback, {
                  status: -1,
                  message: 'Time out.'
                });
              }, this.options.timeout);

      // Create a copy of the waypoints, since they
      // might otherwise be asynchronously modified while
      // the request is being processed.
      for (i = 0; i < waypoints.length; i++) {
        wp = waypoints[i];
        wps.push({
          latLng: wp.latLng,
          name: wp.name || "",
          options: wp.options || {}
        });
      }

      corslite(url, L.bind(function(err, resp) {
        var data;

        clearTimeout(timer);
        if (!timedOut) {
          if (!err) {
            data = JSON.parse(resp.responseText);
            this._routeDone(data, wps, callback, context);
          } else {
            console.log("Error : " + err.response);
            callback.call(context || callback, {
              status: err.status,
              message: err.response
            });
          }
        }
      }, this), true);

      return this;
    },

    _routeDone: function(response, inputWaypoints, callback, context) {

      var coordinates,
          alts,
          actualWaypoints,
          i;
      context = context || callback;
      if (response.trip.status !== 0) {
        callback.call(context, {
          status: response.status,
          message: response.status_message
        });
        return;
      }

      var insts = [];
      var coordinates = [];
      var shapeIndex =  0;

      for(var i = 0; i < response.trip.legs.length; i++){
        var coord = polyline.decode(response.trip.legs[i].shape, 6);

        for(var k = 0; k < coord.length; k++){
          coordinates.push(coord[k]);
        }

        for(var j =0; j < response.trip.legs[i].maneuvers.length; j++){
          var res = response.trip.legs[i].maneuvers[j];
          res.distance = response.trip.legs[i].maneuvers[j]["length"];
          res.index = shapeIndex + response.trip.legs[i].maneuvers[j]["begin_shape_index"];
          insts.push(res);
        }

        if(this._transitmode === 'multimodal') insts = this._unifyTransitManeuver(insts);

        shapeIndex += response.trip.legs[i].maneuvers[response.trip.legs[i].maneuvers.length-1]["begin_shape_index"];
      }

      actualWaypoints = this._toWaypoints(inputWaypoints, response.trip.locations);

      var subRoutes;
      if(this._transitmode == 'multimodal') subRoutes = this._getSubRoutes(response.trip.legs)

      alts = [{
        name: this._trimLocationKey(inputWaypoints[0].latLng) + " , " + this._trimLocationKey(inputWaypoints[1].latLng) ,
        unit: response.trip.units,
        transitmode: this._transitmode,
        coordinates: coordinates,
        subRoutes: subRoutes,
        instructions: insts,//response.route_instructions ? this._convertInstructions(response.route_instructions) : [],
        summary: response.trip.summary ? this._convertSummary(response.trip.summary) : [],
        inputWaypoints: inputWaypoints,
        waypoints: actualWaypoints,
        waypointIndices: this._clampIndices([0,response.trip.legs[0].maneuvers.length], coordinates)
      }];

      // only versions <4.5.0 will support this flag
        if (response.hint_data) {
          this._saveHintData(response.hint_data, inputWaypoints);
        }
      callback.call(context, null, alts);
    },

    _unifyTransitManeuver: function(insts) {

      var transitType;
      var newInsts = insts;

      for(var i = 0; i < newInsts.length; i++) {
        if(newInsts[i].type == 30) {
          transitType = newInsts[i].travel_type;
          break;
        }
      }

      for(var j = 0; j < newInsts.length; j++) {
        if(newInsts[j].type > 29) newInsts[j].edited_travel_type = transitType;
      }

      return newInsts;

    },

    _getSubRoutes: function(legs) {

      var subRoute = [];

      for (var i = 0; i < legs.length; i++) {

        var coord = polyline.decode(legs[i].shape, 6);

        var lastTravelType;
        var travelTypeChangingIncides = [];
        for(var j = 0; j < legs[i].maneuvers.length; j++){

          var res = legs[i].maneuvers[j];
          var travelType = res.travel_type;

          if(travelType !== lastTravelType && lastTravelType !== 'undefined' && travelType !=='undefined') {
            if(res.begin_shape_index > 0) travelTypeChangingIncides.push(res.begin_shape_index);
            if(res.transit_info) subRoute.push({ travle_type: travelType, styles: this._getTransitColor(res.transit_info.color) })
            else subRoute.push({travle_type: travelType})
          }
          lastTravelType = travelType;
        }

        travelTypeChangingIncides.push(coord.length);

        var y = 0;
        for(var z = 0; z < travelTypeChangingIncides.length; z++) {
          var subRouteArr = [];
          var overwrapping = 0;
          if(z !== travelTypeChangingIncides.length-1) overwrapping = 1;

          for(var x = y; x < travelTypeChangingIncides[z]+overwrapping; x++) {
            subRouteArr.push(coord[x]);
          }

          var sra = subRouteArr;
          y = travelTypeChangingIncides[z];
          subRoute[z].coordinates = sra;
        }
      }
      return subRoute;
    },

    _getTransitColor: function(intColor) {

      // isolate red, green, and blue components
      var red = (intColor >> 16) & 0xff,
          green = (intColor >> 8) & 0xff,
          blue = (intColor >> 0) & 0xff;

      // calculate luminance in YUV colorspace based on
      // https://en.wikipedia.org/wiki/YUV#Conversion_to.2Ffrom_RGB
      var lum = 0.299 * red + 0.587 * green + 0.114 * blue,
          is_light = (lum > 0xbb);

      // generate a CSS color string like 'RRGGBB'
      var paddedHex = 0x1000000 | (intColor & 0xffffff),
          lineColor = paddedHex.toString(16).substring(1, 7);

      var transitColor = [
              // Color of outline depending on luminance against background.
              (is_light ? {color: '#000', opacity: 0.4, weight: 10}
                        : {color: '#fff', opacity: 0.8, weight: 10}),

              // Color of this transit line.
              {color: '#'+lineColor.toUpperCase(), opacity: 1, weight: 6}
            ]

      return transitColor;
   },


    _saveHintData: function(hintData, waypoints) {
      var loc;
      this._hints = {
        checksum: hintData.checksum,
        locations: {}
      };
      for (var i = hintData.locations.length - 1; i >= 0; i--) {
        loc = waypoints[i].latLng;
        this._hints.locations[this._locationKey(loc)] = hintData.locations[i];
      }
    },

    _toWaypoints: function(inputWaypoints, vias) {
      var wps = [],
          i;
      for (i = 0; i < vias.length; i++) {
        wps.push(L.Routing.waypoint(L.latLng([vias[i]["lat"],vias[i]["lon"]]),
                                    "name",
                                    {}));
      }

      return wps;
    },
    ///mapzen example
    buildRouteUrl: function(waypoints, options) {
      var serviceUrl = 'https://valhalla.mapzen.com'
      var locs = [],
          locationKey,
          hint;

      var costingOptions = this._costingOptions;

      for (var i = 0; i < waypoints.length; i++) {
        var loc;
        locationKey = this._locationKey(waypoints[i].latLng).split(',');
        if(i === 0 || i === waypoints.length-1){
          loc = {
            lat: parseFloat(locationKey[0]),
            lon: parseFloat(locationKey[1]),
            type: "break"
          }
        }else{
          loc = {
            lat: parseFloat(locationKey[0]),
            lon: parseFloat(locationKey[1]),
            type: "through"
          }
        }
        locs.push(loc);
      }

      var params = JSON.stringify({
        locations: locs,
        costing: this._transitmode,
        costing_options: costingOptions
      });

      return serviceUrl + '/route?json=' +
              params + '&api_key=' + this._accessToken;
    },

    _locationKey: function(location) {
      return location.lat + ',' + location.lng;
    },

    _trimLocationKey: function(location){
      var lat = location.lat;
      var lng = location.lng;

      var nameLat = Math.floor(location.lat * 1000)/1000;
      var nameLng = Math.floor(location.lng * 1000)/1000;

      return nameLat + ' , ' + nameLng;

    },

    _convertSummary: function(route) {
      return {
        totalDistance: route.length,
        totalTime: route.time
      };
    },

    _convertInstructions: function(instructions) {
      var result = [],
          i,
          instr,
          type,
          driveDir;

      for (i = 0; i < instructions.length; i++) {
        instr = instructions[i];
        type = this._drivingDirectionType(instr[0]);
        driveDir = instr[0].split('-');
        if (type) {
          result.push({
            type: type,
            distance: instr[2],
            time: instr[4],
            road: instr[1],
            direction: instr[6],
            exit: driveDir.length > 1 ? driveDir[1] : undefined,
            index: instr[3]
          });
        }
      }
      return result;
    },

    _clampIndices: function(indices, coords) {
      var maxCoordIndex = coords.length - 1,
        i;
      for (i = 0; i < indices.length; i++) {
        indices[i] = Math.min(maxCoordIndex, Math.max(indices[i], 0));
      }
    }
  });

  L.Routing.mapzen = function(accessToken, transitmode, options) {
    return new L.Routing.Mapzen(accessToken, transitmode, options);
  };

  module.exports = L.Routing.Mapzen;
})();