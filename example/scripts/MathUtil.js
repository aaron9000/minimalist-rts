var MathConsts = function (){
    return {
        RadToDeg : 180.0 / Math.PI,
        DegToRad : Math.PI / 180.0,
        Small : 0.00001,
        Large : 100000.0
    };
}();
var MathUtil = function () {

    // Clamp rotation value [-PI - PI]
    function _clampRotation(r){
        var twoPi = Math.PI * 2;
        var newR = r % twoPi;
        if (newR > Math.PI){
            newR -= twoPi;
        }
        if (newR < -Math.PI){
            newR += twoPi;
        }
        return newR;
    }

    // Rotation Difference +/- [0 - PI]
    function _rotationDifference(a, b){
        /*strip*/
        Util.assertNumber(a);
        Util.assertNumber(b);
        /*strip*/

        a = _clampRotation(a);
        b = _clampRotation(b);
        var difference = a - b;
        return _clampRotation(difference);
    }

    // Vector dot product.
    function _dotV(a, b) {
        return (a.x * b.x + a.y * b.y);
    }

    // Vector addition
    function _addV(a, b) {
        return {
            x:a.x + b.x,
            y:a.y + b.y
        };
    }

    // Vector subtraction
    function _subV(a, b) {
        return {
            x:a.x - b.x,
            y:a.y - b.y
        };
    }

    // Vector projection a->b
    function _projV(a, b) {
        var dp = _dotV(a, b);
        return {
            x:( dp / (b.x * b.x + b.y * b.y) ) * b.x,
            y:( dp / (b.x * b.x + b.y * b.y) ) * b.y
        };
    }

    // Random 2d Vector
    function _randomV(){
        var angle = Math.random() * Math.PI * 2;
        return {x: Math.sin(angle), y: Math.cos(angle)};
    }

    // Vector normal
    function _normV(a) {
        return {
            x:-1 * a.y,
            y:a.x
        };
    }

    // Vector multiplication
    function _multV(a, b) {
        return {
            x:a.x * b,
            y:a.y * b
        };
    }

    // Distance between 2 points
    function _distV(a, b) {
        return Math.sqrt(((b.x - a.x) * (b.x - a.x)) + ((b.y - a.y) * (b.y - a.y)));
    }

    // Find unit vector of a
    function _unitV(a) {
        var mag = Math.sqrt((a.x * a.x) + (a.y * a.y));
        if (mag === 0) {
            return {x:1, y:1 };
        }
        return {x:a.x / mag, y:a.y / mag};
    }

    // Magnitude of vector
    function _magV(a) {
        var mag = Math.sqrt((a.x * a.x) + (a.y * a.y));
        return mag;
    }

    // Vector cross product
    function _crossV(a, b) {
        return (a.x * b.y) - (a.y * b.x);
    }

    // Finds intersecting point of 2 line segments
    function _areIntersecting(a, b) {
        var s1_x, s1_y, s2_x, s2_y;
        s1_x = a.x2 - a.x;
        s1_y = a.y2 - a.y;
        s2_x = b.x2 - b.x;
        s2_y = b.y2 - b.y;

        var s, t;
        s = (-s1_y * (a.x - b.x) + s1_x * (a.y - b.y)) / (-s2_x * s1_y + s1_x * s2_y);
        t = ( s2_x * (a.y - b.y) - s2_y * (a.x - b.x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            return { x:a.x + (t * s1_x), y:a.y + (t * s1_y)};
        }

        return false;
    }

	// Direction in between two points in radians
    function _direction(a, b) {
        var temp = 0.0;
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        if (dx !== 0.0 && dy !== 0.0) {
            temp = Math.atan(Math.abs(dy) / Math.abs(dx));
            if (dy < 0.0) {
                if (dx < 0.0) {
                    temp = Math.PI + temp;
                } else {
                    temp = (Math.PI * 2 ) - temp;
                }
            } else {
                if (dx < 0.0)
                    temp = Math.PI - temp;
            }
        } else {
            if (dy === 0.0) {
                if (dx > 0.0) {
                    temp = 0.0;
                } else {
                    temp = Math.PI;
                }
            } else {
                if (dy > 0.0) {
                    temp = Math.PI * 0.5;
                } else {
                    temp = Math.PI * 1.5;
                }
            }
        }
        return temp;
    }

    // Clamp number between floor and ceiling
    function _clamp(val, floor, ceiling){
		if (ceiling < floor){
			Util.error("M: clamp: bad input");
			return val;
		}
		if (val < floor)
			val = floor;
		if (val > ceiling)
			val = ceiling;
		
		return val;
	}

    // Return random integer
    function _randInt(){
        return Math.floor(Math.random() * 100000);
    }

    // Return number between 0 and 2 Pi
    function _randDir(){
        return Math.random() * 2 * Math.PI;
    }

    // Random unit Vector
    function _randUnitV(){
        var dir = _randDir();
        return {x : Math.cos(dir), y : Math.sin(dir)};
    }

    // Midpoint between two points
    function _midpointV(a, b){
        return _multV(_addV(a, b), 0.5);
    }

    // Randomize ordering of elements in array. (In place)
    function _randomizeArray(array){
        var len = array.length;
        for (var k = 0; k < len; k++){
            var randIndex = _randInt() % len;
            var n0 = array[k];
            var n1 = array[randIndex];
            array[k] = n1;
            array[randIndex] = n0;
        }
    }

    // Interpolate linearly
    function _lerp(a, b, t){
        return a + ((b - a) * _clamp(t, 0 , 1));
    }

    // Interpolate between two vectors
    function _lerpV(a, b, t){
        t = _clamp(t, 0 , 1);
        return _addV(_multV(a, 1 - t), _multV(b, t));
    }

    // A random position within radius 1 sampled uniformly
    function _randomRadialOffsetV(radius){
        /*strip*/
        Util.assertNumber(radius);
        /*strip*/

        return _multV(_randUnitV(), radius * Math.sqrt(Math.random()));
    }

    // Separate two points within radius r (In place)
    function _verlet(a, b, radius){
        /*strip*/
        Util.assertNumber(radius);
        Util.assertObject(a);
        Util.assertObject(b);
        /*strip*/
        var dist = _distV(a, b);
        if (dist < radius){
            var delta = (dist - radius);
            var unit = _unitV(_subV(a, b));
            var offset = _multV(unit, delta * 0.5);
            var newA = _subV(a, offset);
            var newB = _addV(b, offset);
            a.x = newA.x;
            a.y = newA.y;
            b.x = newB.x;
            b.y = newB.y;
        }
    }
    return {
        lerp : _lerp,
        dotV:_dotV,
        addV:_addV,
        subV:_subV,
        projV:_projV,
        normV:_normV,
        multV:_multV,
        distV:_distV,
        unitV:_unitV,
        crossV:_crossV,
        magV:_magV,
        lerpV : _lerpV,
        randomV: _randomV,
        areIntersecting:_areIntersecting,
        direction:_direction,
        clamp : _clamp,
        randInt : _randInt,
        randDir : _randDir,
        randUnitV : _randUnitV,
        midpointV : _midpointV,
        randomRadialOffsetV : _randomRadialOffsetV,
        randomizeArray : _randomizeArray,
        rotationDifference : _rotationDifference,
        verlet : _verlet
    };
}();
