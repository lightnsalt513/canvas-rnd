(function (global, factory) {
  global = global;
  global.WhyGalaxy = global.WhyGalaxy || {};
  global.WhyGalaxy.Kv = factory(global);
})(this, function (global, isUndefined) {
  'use strict';

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
        stickyObj: '.wg-kv__sticky',
        customEvent: '.Component' + new Date().getTime(),
        setScroll: false,
        resizeStart: null,
        resizeAttr: {
          w: null,
          h: null,
        },
        viewType: null,
      };
      this.opts = Util.def(defParams, args || {});
      if (!(this.obj = $(this.opts.obj)).length) return;
      this.init();
    }
    Component.prototype = {
      init: function () {
        this.initOpts();
        this.buildPictures();
      },
      loadAfter: function () {
        this.buildScrollMagic();
        this.buildCanvas();
        this.bindEvents(true);
      },
      initOpts: function () {
        this.winWidth = Util.winSize().w;
        if (this.winWidth > RESPONSIVE.MOBILE.WIDTH) {
          this.opts.viewType = 'PC';
        } else if (this.winWidth <= RESPONSIVE.MOBILE.WIDTH) {
          this.opts.viewType = 'MO';
        }
      },
      buildPictures: function () {
        Util.def(this, {
          pictures: {
            instance: null,
            destroy: $.proxy(function () {
              if (this.pictures.instance == null) return;
              this.pictures.instance.destroy();
              this.pictures.instance = null;
            }, this),
            load: $.proxy(function (obj) {
              var deferred = $.Deferred();
              if (this.pictures.instance == null) {
                this.pictures.instance = new PicturesLoaded(obj, {
                  on: {
                    complete: $.proxy(function () {
                      deferred.resolve();
                    }, this),
                  },
                });
              }
              return deferred.promise();
            }, this),
          },
        });
        this.pictures.load(this.obj).done(
          $.proxy(function () {
            this.loadAfter();
          }, this)
        );
      },
      buildScrollMagic: function () {
        var triggerElement = this.obj.find(this.opts.stickyObj).eq(0).get(0);
        var stickyElement = triggerElement;
        var durationRatio = 1.5;
        var duration;
        if (Util.isDevice) {
          duration = Util.winSize().h * durationRatio + 'px';
        } else {
          duration = 100 * durationRatio + '%';
        }
        Util.def(this, {
          scrollmagic: {
            controller: null,
            scene: null,
            stickyOpts: {
              sceneOpts: {
                triggerElement: triggerElement,
                triggerHook: 0,
                duration: duration,
                reverse: true,
              },
              stickyObj: stickyElement,
            },
            changeTween: $.proxy(function (targetScene, newTween) {
              targetScene.removeTween(true);
              targetScene.setTween(newTween);
            }, this),
            buildScene: $.proxy(function () {
              if (this.scrollmagic.controller == null) return;
              this.scrollmagic.scene = new ScrollMagic.Scene(
                this.scrollmagic.stickyOpts.sceneOpts
              )
                .setPin(this.scrollmagic.stickyOpts.stickyObj)
                .addTo(this.scrollmagic.controller);
            }, this),
            destroy: $.proxy(function () {
              if (this.scrollmagic.controller == null) return;
              this.scrollmagic.controller.destroy(true);
              this.scrollmagic.controller = null;
            }, this),
            buildController: $.proxy(function () {
              if (this.scrollmagic.controller !== null) return;
              this.scrollmagic.controller = new ScrollMagic.Controller();
            }, this),
          },
        });
        if (this.obj.get(0).hasOwnProperty('FIXED_ANIMATION_SCENE')) {
          this.scrollmagic.scene = this.obj.get(0).FIXED_ANIMATION_SCENE;
        } else {
          this.scrollmagic.buildController();
          this.scrollmagic.buildScene();
        }
        this.opts.setScroll = true;
      },
      buildCanvas: function () {
        Util.def(this, {
          canvas: {
            instance: {
              PC: null,
              MO: null,
            },
            destroy: $.proxy(function (viewType) {
              if (this.canvas.instance[viewType] == null) return;
              this.canvas.instance[viewType].destroy();
              this.canvas.instance[viewType] = null;
            }, this),
            tween: $.proxy(function (viewType) {
              if (this.canvas.instance[viewType] == null) return;
              return this.canvas.instance[viewType].tweens.instance;
            }, this),
            redraw: $.proxy(function (viewType) {
              if (this.canvas.instance[viewType] == null) return;
              this.canvas.instance[viewType].animation.redraw();
            }, this),
            build: $.proxy(function (viewType) {
              if (this.canvas.instance[viewType] !== null) return;
              this.canvas.instance[viewType] = new CanvasBuild(this.obj, {
                viewType: viewType.toUpperCase(),
                scene: this.scrollmagic.scene,
              });
            }, this),
          },
        });
        this.canvas.build(this.opts.viewType);
        this.scrollmagic.scene.setTween(this.canvas.tween(this.opts.viewType));
      },
      changeEvents: function (event) {
        var events = [],
          eventNames = event.split(' ');
        for (var key in eventNames) {
          events.push(eventNames[key] + this.opts.customEvent);
        }
        return events.join(' ');
      },
      bindEvents: function (type) {
        if (type) {
          $(win).on(
            this.changeEvents('resize orientationchange'),
            $.proxy(this.resizeFunc, this)
          );
        } else {
          $(win).off(
            this.changeEvents('resize orientationchange'),
            $.proxy(this.resizeFunc, this)
          );
        }
      },
      resizeFunc: function () {
        this.winWidth = Util.winSize().w;
        if (this.opts.resizeStart == null) {
          this.opts.resizeStart = this.winWidth;
        }
        win.clearTimeout(this.resizeEndTime);
        this.resizeEndTime = win.setTimeout(
          $.proxy(this.resizeEndFunc, this),
          150
        );
      },
      resizeEndFunc: function () {
        this.opts.resizeStart = null;
        this.setLayout();
      },
      setLayout: function () {
        var _this = this;
        var winWidth = Util.winSize().w;
        function resetLayoutFunc(viewType) {
          var oldViewType = viewType === 'PC' ? 'MO' : 'PC';
          _this.opts.viewType = viewType;
          if (_this.canvas.instance[oldViewType]) {
            _this.canvas.destroy(oldViewType);
          }
          _this.canvas.build(viewType);
          if (_this.opts.setScroll) {
            _this.scrollmagic.changeTween(
              _this.scrollmagic.scene,
              _this.canvas.tween(viewType)
            );
          }
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
      },
      outCallback: function (ing) {
        var callbackObj = this.opts[ing];
        if (callbackObj == null) return;
        callbackObj();
      },
    };

    function CanvasBuild(container, args) {
      if (!(this instanceof CanvasBuild)) {
        return new CanvasBuild(container, args);
      }
      var defParams = {
        obj: container,
        bgArea: '.wg-kv__bg',
        canvas: 'canvas',
        textArea: '.wg-kv__title',
        animationYTarget: '.wg-kv__sticky',
        textStyle: {
          PC: {
            size: 200, // in pixel
          },
          MO: {
            size: 100, // in pixel
          },
        },
        props: {
          PC: {
            from: { scale: 500 },
            to: { scale: 1 },
          },
          MO: {
            from: { scale: 200 },
            to: { scale: 1 },
          },
        },
        viewType: null,
        scene: null,
        customEvent: '.Component' + new Date().getTime(),
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
        this.textArea = this.obj.find(this.opts.textArea).get(0);
        this.bgArea = this.obj.find(this.opts.bgArea);
        this.canvas = this.obj.find(this.opts.canvas).get(0);
        this.ct = this.canvas.getContext('2d');
        this.animationYTarget = this.obj.find(this.opts.animationYTarget);
      },
      initOpts: function () {
        this.textContent = this.textArea.innerText;
        this.textFamily = win.getComputedStyle(this.textArea).fontFamily;
        this.bgColor = this.obj.attr('data-bg-color');
        this.ratio = window.devicePixelRatio || 1;
      },
      returnResponsiveWidth: function () {
        return this.opts.viewType === 'PC'
          ? RESPONSIVE.DESKTOP.WIDTH
          : RESPONSIVE.MOBILE.WIDTH;
      },
      buildAnimation: function () {
        var _this = this;
        Util.def(this, {
          animation: {
            props: this.opts.props[this.opts.viewType],
            updatedProp: {},
            progress: 0,
            updateCanvasOpts: $.proxy(function () {
              this.cvWidth = this.canvas.width = win.innerWidth * this.ratio;
              this.cvHeight = this.canvas.height = win.innerHeight * this.ratio;
              this.newX = this.ratio * (this.cvWidth / 2) - this.cvWidth / 2;
              this.newY = this.ratio * (this.cvHeight / 2) - this.cvHeight / 2;
              this.ct.translate(-this.newX, -this.newY);
              this.ct.scale(this.ratio, this.ratio);
              this.txtX = this.cvWidth / 2;
              this.txtY = this.cvHeight / 2;
              this.textSize = Math.min(
                Math.ceil(
                  (this.opts.textStyle[this.opts.viewType].size /
                    this.returnResponsiveWidth()) *
                    win.innerWidth
                ),
                this.opts.textStyle[this.opts.viewType].size
              );
              this.xOffset = this.obj.attr('data-xoffset')
                ? Math.ceil(
                    (Number(
                      JSON.parse(this.obj.attr('data-xoffset'))[
                        this.opts.viewType
                      ]
                    ) /
                      this.returnResponsiveWidth()) *
                      win.innerWidth
                  )
                : 0;
            }, this),
            draw: $.proxy(function () {
              this.ct.beginPath();
              this.ct.fillStyle = this.bgColor;
              this.ct.rect(0, 0, this.cvWidth, this.cvHeight);
              this.ct.fill();
              this.ct.globalCompositeOperation = 'xor';
              this.ct.beginPath();
              this.ct.font = 'bold ' + this.textSize + 'px ' + this.textFamily;
              this.ct.textBaseline = 'middle';
              this.ct.textAlign = 'center';
              this.ct.fillText(this.textContent, this.txtX, this.txtY);
              this.ct.fill();
            }, this),
            redraw: $.proxy(function () {
              this.animation.updateCanvasOpts();

              var xOffset = this.xOffset * (1 - this.animation.progress);
              this.txtScale = this.animation.updatedProp.scale;
              this.newX =
                this.txtScale * ((this.cvWidth + xOffset) / 2) -
                (this.cvWidth + xOffset) / 2;
              this.newY =
                this.txtScale * (this.cvHeight / 2) - this.cvHeight / 2;
              this.ct.clearRect(0, 0, this.cvWidth, this.cvHeight);
              this.ct.save();
              this.ct.translate(-this.newX, -this.newY);
              this.ct.scale(this.txtScale, this.txtScale);
              this.animation.draw();
              this.ct.restore();
            }, this),
            deleteTweenID: function (prop) {
              var scopeProp = Util.def({}, prop);
              scopeProp._gsTweenID;
              return scopeProp;
            },
            update: $.proxy(function (prop, progress) {
              TweenLite.to(
                this.animation.updatedProp,
                0.5,
                Util.def(prop, {
                  onUpdate: function () {
                    var xOffset = _this.xOffset * (1 - progress);
                    _this.animation.progress = progress;
                    _this.txtScale = _this.animation.updatedProp.scale;
                    _this.newX =
                      _this.txtScale * ((_this.cvWidth + xOffset) / 2) -
                      (_this.cvWidth + xOffset) / 2;
                    _this.newY =
                      _this.txtScale * (_this.cvHeight / 2) -
                      _this.cvHeight / 2;
                    _this.ct.clearRect(0, 0, _this.cvWidth, _this.cvHeight);
                    _this.ct.save();
                    _this.ct.translate(-_this.newX, -_this.newY);
                    _this.ct.scale(_this.txtScale, _this.txtScale);
                    _this.animation.draw();
                    _this.ct.restore();
                  },
                })
              );
            }, this),
            build: $.proxy(function () {
              this.animation.updatedProp = this.animation.deleteTweenID(
                this.animation.props.from
              );
              this.animation.redraw();
            }, this),
          },
        });
        this.animation.build();
      },
      buildTween: function () {
        var _this = this;
        Util.def(this, {
          tweens: {
            instance: null,
            destroy: $.proxy(function () {
              this.tweens.instance.kill();
              this.tweens.instance = null;
            }, this),
            deleteTweenID: function (prop) {
              var scopeProp = Util.def({}, prop);
              scopeProp._gsTweenID;
              return scopeProp;
            },
            build: $.proxy(function () {
              var timeline = new TimelineMax();
              timeline
                .to(
                  this.animation.props.from,
                  0.4,
                  Util.def(this.animation.props.to, {
                    ease: Expo.easeOut,
                    onUpdate: function () {
                      _this.animation.update(
                        _this.tweens.deleteTweenID(_this.animation.props.from),
                        this._time
                      );
                    },
                  })
                )
                .to({}, 0.4, {});
              this.tweens.instance = timeline;
            }, this),
          },
        });
        this.tweens.build();
        var checkScrollFix = function () {
          if (_this.settimeout) {
            clearTimeout(_this.settimeout);
          }
          _this.settimeout = setTimeout(function () {
            if (
              _this.opts.scene.state() === 'DURING' &&
              _this.obj.find('.wg-kv__sticky').css('position') === 'fixed'
            ) {
              _this.obj.addClass('is-loaded');
            } else if (_this.opts.scene.state() === 'BEFORE') {
              _this.obj.addClass('is-loaded');
            } else {
              checkScrollFix();
            }
          }, 100);
        };
        checkScrollFix();
      },
      destroy: function () {
        this.tweens.destroy();
      },
    };

    return Component;
  })();
  return Component;
});

(function (global, factory) {
  $(function () {
    factory(global);
  });
})(this, function (global, isUndefined) {
  'use strict';

  var Component = (function () {
    var win = global,
      $ = win.jQuery,
      Util = win.WhyGalaxy.util;

    function Component(args) {
      var defParams = {
        obj: '.wg-kv',
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
          new win.WhyGalaxy.Kv(this.obj.eq(i));
        }
      },
    };
    return new Component();
  })();
  return Component;
});
