function updatePlayerIconAndLink() {
    var MEDIA_INFO = { sl: { name: 'Silverlight', icon: 'icon_sl.gif', width: 88, height: 31, alt: 'Silverlight', href: 'http://www.microsoft.com/silverlight/resources/install.aspx' },
        wm: { name: 'Windows Media Player', icon: 'icon_wmp11.gif', width: 88, height: 31, alt: 'Windows Media', href: 'http://www.microsoft.com/windows/windowsmedia/player/download/download.aspx' },
        rm: { name: 'Real Player', icon: 'icon_rp.gif', width: 70, height: 33, alt: 'Real Media', href: 'http://www.real.com/player/' },
        fl: { name: 'Adobe Flash Player', icon: 'icon_flash.gif', width: 88, height: 21, alt: 'Flash', href: 'http://get.adobe.com/flashplayer/' }
    };
    var info;
    var t = getMediaType();
    if (t == PlayerType.Real) info = MEDIA_INFO.rm;
    else if (t == PlayerType.Flash) info = MEDIA_INFO.fl;
    else if (supportSL()) info = MEDIA_INFO.sl;
    else info = MEDIA_INFO.wm;
    if (!info) return;
    var parent = document.getElementById('mediaIcon');
    if (!parent) return;
    Accordent.Util.create('img', parent, { id: 'wmpIcon', name: 'wmpIcon', src: info.icon, alt: info.alt, width: info.width, height: info.height });
    var d = Accordent.Util.create('div', parent, { id: 'download_prompt' });
    Accordent.Util.create('a', d, { id: 'dwnldLink', name: 'dwnldLink', target: '_blank', href: info.href, title: info.name }).appendChild(document.createTextNode('Download the free ' + info.name));
}