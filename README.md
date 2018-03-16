# Add support for Valhalla Turn-by-Turn routing in Leaflet Routing Machine

Valhalla Turn-by-Turn is an open-source routing service with dynamic run-time costing that lets you integrate automobile, bicycle, pedestrian, or multimodal navigation into a web or mobile application.

Use this plug-in to create a Leaflet map that has a route line between map locations (also known as waypoints), a text narrative of maneuvers to perform on the route, distances along your route and estimated travel times, and the ability to drag the route start and endpoints to get a different path.

With lrm-valhalla, Valhalla Turn-by-Turn is substituted for the default routing service used in Leaflet Routing Machine. You need to install the lrm-valhalla plug-in and run your own Valhalla Routing Engine [github.com/valhalla/valhalla](https://github.com/valhalla/valhalla).

## Get started with lrm-valhalla

[Download lrm-valhalla](http://tpp.pt/resources/lrm-valhalla.zip) and insert a reference to the JavaScript file into your page right after the line where it loads Leaflet Routing Machine:

```html
[...]
<script src="leaflet-routing-machine.js"></script>
<script src="lrm-valhalla.js"></script>
[...]
```

Also, include the stylesheet. This can replace the default `leaflet-routing-machine.css` provided by LRM, since the Mapzen plug-in includes its own styles and icons.

```html
<link rel="stylesheet" href="leaflet.routing.valhalla.css">
```

Insert the  routing options object to at least include the costing mode (`auto`, `bicycle`, `pedestrian`, or `multimodal`). Note that no additional options are needed for `formatter`.

```js
var map = L.map('map');

L.Routing.control({
  router: L.Routing.valhalla( {
    costing:'auto'
  }),
  formatter: new L.Routing.valhallaFormatter()
}).addTo(map);
```

If you want to include additional costing options to help define the the route and estimated time along the path, you can pass a costing option object as one of router parameters. You can also include options for directions in order to change the language, distance units or narrative guidance production. See the [Valhalla Turn-by-Turn API documentation](https://github.com/valhalla/valhalla-docs/blob/master/turn-by-turn/api-reference.md) for more information on the available options.

```js
L.Routing.control({
  router: L.Routing.valhalla( {
    costing: "bicycle",
    costing_options: {
      bicycle: {
        bicycle_type: "Road",
        cycling_speed: "17.0",
        use_roads: "0.1"
      },
    },
    directions_options: {
      language: 'en-US'
    }
  }),
  formatter: new L.Routing.valhallaFormatter(),
}).addTo(map);
```

With the`multimodal` costing mode, you can set costing options for preferences for taking buses or rail lines or having to make transfers. If you include a `date_time`, you can request a transit route departing at a certain time, for example. See the [Valhalla Turn-by-Turn API documentation](https://github.com/valhalla/valhalla-docs/blob/master/turn-by-turn/api-reference.md) for more information on the available options.

```js
L.Routing.control({
  router: L.Routing.valhalla( {
    // you need to pass valhallaLine as routeLine to router to see subroutes of transit routing.
    // you can skip routeLine if you don't want to use subroutes.
    routeLine: function (route, options) { return L.Routing.valhallaLine(route, options); },
    costing: "multimodal",
    date_time: {
      type: 1,
      value: "2016-05-10T08:00"
    }
  }),
  formatter: new L.Routing.valhallaFormatter(),
}).addTo(map);
```

See the [Leaflet Routing Machine documentation](http://www.liedman.net/leaflet-routing-machine/tutorials/) and [Valhalla Turn-by-Turn API documentation](https://github.com/valhalla/valhalla-docs/blob/master/turn-by-turn/api-reference.md) for more information on the available options.

## Run a local example

If you want to run your lrm-valhalla plug-in locally for testing and development purposes:

- [Download the contents of the lrm-valhalla repo](https://github.com/Rui-Santos/tpp-lrm-valhalla/archive/master.zip)
- Choose the transportation/costing mode (`auto`, `bicycle`, `multimodal` or `pedestrian`)
- Start a local web server (such as `python -m SimpleHTTPServer` or the local server you prefer)
- Go to `http://localhost:8000/examples` in your browser (all assets needed to run lrm-Valhalla are in the `/examples` folder)
