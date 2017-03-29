function loadContent(path) {
    var container = document.getElementById('main');
    fetch('/' + path)
        .then(function (response) {
            return response.text();
        }).then(function (text) {
//            console.log(text);
            container.innerHTML = text;
        });
}

function hideBox() {
    $('.message-box-container').addClass('hidden');
}

function showBox(paint) {
    $('.message-box-container').removeClass('hidden');
    $('#message-box input.delete').attr('onclick', 'deletePaint("' + paint + '")');
}

$('.load-btn').click(function () {
    $('li.active').removeClass('active');
    $(this).addClass('active');
});

function deletePaint(paintid) {
    console.log('del!');
    fetch('/delete/' + paintid).then(function (res) {
        return res.text();
    }).then(function (text) {
        if (text == 'deleted') {
            hideBox();
            loadContent('loadWorks');
        }
    });
}

function getColor(paintid) {
    if (paintid != '') {
        fetch('/colordata/' + paintid).then(function (res) {
            return res.text();
        }).then(function (colordata) {
            console.log(JSON.parse(colordata));
            var colors = JSON.parse(colordata);
            var paintname = document.getElementById('paintname');
            if (paintname != null)
                paintname.value = colors.paintname;

            var mysvg = document.getElementById(paintid).contentDocument.getElementsByTagName('svg')[0];

            var paths = [];
            paths.push(mysvg.getElementsByTagName('path'), mysvg.getElementsByTagName('circle'), mysvg.getElementsByTagName('ellipse'), mysvg.getElementsByTagName('polygon'), mysvg.getElementsByTagName('rect'));

            var index = 0;
            for (var i = 0; i < paths.length; i++) {
                for (var j = 0; j < paths[i].length; j++) {
                    paths[i][j].style.fill = colors['piece-' + index];
                    index++;
                }
            }
        });
    }
}