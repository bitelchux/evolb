evolution=(window.evolution?window.evolution:{});
evolution.Creature= function (game,x,y,dna) {
    if (dna){
        //use given DNA
        this.dna=dna;
    }
    else{
        //create a new DNA
        this.dna=new evolution.Dna();
        this.dna.randomizeBaseTraits();
    }

    //attach creature to dna
    this.dna.creature=this;

    //construct chracter
    evolution.Character.call(this, game, x, y, 'creature');


    //events
    //*************************
    this.body.onBeginContact.add(beginContactHandler, this);


    function beginContactHandler(body, shapeA, shapeB, equation) {
        if (!(body && body.sprite && body.sprite!=null)){ return; }

        var pendingDestruction=false;

        if (body.sprite.key=="enemy1"){
            this.hitCheck(body,body.sprite.attackSpeed,function(){
                this.stopBreeding();
                this.damage(10,true);
            });
        }
        if (body.sprite.key=="food"){
            this.heal(body.sprite.healAmount);
            pendingDestruction=true;
        }

        //creature is a cannibal!
        if (body.sprite.key=="creature" && this.dna.traits.cannibalism
            && this.health/this.maxHealth<=0.25
            ){
            this.hitCheck(body,this.attackSpeed,function(){
                body.sprite.damage(20,true);
                this.heal(10);
            });

        }
        else if (body.sprite.key=="creature" && this.state==this.states.WANTS_TO_BREED){
            this.startBreedingWith(body.sprite);
        }

        if (pendingDestruction){
            body.sprite.destroy();
        }

    }


    //set creature size
    this.scale.setTo(this.dna.baseTraits.sizeSpeed.getValue("size"),
        this.dna.baseTraits.sizeSpeed.getValue("size"));
    this.body.setCircle(this.width/2);

    this.moveSpeed=this.dna.baseTraits.sizeSpeed.getValue("speed");

    //has to be after setCircle otherwise the material is lost
    this.body.setMaterial(evolution.Materials.getCreatureMaterial());

    //methods


    this.init();
};

evolution.Creature.prototype = Object.create(evolution.Character.prototype);
evolution.Creature.prototype.constructor = evolution.Creature;

// behaviours
// ***************

evolution.Creature.prototype.spawn=function(){
    var spawnDna = evolution.Dna.combine(this.dna,this.currentBreedingWith.dna);
    var newCreature = new evolution.Creature(this.game,this.x,this.y,spawnDna);
    evolution.core.getCreatures().add(newCreature);
    newCreature.init();
    //TODO: recycle creature?
};


// override functions
// *******************

evolution.Character.prototype.doHungerEvent=function(){
    this.damage(this.dna.baseTraits.sizeSpeed.getValue("hungerDamage"));
};

evolution.Creature.prototype.init = function(){
    evolution.Character.prototype.init.call(this);
    this.dna.activate();
    this.game.time.events.add(this.hungerDelay,this.setHungry,this);

};


evolution.Creature.prototype.postKill = function(){
    evolution.Character.prototype.postKill.call(this);
};