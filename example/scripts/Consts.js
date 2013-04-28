var _debugMode = false;

/* generated script */
_debugMode = true;
/* generated script */

var Consts = function(){
    return {
        DebugMode: _debugMode,
        Width: 480,
        Height: 480,
        DeltaTime : (1.0 / 60.0),
        FontSize : 12,
        Font : "12pt Courier"
    };
}();
var ObjectType = function(){
    return {
        Soldier : "soldier",
        BloodParticle : "bloodparticle",
        ControlPoint : "controlpoint",
        ResourceIcon : "resourceicon"
    };
}();
var SideType = function(){
    return {
        Friend : "friend",
        Enemy : "enemy",
        Neutral : "neutral"
    };
}();
var MovementType = function(){
    return {
        FollowObject : "followObject",
        Random : "random",
        Patrol : "patrol"
    };
}();
var DifficultyType = function(){
    return {
        Trivial : "trivial",
        Easy : "easy",
        Medium : "medium",
        Difficult : "difficult"
    };
}();
var GameConsts = function(){
    return {
        Lanes : 4,
        CaptureDistance : 42,
        ShootDistance : 80.0,
        ShootDamage : 1,
        ShootCooldown : 0.25,
        SoldierHealth : 10,
        SoldierMoveSpeed : 0.25,
        ResourceRate : 5.0,
        StartingMoney : 12,
        ResetTimer : 3,
        ControlPointYPositions : [(Consts.Height * 0.5 - 95), (Consts.Height * 0.5 + 95)]
    };
}();
