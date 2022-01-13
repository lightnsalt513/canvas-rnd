(function (global, factory) {
    global = global;
    global.WhyGalaxy = global.WhyGalaxy || {};
    global.WhyGalaxy.Invert = factory(global);
})(this, function (global, isUndefined) {
    "use strict";

    var Component = (function () {
        var win = global,
            $ = win.jQuery,
            Util = win.WhyGalaxy.util,
            RESPONSIVE = win.WhyGalaxy.RESPONSIVE;

        function Component(container, args) {
            if (!(this instanceof Component)) {
                return new Component(container, args);
            }
            var defParams = {
                obj: container,
                stickyObj: ".wg-invert__sticky",
                customEvent: ".Component" + new Date().getTime(),
                resizeStart: null,
                resizeAttr : {
                    w: null,
                    h: null
                },
                viewType: null
            };
            this.opts = Util.def(defParams, args || {});
            if (!(this.obj = $(this.opts.obj)).length) return;
            this.init();
        }
        Component.prototype = {
            init: function () {
                this.initOpts();
                this.buildScrollMagic();
                this.buildCanvas();
                this.bindEvents(true);
            },
            initOpts : function () {
                this.winWidth = Util.winSize().w;
                if (this.winWidth > RESPONSIVE.MOBILE.WIDTH) {
                    this.opts.viewType = 'PC';
                } else if (this.winWidth <= RESPONSIVE.MOBILE.WIDTH) {
                    this.opts.viewType = 'MO';
                }
            },
            buildScrollMagic : function () {
                var triggerElement = this.obj.find(this.opts.stickyObj).eq(0).get(0);
                var stickyElement = triggerElement;
                var durationRatio = 2.5;
                var duration;
                if (Util.isDevice) {
                    duration = (Util.winSize().h * durationRatio) + 'px';
                } else {
                    duration = (100 * durationRatio) + '%';
                }
                Util.def(this, {
                    scrollmagic : {
                        controller : null,
                        scene : null,
                        stickyOpts : {
                            sceneOpts : {
                                triggerElement : triggerElement,
                                triggerHook : 0,
                                duration : duration,
                                reverse : true
                            },
                            stickyObj : stickyElement
                        },
                        changeTween : $.proxy(function (targetScene, newTween) {
                            targetScene.removeTween(true);
                            targetScene.setTween(newTween);
                        }, this),
                        buildScene : $.proxy(function () {
                            if (this.scrollmagic.controller == null) return;
                            this.scrollmagic.scene = new ScrollMagic.Scene(this.scrollmagic.stickyOpts.sceneOpts)
                                .setPin(this.scrollmagic.stickyOpts.stickyObj)
                                .addTo(this.scrollmagic.controller);
                        }, this),
                        destroy : $.proxy(function () {
                            if (this.scrollmagic.controller == null) return;
                            this.scrollmagic.controller.destroy(true);
                            this.scrollmagic.controller = null;
                        }, this),
                        buildController: $.proxy(function () {
                            if (this.scrollmagic.controller !== null) return;
                            this.scrollmagic.controller = new ScrollMagic.Controller();
                        }, this)
                    }
                });
                if (this.obj.get(0).hasOwnProperty('FIXED_ANIMATION_SCENE')) {
                    this.scrollmagic.scene = this.obj.get(0).FIXED_ANIMATION_SCENE;
                } else {
                    this.scrollmagic.buildController();
                    this.scrollmagic.buildScene();
                }
            },
            buildCanvas: function () {
                Util.def(this, {
                    canvas : {
                        instance : {
                            PC : null,
                            MO : null
                        },
                        destroy : $.proxy(function(viewType) {
                            if (this.canvas.instance[viewType] == null) return;
                            this.canvas.instance[viewType].destroy();
                            this.canvas.instance[viewType] = null;
                        }, this),
                        tween : $.proxy(function(viewType) {
                            if (this.canvas.instance[viewType] == null) return;
                            return this.canvas.instance[viewType].tweens.instance;
                        }, this), 
                        redraw : $.proxy(function(viewType) {
                            if (this.canvas.instance[viewType] == null) return;
                            this.canvas.instance[viewType].animation.redraw();
                        }, this),
                        build : $.proxy(function(viewType) {
                            if (this.canvas.instance[viewType] !== null) return;
                            this.canvas.instance[viewType] = new CanvasBuild(this.obj, {
                                viewType : viewType.toUpperCase(),
                                scene : this.scrollmagic.scene[1]
                            });
                        }, this)
                    }
                });
                this.canvas.build(this.opts.viewType);
                this.scrollmagic.scene.setTween(this.canvas.tween(this.opts.viewType));
            },
            changeEvents: function (event) {
                var events = [],
                    eventNames = event.split(" ");
                for (var key in eventNames) {
                    events.push(eventNames[key] + this.opts.customEvent);
                }
                return events.join(" ");
            },
            bindEvents: function (type) {
                if (type) {
                    $(win).on(this.changeEvents('resize orientationchange'), $.proxy(this.resizeFunc, this));
                } else {
                    $(win).off(this.changeEvents('resize orientationchange'), $.proxy(this.resizeFunc, this));
                }
            },
            resizeFunc : function () {
                this.winWidth = Util.winSize().w;
                if (this.opts.resizeStart == null) {
                    this.opts.resizeStart = this.winWidth;
                }
                win.clearTimeout(this.resizeEndTime);
                this.resizeEndTime = win.setTimeout($.proxy(this.resizeEndFunc, this), 150);
            },
            resizeEndFunc : function () {
                this.opts.resizeStart = null;
                this.setLayout();
            },
            setLayout : function () {
                var _this = this;
                var winWidth = Util.winSize().w;
                function resetLayoutFunc (viewType) {
                    var oldViewType = (viewType === 'PC') ? 'MO' : 'PC';
                    _this.opts.viewType = viewType;
                    if (_this.canvas.instance[oldViewType]) {
                        _this.canvas.destroy(oldViewType);
                    }
                    _this.canvas.build(viewType);
                }

                if (this.winWidth > RESPONSIVE.MOBILE.WIDTH) {
                    if (this.opts.viewType !== 'PC') {
                        resetLayoutFunc('PC');
                    } else {
                        this.canvas.redraw('PC');
                    }
                } else if (this.winWidth <= RESPONSIVE.MOBILE.WIDTH) {
                    if (this.opts.viewType !== 'MO') {
                        resetLayoutFunc('MO');
                    } else {
                        if (this.opts.resizeAttr.w != winWidth) {
                            this.canvas.redraw('MO');
                        }
                    }
                }
                this.opts.resizeAttr.w = winWidth;
                this.scrollmagic.changeTween(this.scrollmagic.scene, this.canvas.tween(this.opts.viewType));
            },
            outCallback: function (ing) {
                var callbackObj = this.opts[ing];
                if (callbackObj == null) return;
                callbackObj();
            }
        };

        function CanvasBuild(container, args) {
            if (!(this instanceof CanvasBuild)) {
                return new CanvasBuild(container, args);
            }
            var defParams = {
                obj: container,
                canvasFront: ".wg-invert__front",
                canvasBack: ".wg-invert__back",
                textArea: ".wg-invert__title",
                typeClass: {
                    PC : '.is-pc',
                    MO : '.is-mo'
                },
                textStyle: {
                    PC : {
                        size : 120, // in pixel
                        lineHeight : 1.32
                    },
                    MO : {
                        size : 100, // in pixel
                        lineHeight : 1.32
                    }
                },
                textMaxWidth : {
                    PC : 1240, // padding 제외 너비
                    MO : null
                },
                textLeftPadding : {
                    PC : 100,
                    MO : 60 // 768 사이즈 기준 간격
                },
                textYBuffer : {
                    PC : 40,
                    MO : 20
                },
                props : {
                    from : {
                        progress : 0
                    },
                    to : {
                        progress : 1
                    }
                },
                viewType : null,
                scene : null,
                customEvent: ".Component" + new Date().getTime(),
            };
            this.opts = Util.def(defParams, args || {});
            if (!(this.obj = $(this.opts.obj)).length) return;
            this.init();
        }
        CanvasBuild.prototype = {
            init: function () {
                this.setElements();
                this.initOpts();
                this.buildAnimation();
                this.buildTween();
            },
            setElements: function () {
                this.textArea = this.obj.find(this.opts.textArea);
                this.canvas = this.obj.find(this.opts.canvasFront).get(0);
                this.ct = this.canvas.getContext("2d");
                this.canvasBack = this.obj.find(this.opts.canvasBack).get(0);
                this.ctBack = this.canvasBack.getContext("2d");
            },
            initOpts: function () {
                this.targetText = this.obj.find(this.opts.textArea + this.opts.typeClass[this.opts.viewType]).get(0);
                this.textContent = this.targetText.innerHTML;
                this.textLines = this.textContent.split('<br>');
                this.textFamily = win.getComputedStyle(this.targetText).fontFamily;
                this.ratio = window.devicePixelRatio || 1;
            },
            returnResponsiveWidth : function () {
                return (this.opts.viewType === 'PC') ? RESPONSIVE.DESKTOP.WIDTH : RESPONSIVE.MOBILE.WIDTH;
            },
            buildAnimation : function () {
                var _this = this;
                Util.def(this, {
                    animation : {
                        props : this.opts.props,
                        updatedProp : {},
                        progress : 0,
                        updateCanvasOpts : $.proxy(function () {
                            var viewType = this.opts.viewType;
                            this.cvWidth = this.canvas.width = this.canvasBack.width = win.innerWidth * this.ratio;
                            this.cvHeight = this.canvas.height = this.canvasBack.height = win.innerHeight * this.ratio;
                            this.newX = this.ratio * (this.cvWidth / 2) - this.cvWidth / 2;
                            this.newY = this.ratio * (this.cvHeight / 2) - this.cvHeight / 2;
                            this.ct.translate(-this.newX, -this.newY);
                            this.ct.scale(this.ratio, this.ratio);
                            this.ctBack.translate(-this.newX, -this.newY);
                            this.ctBack.scale(this.ratio, this.ratio);
                            
                            this.textSize = Math.min(Math.ceil(this.opts.textStyle[viewType].size / this.returnResponsiveWidth() * win.innerWidth), this.opts.textStyle[viewType].size);
                            this.textLineheight = this.textSize * this.opts.textStyle[viewType].lineHeight;
                            this.totalLineheight = this.textLineheight * this.textLines.length;
                            this.textYBuffer = (this.opts.textYBuffer[viewType] / this.opts.textStyle[viewType].size) * this.textSize;
                            if (this.opts.textMaxWidth[viewType] === null) {
                                this.textLeftPadding = Math.ceil(this.opts.textLeftPadding[viewType] / this.returnResponsiveWidth() * win.innerWidth);
                            } else {
                                this.textLeftPadding = (win.innerWidth < (this.opts.textMaxWidth[viewType] + (this.opts.textLeftPadding[viewType]*2)))
                                                    ? Math.ceil(this.opts.textLeftPadding[viewType] / this.returnResponsiveWidth() * win.innerWidth)
                                                    : Math.ceil((win.innerWidth - this.opts.textMaxWidth[viewType]) / 2);
                            }
                            // this.txtX = this.cvWidth / 2; // for centering text
                            this.txtX = (this.ratio > 1) ? this.textLeftPadding + (this.cvWidth - win.innerWidth)/2 : this.textLeftPadding;
                            this.txtY = (this.textLines.length > 1) ? (this.cvHeight - this.textLines.length * this.textLineheight) / 2 + this.textYBuffer : this.cvHeight / 2;
                        }, this),
                        draw : $.proxy(function (progress) {
                            var firstProgress = (progress > 0.8) ? 1 : progress / 0.8; // 0 - 0.8 구간적용 (전체: 0 ~ 1)
                            var secondProgress = (progress - 0.3) / (1 - 0.3); // 0.3 - 1 구간적용 (전체: 0 ~ 1)
                            var widthFront = win.innerWidth/2 * (1 - firstProgress);
                            var widthBack = (win.innerWidth/2 - widthFront) * (1 - secondProgress);
                            var frontXLeft = (this.cvWidth - win.innerWidth)/2;
                            var frontXRight = this.cvWidth/2 + (win.innerWidth/2 - widthFront);
                            var backXLeft = frontXLeft + widthFront;
                            var backXRight = this.cvWidth/2 + (this.cvWidth/2 - (backXLeft + widthBack));

                            // gray bg
                            this.ctBack.beginPath();
                            this.ctBack.fillStyle = "#dfdfdf";
                            this.ctBack.rect(backXLeft, 0, widthBack, this.cvHeight);
                            this.ctBack.rect(backXRight, 0, widthBack, this.cvHeight);
                            this.ctBack.fill();

                            // front text & bg
                            this.ct.beginPath();
                            this.ct.fillStyle = "black";
                            this.ct.font = "bold " + this.textSize + "px " +  this.textFamily;
                            this.ct.textBaseline = "middle";
                            // this.ct.textAlign = "center"; // for centering text
                            this.ct.textAlign = "left";
                            for (var i = 0, max = this.textLines.length; i < max; i++) {
                                this.ct.fillText(this.textLines[i].trim(), this.txtX, this.txtY + this.textLineheight * i);
                            }
                            this.ct.fill();
                            this.ct.globalCompositeOperation = "xor";
                            this.ct.beginPath();
                            this.ct.fillStyle = "black";
                            this.ct.rect(frontXLeft, 0, widthFront, this.cvHeight);
                            this.ct.rect(frontXRight, 0, widthFront, this.cvHeight);
                            this.ct.fill();
                        }, this),
                        redraw : $.proxy(function () {
                            this.animation.updateCanvasOpts();
                            this.ct.clearRect(0, 0, this.cvWidth, this.cvHeight);
                            this.ctBack.clearRect(0, 0, this.cvWidth, this.cvHeight);
                            this.animation.draw(this.animation.progress);
                        }, this),
                        update : $.proxy(function (prop, progress) {
                            TweenLite.to(this.animation.updatedProp, 0.3, Util.def(prop, {
                                onUpdate : function () {
                                    _this.animation.progress = progress;
                                    _this.ct.clearRect(0, 0, _this.cvWidth, _this.cvHeight);
                                    _this.ctBack.clearRect(0, 0, _this.cvWidth, _this.cvHeight);
                                    _this.animation.draw(_this.animation.updatedProp.progress);
                                }
                            }));
                        }, this),
                        build : $.proxy(function () {
                            this.animation.redraw();
                        }, this)
                    }
                });
                this.animation.build();
            },
            buildTween : function () {
                var _this = this;
                Util.def(this, {
                    tweens : {
                        instance : null,
                        destroy : $.proxy(function () {
                            this.tweens.instance.kill();
                            this.tweens.instance = null
                        }, this),
                        deleteTweenID : function (prop) {
                            var scopeProp = Util.def({}, prop);
                            scopeProp._gsTweenID;
                            return scopeProp;
                        },
                        build : $.proxy(function () {
                            var timeline = new TimelineMax();
                            timeline
                            .to({}, 0.3, {})
                            .to(this.animation.props.from, 0.4, Util.def(this.animation.props.to, {
                                ease: Power2.easeOut,
                                onUpdate : function () {
                                    _this.animation.update(_this.tweens.deleteTweenID(_this.animation.props.from), this._time);
                                }
                            }))
                            .to({}, 0.3, {})
                            this.tweens.instance = timeline;
                        }, this)
                    }
                });
                this.tweens.build();
            },
            destroy: function () {
                this.tweens.destroy();
            }
        }

        return Component;
    })();
    return Component;
});

(function (global, factory) {
    $(function () {
        factory(global);
    });
})(this, function (global, isUndefined) {
    "use strict";

    var Component = (function () {
        var win = global,
            $ = win.jQuery,
            Util = win.WhyGalaxy.util;

        function Component(args) {
            var defParams = {
                obj: ".wg-invert",
            };
            this.opts = Util.def(defParams, args || {});
            if (!(this.obj = $(this.opts.obj)).length) return;
            this.init();
        }
        Component.prototype = {
            init: function () {
                this.callComponent();
            },
            callComponent: function () {
                for (var i = 0, max = this.obj.length; i < max; i++) {
                    new win.WhyGalaxy.Invert(this.obj.eq(i));
                }
            },
        };
        return new Component();
    })();
    return Component;
});
