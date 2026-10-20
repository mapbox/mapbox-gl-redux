@mapbox/mapbox-gl-redux
---

Tools for building Redux applications with Mapbox GL JS

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

If you add a new map action creator or type, please also update the relevant tests and this README.

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
- `setProjection`

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
- `load`

These ones correspond with the special action creators described above:

- `sync`
- `setShowTileBoundaries`
- `setShowCollisionBoxes`

## Publishing

Pull Requests merged to `main` with conventional commit prefixes are automatically published to npm by the `NPM release` GitHub Actions workflow, as new major/minor/patch versions (`feat!:`/`feat:`/`fix:` respectively). When using "Squash and merge", ensure your PR title includes the conventional commit prefix; a `BREAKING CHANGE:` footer only counts if it ends up in the squash commit's body. Other prefixes (`chore:`, `docs:`, etc.) or no prefix don't trigger a release.

Examples:
- `fix: resolved issue with zoom actions` -> patch
- `feat: added setFog action creator` -> minor
- `feat!: renamed MapActionTypes` (requires consumer changes) -> major

The workflow publishes via [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC), so no npm token is needed. This requires an npm org admin to configure a trusted publisher for `@mapbox/mapbox-gl-redux` (GitHub Actions, workflow `npm-release.yml`, environment `npm-release`), and the `npm-release` GitHub Environment to exist in this repository. After publishing, the workflow creates a [GitHub Release](https://github.com/mapbox/mapbox-gl-redux/releases) with generated notes and comments the released version on the merged PRs.

`package.json`'s `version` may be incremented manually if needed (for example, to skip a minor version), but you shouldn't normally need to touch it; the published npm version, not `package.json`, is the source of truth for what gets released next.

### Pre-release versions on other branches

For testing in downstream projects, you can manually trigger the "NPM release" workflow on a branch to publish a pre-release tagged with the short commit sha (e.g. `0.3.0-aa79c6a`) under the npm `prerelease` dist-tag, without affecting `latest`. Check the workflow results for the published version.
