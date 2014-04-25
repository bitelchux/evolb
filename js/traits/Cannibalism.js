evolution=(window.evolution?window.evolution:{});
evolution.Traits=(evolution.Traits?evolution.Traits:{});

evolution.Traits.Cannibalism={
    name: "cannibalism",
    lowName: "Civilized",
    highName: "Cannibal",
    feedPercent: {
        lowLimit: 0.2,
        highLimit: 0.7
    },
    onAdded:function(character){
        var cannibalStars=new Phaser.Sprite(character.game,0,0,"cannibal_stars");
        cannibalStars.blendMode=PIXI.blendModes.ADD;
        cannibalStars.anchor.setTo(0.5,0.5);
        cannibalStars.starTween = character.game.add.tween(cannibalStars)
            .to( { angle: 360 }, 3000, Phaser.Easing.Linear.None).loop().start();

        cannibalStars.alpha=0.4;

        character.gui.cannibalStars=cannibalStars;
        character.gui.addChild(cannibalStars);
    },
    onRemoved: function(character){
        character.gui.starTween.stop();
        character.gui.starTween=null;
        character.gui.removeChild(character.gui.cannibalStars);
        character.gui.cannibalStars=null;
    },
    onUpdate: function(character){
        if (character.health/character.maxHealth<=character.dna.traits.cannibalism.getValue("feedPercent")
            && character.gui.cannibalStars.alpha<1){
            character.gui.cannibalStars.alpha=1;
        }
    }
};
