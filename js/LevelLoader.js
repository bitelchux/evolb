Evolb=(window.Evolb?window.Evolb:{});
Evolb.LevelLoader=function(){

    var _levels;
    var _game;

    function _init(game){
        _game=game;
        _levels={};
        _preloadLevel('tutorial', 'levels/tutorial.js');
        _preloadLevel('random', 'levels/random.js');
        _preloadLevel('level5', 'levels/level5.js');
    }

    function _loadLevel(game,levelData){
        var level=new Evolb.Level(game,levelData.levelWidth,levelData.levelHeight);
        level.name=levelData.name;

        //avoid cache flag
        var noLevelCache="noLevelCache" in Evolb.Utils.getUrlVars();

        //TODO expand auto saving to all level data?
        var savedLevelData = JSON.parse(localStorage.getItem('level-'+level.name));
        var levelObjects=!noLevelCache&&savedLevelData?savedLevelData:levelData.objects;

        for(var x=0;x<levelObjects.length;x++){
            var objectData=levelObjects[x];
            var objectInstance=level.addObject(objectData);
            level.spriteArrays.levelObjects.push(objectInstance);
        }

        if (levelData.onLevelStart){
            levelData.onLevelStart.call(level);
        }

        if (levelData.updateGoal){
            level.updateGoal=levelData.updateGoal;
        }



        return level;

    }

    function _loadLevelByName(levelName){
        return _loadLevel(_game,_levels[levelName]);
    }

    function _preloadLevel(key,url){
        _game.load.script(key,url,function(){
            this[key]=level;
        },_levels)
    }

    return {
        init: _init,
        loadLevel: _loadLevel,
        loadLevelByName: _loadLevelByName
    }
}();