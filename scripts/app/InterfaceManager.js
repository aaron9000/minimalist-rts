var InterfaceConsts = function(){
    return {
        Foo : 3
    };
}();
var InterfaceManager = function(){
    var _gameContainerElement = null;
    var _menuContainerElement = null;
    var _buttonContainerElement = null;
    var _moneyText = null;
    var _loadingText = null;
    var _attackButtons = [];

    function _init(){
        _reset();
    }
    function _reset(){
        //get required references to DOM elements
        _gameContainerElement = Util.get("gameContainer");
        _menuContainerElement = Util.get("menuContainer");
        _buttonContainerElement = Util.get("buttonContainer");
        _moneyText = Util.get("money");
        _loadingText = Util.get("loadingText");

        //ensure we have everything
        if (!_buttonContainerElement || !_moneyText || !_menuContainerElement || !_gameContainerElement || !_loadingText){
            Util.error("InterfaceManager: cant find required DOM elements");
        }

        //attack / defense buttons
        var attack = null;
        for (var i = 0; i < GameConsts.Lanes; i++){
            attack = Util.get("attack" + i);
            Util.assertObject(attack);
            _attackButtons.push(attack);
        }

        //resize container
        _buttonContainerElement.style.width = Consts.Width;
    }
    function _attackRow(lane){
        Util.assertNumber(lane);
        GameManager.spawnSoldier(lane, SideType.Friend);
    }
    function _trivialClick(){
        GameManager.setDifficultyAndPlay(DifficultyType.Trivial);
    }
    function _easyClick(){
        GameManager.setDifficultyAndPlay(DifficultyType.Easy);
    }
    function _mediumClick(){
        GameManager.setDifficultyAndPlay(DifficultyType.Medium);
    }
    function _difficultClick(){
        GameManager.setDifficultyAndPlay(DifficultyType.Difficult);
    }
    function _updateMoneyText(money){
        //change red or white depending on count
        _moneyText.innerText = money;
        _moneyText.style.color = (money > 0) ? "white" : "red";
    }
    function _sync(){
        _updateMoneyText(GameManager.getResources());
    }
    function _showMenuAndHideGame(){
        _gameContainerElement.style.display = "none";
        _menuContainerElement.style.display = "block";
        _loadingText.style.display = "none";
    }
    function _showGameAndHideMenu(){
        _gameContainerElement.style.display = "block";
        _menuContainerElement.style.display = "none";
        _loadingText.style.display = "none";
    }
    return {
        init: _init,
        reset: _reset,
        attackRow: _attackRow,
        trivialClick : _trivialClick,
        easyClick : _easyClick,
        mediumClick : _mediumClick,
        difficultClick : _difficultClick,
        showMenuAndHideGame : _showMenuAndHideGame,
        showGameAndHideMenu : _showGameAndHideMenu,
        sync: _sync
    };
}();
