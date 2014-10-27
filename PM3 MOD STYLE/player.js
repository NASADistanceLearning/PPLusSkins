function formatTimespan(seconds) {
    seconds = Math.floor(seconds);
    var leftOver = seconds % 3600;
    return '{0}:{1}:{2}'.format(Math.floor(seconds / 3600),
                                padInteger(Math.floor(leftOver / 60), 2),
                                padInteger(Math.floor(leftOver % 60), 2));
}
function formatElapsedTime(seconds) {
    return formatTimespan(seconds);
}
function padInteger(number, digits, paddingChar) {
    number = number.toFixed(0);
    if (!paddingChar) paddingChar = '0';
    if (digits > number.length) {
        for (var i = digits - number.length; i > 0; i--)
            number = paddingChar + number;
    }
    return number;
}
//Return 0 - 1
function convertValueToPercent(value, min, length) {
    return (value - min) / length;
}
//Return a number on the scale of slider's (min - max)
function convertPercentToValue(percent, min, length) {
    return percent * length + min;
}
if (!window.Accordent)
    window.Accordent = {};

var VisibleMode = { Show: 'Visible', Hide: 'Collapsed' };
Accordent.SliderMode = { Slider: 1, Progress: 2 };
Accordent.Slider = function(bar, thumb, sliderMode, onValueBeginChange, onValueChanged) {
    var _progBar = null;
    this._sliderMode = (sliderMode || Accordent.SliderMode.Slider);
    this._raiseEventOnDrag = false;
    this._enabled = true;
    var _thumb = thumb;
    var _minCanvasLeft = bar['Canvas.Left'];
    var _maxCanvasLeft = _minCanvasLeft + bar.width - _thumb.width;
    var _initLeft = _minCanvasLeft;

    var _x = 0;
    this._lastValue = null;
    var _down = false;

    var _onValueChanged = onValueChanged;
    var _onValueBeginChange = onValueBeginChange;

    //Start value (minimum value)
    var MIN_VALUE = 0;
    var _reg = new Accordent.EventRegistrationList();

    //Private methods
    var shiftToPoint = function(value) { return value - MIN_VALUE + _minCanvasLeft; }
    var shiftToValue = function(left) { return left + MIN_VALUE; }
    var getMinPoint = function() { return _thumb.width / 2; }
    var getMaxPoint = function() { return getMinPoint() + getLengthInternal(); }
    var getValueInternal = function(left) { return shiftToValue(left - _minCanvasLeft); }
    var getCurrentValue = function() { return getValueInternal(_thumb['Canvas.Left']); }
    var getLengthInternal = function() { return _maxCanvasLeft - _minCanvasLeft; }
    var raiseValueChanged = function(sender) {
        //Memorize the last position
        sender._lastValue = getCurrentValue();
        var args = null;
        if (_onValueChanged && typeof (_onValueChanged) == 'function') {
            args = new Accordent.ValueChangedEventArgs(sender._lastValue, getValueInternal(_initLeft));
            _onValueChanged(sender, args);
        }

        return args;
    }
    var raiseValueBeginChange = function(sender) {
        var args = null;
        if (_onValueBeginChange && typeof (_onValueBeginChange) == 'function') {
            args = new Accordent.CancelEventArgs();
            _onValueBeginChange(sender, args);
        }
        return args;
    }
    var validateLeft = function(newLeft) {
        if (newLeft < _minCanvasLeft)
            return _minCanvasLeft;

        if (newLeft > _maxCanvasLeft)
            return _maxCanvasLeft;

        return newLeft;
    }
    var validateLength = function(length) {
        var min = getMinPoint();
        var max = getMaxPoint();

        if (length < min)
            return min;

        if (length > max)
            return max;

        return length;
    }
    var updateThumb = function(sliderMode, newLeft) {
        if (sliderMode == Accordent.SliderMode.Slider) {
            _thumb['Canvas.Left'] = newLeft;
            if (_progBar) {
                var extraWidth = (_thumb) ? _thumb.width / 2 : 0;
                _progBar.width = newLeft + extraWidth;
            }
        }
        else if (sliderMode == Accordent.SliderMode.Progress) {
            _thumb.width = newLeft;
        }
    }

    //Public methods
    this.setEnable = function(enabled) { this._enabled = enabled; }
    this.getValue = function() { return getCurrentValue(); }
    this.getLength = function() { return getLengthInternal(); }
    this.getMinValue = function() { return shiftToValue(0); }
    this.getMaxValue = function() { return shiftToValue(getLengthInternal()); }
    this.setValue = function(newValue, suppressEvent) {
        if (_down === true) return;

        if (newValue >= this.getMinValue() && newValue <= this.getMaxValue()) {
            var canRaiseEvent = (this._enabled === true) && (!suppressEvent || (suppressEvent === false));
            if (canRaiseEvent) {
                var changeArgs = raiseValueBeginChange(this);
                if (changeArgs && changeArgs.isCancelled()) return;
            }

            if (this._enabled === true) {
                _initLeft = _thumb['Canvas.Left'];
                updateThumb(this._sliderMode, shiftToPoint(newValue));
                this._lastValue = newValue;
            }

            if (canRaiseEvent)
                raiseValueChanged(this);
        }
    }
    this.setPercentValue = function(percent, suppressEvent) {
        if (percent < 0) percent = 0;
        else if (percent > 1) percent = 1;

        this.setValue(percent * getLengthInternal() + this.getMinValue(), suppressEvent);
    }
    this.clearDrag = function() {
        //if (_down === true) {
        _down = false;
        this.setValue(this._lastValue, !this._raiseEventOnDrag);
        //}
    }
    //Event handlers
    this.onThumbDown = function(sender, args) {
        if (this._enabled === false) return;

        var changeArgs = raiseValueBeginChange(this);
        if (changeArgs && changeArgs.isCancelled()) return;

        sender.captureMouse();
        _x = args.getPosition(null).x;

        _initLeft = _thumb['Canvas.Left'];
        _down = true;
    }
    this.onThumbDrag = function(sender, args) {
        if (this._enabled === false) return;

        if (_down === true) {
            var newX = args.getPosition(null).x;
            var oldLeft = _thumb['Canvas.Left'];
            var newLeft = validateLeft(oldLeft + newX - _x);

            //If current position has not changed, then do not update thumb position
            if (oldLeft == newLeft) return;
            updateThumb(this._sliderMode, newLeft);
            _x = newX;

            if (this._raiseEventOnDrag === true)
                raiseValueChanged(this);
        }
    }
    this.onThumbUp = function(sender, args) {
        if (this._enabled === false) return;

        if (_down === true) {
            _down = false;
            sender.releaseMouseCapture();

            if (this._raiseEventOnDrag === false)
                raiseValueChanged(this);
        }
    }
    this.onSelected = function(sender, args) {
        if (this._enabled === false) return;

        _down = false;

        var changeArgs = raiseValueBeginChange(this);
        if (changeArgs && changeArgs.isCancelled()) return;

        //InitLeft is used for oldValue
        _initLeft = _thumb['Canvas.Left'];

        var currentLength = validateLength(args.getPosition(sender).x + 1);
        updateThumb(this._sliderMode, _minCanvasLeft + currentLength - getMinPoint());

        raiseValueChanged(this);
    }
    this.dispose = function() {
        if (this._sliderMode == Accordent.SliderMode.Slider) {

        }
    }
    //Register event handlers
    if (this._sliderMode == Accordent.SliderMode.Slider) {
        _reg.addSL(thumb, 'MouseMove', createDelegate(this, this.onThumbDrag));
        _reg.addSL(thumb, 'MouseLeftButtonUp', createDelegate(this, this.onThumbUp));
        _reg.addSL(thumb, 'MouseLeftButtonDown', createDelegate(this, this.onThumbDown));
        _reg.addSL(bar, 'MouseLeftButtonDown', createDelegate(this, this.onSelected));
        this.setValue(0, true);
    }

    this.setProgressBar = function(progBar) {
        if (!progBar) return;
        _progBar = progBar;
        _progBar['Canvas.Left'] = _minCanvasLeft;
        _progBar.width = _thumb['Canvas.Left'] + _thumb.width / 2;
    }
}
Accordent.ProgressBar = function(bar, thumb) {
    if (!bar || !thumb) return;
    //Set width to 0 so that the progress displays correctly
    thumb.width = 0;

    //Align lefts of thumb and bar to indicate zero progress
    thumb['Canvas.Left'] = bar['Canvas.Left'];
    this._slider = new Accordent.Slider(bar, thumb, Accordent.SliderMode.Progress, null, null);
}
Accordent.ProgressBar.prototype = {
    setValue: function(newValue) {
        this._slider.setValue(newValue, true);
    },
    setPercentValue: function(newValue) {
        this._slider.setPercentValue(newValue, true);
    },
    getValue: function() { return this._slider.getValue(); },
    getLength: function() { return this._slider.getLength(); },
    getMinValue: function() { return this._slider.getMinValue(); },
    dispose: function() { this._slider.dispose(); },
    setEnable: function(enabled) { this._slider.setEnable(enabled); }
}
Accordent.ValueChangedEventArgs = function(newValue, oldValue) {
    var _newValue = newValue;
    var _oldValue = oldValue;
    this.getNewValue = function() { return _newValue; }
    this.getOldValue = function() { return _oldValue; }
}
Accordent.CancelEventArgs = function() {
    var _cancel = false;
    this.isCancelled = function() { return _cancel; }
    this.setCancel = function(isCancelled) { _cancel = isCancelled; }
}
function createDelegate(host, handler) {
    return function() {
        return handler.apply(host, arguments)
    }
}
if (!window.Accordent)
    window.Accordent = {};

var SL = { ControlPanel: 'controlPanel', Player: 'videoPlayer', ControlBar: 'controlBar',
    Play: 'btnPlay', Pause: 'btnPause', Stop: 'btnStop', Mute: 'btnMute', SpeakerImg: 'imgSpeaker',
    Fullscreen: 'btnFullscreen', DockBar: 'docking', Dock: 'btnDock', Undock: 'btnUndock',
    VolumeBar: 'volumeControl', MuteOff: 'muteOffSymbol', TimerBar: 'timerControl', TimerLabel: 'txtTimer'
}
Accordent.PlayerTimer = function(interval, tickHandler) {
    this._onTick = tickHandler;
    this._interval = interval;
    this._timerId = null;
    this._count = 0;
}
Accordent.PlayerTimer.prototype = {
    start: function() {
        if (this._onTick && !this._timerId) this._timerId = setInterval(createDelegate(this, this.tick), this._interval);
    },
    stop: function() {
        if (this._timerId) clearInterval(this._timerId);
        this._timerId = null;
    },
    tick: function() {
        this._count++;
        if (this._onTick) this._onTick();
    }
}
Accordent.SilverlightPlayer = function(defaultSlidePage, defaultRegion, maxMarkerCount) {
    //Events
    var _onSync = null;
    var _onStateChanged = null;
    var _defaultSlide = defaultSlidePage || 'slide.htm';
    var _defaultRegion = defaultRegion || 'region1';
    this._chapters = null;
    var _sourceType = SourceType.OnDemand;
    var _rootCanvas = null;
    var _pluginHost = null;
    var _mediaPlayer = null;
    var _controlPanel = null;
    var _slLastState = null;
    var _volumeSlider;
    var _trackSlider;
    var _downloadProgress;
    var _loaded = false;
    var _markers = null;
    var _sourceFile = '';
    var _defaultStart = 0;
    var _timer = null;
    var _clipCompleted = false;
    var _reg = new Accordent.EventRegistrationList();

    var _bufferCount = 0;
    var _lastVolume = 0.5;
    var _durationText = null;
    var config = { canCpFloat: true,
        docked: true,
        fixedPosition: { top: 0, left: 0 },
        cpHeight: 35,
        initShowCpDuration: 4000,
        timeLineInterval: 100,
        liveTimeLineInterval: 1000,
        defaultVolume: _lastVolume,
        maxMarkers: maxMarkerCount,
        screenRatio: (3 / 4)
    };

    this._speaker = { mode: VisibleMode.Hide, image: 'Screenshot.jpg' };
    this.onSilverlightLoaded = function(sender, context, root) {
        if (!_sourceFile || _sourceFile == '') return;
        _rootCanvas = (root || sender.content.root);
        if (!_rootCanvas) return;

        _reg.addSL(_rootCanvas, 'MouseMove', onMediaAreaMouseMove);
        _reg.addSL(_rootCanvas, 'MouseLeave', onMediaAreaMouseLeave);

        var img = slFind(SL.SpeakerImg);
        if (img) {
            _reg.addSL(img, 'MouseMove', onMediaAreaMouseMove);
            img.source = this._speaker.image;
            img.visibility = this._speaker.mode;

            //Disable fullscreen mode
            if (this._speaker.mode == VisibleMode.Show)
                slHide(SL.Fullscreen);
        }

        _mediaPlayer = slFind(SL.Player);
        _pluginHost = _mediaPlayer.getHost();
        _controlPanel = slFind(SL.ControlPanel);
        if (_controlPanel) {
            config.fixedPosition.top = _controlPanel['Canvas.Top'];
            config.fixedPosition.left = _controlPanel['Canvas.Left'];
        }

        if (!config.screenRatio) config.screenRatio = 3 / 4;
        else if (config.screenRatio > 1) config.screenRatio = 1 / config.screenRatio;

        _reg.addSL(_mediaPlayer, 'MediaOpened', createDelegate(this, this.onMediaOpened));
        _reg.addSL(_mediaPlayer, 'MediaEnded', createDelegate(this, this.onMediaEnded));
        _reg.addSL(_mediaPlayer, 'MediaFailed', onMediaFailed);
        _reg.addSL(_mediaPlayer, 'MarkerReached', onMediaMarkerReached);
        _reg.addSL(_mediaPlayer, 'CurrentStateChanged', createDelegate(this, this.onVideoPlayerCurrentStateChanged));
        _reg.addSL(_mediaPlayer, 'DownloadProgressChanged', onMediaDownloading);
        _reg.addSL(_mediaPlayer, 'BufferingProgressChanged', onMediaBuffering);

        startMedia();

        //Register button handlers (We must remember to dispose them as well
        registerSilverlightControlMouseUp(SL.Play, onButtonPlayMouseUp);
        registerSilverlightControlMouseUp(SL.Pause, onButtonPauseMouseUp);
        registerSilverlightControlMouseUp(SL.Stop, onButtonStopMouseUp);
        registerSilverlightControlMouseUp(SL.Mute, onButtonMuteMouseUp);
        registerSilverlightControlMouseUp(SL.Fullscreen, onSilverlightFullScreen);
        registerSilverlightControlMouseUp(SL.DockBar, onDockingMouseUp);
        registerSilverlightControlMouseOver(SL.ControlBar);
        registerSilverlightControlMouseOver(SL.VolumeBar);
        registerSilverlightControlMouseOver(SL.TimerBar);

        if (_pluginHost.content) {
            _pluginHost.content.onfullScreenChange = onFullScreenChanged;
            _pluginHost.content.onResize = onSilverlightResized;
        }

        if (_controlPanel) {
            if (_controlPanel.height != 0) config.cpHeight = _controlPanel.height;

            //Control volume bar
            _volumeSlider = new Accordent.Slider(slFind('volumeBar'), slFind('volumeThumb'), null, null, onVolumeChanged);
            _volumeSlider._raiseEventOnDrag = true;
            _volumeSlider.setProgressBar(slFind('volumeProgress'));

            //Control track bar
            _trackSlider = new Accordent.Slider(slFind('trackBar'), slFind('trackThumb'), null, function(sender, args) {
                //If cannot seek, then do nothing
                if (canSeekPosition() === false) {
                    args.setCancel(true);
                    return;
                }
            }, createDelegate(this, this.onTrackChanged));
            _trackSlider._raiseEventOnDrag = false;
            _trackSlider.setProgressBar(slFind('trackProgress'));

            //Control download bar
            _downloadProgress = new Accordent.ProgressBar(slFind('downloadBar'), slFind('downloadThumb'));
            _downloadProgress._raiseEventOnDrag = false;
            _volumeSlider.setPercentValue(_lastVolume);
        }

        if (_loaded === false) {
            updateDockingUi();
            this.resetPlayer();
            _loaded = true;
        }
        _clipCompleted = false;
    }
    this.onTimeLineTicking = function() {
        var txtTimer = slFind(SL.TimerLabel);
        if (!txtTimer) return;

        var currentTimeline = _timer._count;
        var totalTime = 'Live ...';
        if (_sourceType === SourceType.OnDemand) {
            totalDuration = _mediaPlayer.naturalDuration.seconds;
            if (totalDuration <= 0) return;

            totalTime = _durationText;
            currentTimeline = _mediaPlayer.position.seconds;
            var percentElapsed = currentTimeline / totalDuration;

            _trackSlider.setPercentValue(percentElapsed, true);
        }

        txtTimer.text = formatElapsedTime(currentTimeline);
        txtTimer.text = '{0} | {1}'.format(formatElapsedTime(currentTimeline), totalTime);
    }
    this.onTrackChanged = function(sender, args) {
        var length = sender.getLength();
        if (length == 0) return;

        var min = sender.getMinValue();
        var newValue = args.getNewValue() - min;
        this.setMediaPosition(convertValueToPercent(newValue, min, length) * _mediaPlayer.naturalDuration.seconds);
    }
    var onButtonStopMouseUp = function(sender, args) {
        if (_mediaPlayer.currentState != PlayerState.Stopped) {
            _mediaPlayer.stop();

            //Reset play progress when stop
            _lastPosition = 0;
            _trackSlider.setValue(_lastPosition, true);
        }
    }
    /* Control panel media state buttons */
    var onButtonPlayMouseUp = function(sender, args) {
        playMedia();
    }
    var onDockingMouseUp = function(sender, args) {
        config.docked = !config.docked;
        updateDockingUi();
    }
    var updateDockingUi = function() {
        if (config.canCpFloat === false)
            slHide(SL.DockBar);
        else {
            slShow(SL.DockBar);
            slVisible(SL.Dock, config.docked === true);
            slVisible(SL.Undock, config.docked === false);
        }
    }
    var onButtonPauseMouseUp = function(sender, args) {
        var isOnDemand = true;

        if (_mediaPlayer.currentState != PlayerState.Paused) {
            _mediaPlayer.pause();
        }
    }
    /* Media volume */
    var onButtonMuteMouseUp = function(sender, args) {
        var muteOffSymbolButton = slFind(SL.MuteOff);
        if (!muteOffSymbolButton) return;

        var isCurrentlyMuted = (muteOffSymbolButton.visibility == VisibleMode.Hide);
        if (isCurrentlyMuted) {
            _volumeSlider.setPercentValue(config.defaultVolume);
            muteOffSymbolButton.visibility = VisibleMode.Show;
        }
        else {
            muteOffSymbolButton.visibility = VisibleMode.Hide;
            _volumeSlider.setPercentValue(0.0);
        }
    }
    var onVolumeChanged = function(sender, args) {
        var length = sender.getLength();
        if (length == 0) return;
        var min = sender.getMinValue();
        adjustVolume(convertValueToPercent(args.getNewValue(), min, length),
                    convertValueToPercent(args.getOldValue(), min, length));
    }
    /* Media video state */
    this.onVideoPlayerCurrentStateChanged = function(sender, args) {
        var isOnDemand = true;
        this.updateControlPanelUi();

        if (_onStateChanged && typeof (_onStateChanged) == 'function')
            _onStateChanged(_mediaPlayer.currentState);
    }
    var onMediaFailed = function(sender, args) {
        //Retry when failed after media started
        if (_mediaStarted === true) {
            startMedia();
        }

        _mediaFailed = true;
        updateMediaStatus('Cannot open media file');
    }
    this.onMediaEnded = function(sender, args) {
        _lastPosition = 0;
        _clipCompleted = true;
        //Leave the last frame
        this.updateControlPanelUi(PlayerState.Stopped);

        if (_onStateChanged && typeof (_onStateChanged) == 'function')
            _onStateChanged(PlayerState.Complete);
    }
    var onMediaMarkerReached = function(sender, args) {
        raiseMarkerChanged(new Accordent.Marker(args.marker.type, args.marker.text, args.marker.time.seconds));
    }

    var _ccMarkers = null;
    this.resetPlayer = function() {
        if (_trackSlider) {
            //Reset status
            _trackSlider.setValue(0, true);
            _downloadProgress.setValue(0, true);

            //Disable interaction temporarity. If it's live, disable tracking and download progress
            _trackSlider.setEnable(false);
            _downloadProgress.setEnable(false);

            slVisible(SL.Pause, _sourceType === SourceType.OnDemand);
        }
    }
    this.updatePlayer = function() {
        var onDemand = (_sourceType === SourceType.OnDemand);
        //Enable/disable tracking
        _trackSlider.setEnable(onDemand);
        _downloadProgress.setEnable(onDemand);
    }
    this.onMediaOpened = function(sender, args) {
        _bufferCount = 0;
        this.updatePlayer();
        hideControlPanel();

        var markers = _mediaPlayer.markers;

        //Get all markers first
        _markers = new Accordent.MarkerCollection(_mediaPlayer.naturalDuration.seconds);
        for (var i = 0; i < markers.count; i++) {
            var item = markers.getItem(i);
            if (canAcceptMarkerType(item.type))
                _markers.add(item.type, item.text, item.time.seconds);
        }

        //If the number of markers are acceptable
        if (_markers.getLength() <= config.maxMarkers)
            createAllMarkers();

        if (_ccMarkers) {
            for (var i = 0; i < _ccMarkers.getLength(); i++) {
                var ccMarker = _ccMarkers.getItem(i);
                ccMarker.render();
                markers.Add(createCcMarker(ccMarker.getType(), replaceAll(htmlEncode(ccMarker.getText()), '"', '&#34;'), ccMarker.getTime()));
            }
        }

        _durationText = formatElapsedTime(_mediaPlayer.naturalDuration.seconds);

        if (_mediaFailed === true)
            setPositionInternal(_lastPosition);

        _mediaFailed = false;
        _mediaStarted = true;

        if (_defaultStart) {
            this.setMediaPosition(_defaultStart);
            _defaultStart = 0;
        }
    }
    var onSilverlightFullScreen = function(sender, args) {
        if (_pluginHost && _pluginHost.content)
            _pluginHost.content.fullScreen = !_pluginHost.content.fullScreen;

    }
    var onFullScreenChanged = function(sender, args) {
        var controlPanel = sender.findName("controlPanel");

        //Calculate the player dimension
        var screenWidth = _pluginHost.content.actualWidth;
        var perfectWidth = getWidthByRatio(_pluginHost.content.actualHeight);
        var minWidth = Math.min(perfectWidth, screenWidth);
        var maxWidth = Math.max(perfectWidth, screenWidth);
        _mediaPlayer.width = minWidth;

        if (screenWidth > minWidth)
            _rootCanvas['Canvas.Left'] = (maxWidth - minWidth) / 2;
        else
            _rootCanvas['Canvas.Left'] = 0;

        _hideTimeout = setTimeout(hideControlPanel, 100);
    }
    var _hideTimeout = null;
    var onSilverlightResized = function(sender, args) {
        if (!_mediaPlayer || !_controlPanel || !_pluginHost || !_pluginHost.content) return;

        var width = _pluginHost.content.actualWidth;
        _mediaPlayer.width = width;

        _hideTimeout = setTimeout(hideControlPanel, 100);
    }

    this.setSpeakerImage = function(visible, image) {
        this._speaker.mode = (visible === true) ? VisibleMode.Show : VisibleMode.Hide;
        this._speaker.image = image;
    }
    var getWidthByRatio = function(height, ratio) {
        return (height || 0) * (ratio || (1 / config.screenRatio));
    }
    var getHeightByRatio = function(width, ratio) {
        return (width || 0) * (ratio || config.screenRatio);
    }
    /* Show/Hide player control panel */
    var onMediaAreaMouseMove = function(sender, args) {
        if (!_pluginHost) return;

        if (config.canCpFloat === true) {
            var mediaWidth = _mediaPlayer.width;
            var mediaHeight = _mediaPlayer.height || getHeightByRatio(mediaWidth);
            //Add logics to handle hiding control panel when it's going out of scope
            if (args) {
                var pos = args.getPosition(null);
                var x = pos.x - _rootCanvas['Canvas.Left'];
                var y = pos.y - _rootCanvas['Canvas.Top'];
                var threshold = 2;
                if (x < threshold || x > (mediaWidth - threshold) || y < threshold || y > (mediaHeight - 2)) {
                    onMediaAreaMouseLeave(sender, args);
                    return;
                }
            }
            showControlPanel(null);
        }
    }
    var onMediaAreaMouseLeave = function(sender, args) {
        _trackSlider.clearDrag();
        _volumeSlider.clearDrag();

        if (config.canCpFloat === true)
            hideControlPanel();
    }
    var onMediaBuffering = function(sender, args) {
        if (sender.bufferingProgress == 1) _bufferCount++;
        var txtStat = updateMediaStatus('Buffering: {0}%'.format((sender.bufferingProgress * 100).toFixed(0)));
        if (!txtStat) return;

        if (sender.bufferingProgress >= 1 || sender.bufferingProgress <= 0)
            txtStat.visibility = VisibleMode.Hide;
    }
    var onMediaDownloading = function(sender, args) {
        if (_downloadProgress)
            _downloadProgress.setPercentValue(sender.downloadProgress);
    }
    var _cpTimeoutId = null;
    var showControlPanel = function(timeout) {
        if (!_controlPanel) return;

        if (config.canCpFloat === false)
            moveControlPanel(config.fixedPosition.top, config.fixedPosition.left);
        else
            moveControlPanel();

        if (_controlPanel.visibility !== VisibleMode.Show) {
            _controlPanel.visibility = VisibleMode.Show;

            if (timeout) {
                if (!_cpTimeoutId)
                    clearTimeout(_cpTimeoutId);
                _cpTimeoutId = setTimeout(hideControlPanel, timeout);
            }
        }
    }
    var moveControlPanel = function(top, left) {
        if (left === undefined || left < 0) {
            var contentWidth = (_pluginHost.content) ? _pluginHost.content.actualWidth : _mediaPlayer.width;
            if (_mediaPlayer.width > 0 && contentWidth > _mediaPlayer.width) contentWidth = _mediaPlayer.width;
            var cpWidth = _controlPanel.width;
            left = (contentWidth - cpWidth) / 2;
        }

        if (top === undefined || top < 0) {
            var contentHeight = (_pluginHost.content) ? _pluginHost.content.actualHeight : _mediaPlayer.height;
            if (_mediaPlayer.height > 0 && contentHeight > _mediaPlayer.height) contentHeight = _mediaPlayer.height;

            top = contentHeight - config.cpHeight;
        }

        _controlPanel["Canvas.Top"] = top;
        _controlPanel['Canvas.Left'] = left;
    }
    var updateMediaStatus = function(mediaStatus) {
        var txtStat = slFind('txtStat');
        if (!txtStat) return;

        if (!mediaStatus)
            mediaStatus = '';

        txtStat.text = mediaStatus;
        txtStat.visibility = VisibleMode.Show;
        return txtStat;
    }
    //Accept only URL markers
    var canAcceptMarkerType = function(markerType) {
        return (markerType || '').toLowerCase() == 'url';
    }
    var raiseMarkerChanged = function(marker, seeking) {
        //if no marker provided, then create a default marker
        if (!marker) marker = new Accordent.Marker('URL', _defaultSlide + '&&' + _defaultRegion, 0);

        var type = marker.getType() || '';
        var text = marker.getText() || '';
        var region = marker.getRegion() || '';

        if (_onSync && typeof (_onSync) == 'function')
            _onSync(type, text, region, _mediaPlayer.position.seconds, seeking);

        //Will update chapter if acceptable
        if (canAcceptMarkerType(type)) {
            //Set chapter title for player (in Silverlight only)
            var txtChapter = slFind('txtChapter');
            if (txtChapter) {
                var chapter = !(marker && this._chapters) ? null : this._chapters.find(marker.getTime());
                txtChapter.text = (!chapter) ? '' : chapter.getTitle();
            }
        }
    }
    this.updateControlPanelUi = function(forcedState) {
        updateMediaStatus();

        var currentState = forcedState || _mediaPlayer.currentState;
        if (currentState === _slLastState) return;

        if (currentState === PlayerState.Closed) {
            slHide(SL.Play);
            slHide(SL.Pause);
            slHide(SL.Stop);

            updateMediaStatus(currentState + '...');
        }
        else if (currentState === PlayerState.Opening) {
            slHide(SL.Play);
            slHide(SL.Pause);
            slHide(SL.Stop);

            updateMediaStatus(currentState + '...');
        }
        else if (currentState === PlayerState.Buffering) {
            slHide(SL.Play);
            //slShow(SL.Pause);
            slVisible(SL.Pause, _sourceType === SourceType.OnDemand);
            slShow(SL.Stop);
        }
        else if (currentState === PlayerState.Playing) {
            slHide(SL.Play);
            //slShow(SL.Pause);
            slVisible(SL.Pause, _sourceType === SourceType.OnDemand);
            slShow(SL.Stop);
        }
        else if (currentState === PlayerState.Paused) {
            slShow(SL.Play);
            slHide(SL.Pause);
            slVisible(SL.Stop, _sourceType !== SourceType.Live);
        }
        else if (currentState === PlayerState.Stopped) {
            slShow(SL.Play);
            slHide(SL.Pause);
            slHide(SL.Stop);
        }

        if (currentState === PlayerState.Playing || currentState == PlayerState.Buffering)
            _timer.start();
        else
            _timer.stop();

        _slLastState = currentState;
    }
    var ensureMediaPlaying = function(defaultPosition) {
        var oldPosition = null;

        if ((!defaultPosition) === false)
            _lastPosition = defaultPosition;

        if (_mediaPlayer.currentState === PlayerState.Closed) {

            //Retry once if necessary
            startMedia();
        }
        else if (Math.floor(_mediaPlayer.position.seconds) == Math.floor(_mediaPlayer.naturalDuration.seconds)) {
            oldPosition = 0;
        }

        return defaultPosition || (oldPosition == null ? -1 : oldPosition);
    }
    var _mediaFailed = false;
    var _mediaStarted = false;
    var _lastPosition = 0;
    var startMedia = function() {
        if (_mediaPlayer) {
            _mediaPlayer.source = _sourceFile;
        }
    }
    var playMedia = function(defaultPosition) {
        var isOnDemand = true;

        var oldPosition = ensureMediaPlaying(defaultPosition);

        if (oldPosition >= 0)
            setPositionInternal(oldPosition);

        if (_mediaPlayer.currentState != PlayerState.Playing) {
            _mediaPlayer.play();
        }
    }
    this.setMediaPosition = function(seconds) {
        if (canSeekPosition() === false) return;

        if (canSetPositionAt(seconds)) {
            setPositionInternal(seconds);
            //If the play button is visible, then play
            var playButton = slFind(SL.Play);
            if (playButton && playButton.visibility == VisibleMode.Show) {
                playMedia(seconds);
            }

            raiseMarkerChanged(_markers ? _markers.find(seconds) : null, true);
        }
    }
    var canSeekPosition = function() {
        return true;
    }
    var canSetPositionAt = function(seconds) {
        return true;
    }
    var setPositionInternal = function(seconds) {
        var newTimespan = formatTimespan(seconds);
        _mediaPlayer.position = newTimespan;
    }
    //Volume must be from 0 to 1
    var adjustVolume = function(volume, previousVolume) {
        if (volume < 0)
            volume = 0;
        else if (volume > 1)
            volume = 1;

        //Set volume
        _lastVolume = volume;
        _mediaPlayer.volume = volume;

        var muteOffSymbolButton = slFind(SL.MuteOff);
        if (muteOffSymbolButton) {
            if (volume == 0) {
                //Remember the previous volume
                if (previousVolume) config.defaultVolume = previousVolume;
                _mediaPlayer.isMuted = true;
                muteOffSymbolButton.visibility = VisibleMode.Hide;
            }
            else {
                _mediaPlayer.isMuted = false;
                muteOffSymbolButton.visibility = VisibleMode.Show;
            }
        }
    }
    var createAllMarkers = function() {
        //Types that should not be rendered
        var excludedTypes = arguments;

        var trackBar = slFind('trackBar');
        if (!trackBar) return;

        var markerHeight = 3;
        var markerWidth = markerHeight;
        var top = Math.round(trackBar['Canvas.Top'] + (trackBar.height - markerHeight) / 2);
        var parent = slFind('timeTrack');
        var thumb = slFind('trackThumb');
        var zIndex = Math.max(0, trackBar['Canvas.ZIndex']);
        trackBar['Canvas.ZIndex'] = zIndex + 1;
        thumb['Canvas.ZIndex'] = zIndex + 2;

        for (var i = 0; i < _markers.getLength(); i++) {
            var item = _markers.getItem(i);
            if (item.hasRendered()) continue;

            if (select(excludedTypes, function(type) { return item._type == type; }, 1).length > 0) continue;

            var left = Math.round(convertPercentToValue(item.getTime() / _markers._duration, _trackSlider.getMinValue(), _trackSlider.getLength()) - (markerWidth / 2));
            createMarkerUi(parent, zIndex, markerHeight, markerWidth, top, left);

            item.render();
        }
    }
    //Private helper functions
    var slFind = function(controlName) {
        return (!_rootCanvas) ? null : _rootCanvas.findName(controlName);
    }
    var slVisible = function(controlName, visible) {
        var control = slFind(controlName);
        if (control) control.visibility = (visible === true) ? VisibleMode.Show : VisibleMode.Hide;
    }
    var slShow = function(controlName) {
        slVisible(controlName, true);
    }
    var slHide = function(controlName) {
        slVisible(controlName, false);
    }
    var hideControlPanel = function() {
        if (config.canCpFloat === false || config.docked === true)
            showControlPanel(null);
        else
            _controlPanel.visibility = VisibleMode.Hide;
    }
    function createCcMarker(type, text, seconds) {
        return _pluginHost.content.createFromXaml('<TimelineMarker Type="{0}" Text="{1}" Time="{2}" />'.format(type, text, formatTimespan(seconds)));
    }
    function createMarkerUi(parent, zIndex, height, width, top, left) {
        if (!_pluginHost || !_pluginHost.content) return;
        if (!parent) return;

        var xaml = '<Ellipse Height="{0}" Width="{1}" Fill="White" Stroke="Black" StrokeThickness="0.3" />'.format(height, width);
        var marker = _pluginHost.content.createFromXaml(xaml);
        marker['Canvas.Left'] = left;
        marker['Canvas.Top'] = top;

        parent.children.add(marker);
        marker['Canvas.ZIndex'] = zIndex;
    }
    var onControlMouseEntered = function(sender, args) {
        if (!sender || !sender.name || !sender.opacity) return;
        sender.opacity = 1;
    }
    var onControlMouseLeave = function(sender, args) {
        if (!sender || !sender.name || !sender.opacity) return;
        var opacity = parseFloat(Accordent.SilverlightPlayer.Opacity[sender.name], 10);
        if (isNaN(opacity) === false)
            sender.opacity = opacity;
    }
    var ensureOpacityCollection = function() {
        if (Accordent.SilverlightPlayer.Opacity == null)
            Accordent.SilverlightPlayer.Opacity = new Object();
    }
    var registerSilverlightControlMouseUp = function(controlName, mouseUpHandler, parentControl) {
        var button = slFind(controlName);
        if (button) {
            _reg.addSL(button, 'MouseLeftButtonUp', mouseUpHandler);
            registerSilverlightControlMouseOver(parentControl || controlName);
        }
    }
    var registerSilverlightControlMouseOver = function(controlName) {
        var button = slFind(controlName);
        if (button) {
            ensureOpacityCollection();
            if (!Accordent.SilverlightPlayer.Opacity[controlName])
                Accordent.SilverlightPlayer.Opacity[controlName] = button.opacity;

            _reg.addSL(button, 'MouseEnter', onControlMouseEntered);
            _reg.addSL(button, 'MouseLeave', onControlMouseLeave);
        }
    }
    this.addSyncHandler = function(onSyncHandler) { _onSync = onSyncHandler; }
    this.addStateChangedHandler = function(onStateChangedHandler) { _onStateChanged = onStateChangedHandler; }
    this.setSource = function(sourceFile, isLive, startSeconds) {
        _defaultStart = (isNaN(startSeconds) || startSeconds < 0) ? 0 : startSeconds;
        _sourceFile = sourceFile;
        _sourceType = (!isLive || isLive === false) ? SourceType.OnDemand : SourceType.Live;

        if (_timer) _timer.stop();
        _timer = new Accordent.PlayerTimer(_sourceType === SourceType.Live ? config.liveTimeLineInterval : config.timeLineInterval, createDelegate(this, this.onTimeLineTicking));
        _timer.start();

        this.resetPlayer();
    }
    this.setCc = function(ccCollection) { _ccMarkers = ccCollection; }
    this.setChapters = function(chapters) { this._chapters = chapters; }
    this.initComponents = function(container, videoId, xamlFile, width, height, supportedVersions) {
        Silverlight.createObject(
            xamlFile || 'Player.xaml',
            container,
            videoId,
            {
                width: width,
                height: height,
                inplaceInstallPrompt: true,
                background: '#000',
                isWindowless: 'false',
                framerate: '24',
                version: '1.0'
            },
            {
                onError: null,
                onLoad: createDelegate(this, this.onSilverlightLoaded)
            },
            null);

        return true;
    }
    this.dispose = function() {
        if (!_mediaPlayer) return;
        if (_timer) _timer.stop();
        if (_reg) _reg.dispose();

        _volumeSlider.dispose();
        _downloadProgress.dispose();
        _trackSlider.dispose();

        delete _mediaPlayer;
        delete _pluginHost;
        delete _controlPanel;
        delete _trackSlider;
        delete _volumeSlider;
        delete _downloadProgress;
    }
    this.getVideo = function() {
        return _mediaPlayer;
    }
    this.isLoaded = function() {
        return _loaded;
    }
    this.isClipCompleted = function() {
        return _clipCompleted;
    }
    this.getClipSeconds = function() {
        var time = 0;
        if (_sourceType === SourceType.OnDemand)
            time = _mediaPlayer.position.seconds;
        else if (_timer)
            time = _timer._count;
        return time;
    }
    this.getBufferCount = function() {
        return _bufferCount;
    }
}