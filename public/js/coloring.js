var _currentFill;

$(function () {

    _currentFill = $('.color-sample.selected').css('background-color');

    $('.color-sample').click(function () {
        $('.color-sample.selected').removeClass('selected');
        $(this).addClass('selected');
        _currentFill = $(this).css('background-color');
    });

    mysvg = $('.svg-container object')[0];
    mysvg.addEventListener('load', function () {
        var svg = mysvg.contentDocument.getElementsByTagName('svg')[0];
        svg.addEventListener('mousedown', function (event) {
            //            console.log(event.target);
            if (event.target.tagName != 'svg') {
                paint(event.target);
                $('#cancel-btn').attr('href', "#");
                $('#cancel-btn').attr('onclick', "showCancelBox()");
            }
        });
    });
});

function paint(target) {
    if ($('#blend-mode')[0].checked) {
        if ($(target).css('fill') == '')
            $(target).css('fill', _currentFill);
        else {
            var rgb = $(target).css('fill');
            rgb = rgb.replace('rgb(', '');
            rgb = rgb.replace(')', '');
            var color = rgb.split(', ');
            var rgb2 = _currentFill;
            rgb2 = rgb2.replace('rgb(', '');
            rgb2 = rgb2.replace(')', '');
            var color2 = rgb2.split(', ');
            for (var i = 0; i < 3; i++) {
                color[i] = parseInt(parseInt(color[i]) + (parseInt(color2[i]) - parseInt(color[i])) * 0.3);
            }
            var rgb3 = 'rgb(' + color.join() + ')';
            $(target).css('fill', rgb3);
        }
    } else {
        $(target).css('fill', _currentFill);
    }
}

function showCancelBox() {
    $('#cancel-msg').removeClass('hidden');
}

function submitData(paintid) {

    var formData = new FormData();
    var mysvg = $('.svg-container object')[0].contentDocument.getElementsByTagName('svg')[0];

    formData.append('svg', $('.svg-container object')[0].className);
    formData.append('paintname', document.getElementById('paintname').value);
    if (paintid != '')
        formData.append('id', paintid);

    var paths = [];
    paths.push(mysvg.getElementsByTagName('path'), mysvg.getElementsByTagName('circle'), mysvg.getElementsByTagName('ellipse'), mysvg.getElementsByTagName('polygon'), mysvg.getElementsByTagName('rect'));
    console.log(paths);

    var index = 0;
    for (var i = 0; i < paths.length; i++) {
        for (var j = 0; j < paths[i].length; j++) {
            formData.append('piece-' + index, paths[i][j].style.fill);
            index++;
        }
    }

    fetch('/save', {
        method: 'POST',
        body: formData
    }).then(function (res) {
        return res.text();
    }).then(function (text) {
        console.log(text);
        window.location.href = '/works';
    });
    //    console.log(formData.get('svgdata'));
}