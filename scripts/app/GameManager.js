var GameManager = function(){
    var _money = 0;
    var _enemyMoney = 0;
    var _difficulty = DifficultyType.Easy;
    var _gameOverTime = 0;
    var _spawnCooldown = 0;
    var _gameOver = false;
    function _reset(){
        _money = GameConsts.StartingMoney;
        _enemyMoney = GameConsts.StartingMoney;
        _gameOverTime = 0;
        _spawnCooldown = 0;
        _gameOver = false;
        InterfaceManager.sync();
    }
    function _getDividerPositions(){
        var dividers = GameConsts.Lanes - 1;
        var laneWidth = Consts.Width / GameConsts.Lanes;
        var positions = [];
        for (var i = 0; i < dividers; i++){
            positions.push(laneWidth * (i + 1));
        }
        return positions;
    }
    function _getBoundaryPosition(lane){
        /*strip*/
        Util.assertNumber(lane);
        /*strip*/
        return (Consts.Width / GameConsts.Lanes) * lane;
    }
    function _getLaneCenter(lane){
        /*strip*/
        Util.assertNumber(lane);
        /*strip*/

        var laneWidth = Consts.Width / GameConsts.Lanes;
        return (lane + 0.5) * laneWidth;
    }
    function _getSpawnPosition(lane, side){
        /*strip*/
        Util.assertString(side);
        Util.assertNumber(lane);
        /*strip*/

        var laneX = _getLaneCenter(lane);
        var laneY = Consts.Height * 0.5;
        switch (side){
            case SideType.Friend:
                laneY = Consts.Height + 32;
                break;
            case SideType.Enemy:
                laneY = -32;
                break;
        }
        return {x : laneX, y : laneY};
    }
    function _step(dt){

        //game over logic
        if (_gameOver === true){
            _gameOverTime += dt;
            if (_gameOverTime > GameConsts.ResetTimer){
                Game.stopGame();
            }
            return;
        }

        //cooldown
        _spawnCooldown -= dt;

        //enemy logic
        if (_enemyMoney <= 0 || _spawnCooldown > 0){
            return;
        }
        switch (_difficulty){
            case DifficultyType.Trivial:
                _spawnCooldown = 1.0;
                break;
            case DifficultyType.Easy:
                _spawnCooldown = 0.5;
                break;
            case DifficultyType.Medium:
                _spawnCooldown = 0.2;
                break;
            case DifficultyType.Difficult:
                _spawnCooldown = 0.1;
                break;
        }

        //check for lane deficiencies
        var deficientRow = -1;
        for (var i = 0; i < GameConsts.Lanes; i++){

            //has AI completely lost a lane? (MEDIUM & DIFFICULT)
            if (_difficulty === DifficultyType.Medium || _difficulty === DifficultyType.Difficult){
                var points = ObjectManager.getObjects({type: ObjectType.ControlPoint, lane: i});
                var isNotControlledByPlayer = false;
                for (var j = 0; j < points.length; j++){
                    if (points[j].owningSide !== SideType.Friend){
                        isNotControlledByPlayer = true;
                    }
                }
                if (isNotControlledByPlayer === false){
                    deficientRow = i;
                    break;
                }
            }

            //is there an unfavorable lane imbalance? (DIFFICULT)
            if (_difficulty === DifficultyType.Difficult){
                if (deficientRow === -1){
                    var enemies = ObjectManager.getObjects({type: ObjectType.Soldier, lane: i, side: SideType.Enemy});
                    var friends = ObjectManager.getObjects({type: ObjectType.Soldier, lane: i, side: SideType.Friend});
                    if ((enemies.length < friends.length) && (friends.length > 0)){
                        deficientRow = i;
                        break;
                    }
                }
            }
        }

        //where should we spawn?
        if (deficientRow >= 0){
            _spawnSoldier(deficientRow, SideType.Enemy);
        }else{
            //randomly choose (EASY)
            _spawnSoldier(MathUtil.randInt() % GameConsts.Lanes, SideType.Enemy);
        }
    }
    function _loadLevel(){
        //start with a reset
        _reset();

        //create control points
        var positions = GameConsts.ControlPointYPositions;
        for (var j = 0; j < GameConsts.Lanes; j++){
            for (var i = 0; i < positions.length; i++){
                var controlArgs = {type: ObjectType.ControlPoint, x : _getLaneCenter(j), y : positions[i], lane : j};
                ObjectManager.createObject(controlArgs);
            }
        }

        //spawn initial wave
        for (var k = 0; k < GameConsts.Lanes; k++){
            _spawnSoldier(k, SideType.Friend);
            _spawnSoldier(k, SideType.Enemy);
        }
    }
    function _spawnSoldier(lane, side){
        /*strip*/
        Util.assertNumber(lane);
        Util.assertString(side);
        /*strip*/

        //we have enough money?
        if (_money <= 0){
            return;
        }

        //make purchase
        if (side === SideType.Friend){
            _money--;
            InterfaceManager.sync();
            AssetManager.Sounds.FriendlySpawn.play();
        }else{
            _enemyMoney--;
        }

        //create object
        var pos = MathUtil.addV( _getSpawnPosition(lane, side), MathUtil.randomRadialOffsetV(24.0));
        ObjectManager.createObject({x: pos.x, y: pos.y, side: side, type: ObjectType.Soldier, lane : lane});
    }
    function _awardResource(side){
        /*strip*/
        Util.assertString(side);
        /*strip*/

        if (side === SideType.Enemy){
            if (_difficulty === DifficultyType.Trivial && MathUtil.randInt() % 4 === 0){
                return;
            }
            _enemyMoney++;
        }else{
            _money++;
            InterfaceManager.sync();
        }
    }
    function _getResources(){
        return _money;
    }
    function _declareWinner(side){
        /*strip*/
        Util.assertString(side);
        /*strip*/

        //early return
        if (_gameOver === true){
            return;
        }

        //gib the opposing side
        var losingSide = (side === SideType.Enemy) ? SideType.Friend : SideType.Enemy;
        if (losingSide === SideType.Friend){
            AssetManager.Sounds.Defeat.play();
        }else{
            AssetManager.Sounds.Victory.play();
        }
        var losers = ObjectManager.getObjects({type: ObjectType.Soldier, side: losingSide});
        for (var i = 0; i < losers.length; i++){
            losers[i].gib();
        }
        _gameOver = true;
    }
    function _setDifficultyAndPlay(difficulty){
        /*strip*/
        Util.assertString(difficulty);
        /*strip*/

        //set and play!
        _difficulty = difficulty;
        Game.startGame();
    }
    function _gameIsOver(){
        return _gameOver;
    }
    return {
        step : _step,
        loadLevel: _loadLevel,
        getDividerPositions : _getDividerPositions,
        getBoundaryPosition : _getBoundaryPosition,
        spawnSoldier : _spawnSoldier,
        awardResource : _awardResource,
        getResources : _getResources,
        declareWinner : _declareWinner,
        setDifficultyAndPlay : _setDifficultyAndPlay,
        gameIsOver : _gameIsOver
    };
}();