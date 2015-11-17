(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.actorjs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    ActorRef: require("./src/ActorRef"),
    ActorContext: require("./src/ActorContext"),
    ActorSystem: require("./src/ActorSystem"),
    ActorUtil: require("./src/ActorUtil"),
    ActorMessages: require("./src/ActorMessages.js"),
    ActorMatch: require("./src/ActorMatch.js")
}

},{"./src/ActorContext":2,"./src/ActorMatch.js":3,"./src/ActorMessages.js":4,"./src/ActorRef":5,"./src/ActorSystem":6,"./src/ActorUtil":7}],2:[function(require,module,exports){
var ActorSystem = require("./ActorSystem");


var ActorContext = function (actor, reference, system, parent) {
    actor.context = this;
    actor.self = reference;
    reference.context = this;
    this.system = system;
    this.self = reference;
    this.parent = parent;
    this.children = { };

}

ActorContext.prototype.actorOf = function(clss, name, options) {
    var ActorUtil = require("./ActorUtil");
    var child = ActorUtil.newActor(clss, this.system, this.self, name, options);
    this.children[name] = child;
    return child;
}

ActorContext.prototype.actorFor = function(name) {
    if (name[0] === '/')
        return this.system.actorFor(name);

    if (name === '..')
        return this.parent;

    if (name.substring(0, 3) === '../')
        return this.parent.context.actorFor(name.substring(3));

    if (name.indexOf(':') > 0)
        return this.system.actorFor(name);

    var position = name.indexOf('/');

    if (position > 0) {
        var rest = name.substring(position + 1);
        name = name.substring(0, position);
        return this.children[name].context.actorFor(rest);
    }
    else
        return this.children[name];
}

module.exports = ActorContext;
},{"./ActorSystem":6,"./ActorUtil":7}],3:[function(require,module,exports){
var TypeMatch = function(receive){

    return function(message){
        if(!receive[message.type]) throw new Error("Connot typeMatch: " + message.type);
        receive[message.type](message.data)
    }

};

module.exports = {
    TypeMatch: TypeMatch
};

},{}],4:[function(require,module,exports){
var Command = function (type, data) {
    return {
        type: type,
        data: data
    }
}

var Event = function (type, data) {
    return {
        type: type,
        data: data
    }
}

module.exports = {
    Command: Command,
    Event: Event
};

},{}],5:[function(require,module,exports){
function ActorRef(actor, parentpath, name) {
    this.actor = actor;
    this.path = parentpath + "/" + name;
}

ActorRef.prototype.tell = function (msg) {
    this.actor.receive(msg);
}

module.exports = ActorRef;
},{}],6:[function(require,module,exports){
var ActorUtil = require("./ActorUtil");

function ActorSystem(name) {
    var counter = 0;
    this.name = name;
    this.path = "actor://" + name;
    this.children = { };

    this.nextName = function () {
        counter++;
        return '_' + counter;
    }
}

ActorSystem.prototype.actorOf = function(clss, name, options) {
    var actor = ActorUtil.newActor(clss, this, null, name, options);
    this.children[name] = actor;
    return actor;
}

ActorSystem.prototype.actorFor = function (name) {
    if (name.indexOf(':') > 0) {
        var path = ActorUtil.parsePath(name);

        if (path.server) {
            var servername = path.server + ':' + path.port;
            if (servername !== this.node.name)
                return this.node.getNode(servername).getSystem(path.system).actorFor(path.path);
        }

        name = path.path;
    }

    if (name && name[0] === '/')
        name = name.substring(1);

    var position = name.indexOf('/');

    if (position > 0) {
        var rest = name.substring(position + 1);
        name = name.substring(0, position);
        return this.children[name].context.actorFor(rest);
    }
    else
        return this.children[name];
}

module.exports = ActorSystem;

},{"./ActorUtil":7}],7:[function(require,module,exports){
var ActorUtil = {
    newActor: function (clss, system, parent, name, options) {
        var actor;

        if (typeof clss === 'function')
            actor = new clss();
        else
            actor = clss;

        if (!name)
            name = system.nextName();

        var ActorRef = require("./ActorRef");
        var ref = new ActorRef(actor, parent ? parent.path : system.path, name);

        if (options && options.router)
            ref = new ActorRouterRef(ref);

        var ActorContext = require("./ActorContext");
        var context = new ActorContext(actor, ref, system, parent);

        return ref;
    },
    parsePath: function (path) {
        var result = {};
        var position = path.indexOf(':');

        result.protocol = path.substring(0, position);

        var rest = path.substring(position + 3);

        var positionat = rest.indexOf('@');
        position = rest.indexOf('/');

        if (positionat >= 0 && positionat < position) {
            result.system = rest.substring(0, positionat);
            result.server = rest.substring(positionat + 1, position);

            var poscolon = result.server.indexOf(':');

            if (poscolon > 0) {
                result.port = parseInt(result.server.substring(poscolon + 1));
                result.server = result.server.substring(0, poscolon);
            }
        }
        else
            result.system = rest.substring(0, position);

        result.path = rest.substring(position);

        return result;
    }
}

module.exports = ActorUtil;

},{"./ActorContext":2,"./ActorRef":5}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJEOlxcUHJvamVjdHNcXGFjdG9yanNcXGFjdG9yLWNvcmVcXGluZGV4LmpzIiwiRDpcXFByb2plY3RzXFxhY3RvcmpzXFxhY3Rvci1jb3JlXFxzcmNcXEFjdG9yQ29udGV4dC5qcyIsIkQ6XFxQcm9qZWN0c1xcYWN0b3Jqc1xcYWN0b3ItY29yZVxcc3JjXFxBY3Rvck1hdGNoLmpzIiwiRDpcXFByb2plY3RzXFxhY3RvcmpzXFxhY3Rvci1jb3JlXFxzcmNcXEFjdG9yTWVzc2FnZXMuanMiLCJEOlxcUHJvamVjdHNcXGFjdG9yanNcXGFjdG9yLWNvcmVcXHNyY1xcQWN0b3JSZWYuanMiLCJEOlxcUHJvamVjdHNcXGFjdG9yanNcXGFjdG9yLWNvcmVcXHNyY1xcQWN0b3JTeXN0ZW0uanMiLCJEOlxcUHJvamVjdHNcXGFjdG9yanNcXGFjdG9yLWNvcmVcXHNyY1xcQWN0b3JVdGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNiLFFBQVEsRUFBRSxPQUFPLENBQUMsZ0JBQWdCLENBQUM7SUFDbkMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztJQUMzQyxXQUFXLEVBQUUsT0FBTyxDQUFDLG1CQUFtQixDQUFDO0lBQ3pDLFNBQVMsRUFBRSxPQUFPLENBQUMsaUJBQWlCLENBQUM7SUFDckMsYUFBYSxFQUFFLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQztJQUNoRCxVQUFVLEVBQUUsT0FBTyxDQUFDLHFCQUFxQixDQUFDOzs7O0FDTjlDLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUMzQzs7QUFFQSxJQUFJLFlBQVksR0FBRyxVQUFVLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRTtJQUMzRCxLQUFLLENBQUMsT0FBTyxHQUFH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Q0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN4RDtBQUNiLFNBQVM7O0FBRVQsWUFBWSxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDOztBQUV4RCxRQUFRLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7UUFFdkMsT0FBTyxNQUFNLENBQUM7S0FDakI7QUFDTCxDQUFDOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIEFjdG9yUmVmOiByZXF1aXJlKFwiLi9zcmMvQWN0b3JSZWZcIiksXHJcbiAgICBBY3RvckNvbnRleHQ6IHJlcXVpcmUoXCIuL3NyYy9BY3RvckNvbnRleHRcIiksXHJcbiAgICBBY3RvclN5c3RlbTogcmVxdWlyZShcIi4vc3JjL0FjdG9yU3lzdGVtXCIpLFxyXG4gICAgQWN0b3JVdGlsOiByZXF1aXJlKFwiLi9zcmMvQWN0b3JVdGlsXCIpLFxyXG4gICAgQWN0b3JNZXNzYWdlczogcmVxdWlyZShcIi4vc3JjL0FjdG9yTWVzc2FnZXMuanNcIiksXHJcbiAgICBBY3Rvck1hdGNoOiByZXF1aXJlKFwiLi9zcmMvQWN0b3JNYXRjaC5qc1wiKVxyXG59IiwidmFyIEFjdG9yU3lzdGVtID0gcmVxdWlyZShcIi4vQWN0b3JTeXN0ZW1cIik7XHJcblxyXG5cclxudmFyIEFjdG9yQ29udGV4dCA9IGZ1bmN0aW9uIChhY3RvciwgcmVmZXJlbmNlLCBzeXN0ZW0sIHBhcmVudCkge1xyXG4gICAgYWN0b3IuY29udGV4dCA9IHRoaXM7XHJcbiAgICBhY3Rvci5zZWxmID0gcmVmZXJlbmNlO1xyXG4gICAgcmVmZXJlbmNlLmNvbnRleHQgPSB0aGlzO1xyXG4gICAgdGhpcy5zeXN0ZW0gPSBzeXN0ZW07XHJcbiAgICB0aGlzLnNlbGYgPSByZWZlcmVuY2U7XHJcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICAgIHRoaXMuY2hpbGRyZW4gPSB7IH07XHJcblxyXG59XHJcblxyXG5BY3RvckNvbnRleHQucHJvdG90eXBlLmFjdG9yT2YgPSBmdW5jdGlvbihjbHNzLCBuYW1lLCBvcHRpb25zKSB7XHJcbiAgICB2YXIgQWN0b3JVdGlsID0gcmVxdWlyZShcIi4vQWN0b3JVdGlsXCIpO1xyXG4gICAgdmFyIGNoaWxkID0gQWN0b3JVdGlsLm5ld0FjdG9yKGNsc3MsIHRoaXMuc3lzdGVtLCB0aGlzLnNlbGYsIG5hbWUsIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5jaGlsZHJlbltuYW1lXSA9IGNoaWxkO1xyXG4gICAgcmV0dXJuIGNoaWxkO1xyXG59XHJcblxyXG5BY3RvckNvbnRleHQucHJvdG90eXBlLmFjdG9yRm9yID0gZnVuY3Rpb24obmFtZSkge1xyXG4gICAgaWYgKG5hbWVbMF0gPT09ICcvJylcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uYWN0b3JGb3IobmFtZSk7XHJcblxyXG4gICAgaWYgKG5hbWUgPT09ICcuLicpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xyXG5cclxuICAgIGlmIChuYW1lLnN1YnN0cmluZygwLCAzKSA9PT0gJy4uLycpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50LmNvbnRleHQuYWN0b3JGb3IobmFtZS5zdWJzdHJpbmcoMykpO1xyXG5cclxuICAgIGlmIChuYW1lLmluZGV4T2YoJzonKSA+IDApXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmFjdG9yRm9yKG5hbWUpO1xyXG5cclxuICAgIHZhciBwb3NpdGlvbiA9IG5hbWUuaW5kZXhPZignLycpO1xyXG5cclxuICAgIGlmIChwb3NpdGlvbiA+IDApIHtcclxuICAgICAgICB2YXIgcmVzdCA9IG5hbWUuc3Vic3RyaW5nKHBvc2l0aW9uICsgMSk7XHJcbiAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyaW5nKDAsIHBvc2l0aW9uKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbltuYW1lXS5jb250ZXh0LmFjdG9yRm9yKHJlc3QpO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuW25hbWVdO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdG9yQ29udGV4dDtcclxuIiwidmFyIFR5cGVNYXRjaCA9IGZ1bmN0aW9uKHJlY2VpdmUpe1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbihtZXNzYWdlKXtcclxuICAgICAgICBpZighcmVjZWl2ZVttZXNzYWdlLnR5cGVdKSB0aHJvdyBuZXcgRXJyb3IoXCJDb25ub3QgdHlwZU1hdGNoOiBcIiArIG1lc3NhZ2UudHlwZSk7XHJcbiAgICAgICAgcmVjZWl2ZVttZXNzYWdlLnR5cGVdKG1lc3NhZ2UuZGF0YSlcclxuICAgIH1cclxuXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIFR5cGVNYXRjaDogVHlwZU1hdGNoXHJcbn07IiwidmFyIENvbW1hbmQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgIGRhdGE6IGRhdGFcclxuICAgIH1cclxufVxyXG5cclxudmFyIEV2ZW50ID0gZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgQ29tbWFuZDogQ29tbWFuZCxcclxuICAgIEV2ZW50OiBFdmVudFxyXG59OyIsImZ1bmN0aW9uIEFjdG9yUmVmKGFjdG9yLCBwYXJlbnRwYXRoLCBuYW1lKSB7XHJcbiAgICB0aGlzLmFjdG9yID0gYWN0b3I7XHJcbiAgICB0aGlzLnBhdGggPSBwYXJlbnRwYXRoICsgXCIvXCIgKyBuYW1lO1xyXG59XHJcblxyXG5BY3RvclJlZi5wcm90b3R5cGUudGVsbCA9IGZ1bmN0aW9uIChtc2cpIHtcclxuICAgIHRoaXMuYWN0b3IucmVjZWl2ZShtc2cpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdG9yUmVmO1xyXG4iLCJ2YXIgQWN0b3JVdGlsID0gcmVxdWlyZShcIi4vQWN0b3JVdGlsXCIpO1xyXG5cclxuZnVuY3Rpb24gQWN0b3JTeXN0ZW0obmFtZSkge1xyXG4gICAgdmFyIGNvdW50ZXIgPSAwO1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgIHRoaXMucGF0aCA9IFwiYWN0b3I6Ly9cIiArIG5hbWU7XHJcbiAgICB0aGlzLmNoaWxkcmVuID0geyB9O1xyXG5cclxuICAgIHRoaXMubmV4dE5hbWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY291bnRlcisrO1xyXG4gICAgICAgIHJldHVybiAnXycgKyBjb3VudGVyO1xyXG4gICAgfVxyXG59XHJcblxyXG5BY3RvclN5c3RlbS5wcm90b3R5cGUuYWN0b3JPZiA9IGZ1bmN0aW9uKGNsc3MsIG5hbWUsIG9wdGlvbnMpIHtcclxuICAgIHZhciBhY3RvciA9IEFjdG9yVXRpbC5uZXdBY3RvcihjbHNzLCB0aGlzLCBudWxsLCBuYW1lLCBvcHRpb25zKTtcclxuICAgIHRoaXMuY2hpbGRyZW5bbmFtZV0gPSBhY3RvcjtcclxuICAgIHJldHVybiBhY3RvcjtcclxufVxyXG5cclxuQWN0b3JTeXN0ZW0ucHJvdG90eXBlLmFjdG9yRm9yID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgIGlmIChuYW1lLmluZGV4T2YoJzonKSA+IDApIHtcclxuICAgICAgICB2YXIgcGF0aCA9IEFjdG9yVXRpbC5wYXJzZVBhdGgobmFtZSk7XHJcblxyXG4gICAgICAgIGlmIChwYXRoLnNlcnZlcikge1xyXG4gICAgICAgICAgICB2YXIgc2VydmVybmFtZSA9IHBhdGguc2VydmVyICsgJzonICsgcGF0aC5wb3J0O1xyXG4gICAgICAgICAgICBpZiAoc2VydmVybmFtZSAhPT0gdGhpcy5ub2RlLm5hbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ub2RlLmdldE5vZGUoc2VydmVybmFtZSkuZ2V0U3lzdGVtKHBhdGguc3lzdGVtKS5hY3RvckZvcihwYXRoLnBhdGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbmFtZSA9IHBhdGgucGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobmFtZSAmJiBuYW1lWzBdID09PSAnLycpXHJcbiAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyaW5nKDEpO1xyXG5cclxuICAgIHZhciBwb3NpdGlvbiA9IG5hbWUuaW5kZXhPZignLycpO1xyXG5cclxuICAgIGlmIChwb3NpdGlvbiA+IDApIHtcclxuICAgICAgICB2YXIgcmVzdCA9IG5hbWUuc3Vic3RyaW5nKHBvc2l0aW9uICsgMSk7XHJcbiAgICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyaW5nKDAsIHBvc2l0aW9uKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbltuYW1lXS5jb250ZXh0LmFjdG9yRm9yKHJlc3QpO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuW25hbWVdO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdG9yU3lzdGVtOyIsInZhciBBY3RvclV0aWwgPSB7XHJcbiAgICBuZXdBY3RvcjogZnVuY3Rpb24gKGNsc3MsIHN5c3RlbSwgcGFyZW50LCBuYW1lLCBvcHRpb25zKSB7XHJcbiAgICAgICAgdmFyIGFjdG9yO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGNsc3MgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgIGFjdG9yID0gbmV3IGNsc3MoKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGFjdG9yID0gY2xzcztcclxuXHJcbiAgICAgICAgaWYgKCFuYW1lKVxyXG4gICAgICAgICAgICBuYW1lID0gc3lzdGVtLm5leHROYW1lKCk7XHJcblxyXG4gICAgICAgIHZhciBBY3RvclJlZiA9IHJlcXVpcmUoXCIuL0FjdG9yUmVmXCIpO1xyXG4gICAgICAgIHZhciByZWYgPSBuZXcgQWN0b3JSZWYoYWN0b3IsIHBhcmVudCA/IHBhcmVudC5wYXRoIDogc3lzdGVtLnBhdGgsIG5hbWUpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJvdXRlcilcclxuICAgICAgICAgICAgcmVmID0gbmV3IEFjdG9yUm91dGVyUmVmKHJlZik7XHJcblxyXG4gICAgICAgIHZhciBBY3RvckNvbnRleHQgPSByZXF1aXJlKFwiLi9BY3RvckNvbnRleHRcIik7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQWN0b3JDb250ZXh0KGFjdG9yLCByZWYsIHN5c3RlbSwgcGFyZW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlZjtcclxuICAgIH0sXHJcbiAgICBwYXJzZVBhdGg6IGZ1bmN0aW9uIChwYXRoKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IHBhdGguaW5kZXhPZignOicpO1xyXG5cclxuICAgICAgICByZXN1bHQucHJvdG9jb2wgPSBwYXRoLnN1YnN0cmluZygwLCBwb3NpdGlvbik7XHJcblxyXG4gICAgICAgIHZhciByZXN0ID0gcGF0aC5zdWJzdHJpbmcocG9zaXRpb24gKyAzKTtcclxuXHJcbiAgICAgICAgdmFyIHBvc2l0aW9uYXQgPSByZXN0LmluZGV4T2YoJ0AnKTtcclxuICAgICAgICBwb3NpdGlvbiA9IHJlc3QuaW5kZXhPZignLycpO1xyXG5cclxuICAgICAgICBpZiAocG9zaXRpb25hdCA+PSAwICYmIHBvc2l0aW9uYXQgPCBwb3NpdGlvbikge1xyXG4gICAgICAgICAgICByZXN1bHQuc3lzdGVtID0gcmVzdC5zdWJzdHJpbmcoMCwgcG9zaXRpb25hdCk7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zZXJ2ZXIgPSByZXN0LnN1YnN0cmluZyhwb3NpdGlvbmF0ICsgMSwgcG9zaXRpb24pO1xyXG5cclxuICAgICAgICAgICAgdmFyIHBvc2NvbG9uID0gcmVzdWx0LnNlcnZlci5pbmRleE9mKCc6Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAocG9zY29sb24gPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucG9ydCA9IHBhcnNlSW50KHJlc3VsdC5zZXJ2ZXIuc3Vic3RyaW5nKHBvc2NvbG9uICsgMSkpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnNlcnZlciA9IHJlc3VsdC5zZXJ2ZXIuc3Vic3RyaW5nKDAsIHBvc2NvbG9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJlc3VsdC5zeXN0ZW0gPSByZXN0LnN1YnN0cmluZygwLCBwb3NpdGlvbik7XHJcblxyXG4gICAgICAgIHJlc3VsdC5wYXRoID0gcmVzdC5zdWJzdHJpbmcocG9zaXRpb24pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFjdG9yVXRpbDsiXX0=
