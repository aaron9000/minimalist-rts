var PathConsts = function(){
    return {
        ArcLengthIterations: 3,
        TangentSamples: 3,
        MinCurvature: 0.25,
        LengthEstimationSteps: 3,
        PathSpeed: 0.005,
        PathScale: 160,
        PathLength: 16
    };
}();

function Path () {
    this.getBezierPos = function (dt, update){
        dt = MathUtil.clamp(dt, 0, 1);

        //find our t and index
        var currIndex = this.index;
        var currT = this.t + dt;
        if (currT > 1){
            currT -= 1;
            currIndex++;
            if (currIndex >= this.points.length){
                currIndex = 0;
            }
        }

        //get the 4 nodes we are working with
        var nodeIndices = [];
        var nodes = [];
        var index = 0;
        for (var i = 0; i < 4; i++){
            index = _findOffsetIndex(this.points, currIndex, i);
            nodeIndices[i] = index;
            nodes[i] = this.points[index];
        }

        //blend the 4 control points
        var pos = _blend(nodes[0], nodes[1], nodes[2], nodes[3], currT);
        if (update){
            this.pos = pos;
            this.t = currT;
            this.index = currIndex;
        }
        return pos;
    };

    this.getNextPosWithSpeed = function(speed){
        speed = Math.max(speed, 0.00001);

        var idealDt = (speed / (this.spacing * PathConsts.LengthEstimationSteps));
        var idealStepDistance = (speed / PathConsts.LengthEstimationSteps);

        //test estimated dt
        var oldPos = this.getBezierPos(0, false);
        var testPos = this.getBezierPos(idealDt, false);
        var testDist = MathUtil.distV(testPos, oldPos);

        //refine dt estimate
        idealDt = idealDt / (testDist / idealStepDistance);

        //iteratively find the distance
        var dtAccum = 0;
        var distAccum = 0;

        //walk along path
        var i = 0;
        var steps = PathConsts.LengthEstimationSteps * 3;
        for (i = 0; i < steps; i++){
            //get points
            if (i !== 0) {
                oldPos = testPos;
                testPos = this.getBezierPos(dtAccum, false);
                testDist = MathUtil.distV(testPos, oldPos);
            } else {
                testPos = oldPos;
                testDist = 0.0;
            }

            //increment and test
            distAccum += testDist;
            if (distAccum > speed){
                return this.getBezierPos(dtAccum, true);
            }else{
                dtAccum += idealDt;
            }
        }

        return oldPos;
    };
    this.reset = function(){
        this.t = 0;
        this.index = 0;
        this.frame = 0;
    };

    this.cleanup = function(){
        //we no longer needs references to these arrays
        delete this.arcLengths;
        delete this.points;
        delete this.tangentPoints;
        delete this.tangents;
        delete this.curvatures;
    };
    this.setup = function(){
        //default properties
        this.arcLengths = [];
        this.tangentPoints = [];
        this.points = [];
        this.tangents = [];
        this.curvatures = [];
        this.cachedPoints = [];
        this.index = 0;
        this.t = 0;
        this.pos = {x : 0, y : 0};
        this.spacing = 1;

        //scatter points around the origin
        this.points = _scatteredPoints(PathConsts.PathLength, this.spacing);

        //verlet the points a bit
        _verletArray(this.points, this.spacing, 3);

        //rearrange order of control points to maximize the amount of "curviness"
        _curvySort(this.points);

        //add connecting point
        _addConnectingPoint(this.points);
    };

    this.findTangentPointsAndArcLengths = function(){
        var done = false;
        var pastZero = false;
        var dt = 1.0 / PathConsts.TangentSamples;

        //make sure first point is initialized
        this.getNextPosWithSpeed(0.00001, true);

        while (!done){
            //find arclength and next position
            var arcLength = 0;
            for (var i = 0; i < PathConsts.ArcLengthIterations; i++){
                var lastPos = this.pos;
                var pos = this.getBezierPos(dt / PathConsts.ArcLengthIterations, true);
                arcLength += MathUtil.distV(lastPos, pos);
            }
            this.tangentPoints.push(this.pos);
            this.arcLengths.push(arcLength);

            if (this.index > 0){
                pastZero = true;
            }
            if (this.index === 0 && pastZero){
                done = true;
            }
        }

        //reset
        this.reset();
    };

    this.findTangents = function(){
        //build tangents
        var len = this.tangentPoints.length;
        for (var i = 0; i < len; i++){

            //tangent from current to next
            var iPrev = _findOffsetIndex(this.tangentPoints, i, -1);
            var prev = this.tangentPoints[iPrev];
            var curr = this.tangentPoints[i];
            var dir = MathUtil.subV(curr, prev);
            dir = MathUtil.unitV(dir);
            this.tangents.push(dir);
        }
    };

    this.findCurvatures = function(){
        var len = this.arcLengths.length;
        var max = 0;
        var min = 10000;
        var avg = 0;
        var i = 0;
        for (i = 0; i < len; i++) {
        //approximate curvature based on arc length
        var curvature = this.arcLengths[i];
        this.curvatures.push(curvature);

        //find max / min / avg for normalization
        max = Math.max(curvature, max);
        min = Math.min(curvature, min);
        avg += curvature;
        }
        avg = avg / len;

        //find std deviation
        var stdDev = _standardDeviation(this.curvatures, avg);

        //clamp max / min curvature to avg +/- stdDev
        var floor = avg - stdDev;
        var ceiling = avg + stdDev;
        max = MathUtil.clamp(max, floor, ceiling);
        min = MathUtil.clamp(min, floor, ceiling);
        var delta = max - min;
        for (i = 0; i < len; i++) {
            //normalize curvature to [0, 1]
            var c = this.curvatures[i];
            c = (c - min) / delta;
            c = MathUtil.clamp(c, 0, 1);
            this.curvatures[i] = c;
        }
    };

    this.cachePath = function(){
        var done = false;
        var pastZero = false;

        while (!done){

            //figure out which tangent points we are using based on index and t
            var decimalIndex = (this.index * PathConsts.TangentSamples) + this.t * PathConsts.TangentSamples;
            var currIndex = (this.index * PathConsts.TangentSamples) + Math.floor(this.t * PathConsts.TangentSamples);
            var nextIndex = _findOffsetIndex(this.tangentPoints, currIndex, 1);
            var remainder = decimalIndex - currIndex;

            //interpolate curvature
            var currCurv = this.curvatures[currIndex];
            var nextCurv = this.curvatures[nextIndex];
            var curvature = MathUtil.lerp(currCurv, nextCurv, remainder);

            //get next speed based on curvature
            var ratio = MathUtil.clamp(Math.sqrt(curvature), PathConsts.MinCurvature, 1);
            var pos = this.getNextPosWithSpeed(PathConsts.PathSpeed * ratio);
            pos = MathUtil.multV(pos, PathConsts.PathScale);
            this.cachedPoints.push(pos);
            if (this.index > 0){
                pastZero = true;
            }
            if (this.index === 0 && pastZero){
                done = true;
            }
        }
    };

    //init
    this.setup();
    this.findTangentPointsAndArcLengths();
    this.findTangents();
    this.findCurvatures();
    this.cachePath();
    this.cleanup();
}

//Helper methods
function _findOffsetIndex (array, index, offset){
    var len = array.length;
    index += offset;
    while(index < 0) {
        index += len;
    }
    return index % len;
}

function _standardDeviation (samples, avg){
    var len = samples.length;
    var sumSquared = 0;
    for (var i = 0; i < len; i++) {
        var dif = samples[i] - avg;
        sumSquared += dif * dif;
    }
    sumSquared = sumSquared / len;
    return Math.sqrt(sumSquared);
}

function _verletArray(array, spacing, iterations){
    MathUtil.randomizeArray(array);
    var len = array.length;
    for (var z = 0; z < iterations; z++){
        for (var k = 0; k < len; k++){
            var n0 = array[k];
            for (var j = k + 1; j < len; j++){
                var n1 = array[j];
                MathUtil.verlet(n0, n1, spacing);
            }
        }
    }
}

function _addConnectingPoint(array){
    if (!array || array.length <= 4){
        Util.error("PathFactory: addConnectingPoint: bad array");
        return;
    }
    var len = array.length;
    var first = array[0];
    var second = array[1];
    var firstDir = MathUtil.unitV(MathUtil.subV(second, first));
    var last = array[len - 1];
    var secondToLast = array[len - 2];
    var lastDir = MathUtil.unitV(MathUtil.subV(last, secondToLast));
    array.push(_findPoint(first, firstDir, last, lastDir));
}

function _scatteredPoints(numPoints, radius){
    var array = [];
    for (var k = 0; k < numPoints; k++){
        var randDir = MathUtil.multV(MathUtil.randUnitV(), Math.random() * radius);
        array[k] = randDir;
    }
    return array;
}

function _findPoint(first, firstDir, last, lastDir){
    var c = MathUtil.midpointV(first, last);
    for (var i = 0; i < 20; i++){
        var dist = MathUtil.distV(first, last) * 1.1;
        var rand = MathUtil.multV(MathUtil.randUnitV(), Math.random() * dist);
        var testPoint = MathUtil.addV(c, rand);
        var dirToStart = MathUtil.unitV(MathUtil.subV(first, testPoint));
        var dirFromEnd = MathUtil.unitV(MathUtil.subV(testPoint, last));
        if (MathUtil.dotV(dirToStart, first) > 0 && MathUtil.dotV(dirFromEnd, lastDir) > 0){
            return testPoint;
        }
    }
    return c;
}

function _curvySort(array){
    //greedy improvement
    var len = array.length;
    var openList = [];
    var greedyList = [];
    for (var k = 0; k < len; k++){
        var point = array[k];
        if (k < 2){
            greedyList.push(point);
        }else{
            openList.push(point);
        }
    }

    //find lowest positive dot product
    var lastPoint = array[1];
    var lastDir = MathUtil.unitV(MathUtil.subV(array[1], array[0]));
    var done = false;
    var p = {x : 0, y : 0};
    var dir = 0;
    while (!done){
        var worst = {x : 0, y : 0};
        var worstDot = 1;
        var worstIndex = -1;
        len = openList.length;
        for (var pIndex = 0; pIndex < len; pIndex++){
            p = openList[pIndex];
            dir = MathUtil.unitV(MathUtil.subV(p, lastPoint));
            var dot = MathUtil.dotV(dir, lastDir);
            if (dot > 0){
                if (dot < worstDot){
                    worst = p;
                    worstDot = dot;
                    worstIndex = pIndex;
                }
            }
            //last point?
            if (pIndex == openList.length - 1){
                break;
            }
        }
        //did we find a point with a positive dot product?
        if (worstIndex >= 0){
            p = worst;
            dir = MathUtil.unitV(MathUtil.subV(p, lastPoint));
        }
        lastDir = dir;
        lastPoint = p;
        greedyList.push(openList[openList.length - 1]);
        openList.pop();
        if (openList.length === 0){
            done = true;
        }
    }
}

function _blend(x0, x1, x2, x3, t){
	var u = 1 - t;
	var t2 = t * t;
	var u2 = u * u;
	var u3 = u2 * u;
	var t3 = t2 * t;

	var b0 = u3 / 6;
	var b1 = (3 * t3 - 6 * t2 + 4) / 6;
	var b2 = (-3 * t3 + 3 * t2 + 3 * t + 1) / 6;
	var b3 = t3 / 6.0;

	var p0 = MathUtil.multV(x0, b0);
	var p1 = MathUtil.multV(x1, b1);
	var p2 = MathUtil.multV(x2, b2);
	var p3 = MathUtil.multV(x3, b3);

	var ret = { x: p0.x + p1.x + p2.x + p3.x,
                y : p0.y + p1.y + p2.y + p3.y };
	return ret;
}

//factory methods
function PathFactory(){}
PathFactory.prototype.pathClass = Path;
PathFactory.prototype.create = function () {
    return new this.pathClass();
};