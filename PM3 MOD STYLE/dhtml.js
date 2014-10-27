var __layout = (query('layout') || '<<@Layout@>>' || 'default').toLowerCase();
var __maxDisplayedMarkers = 50;
var __mType = getMediaType();
var __isRealPlayer = (__mType == PlayerType.Real);
var swapped = (__layout == 'swapped' && !audioModeCheck()) ? true : false;
var lrgVideo = false;
var captioned = false;
var chaptersLoaded = false;
var __swappable = true;
var dlFile = ["<<@DownloadFile1@>>", "<<@DownloadFile2@>>", "<<@DownloadFile3@>>"];
var dlName = ["<<@DownloadFile1Title@>>", "<<@DownloadFile2Title@>>", "<<@DownloadFile3Title@>>"];
var linkURL = ["<<@linkURL1@>>", "<<@linkURL2@>>", "<<@linkURL3@>>"];
var linkName = ["<<@linkURL1Title@>>", "<<@linkURL2Title@>>", "<<@linkURL3Title@>>"];
var topicsVisibility, captionsVisibility, downldVisibility, linksVisibility, emailVisibility, rsrcsVisibility, audio, tabDefs;

onPagePreInit();

topicsVisibility = checkChapters() && '<<@topicstab@>>'.toLowerCase() == 'yes';
captionsVisibility = canSupportCC() && '<<@closedcaptiontab@>>'.toLowerCase() == 'yes';
downldVisibility = hasDownloadResources();
linksVisibility = hasOtherResouces();
emailVisibility = hasNonEmptyItem(['<<@QAemail@>>']);
rsrcsVisibility = (downldVisibility === true) || (linksVisibility === true);
audio = audioModeCheck();
tabDefs = new Array(); // define all possible region2 content tabs. tabs not implemented may be remarked-out, or set with 'visibility':false

onPageInit();

function isMirrored() {
    if (!isInAuxiMode()) return __layout == 'videoright';
}
function pageInit() {
    performLayout(__layout);

    onDOMLoaded();
    captioned = captionsVisibility;
    chaptersLoaded = loadChapters('chaptersBox');

    tabDefs[0] = { 'visibility': topicsVisibility, 'title': 'Lesson Index', 'tab': 'Index', 'panel': 'chaptersBox' };
	tabDefs[1] = { 'visibility': true, 'title': 'Lesson Info', 'tab': 'Info', 'panel': 'eventInfoBox' };
    tabDefs[2] = { 'visibility': rsrcsVisibility, 'title': 'PowerPoint slides, lesson links, and other reources.', 'tab': 'Resources', 'panel': 'resourcesBox' };
    //	tabDefs[3] = { 'visibility':captionsVisibility, 'title':'Closed Captions', 'tab':'Captions',  'panel':'closedCaptionsBox' };
    tabDefs[4] = { 'visibility': emailVisibility, 'title': 'Email your questions to the instructor(s)', 'tab': 'Email', 'panel': 'emailBox' };
	tabDefs[5] = { 'visibility': true, 'title': 'A short questionnaire to test what you have learned.', 'tab': 'Quiz', 'panel': 'quizBox' };
	tabDefs[6] = { 'visibility': true, 'title': 'Troubleshooting, PC requirements, and users guide.', 'tab': 'Help', 'panel': 'helpBox' };

    objPlacements();
}

// load correct xsl file depending on browser type and plugin
function loadChapters(divLyr) {
    if (chaptersLoaded === false && isOnDemand() && isInAuxiMode() == false) {
        readChapters();
        if (topicsVisibility === true) {
            if (!_chapters) return false;
            loadChaptersHtml(divLyr);
            chaptersLoaded = true;
        }
    }

    return true;
}
// display tabs as needed in region 2
function changeMenu(current) {
    var panel, newList = '';
    var tabGroup = document.getElementById('listMenu');
    if (!downldVisibility) hide('dlGroup');   // hide downloads section
    if (!linksVisibility) hide('linksGroup');  // hide links section
    if (!arguments.length) current = 0;
    if (!chaptersLoaded) pageInit();
    for (var i = 0; i < tabDefs.length; i++) {
        if (tabDefs[i] != null && tabDefs[i]['visibility'] != false) {
            var panel = document.getElementById(tabDefs[i]['panel']);
            if (panel) {
                if (current == i) {
                    // display tab with css-highlighted id, and no hyperlink
                    newList += '<li id="current">' + tabDefs[i]['tab'] + '</li>';
                    show(panel);
                }
                else {
                    // display standard tab, and hide the content panel
                    newList += '<li><a href="#" onClick="changeMenu(' + i + ');"';
                    newList += ' title="' + tabDefs[i]['title'] + '">' + tabDefs[i]['tab'] + '</a></li>';
                    hide(panel);
                }
            }
        }
    }
    tabGroup.innerHTML = newList;
    return true;
}
function panelHgt(shortened, swapped, mirrored) {
    var css = { low: 'r2short', normal: 'r2normal', tall: 'r2tall', xtall: 'r2xtall' };
    if (isCompactPlayer() || isInAuxiMode())  {
        for (var len in css) css[len] = 'sl_' + css[len];
    }
    if (widescreenMode) {
        for (var len in css) css[len] = 'ws_' + css[len];
    }
    for (var i = 0; i < tabDefs.length; i++) {
        if (tabDefs[i] != null && tabDefs[i]['visibility'] != false) {
            var panel = document.getElementById(tabDefs[i]['panel']);
            if (!panel) continue;
            panel.className = 'region2content ' + (lrgVideo ? css.xtall : (swapped ? css.tall : ((shortened ? css.low : css.normal))));
        }
    }
}
function getFrameDoc(name) {
    var t = frames[name];
    if ('window' in t) t = t.window;
    if ('document' in t) 
        return t.document;
}
function objPlacements() {
    var i, tag, V, R, C, arrElements;
    // rearrange top-menu links, by re-parenting
    var Lb1Pt, Lb1, Lb2Pt, Lb2, Rb1Pt, Rb1, Rb2Pt, Rb2, tog;

    // wait for Slide and Video to exist.
    try {
        V = getFrameDoc('video');
        R = getFrameDoc('region1');
    } catch (e) { }
    if (V.getElementById('mscc') == null) {
        self.setTimeout('objPlacements()', 50);
        return;
    }
    // reposition nav buttons
    Lb1Pt = document.getElementById('vidGroup');    // left  button 1 parent
    Lb1 = document.getElementById('zoomVid');     // left  button 1
    Lb2Pt = document.getElementById('captioning');  // left  button 2 parent
    Lb2 = document.getElementById('captions');    // left  button 2
    Rb1Pt = document.getElementById('slideGroup');  // right button 1 parent
    Rb1 = document.getElementById('zoomSlide');   // right button 1
    Rb2Pt = Rb1Pt;                                  // right button 2 parent (same)
    Rb2 = document.getElementById('thumbs');      // right button 2

    var mirrored = isMirrored();
    if (swapped && (Rb1.parentNode != Lb1Pt)) {
        Lb1Pt.appendChild(Rb1, true); Rb1Pt.appendChild(Lb2, true);
        Lb2Pt.appendChild(Rb2, true); Rb2Pt.appendChild(Lb1, true);
    } else if (!swapped && (Rb1.parentNode == Lb1Pt)) {
        Lb1Pt.appendChild(Lb1, true); Rb1Pt.appendChild(Rb2, true);
        Lb2Pt.appendChild(Lb2, true); Rb2Pt.appendChild(Rb1, true);
    }

    Accordent.Util.attributes(document.getElementById('videoR2Container'), { className: (mirrored || lrgVideo) ? 'videoR2Group_mirrored' : 'videoR2Group' });
    Accordent.Util.attributes(document.getElementById('slideR3Container'), { className: (mirrored || lrgVideo) ? 'slideR3Group_mirrored' : 'slideR3Group' });

	arrElements = new Array();
	arrElements[0] = document.getElementById('region1');
	arrElements[1] = R ? R.getElementById('slideimage') : null;
	arrElements[2] = document.getElementById('video');
	arrElements[3] = document.getElementById('video_bg');
	arrElements[4] = V.getElementById('sourcemedia');
	arrElements[5] = V.getElementById('MediaPlayer');
	arrElements[6] = V.getElementById('videoPlugin');
	arrElements[7] = V.getElementById('captionbox');
	arrElements[8] = V.getElementById('mscc');
	arrElements[9] = C = V.getElementById('controls');
	var suffix = '';
	if (swapped || (lrgVideo && !__isRealPlayer)) suffix += '_swapped';
	//if (swapped)   suffix += '_swapped';
	if (captioned) suffix += '_captioned';

    for (i = (arrElements.length - 1); i >= 0; i--) {
        // counting down, collapsing array as we go
        if (arrElements[i] == null) continue;
        tag = arrElements[i].id;
        if (tag == null) tag = arrElements[i].name;
        if (tag != null) {
            var name = tag;
            // element exists and has a name or ID that we can match in the CSS
            if (name == 'MediaPlayer' && C != null) tag = 'RealPlayer';
            if (name == 'sourcemedia' && C != null) tag = 'sourcereal';
            if (name == 'MediaPlayer' && audio) tag = 'audioPlayer';
            if (name == 'sourcemedia' && audio) tag = 'audioSource';

            if (mirrored || lrgVideo) {
                if (name in { video: '', region1: '' }) tag += '_mirrored';
            }
            if (isCompactPlayer() || isInAuxiMode()) {
                if (name in { video: '', sourcemedia: '', videoPlugin: '', captionbox: '', video_bg: '' }) tag = 'sl_' + tag;
            }
            if (widescreenMode) tag = 'ws_' + tag;

            arrElements[i].className = tag + suffix;
        } // end if(got tag)
        arrElements.length = i;
    } // end for(arrElements)
    // set panelheight for each tabbed panel
    panelHgt(captioned && (!swapped), swapped, mirrored);

    // cleanup object references
    delete V; delete R; delete C;
}

function swapVidAndSlide() {
    if (__swappable === false) return;

    try {
        //var test = frames['region1'].window.document.getElementById('slideimage');
        swapped = ((swapped) ? false : true);
        objPlacements();
    } catch (e) { swapped = !swapped; }
}

function togCCdisplay() {
    if (!captionsVisibility) return false;
    captioned = ((captioned) ? false : true);
    objPlacements();
}
function _largeslideCall() {
    try {
        if (top.video) {
            top.video.lg_slide();
        }
    } catch (e) {
        alert("This feature is not ready, please try again in a few seconds");
    }
}
function metaCheck() {
    var titleMeta = getTitleMeta();
    var dateMeta = getDateMeta();
    var speakerMeta = "<<@speaker@>>";
    var descMeta = "<<@description@>>";

    if (titleMeta == '') hide('r2Title');
    if (dateMeta == '') hide('r2Date');
    if (speakerMeta == '') hide('r2Speaker');
    if (descMeta == '') hide('r2Description');
}
function launchCheck() {
    var customBG = "<<@mainBG@>>";
    var customlogo = "<<@TopBannerLogo@>>";
    var customTitleColor = ("<<@headerTitleColor@>>").toLowerCase();

    /* check if custom color for header title is defined and valid */
    if (hasNonEmptyItem([customTitleColor]) && (/^#([A-F0-9]{3,6})$/i.test(customTitleColor))) {
        customTitleColor.toString();
        $('#title').css("color", customTitleColor);
        $('.titlePointer').css("color", customTitleColor);
    } else if (customTitleColor == 'none') {
        hide('title');
    }

    try {
        //var zoomVideoButton = document.getElementById('zoomVid');
        //if (!isBrowserIeWin()) {
        // SET BUTTONS and FEATURES
        // hide zoom slide from non-windows os and non-ie browsers
        //hide('zoomSlide');
        // ---- 	document.getElementById('swapVid').style.display = 'none';
        //if (!hasP25()) {
        //   hide('zoomVid');
        //    //				captionsVisibility   = false;
        //    //				thumbnailsVisibility = false;
        //}
        //}

        if (isCompactPlayer()) hide('zoomVid');

        if (audio) {
            // hide swap and zoom vid if audio only mode
            __swappable = false;
            hide('zoomVid');
        }
        toggleThumbNails();
        if (__isRealPlayer || !captionsVisibility) hide('captions');

        document.getElementById('logoImage').src = (hasNonEmptyItem([customlogo])) ? customlogo : 'logo.jpg';

        if (top.window.name != 'presMode') {
            hide('closeLayer');
            document.getElementById('bgOuter').style.border = 'none'; ;
        }

        if (hasNonEmptyItem([customBG])) {
            document.getElementById("bgOuter").style.backgroundImage = "url(" + customBG + ")";
            if (!hasNonEmptyItem([customlogo])) document.getElementById("logoImage").src = 'spacer.gif';
        }
    } catch (e) { }

    if (!__swappable) hide('swapVid');                      // force disable swapping
}

/* resize to inner height and width to account for
IE7 phishing bar and other possible browser chrome. */
function getW() {
    //alert(document.documentElement.clientWidth);
    return window.innerWidth || document.documentElement.clientWidth;
}
function getH() {
    return window.innerHeight || document.documentElement.clientHeight;
}
var _idealW, _idealH;
function setWH(setw, seth) {
    _idealW = setw; _idealH = seth;
    window.resizeTo(setw, seth);
    var b = Accordent.PluginDetection;
    if (b && b.isWin() && b.isChrome()) {
        window.setTimeout(doFinalResize, 100);
        return;
    }
    doFinalResize();
}
function doFinalResize() {
    window.resizeTo(2 * _idealW - getW(), 2 * _idealH - getH());
}

function performLayout(layout, isFullscreen, forceLayout) {
    if (forceLayout === true && isNullOrBlank(layout)) return;

    if (layout == 'fullscreen') isFullscreen = true;
    else {
        if (forceLayout) swapped = false;
        __layout = layout;

        if (__layout && __layout !== 'default' && __layout !== 'videoright') {
            var windowSize = null;        //{ width: window.screen.availWidth, height: window.screen.availHeight }

            if (__layout == 'noslide') {
                windowSize = setNoslideMode();
            }
            else if (__layout == 'largevideo') {
				/* check to make sure im not audio or auxi mode */
				if (audio || isInAuxiMode()) windowSize = setNoslideMode();
				else 
				{
				windowSize = null;
				setLrgVideoMode();
				}
            }
            else if (__layout == 'onlyvideo') 
				{
                windowSize = null;
				setVideoOnlyMode();
				}
        }
        else if (forceLayout === true) {
            windowSize = setDefaultMode();
        }
    }

    if (isFullscreen === true) {
        //Do fullscreen   
    }
    else {
        if (windowSize) {
            //window.resizeTo(windowSize.width, windowSize.height);
            setWH(windowSize.width, windowSize.height);
        }
    }
}
function setNoslideMode() {
    hide('title');
    hide('region1');
    hide('slideR3Container');
    hide('poweredMsg');

    $('.presoWidth').css("width", "356px");

    if (window.name != 'presMode') return { width: 356, height: 624 };
}
function setLrgVideoMode() {
    lrgVideo = true;
    if (!__isRealPlayer) swapVidAndSlide();
    hide('region1');
    hide('video_bg');
    hide('vidHeader');
    hide('swapping');

    $('#r2Layer').css("margin-top", "0px");

    if (window.name != 'presMode') return { width: 997, height: 624 };
}
function setVideoOnlyMode() {
    // Hide the title in the header
    hide('title');
    hide('region1');
    hide('slideR3Container');
    hide('r2Layer');
    hide('poweredMsg');

    $('.presoWidth').css("width", "356px");

    var tmp = {
        WS: { noCC: 388, CC: 452 },
        ST: { noCC: 448, CC: 512 }
    }
    var aspectMode = (widescreenMode) ? "WS" : "ST";
    var captionsMode = (captionsVisibility) ? "CC" : "noCC";
    var skinHeight = tmp[aspectMode][captionsMode];

    document.getElementById('bgOuter').style.height = skinHeight.toString() + "px";
    document.getElementById('pageInner').style.height = skinHeight.toString() + "px";

    if (window.name != 'presMode') return { width: 356, height: skinHeight };
}

function setDefaultMode() {
    // Hide the title in the header
    show('title');
    show('region1');
    show('slideR3Container');
    show('r2Layer');
    show('poweredMsg');

    $('.presoWidth').css("width", "997px");
    $('.presoHeight').css("height", "624px");

    if (window.name != 'presMode') return { width: 997, height: 624 };
}

// write the number of resource items in the array to a list. pass names of the resource array to be used. 
function writeList(rscItemArray, rscNameArray) {
    var myRscList = '';
    // cycle through array and check if empty
    for (var i = 0; i < rscItemArray.length; i++) {
        if (hasNonEmptyItem([rscItemArray[i]])) {
            var itemName = rscNameArray[i] || rscItemArray[i];
            myRscList += '<li id=\"dl' + i + '\"><a href=\"' + rscItemArray[i] + '\" target=\"_blank\">' + itemName + '</a></li>';
        }
    }
    document.write(myRscList);
}
function hasDownloadResources() {
    return hasNonEmptyItem(dlFile);
}
function hasOtherResouces() {
    return hasNonEmptyItem(linkURL);
}
function isCompactPlayer() {
    return __useSilverlight || (__mType == PlayerType.Flash);
}
function closeThumbWindow() {
    if (window.top.video.openThumbPage) window.top.video.openThumbPage.close();
    if (window.top.video.lgwin) window.top.video.lgwin.close();
}
//function vidFull() {
//    try {
//        if (top.window.video && top.window.video.full_screen && typeof(top.window.video.full_screen) == 'function') top.window.video.full_screen();
//    } catch (e) { }
//}