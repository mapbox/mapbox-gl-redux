import EventEmitter from 'eventemitter3';
import * as MapboxGLRedux from './src/';

// These lists should correspond to the lists in the source code
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
  'stop',
  'setProjection'
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
  'pitch',
  'load'
];

describe('MapboxGLRedux', () => {
  describe('API', () => {
    test('only exposes known stuff', () => {
      expect(Object.keys(MapboxGLRedux).length).toBe(5);
    });

    test('exposes all the stuff we want exposed', () => {
      expect(MapboxGLRedux.ReduxMapControl).toBeTruthy();
      expect(MapboxGLRedux.mapMiddleware).toBeTruthy();
      expect(MapboxGLRedux.MapActionCreators).toBeTruthy();
      expect(MapboxGLRedux.bindMapActionCreators).toBeTruthy();
      expect(MapboxGLRedux.MapActionTypes).toBeTruthy();
    });
  });

  describe('MapboxGLRedux.MapActionTypes', () => {
    test('are correct', () => {
      expect(MapboxGLRedux.MapActionTypes).toEqual({
        move: 'mapbox-move',
        movestart: 'mapbox-movestart',
        moveend: 'mapbox-moveend',
        zoom: 'mapbox-zoom',
        zoomstart: 'mapbox-zoomstart',
        zoomend: 'mapbox-zoomend',
        rotate: 'mapbox-rotate',
        rotatestart: 'mapbox-rotatestart',
        rotateend: 'mapbox-rotateend',
        pitch: 'mapbox-pitch',
        load: 'mapbox-load',
        sync: 'mapbox-sync',
        setShowCollisionBoxes: 'mapbox-setShowCollisionBoxes',
        setShowTileBoundaries: 'mapbox-setShowTileBoundaries',
        setShowOverdrawInspector: 'mapbox-setShowOverdrawInspector'
      });
    });
  });

  describe('MapboxGLRedux.MapActionCreators', () => {
    test('are the right ones', () => {
      expect(Object.keys(MapboxGLRedux.MapActionCreators).length).toBe(22);
    });

    // They all do the same thing, so can all be tested with the same assertion,
    // really
    Object.keys(MapboxGLRedux.MapActionCreators).forEach(actionCreatorName => {
      const actionCreator = MapboxGLRedux.MapActionCreators[actionCreatorName];
      test(`${actionCreatorName} works`, () => {
        expect(actionCreator('foo', 1, 2, 3)).toEqual({
          mapId: 'foo',
          args: [1, 2, 3],
          type: `internal-mapbox-${actionCreatorName}`
        });
      });
    });
  });

  describe('MapboxGLRedux.bindMapActionCreators', () => {
    const boundMapActionCreators = MapboxGLRedux.bindMapActionCreators(
      'walkawalka'
    );

    Object.keys(boundMapActionCreators).forEach(actionCreatorName => {
      const actionCreator = boundMapActionCreators[actionCreatorName];
      test(`${actionCreatorName} works`, () => {
        expect(actionCreator(1, 2, 3)).toEqual({
          mapId: 'walkawalka',
          args: [1, 2, 3],
          type: `internal-mapbox-${actionCreatorName}`
        });
      });
    });
  });

  describe('MapboxGLRedux.ReduxMapControl', () => {
    let mockMap;
    let control;
    let mockMapOnSpy;
    let mockMapOffSpy;

    beforeEach(() => {
      control = new MapboxGLRedux.ReduxMapControl('choo');
      mockMap = new EventEmitter();
      mockMapOnSpy = jest.spyOn(mockMap, 'on');
      mockMapOffSpy = jest.spyOn(mockMap, 'off');
    });

    test('exposes bound MapActionCreators', () => {
      const actionCreators = control.MapActionCreators;
      expect(actionCreators.zoomTo(7)).toEqual({
        mapId: 'choo',
        args: [7],
        type: 'internal-mapbox-zoomTo'
      });
    });

    test('exposes onAdd and onRemove methods for GL JS Control interface', () => {
      expect(typeof control.onAdd).toBe('function');
      expect(typeof control.onRemove).toBe('function');
    });

    describe('adds listeners when added to map', () => {
      beforeEach(() => {
        control.onAdd(mockMap);
      });

      test('the correct number', () => {
        expect(mockMapOnSpy).toHaveBeenCalledTimes(mapEvents.length);
      });

      mapEvents.forEach(eventType => {
        test(`adds listener for event ${eventType}`, () => {
          const listenerAdded = mockMapOnSpy.mock.calls.find(call => {
            return call[0] === eventType;
          });
          expect(listenerAdded).toBeTruthy();
        });
      });
    });

    describe('adds listeners that dispatch actions', () => {
      let dispatchSpy;

      beforeEach(() => {
        dispatchSpy = jest.fn();
        // Register dispatch by invoking the middleware
        MapboxGLRedux.mapMiddleware({ dispatch: dispatchSpy });
        control.onAdd(mockMap);
      });

      mapEvents.forEach(eventType => {
        test(`dispatches when event ${eventType} fires`, () => {
          mockMap.emit(eventType, { foo: 'bar' });
          const dispatchCall = dispatchSpy.mock.calls.find(call => {
            return call[0].event === eventType;
          });

          expect(dispatchCall).toBeTruthy();
          expect(dispatchCall[0]).toEqual({
            map: mockMap,
            mapId: 'choo',
            eventData: { foo: 'bar' },
            event: eventType,
            type: `mapbox-${eventType}`
          });
        });
      });
    });

    describe('removes listeners when removed from map', () => {
      beforeEach(() => {
        control.onAdd(mockMap);
        control.onRemove(mockMap);
      });

      test('the correct number', () => {
        expect(mockMapOnSpy).toHaveBeenCalledTimes(mapEvents.length);
      });

      mapEvents.forEach(eventType => {
        test(`removes listener for event ${eventType}`, () => {
          const listenerAdded = mockMapOffSpy.mock.calls.find(call => {
            return call[0] === eventType;
          });
          expect(listenerAdded).toBeTruthy();
        });
      });
    });
  });

  describe('MapboxGLRedux.mapMiddleware', () => {
    let dispatchSpy = jest.fn();
    let nextSpy = jest.fn();
    let actionReceiver;
    let mockMap;

    beforeEach(() => {
      // Register a map
      mockMap = new EventEmitter();
      const control = new MapboxGLRedux.ReduxMapControl('pie');
      control.onAdd(mockMap);

      mockMap.showCollisionBoxes = false;
      mockMap.showTileBoundaries = false;
      mapMethods.forEach(methodName => {
        mockMap[methodName] = jest.fn();
      });

      dispatchSpy.mockClear();
      nextSpy.mockClear();

      actionReceiver = MapboxGLRedux.mapMiddleware({ dispatch: dispatchSpy })(
        nextSpy
      );
    });

    test('does nothing if mapId does not match registered map', () => {
      const action = { mapId: 'choo' };
      actionReceiver(action);
      expect(dispatchSpy.mock.calls.length).toBe(0);
      mapMethods.forEach(methodName => {
        expect(mockMap[methodName]).toHaveBeenCalledTimes(0);
      });
      expect(nextSpy.mock.calls.length).toBe(1);
      expect(nextSpy.mock.calls[0]).toEqual([action]);
    });

    describe('real map methods', () => {
      mapMethods.forEach(methodName => {
        describe(methodName, () => {
          const action = {
            mapId: 'pie',
            type: `internal-mapbox-${methodName}`,
            args: [1, 2, 3]
          };

          beforeEach(() => {
            actionReceiver(action);
          });

          test('does not dispatch', () => {
            expect(dispatchSpy.mock.calls.length).toBe(0);
          });

          test('invokes method on map with args', () => {
            expect(mockMap[methodName]).toHaveBeenCalledTimes(1);
            expect(mockMap[methodName].mock.calls[0]).toEqual([1, 2, 3]);
          });

          test('passes action along', () => {
            expect(nextSpy).toHaveBeenCalledTimes(1);
            expect(nextSpy.mock.calls[0]).toEqual([action]);
          });
        });
      });
    });

    describe('special cases', () => {
      test('dispatches sync action', () => {
        const action = {
          mapId: 'pie',
          type: 'internal-mapbox-sync',
          foo: 'bar'
        };

        actionReceiver(action);
        expect(dispatchSpy.mock.calls.length).toBe(1);
        expect(dispatchSpy.mock.calls[0]).toEqual([
          {
            map: mockMap,
            mapId: 'pie',
            type: 'mapbox-sync'
          }
        ]);
        expect(nextSpy).toHaveBeenCalledWith(action);
      });

      test('dispatches showCollisionBoxes action and changes map', () => {
        const action = {
          mapId: 'pie',
          type: 'internal-mapbox-setShowCollisionBoxes',
          foo: 'bar',
          args: [true]
        };

        actionReceiver(action);
        expect(dispatchSpy.mock.calls.length).toBe(1);
        expect(dispatchSpy.mock.calls[0]).toEqual([
          {
            map: mockMap,
            mapId: 'pie',
            type: 'mapbox-setShowCollisionBoxes'
          }
        ]);
        expect(mockMap.showCollisionBoxes).toBe(true);
        expect(nextSpy).toHaveBeenCalledWith(action);
      });

      test('dispatches showTileBoundaries action and changes map', () => {
        const action = {
          mapId: 'pie',
          type: 'internal-mapbox-setShowTileBoundaries',
          foo: 'bar',
          args: [true]
        };

        actionReceiver(action);
        expect(dispatchSpy.mock.calls.length).toBe(1);
        expect(dispatchSpy.mock.calls[0]).toEqual([
          {
            map: mockMap,
            mapId: 'pie',
            type: 'mapbox-setShowTileBoundaries'
          }
        ]);
        expect(mockMap.showTileBoundaries).toBe(true);
        expect(nextSpy).toHaveBeenCalledWith(action);
      });

      test('dispatches showOverdrawInspector action and changes map', () => {
        const action = {
          mapId: 'pie',
          type: 'internal-mapbox-setShowOverdrawInspector',
          foo: 'bar',
          args: [true]
        };

        actionReceiver(action);
        expect(dispatchSpy.mock.calls.length).toBe(1);
        expect(dispatchSpy.mock.calls[0]).toEqual([
          {
            map: mockMap,
            mapId: 'pie',
            type: 'mapbox-setShowOverdrawInspector'
          }
        ]);
        expect(mockMap.showOverdrawInspector).toBe(true);
        expect(nextSpy).toHaveBeenCalledWith(action);
      });
    });
  });
});
