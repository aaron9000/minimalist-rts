var Util = function(){
    function _openTab(url){
        _assertString(url);
        window.open(url, '_newtab');
    }
    function _GUID ()
    {
        var S4 = function ()
        {
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return (S4() + S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + "-" +
            S4() + S4() + S4());
    }
    function _navigate(url){
        _assertString(url);
        window.location.href = url;
    }
    function _get(id){
        _assertString(id);
        var ret = document.getElementById(id);
        return ret;
    }
    function _registerClickEvent(controlId, handler){
        _assertString(controlId);
        _assertFunction(handler);
        var c = _get(controlId);
        _assertObject(c);
        _addListener(c, "click", handler);
    }
    function _addListener(element, message, handler){
        _assertObject(element);
        _assertString(message);
        _assertFunction(handler);
        if (element.addEventListener){
            element.addEventListener(message, handler, false);
        }else if (element.attachEvent){
            element.attachEvent(message, handler);
        } else {
            _error("Util: addListener: unable to register event listener");
            return false;
        }
        return true;
    }
    function _warning(message){
        if (Consts.DebugMode) {
            console.log(message);
        }
    }
    function _error(message){
        if (Consts.DebugMode) {
            var stack = printStackTrace();
            var sanitizedStack = [];
            var count = stack.length;
            for (var i = 0; i < count; i++) {
                var line = stack[i];
                if (line.indexOf("printStackTrace") === -1 && line.indexOf("undef") === -1){
                     sanitizedStack.push(line);
                }
            }
            var errorString = message + "\n" + sanitizedStack.join('\n');
            throw errorString;
        }else{
            console.log(message);
        }
    }
    function _assertString(x){
        if (!x || x === undefined || typeof x != "string"){
            _error("assertString: assertion failed");
        }
    }
    function _assertNumber(x){
        if (x === undefined || isNaN(x)){
            _error("assertNumber: assertion failed");
        }
    }
    function _assertObject(x){
        if (!x || x === undefined || typeof x != "object"){
            _error("assertObject: assertion failed");
        }
    }
    function _assertBool(x){
        if (x === undefined || typeof x != "boolean"){
            _error("assertBool: assertion failed");
        }
    }
    function _assertFunction(x){
        if (!x || x === undefined || typeof x != "function"){
            _error("assertBool: assertion failed");
        }
    }
    function _assertCanvasElement(x){
        _assertObject(x);
        _assertFunction(x.getContext);
        var context = x.getContext("2d");
        _assertContext(context);
    }
    function _assertContext(x){
        _assertObject(x);
        _assertFunction(x.fillRect);
    }
    function _assertArray(x){
        _assertObject(x);
        if (x instanceof Array){

        }else{
            _error("assertArray: assertion failed");
        }
    }
    function _assertTrue(x){
        if (!x || x === undefined){
            _error("assertion failed");
        }
    }
    function _assertFalse(x){
        if (x){
            _error("assertion failed");
        }
    }
    function _getContext(canvasId){
        /*strip*/
        _assertString(canvasId);
        /*strip*/
        var element = _get(canvasId);
        _assertCanvasElement(element);
        return element.getContext("2d");
    }
    function _setElementVisibility(element, visible){
        /*strip*/
        _assertObject(element);
        _assertBool(visible);
        /*strip*/
        if (visible === true){
            element.style.display = "inline";
            element.style.visibility = "visible";
        }else{
            element.style.display = "none";
            element.style.visibility = "hidden";
        }
    }
    return {
        warning: _warning,
        error: _error,
        addListener: _addListener,
        registerClickEvent: _registerClickEvent,
        navigate: _navigate,
        openTab: _openTab,
        get: _get,
        getContext: _getContext,
        GUID : _GUID,
        assertString : _assertString,
        assertNumber : _assertNumber,
        assertObject : _assertObject,
        assertBool : _assertBool,
        assertFunction : _assertFunction,
        assertCanvasElement : _assertCanvasElement,
        assertContext : _assertContext,
        assertArray : _assertArray,
        assertTrue : _assertTrue,
        assertFalse : _assertFalse,
        setElementVisibility : _setElementVisibility
    };
}();
