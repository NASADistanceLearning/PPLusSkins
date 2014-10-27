var openThumbPage = false;
var forceWidescreen = false;
var launchOnlyVideoFS = false;
var __query = null;

var startFS = (launchOnlyVideoFS && (('<<@Layout@>>').toLowerCase() == 'onlyvideo')) ? true : false;
function startFullscreen() {
    var useSilverlight = (query('player') === PlayerType.Silverlight);
    var useReal = (query('player') === PlayerType.Real);
    if (startFS && !useSilverlight) {
        if (useReal) {
            if (document.MediaPlayer.CanStop()) {
                window.clearInterval(idTmr);
                full_screen(true);
            }
        } else {
            if (document.MediaPlayer.playState == 3) {
                window.clearInterval(idTmr);
                full_screen();
            }
        }
    }
}

function initFS() {
    idTmr = window.setInterval("startFullscreen()", 1000);
}

function query(key) {
    var value = '';
    if (key) {
        key = key.toLowerCase();
        if (!__query) __query = new Accordent.QueryString(window.location.search);
        if (key in __query) value = (__query[key] || '').toLowerCase();
    }

    return value;
}
function hasNonEmptyItem(items) {
    try {
        // loop thru array to see if there are any downloadable files in any position
        for (var i = 0; i < items.length; i++) {
            if (items[i] != '' && items[i].indexOf('@>') < 0)
                return true;
        }

    } catch (e) { }
    return false;
}

function isBrowserFF() {
    var ff = false;
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('firefox') > -1)
        ff = true;
    return ff;
}

function hasP25() {
    var P25 = false;
    var plugin = navigator.mimeTypes && navigator.mimeTypes["application/x-ms-wmp"];
    var FFcheck = navigator.userAgent.indexOf("Firefox");
    if (plugin && FFcheck != -1)
        P25 = true;
    return P25;
}

function openThumbWindow() {
    if (openThumbPage.window) {
        openThumbPage.focus();
    } else {
        openThumbPage = window.open('thumbs.htm', 'thumbpage', 'scrollbars=yes,resizable=yes,width=225,height=630');
        openThumbPage.focus();
    }
}

function exit() {
    top.window.close();
}

function isBrowserIeWin() {
    var iewin = false;
    var ua = navigator.userAgent.toLowerCase();
    if ((ua.indexOf('ie') > -1) & (ua.indexOf('win') > -1))
        iewin = true;
    return iewin;
}

function isWin() {
    var win = false;
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('win') > -1)
        win = true;
    //if(win){alert('is win');}else{alert('is NOT win');}
    return win;
}
//function seek(timestr) { // Modified For FullScreen***
//	if(window.top.video) window.top.video.seek(timestr);
//	else if(window.top.mainFrame.video) window.top.mainFrame.video.seek(timestr);
//	else if(window.opener.top.video) window.opener.top.video.seek(timestr);
//	else if(window.opener.top.mainFrame.video) window.opener.top.mainFrame.video.seek(timestr);
//}

//function MM_openBrWindow(theURL,winName,features) { //v2.0
//  window.open(theURL,winName,features);
//}

function Lvl_openWin(u, n, w, h, l, t, c, f) {
    var x = ((screen.width - w) / 2); if (c == 1) { l = x; t = (screen.height - h) / 2; } if (c == 2) { l = x }
    f += ',top=' + t + ',left=' + l; LvlWin = window.open(u, n, f); LvlWin.focus();
}
function vidFull() {
    try {
        if (top.window.video) {
            top.window.video.full_screen();
        }
    } catch (e) {
        alert("error");
        var err = e;
    }
}
function MM_callJS(jsStr) { //v2.0
    return eval(jsStr)
}

//function toggleThb() {
//	if(window.top.region1){
//		window.top.region1.toggleView(window.top.region1.hasSlideInfo)
//	}
//}

function callPopUp() {
    if (window.top.video) {
        window.top.video.openThumbWindow();
    }
}

function audioModeCheck() {
    var mode = query('audioonly');
    if (mode == 'no')
        return false;

    return mode == 'yes' || isAudioOnlyPrefered();
}

function getSkinBaseUrl() {
    var url = '<<@BASEURL@>>';
    return hasNonEmptyItem([url]) ? url : '';
}

// set widescreen mode in video
var widescreenMode = (('<<@VAspect@>>'.toLowerCase() == 'widescreen') || forceWidescreen) ? true : false;
function getCompactPlayerDimensions(layout) {
    return (layout == 'swapped' || layout == 'largevideo') ?
                                    { w: 640, h: (widescreenMode === true) ? 360 : 480} :
                                    { w: 320, h: (widescreenMode === true) ? 180 : 240 };
}
function getMainUrl(type, bandwidth, layout, archived, additionalQueryString) {
    var l = layout || '';
    var page = !bandwidth ? 'auxi.htm' : 'main.htm';
    var url = page + '?layout=' + l;
    if (type) url += '&type=' + type;
    if (archived) url += '&archived=' + archived;
    var query = top.location.search || '';
    if (query && query.length > 1) query = '&' + query.substr(1);
    if (bandwidth) url += '&bandwidth=' + bandwidth + '&audioonly=' + ((bandwidth == 'low') ? 'yes' : 'no');
    if (additionalQueryString) url += additionalQueryString;
    return url + query;
}