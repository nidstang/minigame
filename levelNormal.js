(function () {

    function LevelNormal(mapFile, bg, posSp, posBg, ctxAudio) {
        Scene.call(this, mapFile, 64, 32, ctxAudio);

        this.background = resources.get(bg);
        this.xSplash = posSp[0];
        this.ySplash = posSp[1];
        this.xBackgroud = posBg[0];
        this.yBackgroud = posBg[1];
        this.bgmusic = 'test3.wav';
        this.flagSound = false;
        this.bullets = [];
        this.music = null;
        this.finale = false;
        this.coins = [];
        this.score = $("#score");

        this.reset = function() {
            Scene.prototype.reset.call(this);
            this.bullets = [];
            this.flagSound = false;
            this.music = null;
        }

        this.init = function() {
            Scene.prototype.init.call(this);

        };

        this.render = function(ctx) {
            Scene.prototype.render.call(this, ctx);

            //Render Bullets
            for(var i = 0; i < this.bullets.length; i++) {
                if(this.bullets[i])
                    this.bullets[i].render(ctx);
            }

            //Render all coins
            if(GameState.game == 'start') {
                for(var i = 0; i < this.coins.length; i++) {
                    if(this.coins[i])
                        this.coins[i].render(ctx);
                }
            }

            //Redner Boss
            this.boss.render(ctx);
        };

        //Functions
        this.update = function(dt, controls) {
            Scene.prototype.update.call(this, dt, controls);

            if(GameState.game == 'start') {

                //Player
                if(controls.up) {
                    if(this.collision && !flagSound) {
                        this.audio.make(this.sounds.jump.buffer, this.sounds.jump.loop).start(contextAudio.currentTime);
                        flagSound = true;
                    }
                }
                if(controls.up || this._player.jumped) {
                    this._player.jump(dt, this.collision);
                } else {
                    flagSound = false;
                }

                if(!this.collision && !this._player.jumped) {
                    this._player.y += this._player.speedDown * dt;
                }

                //Enemies
                for(i = 0; i < this._enemies.length; i++) {
                    this.collisionEnemy = false;
                    for(j = 0; j < this._plataforms.length; j++) {
                        if(this._plataforms[j].type != 'i') {
                            if(!this._enemies[i].isDie) {
                                if(this._enemies[i].checkCollision(this._plataforms[j])) {
                                    this.collisionEnemy = true;
                                    break;
                                }
                            }
                        }
                    }
                    if(this._enemies[i].x >= -(this.viewport.offsetx+this._sizeTile) && this._enemies[i].x <= (-(this.viewport.offsetx) + canvas.width)) {
                        this._enemies[i].rendering = true;
                        this._enemies[i].moving = true;
                    } else {
                        this._enemies[i].rendering = false;
                    }

                    //Moving Enemies
                    
                    if(this._enemies[i].moving) {
                        if(!this._enemies[i].isDie) {
                            this._enemies[i].move(dt);
                            this._enemies[i].runAnimations();
                        }
                        if(!this.collisionEnemy && !this._enemies[i].jumped) {
                            this._enemies[i].stopAnimations();
                            this._enemies[i].down(dt);
                        }
                    }

                    //Collision player with enemies
                    if(!this._enemies[i].isDie) {
                        if(this._player.checkCollisionEnemy(this._enemies[i], this.viewport)) {
                            this._player.die(dt);
                            GameState.game = 'die';
                            //console.log(GameState.game);
                            break;
                        }
                    }

                    //Collision enemy with bullets

                    for(var k = 0; k < this.bullets.length; k++) {
                        if(!this._enemies[i].isDie) {
                            if(this.bullets[k]) {
                                if(this._enemies[i].checkCollisionBullet(this.bullets[k])) {
                                    this._enemies[i].die(dt);
                                    //delete the bullet
                                    delete this.bullets[k];
                                }
                            }
                        }
                    }

                    //Animation death enemis
                    if(this._enemies[i].jumped) {
                        this._enemies[i].jump(dt);
                    }

                    //Update
                    this._enemies[i].update(dt);
                }

                //Collision player with coins
                for(var i = 0; i < this.coins.length; i++) {
                    if(this.coins[i]) {
                        if(this._player.checkCollisionEnemy(this.coins[i], this.viewport)) {
                            //+ Score
                            var scoreLast = ~~this.score.text();
                            this.score.text(scoreLast + this.coins[i].score);

                            delete this.coins[i];
                        }
                    }
                }

                //Collision player with special plataforms
                for(j = 0; j < this._plataforms.length; j++) {
                    
                    if(this._plataforms[j].type == 'o') {
                        if(this._player.checkCollisionEnemy(this._plataforms[j], this.viewport)) {
                            if(!this.finale)
                                this.finale = true;
                            for(var o = 0; o < this._plataforms.length; o++) {
                                if(this._plataforms[o].type == 'k') {
                                    if(!this._plataforms[o].fallen) {
                                        this._plataforms[o].broken();

                                        //Create plataforms of background
                                        this._plataforms.push(new Plataform(this._plataforms[o].lastX,this._plataforms[o].lastY,this._sizeTile,this._sizeTile,null, 'img/relleno.png', 'i'));
                                    }
                                }
                            }
                        }
                    }
                }

                //Fallen special plataforms whenever finale is true
                if(this.finale) {
                    if(this.boss.hidden)
                        this.boss.hidden = false;
                    for(var o = 0; o < this._plataforms.length; o++) {
                        if(this._plataforms[o].type == 'k') {
                            if(this.specials > 0) {
                                //this._plataforms[o].Viewx = this.viewport.offsetx;
                                this._plataforms[o].update(dt);
                                if(this._plataforms[o].endDisapear)
                                    this.specials--;
                            }
                        }
                    }
                }
            }

            if(GameState.game == 'die') {
                if(this._player.jumped) {
                    this._player.jump(dt, false);
                } else {
                    this._player.y += this._player.speedDown * dt;
                }
            }

            if(GameState.game != 'die') {

                //Shoots
                if(this._player.shooting) {
                    if(this._player.isFinaleShooting()) {
                        var posy = this._player.y, posx = 0;
                        if((this._player.x-this.viewport.offsetx) <= this._player.x) {
                            posx = this._player.x;
                            if(this._player.dir == 'right')
                                posx += 50; //Ajuste en right
                        }
                        else {
                            posx = ((this._player.x + this._player.width/2) - this.viewport.offsetx);
                        }
                        if(this._player.dir == 'left')
                            posx -= 50; //Ajuste en left
                        this.bullets.push(new Bullet(posx, posy, 300, this._player.dir));
                        this._player.shooting = false;
                        this._player.stopAnimations();
                        this._player.idle();

                    } 
                }

                if(controls.space) {
                    if(!this._player.shooting) {
                        this._player.stopAnimations();
                        this._player.shoot();
                        this._player.runAnimations();
                        this._player.shooting = true;
                    }
                }

                //Update Bullets
                for(var i = 0; i < this.bullets.length; i++) {
                    //console.log(this.bullets);
                    if(this.bullets[i]) {
                        if(this.bullets[i].x >= -(this.viewport.offsetx+this._sizeTile) && this.bullets[i].x <= (-(this.viewport.offsetx) + canvas.width)) {
                            this.bullets[i].update(dt);
                        } else {
                            delete this.bullets[i];
                        }
                    }
                }
            }

            //Die Player for fallen
            if(this._player.y >= 570) {
                GameState.game = 'reset';
                //this.music.stop();
                this.reset();
            }

            if(GameState.game == 'start' || GameState.game == 'die') {
                //update player position
                this._player.Viewx = this.viewport.offsetx;
                this._player.Viewy = this.viewport.offsety;
                this._player.update(dt);

                this.boss.update(dt);
            }
        };
    };

    LevelNormal.prototype = new Scene;

    window.LevelNormal = LevelNormal;

})();