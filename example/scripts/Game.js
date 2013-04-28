var Game = function(){
    var _lastRender = new Date().getTime();
    var _shouldRender = false;
    function _init(){
        ObjectManager.init();
        CanvasManager.init();
        InterfaceManager.init();
        AssetManager.init(_assetsLoaded);
    }
    function _reset(){
        ObjectManager.reset();
        CanvasManager.reset();
        InterfaceManager.reset();
        AssetManager.reset();
    }
    function _startGame(){

        //reset everything to default
        _reset();

        //kickoff game loop
        _shouldRender = true;
        _requestFrame();

        //load level
        InterfaceManager.showGameAndHideMenu();
        CanvasManager.resetTerrain();
        GameManager.loadLevel();
    }
    function _stopGame(){
        _shouldRender = false;
        InterfaceManager.showMenuAndHideGame();
    }
    function _runTests(){
        if (Consts.DebugMode){

        }
    }
    function _executeOnLoad(){
        _init();
    }
    function _assetsLoaded(){
        InterfaceManager.showMenuAndHideGame();

        //test if in debug mode
        _runTests();
    }
    function _step(){
        //find dt
        var frameDelay = _endTimer();
        _startTimer();

        //refresh screen then draw objects
        CanvasManager.refreshWithDelay(frameDelay);
        CanvasManager.renderDividers();
        ObjectManager.step(CanvasManager.getRenderContext(), Consts.DeltaTime);
        GameManager.step(Consts.DeltaTime);

        //continue game loop
        if (_shouldRender === true){
            _requestFrame();
        }
    }
    function _requestFrame(){
        //browser specific calls
        if (window.webkitRequestAnimationFrame){
            window.webkitRequestAnimationFrame(_step);
            return;
        }
        if (window.mozRequestAnimationFrame){
            window.mozRequestAnimationFrame(_step);
            return;
        }
        if (window.msRequestAnimationFrame){
            window.msRequestAnimationFrame(_step);
            return;
        }
        //fallback with setTimeout
        setTimeout(_step, Consts.TargetMS);
    }
    function _startTimer(){
        _lastRender = new Date();
    }
    function _endTimer(){
        if (_lastRender){
            var currTime = new Date().getTime();
            var delta = currTime - _lastRender;
            return delta;
        }
        return 0;
    }
    return {
        executeOnLoad: _executeOnLoad,
        startGame: _startGame,
        stopGame: _stopGame
    };
}();
