var ObjectManager = function(){
	var _objectArray = [];
    var _objectsByLane = [];
    var _objectsToAdd = [];
    function _reset(){
        //teardown all objects
        var len = _objectArray.length;
        for (i = 0; i < len; i++){
            _objectArray[i].teardown();
        }

        //reset collections
        _objectsToAdd = [];
        _objectArray = [];
        _objectsByLane = [];
        for (var i = 0; i < GameConsts.Lanes; i++){
            _objectsByLane[i] = [];
        }
    }
	function _init(){
        _reset();
	}
	function _createObject(args){
        /*strip*/
        Util.assertObject(args);
        /*strip*/

		//create object
		var factory = new ObjectFactory();
		var newObject = factory.create(args);

		//add to pool
        _objectsToAdd.push(newObject);
		return newObject;
	}
	function _step(bufferContext, dt){
        /*strip*/
        Util.assertContext(bufferContext);
        Util.assertNumber(dt);
        /*strip*/

        //add newly created
        var len = _objectsToAdd.length;
        var objectToAdd = null;
        for (var i = 0; i < len; i++){
            objectToAdd = _objectsToAdd[i];
            _objectArray.push(objectToAdd);
            if (objectToAdd.lane >= 0){
                _objectsByLane[objectToAdd.lane].push(objectToAdd);
            }
        }
        if (_objectsToAdd.length > 0){
            //resort on z
            _objectArray.sort(function(a, b) { return b. z - a.z; });
        }
        _objectsToAdd = [];

		//update and render
        var newObjectArray = [];
        var newObjectsByLane = [];
        for (var k = 0; k < GameConsts.Lanes; k++){
            newObjectsByLane[k] = [];
        }
		var object = null;
		len = _objectArray.length;
        var postRenderedObjects = [];
		for (i = 0; i < len; i++){
			object = _objectArray[i];
			if (object.needsRemoval){
                object.teardown();
			}else{
                object.step(dt);
                object.render(bufferContext);
                newObjectArray.push(object);
                if (object.lane >= 0){
                    //add to indexed array
                    newObjectsByLane[object.lane].push(object);
                }
                if (typeof object.postRender === "function"){
                    postRenderedObjects.push(object);
                }
            }
		}

        //postrender
        len = postRenderedObjects.length;
        for (i = 0; i < len; i++){
            postRenderedObjects[i].postRender(bufferContext);
        }

        //consume new array
        _objectArray = newObjectArray;
        _objectsByLane = newObjectsByLane;
	}
    function _objectMatchesQuery(object, queryObject){
        /*strip*/
        Util.assertObject(object);
        Util.assertObject(queryObject);
        /*strip*/

        if (queryObject.side && (object.side !== queryObject.side)){
            return false;
        }
        if (queryObject.type && (object.type !== queryObject.type)){
            return false;
        }
        if (queryObject.within && queryObject.of){
            var dist = MathUtil.distV(queryObject.of, { x: object.x, y: object.y });
            if (dist > queryObject.within){
                return false;
            }
            object.queriedDistance = dist;
        }
        return true;
    }
    function _getObjects(queryObject){
        /*strip*/
        Util.assertObject(queryObject);
        /*strip*/

        var results = [];
        var object = null;
        var i, len;
        var laneIndexed = !isNaN(queryObject.lane);
        if (laneIndexed){
            var objectsInLane = _objectsByLane[queryObject.lane];
            len = objectsInLane.length;
            for (i = 0; i < len; i++){
                object = objectsInLane[i];
                if (_objectMatchesQuery(object, queryObject) === false){
                    continue;
                }
                results.push(object);
            }
        }else{
            len = _objectArray.length;
            for (i = 0; i < len; i++){
                object = _objectArray[i];
                if (_objectMatchesQuery(object, queryObject) === false){
                    continue;
                }
                results.push(object);
            }
        }
        return results;
    }
	return {
		step : _step,
		init : _init,
        reset : _reset,
        createObject : _createObject,
        getObjects : _getObjects
	};
}();