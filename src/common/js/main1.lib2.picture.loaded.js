(function (global, factory) {
    global = global;
    global.PicturesLoaded = factory();
}(this, function () { 'use strict';
    
    var PicturesLoaded = (function (isUndefined) {
        var win = window,
            $ = win.jQuery,
            doc = win.document,
            Util = win.WhyGalaxy.util;
            
        function PicturesLoaded (container, args) {
            if (!(this instanceof PicturesLoaded)) {
                return new PicturesLoaded(container, args);
            }
            var defParams = {
                jsPicture : '.js-picture',
                videoContainer : '.video-container',
                stateAttr : {
                    destroy : false
                },
                on : {
                    update : null,
                    complete : null
                }
            };
            this.opts = Util.def(defParams, (args || {}));
            if (!(this.obj = $(container)).length) return;
            this.init();
        }
        PicturesLoaded.prototype = {
            init : function () {
                this.loadPictures();
            },
            loadPictures : function () {
                Util.def(this, {
                    pictures : {
                        img : {
                            active : false,
                            load : $.proxy(function (obj, callback) {
                                var deferred = $.Deferred();
                                var objLength = obj.length;
                                var doneNum = 0;
                                var allDoneFunc = $.proxy(function (obj) {
                                    callback(obj);
                                    if (doneNum == objLength) {
                                        if (this.opts.stateAttr.destroy) {
                                            deferred.reject();
                                        } else {
                                            deferred.resolve();
                                        }
                                    }
                                }, this);
                                var load = $.proxy(function (index) {
                                    var el = obj.eq(index);
                                    var hasLoad = el.attr('data-load') == 'true';
                                    if (hasLoad) {
                                        doneNum++;
                                        allDoneFunc(el);
                                    } else {
                                        new PictureImg(el);
                                        Util.imgLoaded(el).done($.proxy(function () {
                                            doneNum++;
                                            allDoneFunc(el);
                                        }, this));
                                    }
                                }, this)
                                for (var i = 0, max = objLength; i < max; i++) {
                                    load(i);
                                }
                                if (!obj.length) {
                                    allDoneFunc();
                                }
                                return deferred.promise();
                            }, this)
                        },
                        video : {
                            instance : [],
                            active : false,
                            destroy : $.proxy(function () {
                                for (var i = 0, max = this.pictures.video.instance.length; i < max; i++) {
                                    var instance = this.pictures.video.instance[i];
                                    instance.pause();
                                    instance.destroy();
                                }
                                this.pictures.video.instance = [];
                            }, this),
                            pauseAll : $.proxy(function () {
                                for (var i = 0, max = this.pictures.video.instance.length; i < max; i++) {
                                    var instance = this.pictures.video.instance[i];
                                    instance.pause();
                                }
                            }, this),
                            load : $.proxy(function (obj, callback) {
                                var deferred = $.Deferred();
                                var objLength = obj.length;
                                var doneNum = 0;
                                var allDoneFunc = $.proxy(function (obj) {
                                    callback(obj);
                                    if (doneNum == objLength) {
                                        if (this.opts.stateAttr.destroy) {
                                            deferred.reject();
                                        } else {
                                            deferred.resolve();
                                        }
                                    }
                                }, this);
                                var load = $.proxy(function (index) {
                                    var el = obj.eq(index);
                                    var hasLoad = el.attr('data-video-loaded') == 'true';
                                    if (hasLoad) {
                                        var instance = el.data('HiveVideo');
                                        doneNum++;
                                        allDoneFunc(el);
                                    } else {
                                        var instance = new HiveVideo(el, {
                                            isLoadAfterVideoPlay : true,
                                            on : {
                                                loaded : $.proxy(function () {
                                                    doneNum++;
                                                    allDoneFunc(el);
                                                }, this)
                                            }
                                        });
                                    }
                                    this.pictures.video.instance.push(instance);
                                }, this)
                                for (var i = 0, max = objLength; i < max; i++) {
                                    load(i);
                                }
                                if (!obj.length) {
                                    allDoneFunc();
                                }
                                return deferred.promise();
                            }, this)
                        },
                        destroy : $.proxy(function () {
                            // this.pictures.video.destroy();
                            this.pictures.video.pauseAll();
                        }, this),
                        load : $.proxy(function (obj) {
                            var deferred = $.Deferred();
                            var jsPictures = obj.find(this.opts.jsPicture);
                            var videoContainers = obj.find(this.opts.videoContainer);
                            this.pictures.img.active = jsPictures.length ? false : true;
                            this.pictures.video.active = videoContainers.length ? false : true;
                            var totalLength = jsPictures.length + videoContainers.length;
                            var doneNum = 0;
                            var allDone = $.proxy(function () {
                                if (this.pictures.img.active && this.pictures.video.active) {
                                    if (this.opts.stateAttr.destroy) {
                                        deferred.reject();
                                    } else {
                                        deferred.resolve();
                                    }
                                }
                            }, this);
                            var updateCallback = $.proxy(function (obj) {
                                doneNum++;
                                this.outCallback('update', {
                                    target : obj,
                                    data : {
                                        percent : doneNum / totalLength * 100,
                                        current : doneNum,
                                        total : totalLength
                                    }
                                });
                            }, this);
                            if (jsPictures.length) {
                                this.pictures.img.load(jsPictures, updateCallback).done($.proxy(function () {
                                    this.pictures.img.active = true;
                                    allDone();
                                }, this));
                            }
                            if (videoContainers.length) {
                                this.pictures.video.load(videoContainers, updateCallback).done($.proxy(function () {
                                    this.pictures.video.active = true;
                                    allDone();
                                }, this));
                            }
                            return deferred.promise();
                        }, this)
                    }
                });
                this.pictures.load(this.obj).done($.proxy(function () {
                    this.outCallback('complete');
                }, this));
            },
            destroy : function () {
                this.opts.stateAttr.destroy = true;
                this.pictures.destroy();
            },
            outCallback : function (ing, props) {
                var callbackObj = this.opts.on[ing];
                if (callbackObj == null) return;
                if (ing == 'update') {
                    callbackObj(props.target, props.data);
                } else {
                    callbackObj();
                }
            }
        };
        return PicturesLoaded;
    })();
    return PicturesLoaded;

}));
