(function (global, factory) {
    global = global;
    global.PictureImg = factory();
}(this, function () { 'use strict';
    var PictureImg = (function (isUndefined) {
        var win = window,
            $ = win.jQuery,
            Util = win.WhyGalaxy.util;
        function PictureImg (container, args) {
            if (!(this instanceof PictureImg)) {
                return new PictureImg(container, args);
            }
            var defParams = {
                container : container,
                target : 'img, .js-img-bg',
                props : [],
                classAttr : {
                    active : 'is-active',
                    bg : 'js-img-bg'
                },
                customEvent : '.PictureImg' + (new Date()).getTime() + Math.random(),
                viewType : null,
                resizeStart : null,
                on : {
                    complete : null
                }
            };
            this.opts = Util.def(defParams, (args || {}));
            if (!(this.obj = $(this.opts.container)).length) return;
            if (this.obj.attr('data-load') == 'true') return;
            this.init();
        }
        PictureImg.prototype = {
            init : function () {
                this.setElements();
                this.initOpts();
                this.resizeFunc();
                this.bindEvents(true);
                this.obj.attr('data-load', 'true');
                this.obj.data('PictureImg', this);
            },
            setElements : function () {
                this.targets = this.obj.find(this.opts.target).hide();
            },
            initOpts : function () {
                var _this = this;
                var mediaParse = function (str) {
                    var parse = '';
                    if ((str !== isUndefined) && (str.length)) {
                        parse = str.replace(/\s/gi, "").replace(/\(/gi, '').replace(/\)/gi, '');
                    } else {
                        parse = '';
                    }
                    return parse;
                };
                for (var min = 0, max = this.targets.length; min < max; min++) {
                    var target = this.targets.eq(min),
                        bgType = target.hasClass(this.opts.classAttr.bg),
                        dataMedia = $.trim(target.attr('data-media')),
                        dataMediaParse = mediaParse(dataMedia),
                        andSplits = dataMediaParse.split('and');
                    if (dataMediaParse.length) {
                        var data = {
                            'TARGET' : target,
                            'BGTYPE' : bgType
                        };
                        for (var asMin = 0, asMax = andSplits.length; asMin < asMax; asMin++) {
                            var aSplit = andSplits[asMin],
                                oSplit = aSplit.split(':');
                            if (oSplit[0] === 'min-width') {
                                data['MIN'] = parseInt(oSplit[1]);
                            } else if (oSplit[0] === 'max-width') {
                                data['MAX'] = parseInt(oSplit[1]);
                            }
                        }
                        this.opts.props.push(data);
                    }
                }

                // empty value modify
                var maxCheck = function (num) {
                    var props = _this.opts.props,
                        maxs = [];
                    for (var aMin = 0, aMax = props.length; aMin < aMax; aMin++) {
                        var prop = props[aMin];
                        if (num > prop['MAX']) {
                            maxs.push(prop['MAX']);
                        }
                    }
                    return maxs.length ? (Math.max.apply(null, maxs) + 1) : 0;
                };
                var minCheck = function (num) {
                    var props = _this.opts.props,
                        mins = [];
                    for (var bMin = 0, bMax = props.length; bMin < bMax; bMin++) {
                        var prop = props[bMin];
                        if (num < prop['MIN']) {
                            mins.push(prop['MIN']);
                        }
                    }
                    return mins.length ? (Math.min.apply(null, mins) - 1) : Infinity;
                };
                for (var pMin = 0, pMax = this.opts.props.length; pMin < pMax; pMin++) {
                    var prop = this.opts.props[pMin];
                    if (!prop.hasOwnProperty('MIN')) {
                        prop['MIN'] = maxCheck(prop['MAX']);
                    }
                    if (!prop.hasOwnProperty('MAX')) {
                        prop['MAX'] = minCheck(prop['MIN']);
                    }
                }

                // sort
                this.opts.props.sort(function (a, b) {
                    if (a.MIN > b.MIN) {
                        return 1;
                    }
                    if (a.MIN < b.MIN) {
                        return -1;
                    }
                    if (a.MAX > b.MAX) {
                        return 1;
                    }
                    if (a.MAX < b.MAX) {
                        return -1;
                    }
                    return 0;
                });
            },
            changeEvents : function (event) {
                var events = [],
                    eventNames = event.split(' ');
                for (var key in eventNames) {
                    events.push(eventNames[key] + this.opts.customEvent);
                }
                return events.join(' ');
            },
            bindEvents : function (type) {
                if (type) {
                    $(win).on(this.changeEvents('resize orientationchange'), $.proxy(this.resizeFunc, this));
                } else {
                    $(win).off(this.changeEvents('resize orientationchange'));
                }
            },
            resizeFunc : function () {
                this.winWidth = Util.winSize().w;
                if (this.opts.resizeStart == null) {
                    this.opts.resizeStart = this.winWidth;
                    this.resizeAnimateFunc();
                }
                win.clearTimeout(this.resizeEndTime);
                this.resizeEndTime = win.setTimeout($.proxy(this.resizeEndFunc, this), 50);
            },
            resizeEndFunc : function () {
                this.opts.resizeStart = null;
                Util.cancelAFrame.call(win, this.resizeRequestFrame);
            },
            resizeAnimateFunc : function () {
                this.setLayout();
                this.resizeRequestFrame = Util.requestAFrame.call(win, $.proxy(this.resizeAnimateFunc, this));
            },
            setLayout : function () {
                var props = this.opts.props,
                    actives = [];
                for (var pMin = 0, pMax = props.length; pMin < pMax; pMin++) {
                    var prop = props[pMin];
                    if (prop['MIN'] <= this.winWidth && prop['MAX'] >= this.winWidth) {
                        actives.push(pMin);
                    }
                }
                if (actives.length) {
                    var activeNum = actives[actives.length - 1];
                    if (this.opts.viewType != activeNum) {
                        if (this.opts.viewType !== null) {
                            props[this.opts.viewType]['TARGET'].hide().removeClass(this.opts.classAttr.active);
                        }
                        this.opts.viewType = activeNum;
                        if (props[activeNum]['TARGET'].attr('data-srcset') != isUndefined) {
                            props[activeNum]['TARGET'].removeAttr('src');
                            var url = props[activeNum]['TARGET'].attr('data-srcset');
                            if (props[activeNum]['BGTYPE']) {
                                props[activeNum]['TARGET'].css('background-image', 'url(' + url + ')');
                            } else {
                                props[activeNum]['TARGET'].attr('src', url);
                            }
                            props[activeNum]['TARGET'].removeAttr('data-srcset');
                            // Util.imgLoaded(props[activeNum]['TARGET']);
                        }
                        props[activeNum]['TARGET'].css('display', '').addClass(this.opts.classAttr.active);
                        this.outCallback('complete');
                    }
                } else {
                    if (this.opts.viewType !== null) {
                        this.opts.viewType = null;
                        this.targets.hide().removeClass(this.opts.classAttr.active);
                    }
                }
            },
            outCallback : function (ing) {
                var callbackObj = this.opts.on[ing];
                if (callbackObj == null) return;
                callbackObj();
            }
        };
        return PictureImg;
    })();
    return PictureImg;
}));
