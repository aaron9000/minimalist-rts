var CanvasManager = function(){

    //dom references
    var _terrainCanvas = null;
    var _mainCanvas = null;
    var _mainCanvasElement = null;
    var _bufferElement = null;
    var _containerElement = null;
    var _canvasDict = [];

    function _reset(){

        //get references to rendering elements
        _mainCanvas = Util.getContext("mainCanvas");
        _mainCanvasElement = Util.get("mainCanvas");
        _containerElement = Util.get("container");
        _bufferElement = Util.get("buffer");
        if (!_mainCanvas || !_bufferElement || !_containerElement){
            Util.error("Game: initialize: could not find required DOM elements");
        }

        //set visibility of buffers
        _resizeCanvasElement([_mainCanvasElement, _containerElement]);
        Util.setElementVisibility(_mainCanvasElement, true);

        //destroy all dynamic canvas
        _destroyAllCanvases();
    }
    function _init(){
        _reset();
    }
    function _resizeCanvasElement(elements){
        Util.assertArray(elements);
        for (var i = 0; i < elements.length; i++){
            elements[i].style.display = "block";
            elements[i].width = Consts.Width;
            elements[i].height = Consts.Height;
        }
    }
    function _refreshWithDelay(frameDelay){
        Util.assertNumber(frameDelay);

        //draw background
        var bg = Util.get("terrain");
        _mainCanvas.drawImage(bg, 0, 0);
    }

    function _createCanvas(id, width, height){
        /*strip*/
        Util.assertNumber(width);
        Util.assertNumber(height);
        Util.assertString(id);
        if (width <= 0 || height <= 0){
            Util.error("bad dimensions");
        }
        /*strip*/
        if (_canvasDict[id]){
            Util.warning("duplicate canvas being created");
            return;
        }
        var canvas = document.createElement('canvas');
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        canvas.setAttribute("id", id);
        _bufferElement.appendChild(canvas);
        _canvasDict[id] = canvas;
        return canvas;
    }
    function _destroyAllCanvases(){
        for (var id in _canvasDict){
            _destroyCanvas(id);
        }
        _canvasDict = [];
    }
    function _destroyCanvas(id){
        var canvas = Util.get(id);
        if (!canvas){
            Util.warning("Game: destroyCanvas: could not find canvas element");
            return;
        }
        if (!_canvasDict[id]){
            Util.error("Game: destroyCanvas: could not find canvas in dictionary");
            return;
        }
        _bufferElement.removeChild(canvas);
        delete _canvasDict[id];
        _canvasDict[id] = null;
    }
    function _getContextWithId(id){
        Util.assertString(id);
        return _canvasDict[id];
    }
    function _getTerrainContext(){
        return _terrainCanvas;
    }
    function _getRenderContext(){
        return _mainCanvas;
    }
    function _resetTerrain(){
        var bg = AssetManager.Images.Background;
        Util.assertObject(bg);
        _createCanvas("terrain", Consts.Width, Consts.Height);
        _terrainCanvas = Util.getContext("terrain");
        _terrainCanvas.drawImage(bg, 0, 0);
    }
    function _renderDividers(){
        var dividers = GameManager.getDividerPositions();
        for (var i = 0; i < dividers.length; i++){
            _mainCanvas.drawImage(AssetManager.Images.Barrier, dividers[i] - 32, 0);
        }
    }
    return {
        createCanvas: _createCanvas,
        destroyCanvas: _destroyCanvas,
        getContextWithId: _getContextWithId,
        getRenderContext : _getRenderContext,
        getTerrainContext : _getTerrainContext,
        refreshWithDelay : _refreshWithDelay,
        renderDividers : _renderDividers,
        init : _init,
        reset : _reset,
        resetTerrain: _resetTerrain
    };
}();
