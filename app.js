'use strict';

const Hapi = require('hapi');
const Blipp = require('blipp');
const Path = require('path');
const Inert = require('inert');
const Vision = require('vision');
const Handlebars = require('handlebars');
const Svg = require('svgutils').Svg;
const pg = require('pg');

const fs = require('fs');
const Sequelize = require('sequelize');

const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    }
});

server.connection({
    port: (process.env.PORT || 3000)
});

var currentUser = 'Guest';

var sequelize;

if (process.env.DATABASE_URL) {
    // the application is executed on Heroku ... use the postgres database
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: true //false
    });
} else {
    sequelize = new Sequelize('db', 'username', 'password', {
        host: 'localhost',
        dialect: 'sqlite',
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        },
        storage: 'db.sqlite'
    });
}

// Define model
var table = {
    svg: Sequelize.STRING,
    paintname: Sequelize.STRING
};
for (var i = 0; i < 300; i++) {
    table['piece-' + i] = Sequelize.STRING;
}
var Colors = sequelize.define('colors', table);

// svg files
var svgfiles = [
    {
        svg: 'Octocat'
                },
    {
        svg: 'Foxes'
                },
    {
        svg: 'Bear'
                },
    {
        svg: 'Owls'
                }
                ];

server.register([Blipp, Inert, Vision], () => {});

server.views({
    engines: {
        html: Handlebars
    },
    path: 'views',
    relativeTo: __dirname,
    layoutPath: 'views/layout',
    layout: 'layout',
    helpersPath: 'views/helpers'
});

server.route({
    method: 'GET',
    path: '/signup',
    handler: {
        view: {
            template: 'index'
        }
    }
});

server.route({
    method: 'GET',
    path: '/login',
    handler: {
        view: {
            template: 'index'
        }
    }
});

server.route({
    method: 'POST',
    path: '/catalog',
    handler: function (request, reply) {

        currentUser = request.payload.username;

        reply().redirect('/');
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply.view('catalog_content', {
            message: 'Pick a sketch and start coloring!',
            svgs: svgfiles
        }, {
            layout: 'thumbnails_layout'
        });
    }
});

server.route({
    method: 'GET',
    path: '/loadCatalog',
    handler: function (request, reply) {
        reply.view('catalog_content', {
            message: 'Pick a sketch and start coloring!',
            svgs: svgfiles
        }, {
            layout: 'none'
        });
    }
});

server.route({
    method: 'GET',
    path: '/loadWorks',
    handler: function (request, reply) {

        Colors.findAll({
            where: {
                paintname: {
                    not: 'Average'
                }
            }
        }).then(function (color) {
            var colordata = JSON.parse(JSON.stringify(color));
            var svgs = [];
            //            console.log(colordata);
            for (var i = 0; i < colordata.length; i++) {
                svgs.push({
                    svg: colordata[i].svg,
                    paintid: colordata[i].id
                });
            }
            reply.view('works_content', {
                message: "Here are the works you've done.",
                svgs: svgs
            }, {
                layout: 'none'
            });
        });

    }
});

server.route({
    method: 'GET',
    path: '/loadMix',
    handler: function (request, reply) {

        Colors.findAll({
            where: {
                paintname: 'Average'
            }
        }).then(function (color) {
            var colordata = JSON.parse(JSON.stringify(color));
            var svgs = [];
            //            console.log(colordata);
            for (var i = 0; i < colordata.length; i++) {
                svgs.push({
                    svg: colordata[i].svg,
                    paintid: colordata[i].id
                });
            }
            reply.view('works_content', {
                message: "See how everyone's painting mixed together!",
                svgs: svgs
            }, {
                layout: 'none'
            });
        });

    }
});

server.route({
    method: 'GET',
    path: '/new/{svg}',
    handler: function (request, reply) {
        reply.view('coloring', {
            svg: request.params.svg
        });
    }
});

server.route({
    method: 'GET',
    path: '/works/{svg}/{paintid}',
    handler: function (request, reply) {
        reply.view('coloring', {
            svg: request.params.svg,
            paintid: request.params.paintid
        });
    }
});

server.route({
    method: 'POST',
    path: '/save',
    handler: function (request, reply) {
        if (request.payload.id == null)
            Colors.create(request.payload).then(function () {
                Colors.sync().then(function () {
                    mix(request.payload.svg);
                });
            });
        else
            Colors.update(request.payload, {
                where: {
                    id: request.payload.id
                }
            }).then(function () {
                Colors.sync().then(function () {
                    mix(request.payload.svg);
                });
            });

        reply('Saved ' + request.payload.id);
    }
});

server.route({
    method: 'GET',
    path: '/colordata/{paintid}',
    handler: function (request, reply) {
        Colors.findOne({
            where: {
                id: request.params.paintid
            }
        }).then(function (color) {
            reply(JSON.stringify(color));
        });

    }
});

server.route({
    method: 'GET',
    path: '/delete/{paintid}',
    handler: function (request, reply) {
        var svg;
        Colors.findOne({
            where: {
                id: request.params.paintid
            }
        }).then(function (data) {
            var d = JSON.parse(JSON.stringify(data));
            svg = d.svg;
            Colors.destroy({
                where: {
                    id: request.params.paintid
                }
            }).then(function () {
                mix(svg);
                reply('deleted');
            });
        });
    }
});

server.route({
    method: 'GET',
    path: '/mix/{svg}',
    handler: function (request, reply) {
        mix(request.params.svg);
        reply('Mixed.');
    }
});

server.route({
    method: 'GET',
    path: '/clearDB',
    handler: function (request, reply) {
        Colors.drop();
        reply('Database cleared.');
    }
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: './',
            listing: true,
            index: false,
            redirectToSlash: true
        }
    }
});

function mix(svg) {
    Colors.findAll({
        where: {
            svg: svg,
            paintname: {
                not: 'Average'
            }
        }
    }).then(function (colordata) {
        var colors = JSON.parse(JSON.stringify(colordata));
        var avgColor = {};
        if (colors.length >= 1) {
            avgColor = colors[0];
            for (var i = 1; i < colors.length; i++) {
                for (var key in colors[i]) {
                    if (key.startsWith('piece')) {
                        avgColor[key] = averageColor(avgColor[key], colors[i][key]);
                    }
                }
            }
            delete avgColor.id;
            avgColor.paintname = 'Average';
            Colors.count({
                where: {
                    svg: svg,
                    paintname: 'Average'
                }
            }).then(function (count) {
                if (count > 0) {
                    Colors.update(avgColor, {
                        where: {
                            svg: svg,
                            paintname: 'Average'
                        }
                    }).then(function () {
                        Colors.sync();
                    });
                } else {
                    Colors.create(avgColor).then(function () {
                        Colors.sync();
                    });
                }
            });
        }
    });
}

function averageColor(color1, color2) {
    if (color1 == '' || color1 == null)
        return color2;
    else if (color2 == '' || color2 == null)
        return color1;
    else {
        color1 = color1.replace('rgb(', '');
        color1 = color1.replace(')', '');
        var rgb1 = color1.split(', ');
        color2 = color2.replace('rgb(', '');
        color2 = color2.replace(')', '');
        var rgb2 = color2.split(', ');
        for (var i = 0; i < 3; i++) {
            rgb1[i] = parseInt((parseInt(rgb1[i]) + parseInt(rgb2[i])) / 2);
        }
        return 'rgb(' + rgb1.join(', ') + ')';
    }
}

server.route({
    method: 'GET',
    path: '/createDB',
    handler: function (request, reply) {
        Colors.sync({
            force: true
        });
        reply('Database created.');
    }
});


server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});