'use strict';

const mapMethods = [
  'setCenter',
  'panBy',
  'panTo',
  'setZoom',
  'zoomTo',
  'zoomOut',
  'zoomIn',
  'setBearing',
  'rotateTo',
  'resetNorth',
  'snapToNorth',
  'setPitch',
  'fitBounds',
  'jumpTo',
  'flyTo',
  'easeTo',
  'stop'
];

const mapEvents = [
  'move',
  'movestart',
  'moveend',
  'zoom',
  'zoomstart',
  'zoomend',
  'rotate',
  'rotatestart',
  'rotateend',
  'pitch'
];

const ACTION_TYPE_PREFIX = 'mapbox-';
const SYNC = 'sync';
const SET_SHOW_COLLISION_BOXES = 'setShowCollisionBoxes';
const SET_SHOW_TILE_BOUNDARIES = 'setShowTileBoundaries';
const SET_SHOW_OVERDRAW_INSPECTOR = 'setShowOverdrawInspector';

const specialCases = [
  SYNC,
  SET_SHOW_COLLISION_BOXES,
  SET_SHOW_TILE_BOUNDARIES,
  SET_SHOW_OVERDRAW_INSPECTOR
];

const prefixOutgoingActionType = actionType =>
  `${ACTION_TYPE_PREFIX}${actionType}`;
const prefixInternalActionType = actionType =>
  `internal-${ACTION_TYPE_PREFIX}${actionType}`;

const mapMethodsByInternalActionType = mapMethods.reduce((memo, mapMethod) => {
  return { ...memo, [prefixInternalActionType(mapMethod)]: mapMethod };
}, {});

export const MapActionTypes = mapEvents
  .concat(specialCases)
  .reduce((memo, mapEvent) => {
    return { ...memo, [mapEvent]: prefixOutgoingActionType(mapEvent) };
  }, {});

export const MapActionCreators = mapMethods
  .concat(specialCases)
  .reduce((memo, mapMethod) => {
    memo[mapMethod] = (mapId, ...args) => {
      return {
        mapId,
        args,
        type: prefixInternalActionType(mapMethod)
      };
    };
    return memo;
  }, {});

export function bindMapActionCreators(mapId) {
  const boundActionCreators = {};
  for (let mapMethod in MapActionCreators) {
    if (!MapActionCreators.hasOwnProperty(mapMethod)) continue;
    boundActionCreators[mapMethod] = MapActionCreators[mapMethod].bind(
      null,
      mapId
    );
  }
  return boundActionCreators;
}

const registeredMaps = {};

let registeredDispatch = () => {};

export class ReduxMapControl {
  constructor(mapId) {
    this.mapId = mapId;
    this.MapActionCreators = bindMapActionCreators(mapId);
    this._listeners = [];
    this.div = null;
  }

  onAdd(map) {
    const { mapId, _listeners } = this;
    registeredMaps[mapId] = map;
    this.map = map;

    mapEvents.forEach(mapEvent => {
      const listener = eventData => {
        registeredDispatch({
          map,
          mapId,
          eventData,
          event: mapEvent,
          type: prefixOutgoingActionType(mapEvent)
        });
      };
      map.on(mapEvent, listener);
      _listeners.push([mapEvent, listener]);
    });

    this.div = document.createElement('div');
    return this.div;
  }

  onRemove() {
    const { map, mapId, _listeners } = this;
    if (!map) return this;

    _listeners.forEach(([mapEvent, listener]) => {
      map.off(mapEvent, listener);
    });
    delete registeredMaps[mapId];

    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
    this.div = null;

    return this;
  }
}

const syncInternalActionType = prefixInternalActionType(SYNC);
const showCollisionBoxesInternalActionType = prefixInternalActionType(
  SET_SHOW_COLLISION_BOXES
);
const showTileBoundariesInternalActionType = prefixInternalActionType(
  SET_SHOW_TILE_BOUNDARIES
);
const showOverdrawInspectorInternalActionType = prefixInternalActionType(
  SET_SHOW_OVERDRAW_INSPECTOR
);

export function mapMiddleware({ dispatch }) {
  registeredDispatch = dispatch;

  return next => action => {
    const map = action.mapId && registeredMaps[action.mapId];
    if (!map) return next(action);

    switch (action.type) {
      case syncInternalActionType:
        registeredDispatch({
          map,
          mapId: action.mapId,
          type: prefixOutgoingActionType(SYNC)
        });
        break;
      case showCollisionBoxesInternalActionType:
        map.showCollisionBoxes = action.args[0];
        registeredDispatch({
          map,
          mapId: action.mapId,
          type: prefixOutgoingActionType(SET_SHOW_COLLISION_BOXES)
        });
        break;
      case showTileBoundariesInternalActionType:
        map.showTileBoundaries = action.args[0];
        registeredDispatch({
          map,
          mapId: action.mapId,
          type: prefixOutgoingActionType(SET_SHOW_TILE_BOUNDARIES)
        });
        break;
      case showOverdrawInspectorInternalActionType:
        map.showOverdrawInspector = action.args[0];
        registeredDispatch({
          map,
          mapId: action.mapId,
          type: prefixOutgoingActionType(SET_SHOW_OVERDRAW_INSPECTOR)
        });
        break;
      default:
        if (mapMethodsByInternalActionType[action.type]) {
          map[mapMethodsByInternalActionType[action.type]].apply(
            map,
            action.args
          );
        }
    }

    next(action);
  };
}
