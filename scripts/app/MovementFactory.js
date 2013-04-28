var MovementConsts = function(){
    return {
        SuctionRadius: 88,
        SuctionAccel: 120,
        AirFriction: 0.0032
    };
}();

function Patrol(args){
    this.setup = function(args){
        _defaultMovementSetup(this, args);
        var factory = new PathFactory();
        this.path = AssetManager.randomPath();
        this.frame = MathUtil.randInt() % this.path.cachedPoints.length;
    };
    this.step = function(dt){
        this.frame++;
        if (this.frame >= this.path.cachedPoints.length){
            this.frame = 0;
        }
        var pos = this.path.cachedPoints[this.frame];
        this.pos = {x : pos.x, y : pos.y};
    };

    this.setup(args);
}
function Random(args){
    this.setup = function(args){
        _defaultMovementSetup(this, args);
        this.velocity = MathUtil.multV(MathUtil.randUnitV(), Math.random() * 16);
    };
    this.step = function(dt){
        this.pos = MathUtil.addV(this.pos, MathUtil.multV(this.velocity, dt));
    };

    this.setup(args);
}
function FollowObject(args) {
    this.setup = function(args){
        _defaultMovementSetup(this, args);
        this.lastPos = MathUtil.addV(MathUtil.multV(MathUtil.randUnitV(), Math.random() * 2), this.pos);
        this.hasCollided = false;
    };
    this.step = function(dt){
        //get suction point from target
        var suctionPos = {x : this.targetObject.x, y : this.targetObject.y};

        //air friction
        var velocity = MathUtil.multV(MathUtil.subV(this.pos, this.lastPos), 1 / dt);
        var velocityMag = MathUtil.magV(velocity);
        if (velocityMag > Consts.Small){
            var frictionMag = MovementConsts.AirFriction * velocityMag * velocityMag * dt;
            frictionMag = MathUtil.clamp(frictionMag, Consts.Small, velocityMag);
            velocity = MathUtil.multV(velocity, (velocityMag - frictionMag) / velocityMag);
        }

        //suction accel
        var suctionVector = MathUtil.unitV(MathUtil.subV(suctionPos, this.pos));
        var suctionAccel = MathUtil.multV(suctionVector, MovementConsts.SuctionAccel);
        velocity = MathUtil.addV(velocity, MathUtil.multV(suctionAccel, dt));

        //super suction
        var dist = MathUtil.distV(this.pos, suctionPos);
        if (dist < MovementConsts.SuctionRadius){
            velocityMag = MathUtil.magV(velocity);
            var ratio = 1 - (dist / MovementConsts.SuctionRadius);
            ratio *= ratio;
            var suctionVelocity = MathUtil.multV(suctionVector, velocityMag * ratio);
            velocity = MathUtil.multV(velocity, 1 - ratio);
            velocity = MathUtil.addV(velocity, suctionVelocity);
        }

        //update position
        this.lastPos = this.pos;
        if (dist < 1){
            this.pos = suctionPos;
            this.hasCollided = true;
        }else{
            this.pos = MathUtil.addV(this.pos, MathUtil.multV(velocity, dt));
        }
    };

    //init
    this.setup(args);
}

function Empty (args) {
    Util.error("MovementFactory: bad type");
}

function _defaultMovementSetup(movement, args){
    movement.pos = {x : args.x, y : args.y};
    movement.type = args.type;
    movement.targetObject = args.targetObject;
    movement.rot = 0;
}

function MovementFactory(){}
MovementFactory.prototype.movementClass = Empty;
MovementFactory.prototype.create = function(args) {
    /*strip*/
    Util.assertObject(args);
    Util.assertString(args.type);
    Util.assertNumber(args.x);
    Util.assertNumber(args.y);
    /*strip*/
   switch(args.type || "Empty"){
        case MovementType.FollowObject:
            this.movementClass = FollowObject;
            break;
       case MovementType.Random:
           this.movementClass = Random;
           break;
       case MovementType.Patrol:
           this.movementClass = Patrol;
           break;
        default:
            Util.error("MovementFactory: create: unknown type - " + args.type);
            break;
    }
    return new this.movementClass(args);
};