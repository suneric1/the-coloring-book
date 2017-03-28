const Handlebars = require('handlebars');

Handlebars.registerHelper('thumbnails', function (context, options) {

    var list = '';
    for (var i = 0; i < context.length; i++) {
        list += options.fn(context[i]);
    }
    
    return list;
    
});