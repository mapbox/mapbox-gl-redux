@mapbox/mapbox-gl-redux
---

Tools for building Redux applications with Mapbox GL JS

[![Build Status](https://travis-ci.com/mapbox/mapbox-gl-redux.svg?token=YkkMPyN1R9p9yTUwpzb5&branch=master)](https://travis-ci.com/mapbox/mapbox-gl-redux)

---

Add middleware to your Redux store and a control to your Mapbox GL JS map to
sync your application state with the map's internally managed state, while
maintaining clean one-way data-flow.

## API

- `ReduxMapControl`: Add this to the Mapbox GL JS map. It subscribes to map
events and dispatches corresponding Redux actions.
- `mapMiddleware`: Add this to the Redux store. When `MapActionCreators`
are used, mapMiddleware will translate those actions into method invocations on
the map.
- `MapActionCreators`: Use these to programmatically change the map's state.
- `bindMapActionCreators`: Returns a set of `MapActionCreators` scoped to a
specific map.
- `MapActionTypes`: Use these in your reducer to identify actions triggered by
map events.

## Usage

Let's say you have a button to zoom out and a display of the map's zoom level.
When you click the zoom out button, the data flow will look like this:

- A click handler invokes `MapActionCreators.zoomOut()` to create a zoomOut
action.
- `mapMiddleware` detects the zoomOut action and tells the map to zoom out.
- While the map zooms, it fires 'zoom' events that `ReduxMapControl` converts
to actions.
- Your reducer hears of these 'zoom' actions and updates the displayed zoom
level accordingly.

So: `UI -> click -> action -> map -> map event -> action -> reducer -> UI`

The `MapActionCreators` correspond to Mapbox GL JS methods, with a few special 
cases. You can use them with the same function signature documented for the GL 
JS methods.

The `MapActionTypes` correspond to Mapbox GL JS events, with a few special 
cases. Actions of these types will include the following properties:

- `map`: Use this to gather information about the map, e.g. on 
`MapActionTypes.zoom`. You probably want to update your zoom state with the 
value from `map.getZoom()`.
- `mapId`: You'll want to ignore the action if it doesn't pertain to your map.
- `event`: The Mapbox GL JS map event type.
- `eventData`: The Mapbox GL JS map event data.
- `type`: The action type.

### `MapActionCreators`

These action creators correspond directly with Mapbox GL JS methods:

- `setCenter`
- `panBy`
- `panTo`
- `setZoom`
- `zoomTo`
- `zoomOut`
- `zoomIn`
- `setBearing`
- `rotateTo`
- `resetNorth`
- `snapToNorth`
- `setPitch`
- `fitBounds`
- `jumpTo`
- `flyTo`
- `easeTo`
- `stop`

### Special actions

There are a few special action creators that do not directly correspond to
Mapbox GL JS map methods.

#### `sync`

Dispatch a `MapActionCreators.sync(`) action at any time to give your reducer 
an opportunity to sync up with map state.

When the middleware detects this action it dispatches a `MapActionTypes.sync`
action that you can use in your reducer.

#### `setShowCollisionBoxes`

Dispatch `MapActionCreators.setShowCollisionBoxes(true)` to turn on collision 
boxes, or `MapActionCreators.setShowCollisionBoxes(false)` to turn them off.

After the middleware has adjusted the map's setting, it dispatches a 
`MapActionTypes.setShowCollisionBoxes` action that you can use in your reducer.

#### `setShowTileBoundaries`

Dispatch `MapActionCreators.setShowTileBoundaries(true)` to turn on collision 
boxes, or `MapActionCreators.setShowTileBoundaries(false)` to turn them off.

After the middleware has adjusted the map's setting, it dispatches a 
`MapActionTypes.setShowTileBoundaries` action that you can use in your reducer.


### `MapActionTypes`

These action types correspond directly with Mapbox GL JS events:

- `move`
- `movestart`
- `moveend`
- `zoom`
- `zoomstart`
- `zoomend`
- `rotate`
- `rotatestart`
- `rotateend`
- `pitch`

These ones correspond with the special action creators described above:

- `sync`
- `setShowTileBoundaries`
- `setShowCollisionBoxes`
