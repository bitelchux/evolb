var game = new Phaser.Game(640, 480, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });
var displacementFilter;
var creatures;
var underwater;

function preload() {
    game.load.image('background', 'assets/background.png');
    game.load.image('creature', 'assets/creature.png');
    game.load.script('abstracFilter', 'js/filters/AbstractFilter.js');
    game.load.script('displacementFilter', 'js/filters/DisplacementFilter.js');
}

function create() {
    //	Enable p2 physics
    game.physics.startSystem(Phaser.Physics.P2JS);
    underwater=game.add.group();
    creatures=game.add.group();




    var bg=game.add.tileSprite(0, 0, 2000, 2000, 'background');
    underwater.add(bg);
    underwater.add(creatures);

    var displacementTexture = PIXI.Texture.fromImage("assets/displacement_map.jpg");
    displacementFilter=new PIXI.DisplacementFilter(displacementTexture);
    displacementFilter.scale.x = 25;
    displacementFilter.scale.y = 25;
    //underwater.filters =[displacementFilter];

    bg.scale.x=2;
    bg.scale.y=2;


    var centerSpawnPoint=new Phaser.Point(200, 200);
    for (var x=0;x<5;x++){
        var spawnPoint = new Phaser.Point(centerSpawnPoint.x+game.rnd.realInRange(-300,300),centerSpawnPoint.y+game.rnd.realInRange(-300,300));
        var newCreature=new Creature(spawnPoint.x,spawnPoint.y);
        game.add.existing(newCreature);
        creatures.add(newCreature);
    }

    game.input.onDown.add(function(){
        creatures.forEach(function(creature){
            creature.state="following";
        });
    }, this);

    game.input.onUp.add(function(){
        creatures.forEach(function(creature){
            creature.setIdle();
        });
    }, this);

    resizeGame();


}

var count=0;
function update () {
    game.physics.arcade.collide(creatures, creatures, null, null, this);
    count+=0.1;

    displacementFilter.offset.x = count * 10;
    displacementFilter.offset.y = count * 10 ;
}

function render(){

}

function resizeGame() {
    var height =  Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    game.width = width;
    game.height = height;
    game.stage.bounds.width = width;
    game.stage.bounds.height = height;

    if (game.renderType === Phaser.WEBGL)
    {
        game.renderer.resize(width, height);
    }

}
window.addEventListener('resize',function() { window.resizeGame(); } );

Creature= function (x,y) {
    this.dna=new Dna();
    this.dna.randomizeBaseTraits();

    //  We call the Phaser.Sprite passing in the game reference
    //  We're giving it a random X/Y position here, just for the sake of this demo - you could also pass the x/y in the constructor
    Phaser.Sprite.call(this, game, x, y, 'creature');
    game.physics.enable(this, Phaser.Physics.ARCADE);



    this.floatSpeed=5;
    this.body.bounce=1;
    this.body.drag.x=5;
    this.body.drag.y=5;

    //set creature size
    this.scale.setTo(this.dna.baseTraits.sizeSpeed.getValue("size"),
                     this.dna.baseTraits.sizeSpeed.getValue("size"));

    this.moveSpeed=this.dna.baseTraits.sizeSpeed.getValue("speed");

    //methods

    this.setIdle=function(){
        this.state="idle";
        bob.call(this)
    };

    function bob(){
        this.idlePoint=new Phaser.Point(this.x, this.y);
        var randomPoint = new Phaser.Point(this.idlePoint.x,this.idlePoint.y+10);
        randomPoint.rotate(this.x, this.y, game.rnd.realInRange(0, 360), true);

        var movementVector=new Phaser.Point(randomPoint.x-this.x,randomPoint.y-this.y);
        movementVector.normalize();

        this.body.velocity.x=this.body.velocity.x+(movementVector.x*this.floatSpeed);
        this.body.velocity.y=this.body.velocity.y+(movementVector.y*this.floatSpeed);


        if (this.state=="idle"){
            game.time.events.add(game.rnd.realInRange(500,2000), bob, this);
        }
    }

    this.setIdle();


};

Creature.prototype = Object.create(Phaser.Sprite.prototype);
Creature.prototype.constructor = Creature;


Creature.prototype.update = function() {

    if (this.state=="following"){
        game.physics.arcade.moveToPointer(this, this.moveSpeed);
    }

};