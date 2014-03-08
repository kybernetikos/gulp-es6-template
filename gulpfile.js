var NodeStatic = require('node-static');
var gulp = require('gulp');
var gulputil = require('gulp-util');
var listen = require('in-a-storm');
var open = require('open');

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
	gulp.src(ext(paths.resources, 'md').concat(['readme.md']))
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
	gulp.src(ext(paths.es6, 'js'))
			.pipe(changed(paths.es5))
			.pipe(traceur())
			.pipe(gulp.dest(paths.es5));
});

gulp.task('test', function() {
	gulp.src(['spec/**/*-spec.js', paths.es5 + '/**/*.js'])
			.pipe(jasmine())
			.pipe(changed(paths.output))
			.pipe(gulp.dest(paths.output + "/spec"));
});

gulp.task('bundle', ['compile'], function() {
	gulp.src(paths.entry)
			.pipe(browserify({
				standalone: descriptor.name,
				debug : true
			}))
			.pipe(gulp.dest(paths.output));
});

gulp.task('watch', function() {
	gulp.watch(ext(paths.es6, 'js'), ['bundle']);
	gulp.watch([paths.resources + '/**', 'MarkdownWrapper.html', 'readme.md'], ['resources']);
	gulp.watch(['spec/**/*-spec.js', paths.es5 + '/**/*.js'], ['test']);

	var server = livereload();
	gulp.watch(paths.output + '/**').on('change', function(file) {
		server.changed(file.path);
	});
});

gulp.task('serve', ['resources', 'bundle', 'test', 'watch'], function(next) {
	var staticServer = new NodeStatic.Server('./' + paths.output);
	var server = require('http').createServer(function (request, response) {
		request.addListener('end', function () {
			staticServer.serve(request, response);
		}).resume();
	});
	listen(server).then(function(port) {
		gulputil.log('Dev Server listening on port: ' + gulputil.colors.magenta(port));
		open('http://localhost' + ( port !== 80 ? (':'+port) : "") + "/");
		open('http://localhost' + ( port !== 80 ? (':'+port) : "") + "/spec");
	});

});

gulp.task('default', ['serve']);