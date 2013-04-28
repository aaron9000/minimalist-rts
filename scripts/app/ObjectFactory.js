var ObjectConsts = function(){
    return {
        //new
        BloodDuration : 1.4,
        ResourceDuration : 1.1
    };
}();

function Soldier(args){
    this.setup = function(args){
        Util.assertNumber(args.lane);
        _objectDefaultSetup(this, args);
        this.side = args.side || SideType.Friend;
        if (this.side === SideType.Friend){
            this.tex = AssetManager.Images.GreenSoldier;
            this.rot = Math.PI * 0.5;
            this.moveSpeed = {x : 0, y : -GameConsts.SoldierMoveSpeed};
        }else{
            this.tex = AssetManager.Images.RedSoldier;
            this.rot = Math.PI * 1.5;
            this.moveSpeed = {x : 0, y : GameConsts.SoldierMoveSpeed};
        }
        this.width = 48;
        this.height = 48;
        this.drawMuzzleFlash = false;
        this.shootPos = {x: 100, y: 100};
        this.rotOffset = 0;
        this.livetime = Math.random() * 360;
        this.enemy = null;
        this.shootCooldown = 0;
        this.health = GameConsts.SoldierHealth;
    };
    this.step = function(dt){

        //test muzzle flash
        this.drawMuzzleFlash = false;

        //determine this.enemy
        this.enemy = null;
        var enemySide = (this.side == SideType.Enemy) ? SideType.Friend : SideType.Enemy;
        var enemies = ObjectManager.getObjects({type : ObjectType.Soldier, side: enemySide, lane: this.lane, within: GameConsts.ShootDistance, of: {x : this.x, y: this.y}});
        var closest = GameConsts.ShootDistance;
        var enemy = null;
        for (var i = 0; i < enemies.length; i++){
            enemy = enemies[i];
            if (enemy.queriedDistance < closest){
                closest = enemy.queriedDistance;
                this.enemy = enemy;
            }
        }

        //move animation
        var isAimed = false;
        if (this.enemy){
            var enemyPos = {x : this.enemy.x, y: this.enemy.y};
            var r = this.rot + this.rotOffset;
            var directionToEnemy = MathUtil.direction({x: this.x, y: this.y}, enemyPos);
            var dif = MathUtil.rotationDifference(r, directionToEnemy);
            var adjustSpeed = dt * 2.5;
            if (Math.abs(dif - Math.PI) >= adjustSpeed){
                if (dif > 0){
                    this.rotOffset += adjustSpeed;
                }else{
                    this.rotOffset -= adjustSpeed;
                }
            }else{
                isAimed = true;
            }
        }else{
            var desiredOffset = Math.sin(this.livetime * 6.5) * 0.08;
            this.rotOffset = MathUtil.lerp(this.rotOffset, desiredOffset, 0.05);
        }

        //shoot or march
        if (this.enemy){
            if (this.shootCooldown <= 0 && isAimed === true){
                this.shoot();
            }
        }else{
            this.y += this.moveSpeed.y;
        }

        //stay inside lane
        var leftWall = GameManager.getBoundaryPosition(this.lane) + this.width * 0.5;
        var rightWall = GameManager.getBoundaryPosition(this.lane + 1) - this.width * 0.5;
        this.x = MathUtil.clamp(this.x, leftWall, rightWall);

        //collide with other nearby enemies
        var radius = this.width * 0.6;
        var bodies = ObjectManager.getObjects({type : ObjectType.Soldier, within: radius, of: {x: this.x, y: this.y}, lane: this.lane});
        var len = bodies.length;
        var body = null;
        for (var k = 0; k < len; k++){
            body = bodies[k];
            if (body === this){
                continue;
            }

            //crowd physics
            var here = {x : this.x, y: this.y};
            var there = {x: body.x, y: body.y};
            MathUtil.verlet(here, there, radius);
            this.x = here.x;
            this.y = here.y;
            body.x = there.x;
            body.y = there.y;
        }

        //victory?
        if (this.side === SideType.Enemy){
            if (this.y > Consts.Height){
                GameManager.declareWinner(this.side);
            }
        }else{
            if (this.y < 0){
                GameManager.declareWinner(this.side);
            }
        }

        //cooldown
        this.shootCooldown -= dt;
        this.livetime += dt;

        //death?
        if (this.health <= 0){
            this.gib();
        }
    };
    this.shoot = function(){

        //damage enemy
        this.enemy.health -= GameConsts.ShootDamage;

        //take outside position soon
        this.shootCooldown = GameConsts.ShootCooldown;

        //find random impact position
        this.shootPos = MathUtil.addV({x: this.enemy.x, y:this.enemy.y}, MathUtil.randomRadialOffsetV(24.0));
        this.drawMuzzleFlash = true;

        //draw scorch decal
        var renderArgs = {x : this.shootPos.x, y: this.shootPos.y, width: 10, height: 10, scale : ((Math.random() * 0.25) + 0.75), alpha : 1.0};
        CanvasUtil.drawElementOnContext(renderArgs, AssetManager.Images.Scorch, CanvasManager.getTerrainContext());
    };
    this.gib = function(){
        //create gib particles
        for (var i = 0 ; i < 7; i++){
            var offset = MathUtil.randomRadialOffsetV(20);
            ObjectManager.createObject({x : this.x + offset.x, y: this.y + offset.y, type: ObjectType.BloodParticle});
        }

        //sound
        if (this.side === SideType.Friend){
            AssetManager.Sounds.FriendlyDeath.play();
        }else{
            AssetManager.Sounds.EnemyDeath.play();
        }

        //draw blood decal
        var renderArgs = {x : this.x, y: this.y, width: 100, height: 100, rotation: MathUtil.randDir(), scale : ((Math.random() * 0.25) + 0.75), alpha : 1.0};
        CanvasUtil.drawElementOnContext(renderArgs, AssetManager.Images.Splat, CanvasManager.getTerrainContext());

        //flag this object as dead
        this.needsRemoval = true;
    };
    this.render = function(renderContext){
        var renderArgs = {x : this.x, y : this.y, width : this.width, height : this.height, rotation : (this.rot - (Math.PI * 0.5)) + this.rotOffset, scale : 1.0, alpha : 1.0, blendmode : BlendMode.Normal};
        CanvasUtil.drawElementOnContext(renderArgs, this.tex, renderContext);
    };
    this.postRender = function(renderContext){
        if (this.drawMuzzleFlash === false){
            return;
        }

        //draw flash
        var r = this.rot + this.rotOffset;
        var unit = {x : -Math.cos(r), y : -Math.sin(r)};
        var flashPos = MathUtil.addV(MathUtil.multV(unit, 24.0), {x : this.x, y: this.y});
        var flashArgs = {x : flashPos.x, y : flashPos.y, width : 64, height : 64, rotation : MathUtil.randDir(), scale : (0.75 + Math.random() * 0.25) * 0.65, alpha : 1.0, blendmode : BlendMode.Additive};
        CanvasUtil.drawElementOnContext(flashArgs, AssetManager.Images.MuzzleFlash, renderContext);

        //bullet impact
        var impactArgs = {x : this.shootPos.x, y : this.shootPos.y, width : 64, height : 64, rotation : MathUtil.randDir(), scale : (0.75 + Math.random() * 0.25) * 0.3, alpha : 1.0, blendmode : BlendMode.Additive};
        CanvasUtil.drawElementOnContext(impactArgs, AssetManager.Images.BulletImpact, renderContext);
    };
    this.teardown = function(){
        //empty
    };

    //init
    this.setup(args);
}

function ControlPoint(args) {
    this.setup = function(args){
        _objectDefaultSetup(this, args);
        this.tex = AssetManager.Images.ControlPad;
        this.overlayTex = {};
        this.overlayTex[SideType.Enemy] = AssetManager.Images.RedLight;
        this.overlayTex[SideType.Friend] = AssetManager.Images.GreenLight;
        this.overlayTex[SideType.Neutral] = AssetManager.Images.WhiteLight;
        this.owningSide = SideType.Neutral;
        this.overlayWidth = 132;
        this.overlayHeight = 88;
        this.width = 112;
        this.height = 48;
        this.livetime = Math.random() * 360;
        this.cooldown = 0;
        this.z = 100;
    };

    this.step = function(dt){
        //query for nearby objects
        var here = {x:this.x, y:this.y};
        var friends = ObjectManager.getObjects({type : ObjectType.Soldier, lane: this.lane, side: SideType.Friend, within: GameConsts.CaptureDistance, of: here});
        var enemies = ObjectManager.getObjects({type : ObjectType.Soldier, lane: this.lane, side: SideType.Enemy, within: GameConsts.CaptureDistance, of: here});
        var newSide = null;
        switch (this.owningSide){
            case SideType.Friend:
                if (friends.length === 0){
                    if (enemies.length > 0){
                        newSide = SideType.Enemy;
                        AssetManager.Sounds.LostCapture.play();
                    }
                }
                break;
            case SideType.Enemy:
                if (enemies.length === 0){
                    if (friends.length > 0){
                        newSide = SideType.Friend;
                        AssetManager.Sounds.Capture.play();
                    }
                }
                break;
            case SideType.Neutral:
                if (enemies.length > 0){
                    newSide = SideType.Enemy;
                }
                if (friends.length > 0){
                    newSide = SideType.Friend;
                    AssetManager.Sounds.Capture.play();
                }
                break;
        }

        //update ownership
        if (newSide){
            if (this.owningSide != newSide){
                this.owningSide = newSide;
            }
        }

        //award resources?
        if (this.cooldown < 0 && this.owningSide !== SideType.Neutral && GameManager.gameIsOver() === false){
            GameManager.awardResource(this.owningSide);
            this.cooldown = GameConsts.ResourceRate;
            if (this.owningSide === SideType.Friend){
                ObjectManager.createObject({type : ObjectType.ResourceIcon, x: this.x, y: this.y, lane : -1});
            }
        }

        //tick onwards
        this.livetime += dt;
        this.cooldown -= dt;
    };

    this.render = function(renderContext){
        var renderArgs = {x : this.x, y : this.y, width : this.width, height : this.height, rotation : 0, scale : 1.0, alpha : 1.0, blendmode : BlendMode.Normal};
        CanvasUtil.drawElementOnContext(renderArgs, this.tex, renderContext);
    };
    this.postRender = function(renderContext){
        //update glow effect
        var glowRatio = (1.0 + Math.sin(this.livetime * 0.75)) * 0.5;
        var alpha = (glowRatio * 0.25) + 0.75;
        var renderArgs = {x : this.x + 2, y : this.y - 2, width : this.overlayWidth, height : this.overlayHeight, rotation : 0, scale : 1.0, alpha : alpha, blendmode : BlendMode.Additive};
        var overlayTex  = this.overlayTex[this.owningSide];
        CanvasUtil.drawElementOnContext(renderArgs, overlayTex, renderContext);
    };
    this.teardown = function(){
        //empty
    };

    //init
    this.setup(args);
}

function BloodParticle (args) {
    this.setup = function(args){
        _objectDefaultSetup(this, args);
        this.tex = AssetManager.Images.BloodPuff;
        this.maxLivetime = ObjectConsts.BloodDuration;
        this.livetime = Math.random() * this.maxLivetime * 0.35;
        var factory = new MovementFactory();
        this.movement = factory.create({type : MovementType.Random, x : args.x, y : args.y});
        this.scale = Math.random() * 0.25 + 1;
        this.rot = MathUtil.randDir();
        this.rotSpeed = (Math.random() - 0.5) * 2;
    };

    this.step = function(dt){
        /*strip*/
        Util.assertObject(this.movement);
        /*strip*/
        this.movement.step(dt);
        this.x = this.movement.pos.x;
        this.y = this.movement.pos.y;
        this.livetime += dt;
        this.scale += 0.4 * dt;
        this.rot += this.rotSpeed * dt;
        this.alpha = 1.01 - MathUtil.clamp(this.livetime / this.maxLivetime, 0, 1);

        //die?
        if (this.livetime > this.maxLivetime){
            this.needsRemoval = true;
        }
    };

    this.render = function(renderContext){
        var renderArgs = {x : this.x, y : this.y, width : 64, height : 64, rotation : this.rot, scale : this.scale, alpha : this.alpha, blendmode : BlendMode.Normal};
        CanvasUtil.drawElementOnContext(renderArgs, this.tex, renderContext);
    };
    this.teardown = function(){
        //empty
    };

    //init
    this.setup(args);
}

function ResourceIcon (args) {
    this.setup = function(args){
        _objectDefaultSetup(this, args);
        this.tex = AssetManager.Images.Resource;
        this.maxLivetime = ObjectConsts.ResourceDuration;
    };

    this.step = function(dt){
        this.livetime += dt;
        this.scale += 0.4 * dt;
        this.alpha = 1.01 - MathUtil.clamp(this.livetime / this.maxLivetime, 0, 1);

        //die?
        if (this.livetime > this.maxLivetime){
            this.needsRemoval = true;
        }
    };

    this.render = function(renderContext){
        //stub
    };
    this.postRender = function(renderContext){
        var renderArgs = {x : this.x, y : this.y, width : 96, height : 96, rotation : this.rot, scale : this.scale, alpha : this.alpha, blendmode : BlendMode.Additive};
        CanvasUtil.drawElementOnContext(renderArgs, this.tex, renderContext);
    };
    this.teardown = function(){
        //empty
    };

    //init
    this.setup(args);
}

function Empty (args) {
    Util.error("ObjectFactory: bad type");
}

function _objectDefaultSetup(object, args){
    object.guid = Util.GUID();
    object.needsRemoval = false;
    object.x = args.x;
    object.y = args.y;
    object.side = args.side || SideType.Neutral;
    object.type = args.type;
    object.livetime = 0;
    object.z = 0;
    object.queriedDistance = 0;
    object.lane = isNaN(args.lane) ? -1 : args.lane;
}

function _assertObjectArgs(args){
    Util.assertObject(args);
    Util.assertString(args.type);
    Util.assertNumber(args.x);
    Util.assertNumber(args.y);
    return true;
}

function ObjectFactory(){}
ObjectFactory.prototype.objectClass = Empty;
ObjectFactory.prototype.create = function (args) {
    /*strip*/
    if (!_assertObjectArgs(args)){
        return null;
    }
    /*strip*/
    switch (args.type || "Empty"){
        case ObjectType.ControlPoint:
            this.objectClass = ControlPoint;
            break;
        case ObjectType.Soldier:
            this.objectClass = Soldier;
            break;
        case ObjectType.BloodParticle:
            this.objectClass = BloodParticle;
            break;
        case ObjectType.ResourceIcon:
            this.objectClass = ResourceIcon;
            break;
        default:
            Util.error("ObjectFactory: create: unknown type - " + args.type);
            break;
    }
    return new this.objectClass(args);
};