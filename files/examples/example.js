(function () {
	if (!overwolf)
		return;
 
	var global = (function () {return this;}).call(),
		ignoreSingleResize = false,
		windowTools = {};
 
	windowTools.getMaxWindowSize = function() {
		return {
			w: Math.min(screen.availWidth, 1920),
			h: Math.min(screen.availHeight, 1080)
		};
	}
 
	// OW doesn't restore window sizes :(
	var windowResizeTimeout,
		windowSettings = JSON.parse(localStorage.getItem('windows')) || {};
 
	windowTools.manifestWindowName = "";
	windowTools.restoreWindowSize = function(manifestWindowName, callback) {
		windowTools.manifestWindowName = manifestWindowName;
		if (typeof windowSettings[manifestWindowName] === "undefined")
			return;
 
		overwolf.windows.obtainDeclaredWindow(manifestWindowName, function(result) {
			if (result.status !== "success") {
				if (callback)
					callback(result);
 
				return;
			}
			var windowSetting = windowSettings[manifestWindowName];
			//console.log("Restore Window Size for", result.window);
			overwolf.windows.changeSize (result.window.id, windowSetting.w, windowSetting.h, function(result) {
				//console.log("Restore Window Size Result", result);
				if (callback)
					callback(result);
			});
		});
	}
 
	windowTools.onResizeEnd = function() {
		windowResizeTimeout = undefined;
		overwolf.windows.getCurrentWindow(function(result){
			if (result.status=="success") {
				var wi = result.window.width,
					he = result.window.height,
					manifestWindowName = windowTools.manifestWindowName;
 
				var maxWindowSize = windowTools.getMaxWindowSize();
				if (ignoreSingleResize) {	// maximizing window
					ignoreSingleResize = undefined;
					return;
				}
 
				if ((typeof windowSettings[manifestWindowName] !== "undefined") && (windowSettings[manifestWindowName].w == wi) && (windowSettings[manifestWindowName].h == he))
					return;
 
				windowSettings[manifestWindowName] = {w:wi,h:he};
				localStorage.setItem('windows', JSON.stringify(windowSettings));
			}
		});
	}
 
	var addEvent = function(elem, type, eventHandle) {
		if (elem == null || typeof(elem) == 'undefined') return;
		if ( elem.addEventListener ) {
			elem.addEventListener( type, eventHandle, false );
		} else if ( elem.attachEvent ) {
			elem.attachEvent( "on" + type, eventHandle );
		} else {
			elem["on"+type]=eventHandle;
		}
	};
	addEvent(window, "resize", function() {
		if (typeof windowResizeTimeout !== "undefined")
			clearTimeout(windowResizeTimeout);
 
		if (windowTools.manifestWindowName !== "")
			windowResizeTimeout = setTimeout("owTools.windows.onResizeEnd()", 200);
	});
 
	windowTools.maximizeCurrentWindow = function(callback) {
		ignoreSingleResize = true;
		overwolf.windows.getCurrentWindow(function(result){
			if (result.status !== "success") {
				if (callback)
					callback(result);
 
				return;
			}
 
			var myWindow = result.window,
				maxWindowSize = windowTools.getMaxWindowSize();
 
			if ((maxWindowSize.w == myWindow.width) && (maxWindowSize.h == myWindow.height)) {
				if (callback)
					callback(result);
 
				return;
			}
 
			overwolf.windows.changeSize (result.window.id, maxWindowSize.w, maxWindowSize.h, function(resizeResult) {
				if (resizeResult.status !== "success") {
					if (callback)
						callback(resizeResult);
 
					return;
				}
				result.window.width = maxWindowSize.w;
				result.window.height = maxWindowSize.h;
				if (callback)
					callback(result);
 
			});
		});
	}
 
	windowTools.centerWindow = function(isHorizontal, isVertical, owWindow, callback) {
		var x = (isHorizontal)?(screen.availWidth - owWindow.width):(owWindow.left),
			y = (isVertical)?(screen.availHeight - owWindow.height):(owWindow.top);
 
		if (isHorizontal) {
			if (x > 0)
				x = x/2;
		}
 
		if (isVertical) {
			if (y > 0)
				y = y/2;
		}
 
		if ((owWindow.left == x) && (owWindow.top == y)) {
			if (callback)
				callback({window:owWindow,status:"success"});
 
			return;
		}
		overwolf.windows.changePosition(owWindow.id, x, y, function(result) {
			if (callback) {
				if (result.status === "success") {
					owWindow.left = x;
					owWindow.top = y;
				}
				callback({window:owWindow,status:result.status});
			}
		});
	}
 
	// just shortcuts
	windowTools.dragMove = function(e) {
		e.stopPropagation();
		overwolf.windows.getCurrentWindow(function(result) {
			if (result.status === "success") {
				overwolf.windows.dragMove(result.window.id);
			}
		});
	};
 
	windowTools.dragResize = function(edge){
		overwolf.windows.getCurrentWindow(function(result){
			if (result.status=="success") {
				overwolf.windows.dragResize(result.window.id, edge);
			}
		});
	};
 
	windowTools.minimizeWindow = function(e) {
		if (jQuery)
			jQuery(this).blur();	// fix for outlined button
 
		overwolf.windows.getCurrentWindow(function(result){
			if (result.status=="success"){
				overwolf.windows.minimize(result.window.id, function() {
					//console.log("Window minimized.");
				});
			}
		});
	};
 
	windowTools.closeWindow = function(e) {
		overwolf.windows.getCurrentWindow(function(result){
			if (result.status=="success"){
				overwolf.windows.close(result.window.id, function() {});
			}
		});
	};
 
	if (typeof owTools === "undefined")
		global.owTools = {};
 
	owTools.windows = windowTools;
})();
