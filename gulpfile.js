var gulp = require('gulp');
var gulputil = require('gulp-util');
var listen = require('in-a-storm');
var open = require('open');
var express = require('express');
var url = require('url');
var fs = require('fs');

var descriptor = require('./package.json');

var livereload = require('gulp-livereload');
var changed = require('gulp-changed');
var traceur = require('gulp-traceur');
var browserify = require('gulp-browserify');
var stylus = require('gulp-stylus');
var imagemin = require('gulp-imagemin');
var jasmine = require('gulp-jasmine');
var markdown = require('gulp-markdown');
var wrap = require("gulp-wrap");

var paths = {
	output: 'public',
	resources: 'resources',
	spec: 'spec',
	es5: "es5",
	es6: "src",
	entry: descriptor.main || "index.js"
};

var includeLiveReload = '<script src="http://localhost:35729/livereload.js?snipver=1"></script>';

function ext(base) {
	var result = [];
	for (var i = 1; i < arguments.length; ++i) {
		result.push(base + '/**/*.' + arguments[i]);
	}
	return result;
}

gulp.task('resources', function() {
	// process images
	gulp.src(ext(paths.resources, 'png', 'jpg', 'jpeg'))
			.pipe(changed(paths.output))
			.pipe(imagemin({optimizationLevel: 5}))
			.pipe(gulp.dest(paths.output));

	// process markdown
	gulp.src(ext(paths.resources, 'md').concat(['./readme.md']))
			// .pipe(changed(paths.output, { extension: '.html' }))
			.pipe(markdown({
				highlight: function (code) {
					return require('highlight.js').highlightAuto(code).value;
				}
			}))
			.pipe(wrap({ src: './MarkdownWrapper.html' }))
			.pipe(gulp.dest(paths.output));

	// process stylus files
	gulp.src(ext(paths.resources, 'styl'))
			.pipe(changed(paths.output, { extension: '.css' }))
			.pipe(stylus())
			.pipe(gulp.dest(paths.output));

	// everything else gets copied across
	gulp.src([paths.resources + '/**/*',
				'!/**/*.png', '!/**/*.jpg', '!/**/*.jpeg', '!/**/*.styl', '!/**/*.md'])
			.pipe(changed(paths.output))
			.pipe(gulp.dest(paths.output));
});

gulp.task('compile', function () {

	var tcomp = traceur();
	tcomp.on('error', function(e) {
		console.error("Traceur Error: ", e.name + ": " + e.message);
	});

	gulp.src(ext(paths.es6, 'js'))
			.pipe(changed(paths.es5))
			.pipe(tcomp)
			.pipe(gulp.dest(paths.es5));
});

gulp.task('test', function() {
	gulp.src(['spec/**/*-spec.js', paths.es5 + '/**/*.js'])
			.pipe(jasmine())
			.pipe(changed(paths.output))
			.pipe(gulp.dest(paths.output + "/spec"));
});

var browserifyError = null;

gulp.task('bundle', ['compile'], function() {
	var bify = browserify({
		standalone: descriptor.name,
		debug : true
	});
	bify.on('error', function(err) {
		console.error(err.name + ": "+err.message);
		browserifyError = err;
	});
	bify.on('postbundle', function(src) {
		browserifyError = null;
	});

	gulp.src(paths.entry)
			.pipe(bify)
			.pipe(gulp.dest(paths.output));
});

gulp.task('watch', function() {
	gulp.watch(ext(paths.es6, 'js'), ['bundle']);
	gulp.watch([paths.resources + '/**', './MarkdownWrapper.html', './readme.md'], ['resources']);
	gulp.watch(['spec/**/*-spec.js', paths.es5 + '/**/*.js'], ['test']);

	var server = livereload();
	gulp.watch(paths.output + '/**').on('change', function(file) {
		server.changed(file.path);
	});
});

gulp.task('serve', ['resources', 'bundle', 'test', 'watch'], function(next) {
	var app = express();
	app.use(function(req, res, next) {
		var path = url.parse(req.url).pathname;
		if (path.substr(-1) === '/') {
			path = path + "index.html";
		}
		if (/\.html$/.test(path)) {
			fs.readFile(paths.output + path, {encoding: 'utf8'}, function(err, data) {
				var replacement = "<head>\n\t" + includeLiveReload + "\n";

				if (browserifyError) {
					var warning = "Error : " + browserifyError.name + "\n" + browserifyError.message + "\n\nUsing most recent successful code.";
					replacement += "<script>console.error(" + JSON.stringify(warning) + ");alert("+ JSON.stringify(warning) +");</script>"
				}

				res.send(200, data.replace(/<head>/, replacement));
			});
		} else {
			next();
		}
	});
	app.use(express.static('./' + paths.output));

	listen(app).then(function(port) {
		gulputil.log('Dev Server listening on port: ' + gulputil.colors.magenta(port));
		open('http://localhost' + ( port !== 80 ? (':'+port) : "") + "/");
		open('http://localhost' + ( port !== 80 ? (':'+port) : "") + "/spec");
	});
});

gulp.task('default', ['serve']);