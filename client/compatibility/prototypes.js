String.prototype.width = function(font) {
    var f = font || '24px arial',
        o = $('<div>' + this + '</div>')
            .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
            .appendTo($('body')),
        w = o.width();

    o.remove();

    return w;
};

String.prototype.height = function(font) {
    var f = font || '24px arial',
        o = $('<div>' + this + '</div>')
            .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
            .appendTo($('body')),
        h = o.height();

    o.remove();

    return h;
};
