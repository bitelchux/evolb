evolution=(window.evolution?window.evolution:{});
evolution.Level=function(game,levelWidth,levelHeight){
    var that=this;
    this.labOffset=200;
    this.cameraSpeed=5;

    //flags
    this.isControlEnabled=true;

    this.levelWidth=levelWidth;
    this.levelHeight=levelHeight;
    this.game=game;

    this.levelEditor=new evolution.LevelEditor(this);

    game.world.setBounds(-this.labOffset, -this.labOffset, this.levelWidth+this.labOffset*2, this.levelHeight+this.labOffset*2);


    
    this.layers={
        behindAquarium: null,
        aquariumEffect: null,
        inAquarium: null,
        foreground: null,
        enemies: null,
        creatures: null,
        powerUps: null,
        rocks: null,
        gui: null,
        level: null
    };

    for (layerName in this.layers){
        this.layers[layerName]=game.add.group();
    }

    this.spriteArrays={
        all: [],
        levelObjects: [] //all objects that make up the level in its initial state
    };


    this.labBgMasked=game.add.sprite(8053, 4697, 'lab_bg');
    this.labBgMasked.fixedToCamera=true;
    this.labBgMasked.width=this.levelWidth*0.3;
    this.labBgMasked.height=this.levelWidth*0.3;
    this.labBgMasked.cameraOffset.x=0;
    this.labBgMasked.cameraOffset.y=0;
    this.layers.aquariumEffect.add(this.labBgMasked);

    this.labBg=game.add.sprite(8053, 4697, 'lab_bg');
    this.labBg.fixedToCamera=true;
    this.labBg.width=this.labBgMasked.width;
    this.labBg.height=this.labBgMasked.height;
    this.labBg.cameraOffset.x=0;
    this.labBg.cameraOffset.y=0;
    this.layers.behindAquarium.add(this.labBg);
    this.labBg.alpha=1;

    this.shine=game.add.sprite(3065, 2276, 'shine');
    this.shine.fixedToCamera=true;
    this.shine.width*=3;
    this.shine.height*=3;
    this.shine.cameraOffset.x=0;
    this.shine.cameraOffset.y=0;
    this.layers.foreground.add(this.shine);



    this.aquariumMasked=game.add.graphics(0,0,this.layers.aquariumEffect);
    this.aquarium_blue=game.add.graphics(0, 0,this.layers.aquariumEffect);
    this.aquarium = game.add.graphics(0,0,this.layers.inAquarium);
    this.aquariumMask=game.add.graphics(0,0);


    var aquariumPathString="M0 0"+
                            "l0 "+(levelHeight-160)+
                            "q0 160 160 160"+
                            "l"+(levelWidth-160-160)+" 0"+
                            "q160 0 160 -160"+
                            "l0 "+(-levelHeight+160)+
                            "l50 0"+
                            "a50,-50 0 0,0 0,-100"+
                            "l"+(-levelWidth-50-50)+" 0"+
                            "a-50,50 0 0,0 0, 100"+
                            "l64 0";
    var aquariumPointArray=evolution.core.getPointArray(aquariumPathString,1000);

    this.aquarium.lineStyle(28, 0XFFFFFF, 1);
    this.aquarium_blue.beginFill(0X2f919e, 0.83);
    this.aquarium_blue.lineStyle(28, 0XFFFFFF, 1);
    this.aquariumMask.beginFill(0XFFFFFF, 1);

    this.aquarium.moveTo(aquariumPointArray[0].x,aquariumPointArray[0].y);
    this.aquarium_blue.moveTo(aquariumPointArray[0].x,aquariumPointArray[0].y);
    this.aquariumMask.moveTo(aquariumPointArray[0].x,aquariumPointArray[0].y);
    for(var x=0;x<aquariumPointArray.length;x++){
        this.aquarium.lineTo(aquariumPointArray[x].x,aquariumPointArray[x].y);
        this.aquarium_blue.lineTo(aquariumPointArray[x].x,aquariumPointArray[x].y);
        this.aquariumMask.lineTo(aquariumPointArray[x].x,aquariumPointArray[x].y);
    }
    this.aquarium_blue.endFill();
    this.aquariumMask.endFill();

    this.aquariumMask.alpha=1;
    this.layers.aquariumEffect.mask=this.aquariumMask;
    this.layers.foreground.mask=this.aquariumMask;


    var displacementTexture = PIXI.Texture.fromImage("assets/displacement_map.jpg");
    this.displacementFilter=new PIXI.DisplacementFilter(displacementTexture);
    this.displacementFilter.scale.x = 15;
    this.displacementFilter.scale.y = 15;
    this.displacementCount=0;
    this.layers.aquariumEffect.filters =[this.displacementFilter];



    this.addAquariumWalls();

    //place layers in proper order
    this.layers.level.add(this.layers.behindAquarium);
    this.layers.level.add(this.layers.aquariumEffect);
    this.layers.level.add(this.layers.inAquarium);
    this.layers.level.add(this.layers.creatures);
    this.layers.level.add(this.layers.enemies);
    this.layers.level.add(this.layers.rocks);
    this.layers.level.add(this.layers.powerUps);
    this.layers.level.add(this.layers.foreground);
    this.layers.level.add(this.layers.gui);

    //EVENTS
    var blinkTimer=0;
    var shouldBlink=game.rnd.integerInRange(1,4);
    game.time.events.loop(200,function(){
        if (blinkTimer==shouldBlink){
            var creature=null;
            var tryCount=0;
            while((!creature || creature && !creature.alive) && tryCount<10){
                creature=this.layers.creatures.getRandom();
                tryCount++;
            }
            if (creature){
                creature.blink();
            }
            blinkTimer=0;
            shouldBlink=game.rnd.integerInRange(1,7);
        }
        else
        {
            blinkTimer++;
        }

    },this);

    //UI
    var infoPanel=new evolution.gui.InfoPanel(game);
    this.layers.gui.add(infoPanel);
    infoPanel.init();

    this.pointerController=new Phaser.Graphics(game,0,0);
    this.pointerController.fixedToCamera=true;
    this.layers.gui.addChild(this.pointerController);



    //INPUT
    game.input.onDown.add(function(pointer){

        //character control
        if (this.isControlEnabled && !this.levelEditor.isActive){
            var clickPoint= new Phaser.Point(pointer.position.x+game.camera.x,pointer.position.y+game.camera.y);
            var bodies=game.physics.p2.hitTest(clickPoint,this.layers.creatures.children);
            if (bodies.length>0){
                var sprite=bodies[0].parent.sprite;
                infoPanel.selectCharacter(sprite);
            }
            else{
                infoPanel.close();
                this.layers.creatures.forEachAlive(function(creature){
                    creature.isFollowingPointer=true;
                });


            }

        }

    },this);

    game.input.onUp.add(function(pointer){
        if(this.isControlEnabled && !this.levelEditor.isActive){
            this.clearControlPointer();
        }
    },this);

};

evolution.Level.prototype.constructor = evolution.Level;

evolution.Level.prototype.update=function(){
    this.displacementCount+=0.1;
    this.displacementFilter.offset.x = this.displacementCount * 10;
    this.displacementFilter.offset.y = this.displacementCount * 10 ;

};


evolution.Level.prototype.render=function(){

    if (!this.levelEditor.isActive && this.layers.creatures.countLiving()>0){
        this.focusOnCreatures(false);
    }

    //TODO: add this to charactersin generael
    this.layers.creatures.forEachAlive(function(creature){
        creature.render();
    });

    if(this.isControlEnabled && !this.levelEditor.isActive){
        this.updatePointerController();
    }

    this.levelEditor.render();

    this.bgParallex();
};


evolution.Level.prototype.addAquariumWalls=function(){
    var debug=false;

    var leftWall=new Phaser.Sprite(this.game,0,0);
    this.game.physics.p2.enable(leftWall,debug);
    leftWall.body.setRectangle(this.labOffset,this.levelHeight+this.labOffset);
    leftWall.body.x = -this.labOffset/2;
    leftWall.body.y = -this.labOffset/2+this.levelHeight/2;
    leftWall.body.static = true;
    this.game.add.existing(leftWall);


    var rightWall=new Phaser.Sprite(this.game,0,0);
    this.game.physics.p2.enable(rightWall,debug);
    rightWall.body.setRectangle(this.labOffset,this.levelHeight+this.labOffset);
    rightWall.body.x = this.levelWidth+(this.labOffset)/2;
    rightWall.body.y = -this.labOffset/2+this.levelHeight/2;
    rightWall.body.static = true;
    this.game.add.existing(rightWall);

    var bottomWall=new Phaser.Sprite(this.game,0,0);
    this.game.physics.p2.enable(bottomWall,debug);
    bottomWall.body.setRectangle(this.levelWidth+this.labOffset*2,this.labOffset);
    bottomWall.body.x = (this.labOffset+this.levelWidth)/2;
    bottomWall.body.y = this.levelHeight+this.labOffset/2;
    bottomWall.body.static = true;
    this.game.add.existing(bottomWall);

    var topWall=new Phaser.Sprite(this.game,0,0);
    this.game.physics.p2.enable(topWall,debug);
    topWall.body.setRectangle(this.levelWidth+this.labOffset*2,this.labOffset);
    topWall.body.x = (this.labOffset+this.levelWidth)/2;
    topWall.body.y = -this.labOffset/2;
    topWall.body.static = true;
    this.game.add.existing(topWall);

    this.spriteArrays.all.push(leftWall);
    this.spriteArrays.all.push(rightWall);
    this.spriteArrays.all.push(bottomWall);
    this.spriteArrays.all.push(topWall);

};


//move bg for parallex effect
evolution.Level.prototype.bgParallex=function(){
    this.calculateParallex(this.aquariumMasked);
    this.calculateParallex(this.labBgMasked);
    this.calculateParallex(this.labBg);
    this.calculateParallex(this.shine);
};



evolution.Level.prototype.calculateParallex=function(bgSprite){
    var bgMovementX=bgSprite.width-this.game.width;
    var bgMovementY=bgSprite.height-this.game.height;
    var boundsWidth=this.levelWidth+this.labOffset*2;
    var boundsHeight=this.levelHeight+this.labOffset*2;

    //level coordinates start at 0,0 but bounds starts at -this.labOffset
    var moveXPercent=(this.game.camera.x+this.labOffset)/(boundsWidth-this.game.width);
    var moveYPercent=(this.game.camera.y+this.labOffset)/(boundsHeight-this.game.height);
    bgSprite.cameraOffset.x=-bgMovementX*moveXPercent;
    bgSprite.cameraOffset.y=-bgMovementY*moveYPercent;
};


evolution.Level.prototype.getObjectById=function(id){
    var foundSprite=this.spriteArrays.all.filter(function(sprite){
        return sprite.id==id;
    });
    return foundSprite.length>0?foundSprite[0]:null;
};

evolution.Level.prototype.focusOnCreatures=function(isInstant){
    var creatureGroupCenter=this.findCenterOfMass(this.layers.creatures);

    if (isInstant){
        this.game.camera.focusOnXY(creatureGroupCenter.x,creatureGroupCenter.y);
    }
    else{
        var movementVector=new Phaser.Point(creatureGroupCenter.x-(this.game.camera.x+this.game.width/2),
            creatureGroupCenter.y-(this.game.camera.y+this.game.height/2));

        //move in steps, if large distance
        if (movementVector.getMagnitude()>=this.cameraSpeed){
            movementVector.setMagnitude(this.cameraSpeed);
        }

        this.game.camera.x+=movementVector.x;
        this.game.camera.y+=movementVector.y;
    }

};

evolution.Level.prototype.findCenterOfMass=function(group){
    var totalX=0;
    var totalY=0;
    group.forEachAlive(function(item){
        totalX+=item.body.x;
        totalY+=item.body.y;
    });
    return {x: totalX/group.countLiving(), y: totalY/group.countLiving()}
};

evolution.Level.prototype.clearControlPointer=function(){
    this.pointerController.clear();
    this.layers.creatures.forEachAlive(function(creature){
        creature.isFollowingPointer=false;
    });
};

evolution.Level.prototype.updatePointerController=function(){
    var pointer=this.game.input.activePointer;
    var minRadius=20;
    var maxRadius=90;
    var maxMouseDownTime=1000;

    var controlRatio=pointer.duration/maxMouseDownTime;
    pointer.controlRatio=controlRatio;

    var controlRadius=Math.min(1,Math.pow(controlRatio,2))*(maxRadius-minRadius)+minRadius;
    if (controlRatio>0){
        this.pointerController.clear();
        this.pointerController.cameraOffset.x=pointer.x;
        this.pointerController.cameraOffset.y=pointer.y;
        this.pointerController.beginFill(0xFFFFFF, 0.1);
        this.pointerController.drawCircle(0, 0,controlRadius);

    }

};

evolution.Level.prototype.addTextGroup=function(textArray,callback){
    this.clearControlPointer();

    var textQueue=textArray.slice(0); //clone the text array
    var currentText=null;
    var currentTextObj=null;

    showNextMessage.call(this);
    this.game.input.onDown.add(showNextMessage,this);

    function showNextMessage(){
        if (currentTextObj){
            var oldTextObj=currentTextObj;
            var fadeOutTween=this.game.add.tween(oldTextObj).to({ alpha: 0}, 600, Phaser.Easing.Cubic.In);
            fadeOutTween.onComplete.addOnce(function(){
                this.layers.gui.remove(oldTextObj);
            },this);
            fadeOutTween.start();
        }
        if (textQueue.length>0){
            currentText=textQueue.shift();
            currentTextObj=this.addTextBubble(this.game.width/2-150,150,currentText);

        }
        else{
            this.game.input.onDown.remove(showNextMessage,this);
            if (callback){callback.call(this);}
        }
    }


};

evolution.Level.prototype.addTextBubble=function(x,y,text){
    var bubbleObject=this.game.add.graphics(0,0,this.layers.gui);
    bubbleObject.fixedToCamera=true;
    bubbleObject.cameraOffset.x=x;
    bubbleObject.cameraOffset.y=y;
    bubbleObject.alpha=0;

    var bubbleWidth=300;
    var bubbleHeight=150;
    var padding=10;

    bubbleObject.beginFill(0x1a6fb9, 0.8);
    bubbleObject.drawRect(0,0,bubbleWidth,bubbleHeight);

    var textObject=new Phaser.Text(this.game,padding,padding,text);
    bubbleObject.addChild(textObject);
    textObject.font = 'Quicksand';
    textObject.fontSize = 18;
    textObject.fill = '#ffffff';
    textObject.wordWrap= true;
    textObject.wordWrapWidth = bubbleWidth-padding*2;

    var continueText=new Phaser.Text(this.game,150,bubbleHeight-25,"( click to continue )");
    bubbleObject.addChild(continueText);
    continueText.font = 'Quicksand';
    continueText.fontSize = 14;
    continueText.fill = '#99a7b3';


    this.game.add.tween(bubbleObject).to({ alpha: 1}, 600, Phaser.Easing.Cubic.In).start();

    return bubbleObject;
};

evolution.Level.prototype.hideInstructionText=function(){
    if (this.instructionText){
        var oldInstructionText=this.instructionText;
        var fadeInTween=this.game.add.tween(oldInstructionText).to({ alpha: 0}, 600, Phaser.Easing.Cubic.In);
        fadeInTween.onComplete.addOnce(function(){
            this.layers.gui.remove(oldInstructionText);
        },this);
        fadeInTween.start();
    }
};

evolution.Level.prototype.showInstructionText=function(text){
    this.hideInstructionText();

    this.instructionText=this.game.add.text(0,0,text,null,this.layers.gui);
    this.instructionText.font = 'Quicksand';
    this.instructionText.fontSize = 22;
    this.instructionText.fill = '#ffffff';
    this.instructionText.fixedToCamera=true;
    this.instructionText.cameraOffset.x=this.game.width/2-this.instructionText.width/2;
    this.instructionText.cameraOffset.y=100;

    this.instructionText.alpha=0;

    this.game.add.tween(this.instructionText).to({ alpha: 1}, 600, Phaser.Easing.Cubic.In).start();

    return this.instructionText;
};

evolution.Level.prototype.addObject=function(objectData){
    var alpha=objectData.hasOwnProperty("alpha")?objectData.alpha:1;

    var objectInstance=new evolution[objectData.constructorName](this,objectData);
    this.layers[objectData.layer].add(objectInstance);
    this.spriteArrays.all.push(objectInstance);

    objectInstance.alpha=alpha;
    return objectInstance;
};

evolution.Level.prototype.removeObject=function(object){
    object.destroy();
};


//static methods
evolution.Level.getDefaultParams=function(params){
    return{
        x: 0,
        y: 0,
        angle: 0,
        id: params.id?params.id:evolution.core.generateId()
    };
};

evolution.Level.prototype.exportObjects=function(){
    var levelObjects=this.spriteArrays.levelObjects;
    var exportArray=[];
    for (var x=0;x<levelObjects.length;x++){
        exportArray.push(levelObjects[x].objectData);
    }
    return exportArray;
};
