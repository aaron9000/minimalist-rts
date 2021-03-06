var AssetConsts = function(){
    return {
        PathCopies : 8
    };
}();
var AssetManager = function () {
    var _callback;
    var _loaded = false;

    var _paths = [];

    var _soundCount = 0;
    var _sounds = {};
    /*sounds*/

    var _imageCount = 0;
    var _images = {};
    /*images*/

    function _imageLoaded() {
        _imageCount--;
        _checkForCompletion();
    }

    function _soundLoaded(e){
        _soundCount--;
        _checkForCompletion();
    }
    function _soundLoadError(e){
        console.log(e.error);
    }

    function _checkForCompletion(){
        if (_imageCount === 0 && _soundCount === 0) {
            _loaded = true;
            _callback();
        }
    }

    function _isLoaded(){
        return _loaded;
    }
    function _loadPaths(){
        var factory = new PathFactory();
        for (var i = 0; i < AssetConsts.PathCopies; i++){
            _paths.push(factory.create());
        }
    }
    function _loadSounds(){
        for (var prop in _sounds) {
            _soundCount++;
            var snd = new buzz.sound(_sounds[prop]);
            _sounds[prop] = snd;
            snd.load();
            snd.bind("loadeddata", _soundLoaded);
            snd.bind("error", _soundLoadError);
        }
        if (_soundCount === 0){
            Util.warning("Assets: no sounds to included");
        }
    }
    function _loadImages(){
        for (var prop in _images) {
            _imageCount++;
            var img = new Image();
            img.src = _images[prop];
            img.onload = _imageLoaded;
            _images[prop] = img;
        }
        if (_imageCount === 0){
            Util.warning("Assets: no images included");
        }
    }
    function _init(callback) {
        Util.assertFunction(callback);
        _callback = callback;

        _loadImages();
        _loadSounds();
        _loadPaths();
        _checkForCompletion();
    }
    function _randomPath(){
        var index = MathUtil.randInt() % AssetConsts.PathCopies;
        return _paths[index];
    }
    function _reset(){
        //Stub
    }
    return {
        Images: _images,
        Sounds: _sounds,
        init: _init,
        reset: _reset,
        loaded: _isLoaded,
        randomPath: _randomPath
    };
}();