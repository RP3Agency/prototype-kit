//TODO: set your AWS profile
process.env.AWS_PROFILE = 'SET YOUR PROFILE HERE';

var fs				= require('fs'),
	path			= require('path'),
	gulp			= require('gulp'),
	sass			= require('gulp-sass'),
	sourcemaps		= require('gulp-sourcemaps'),
	autoprefixer	= require('gulp-autoprefixer'),
	filter			= require('gulp-filter'),
	removeHtmlComments = require('gulp-remove-html-comments'),
	browserSync		= require('browser-sync').create(),
	reload			= browserSync.reload,
	watch			= require('gulp-watch'),
	del				= require('del'),
	jshint			= require('gulp-jshint'),
	markdown		= require('gulp-markdown'),
	wrap 			= require('gulp-wrap'),
	extender		= require('gulp-html-extend'),
	ejs				= require('gulp-ejs'),
	//TODO: set your region
	aws_s3			= require('gulp-s3-upload')({ useIAM: true }, { region: '' }),
	slack			= require('gulp-slack')({
			url:  '',  //from slack interface
			icon_url: 'http://purefishing.scene7.com/is/image/purefishing/1109403',
			user: 'Gulp',
			channel: '' //from your Slack instance
	}),
	username 		= require('username'),
	user			= username.sync(),
	paths = {
		src	: {
			base	: __dirname + '/src',
			sass	: __dirname + '/src/sass',
			js		: __dirname + '/src/js',
			images	: __dirname + '/src/images',
			vendor	: __dirname + '/src/vendor',
			fonts	: __dirname + '/src/css/fonts',
		},
		dist	: {
			base	: __dirname + '/build',
			css		: __dirname + '/build/css',
			js		: __dirname + '/build/js',
			images	: __dirname + '/build/images',
			vendor	: __dirname + '/build/vendor',
			fonts	: __dirname + '/build/css/fonts',
		}
	},
	mdTemplate		= '<!-- @@master /_templates/main.html { "title": "Home Page" } -->\n<!-- @@block content -->\n<%= contents %>\n<!-- @@close -->',
	environments = {
		qc: 'qc.prototype.example.support',
		uat: 'uat.prototype.example.support',
		prod: 'example.com'
	};


/*****

Lifecycle Management

*****/

//Clean

gulp.task('clean', function (cb) {
	del([
		paths.dist.base + '/**',
		'!' + paths.dist.base,
	], cb);
});




//Build


gulp.task('md', function () {
	return gulp.src([
			paths.src.base + '/**/*.md',
			'!' + paths.src.base + '/_templates/**',
			'!' + paths.src.base + '/_components/**',
			'!' + paths.src.base + '/html/**/_*.md'
		])
		.pipe(markdown())
		.pipe(wrap(mdTemplate, {}, { parse: false}))
		.pipe(extender({
			annotations: false,
			verbose: false,
			root: '/src/'
		}))
		.pipe(removeHtmlComments())
		.pipe(gulp.dest(paths.dist.base))
		.pipe(reload({stream: true}));
});



gulp.task('html', function(){
	return gulp.src([
			paths.src.base + '/**/*.html',
			'!' + paths.src.base + '/_templates/**',
			'!' + paths.src.base + '/_components/**',
			'!' + paths.src.base + '/html/**/_*.html'
		])
		.pipe(extender({
			annotations: false,
			verbose: false,
			root: '/src/'
		}))
		.pipe(ejs())
		.pipe(removeHtmlComments())
		.pipe(gulp.dest(paths.dist.base))
		.pipe(reload({stream: true}));
});

gulp.task('styles', function () {
	return gulp.src(paths.src.sass + '/site.scss')
		.pipe(sourcemaps.init())				// source map init
		.pipe(sass())							// Sass
		.pipe(autoprefixer('last 2 version'))
		.pipe(sourcemaps.write())				// sourcemap write
		.pipe(gulp.dest( paths.dist.css ))		// save css file
		.pipe(filter('**/*.css'))				// filter only css files (remove the map file)
		.pipe(reload({stream: true}));			// inject the changed css
});

gulp.task('images', function () {
    return gulp.src(paths.src.images + '/**/*',{ allowEmpty: true })
				.pipe(gulp.dest(paths.dist.images));
});

gulp.task('js', function () {
	return gulp.src(paths.src.js + '/**/*.js',{ allowEmpty: true })
		.pipe(jshint(__dirname + '/.jshintrc'))
		.pipe(jshint.reporter('default'))
		.pipe(gulp.dest(paths.dist.js));
});

gulp.task('fonts', function () {
    return gulp.src(paths.src.fonts + '/**/*',{ allowEmpty: true })
				.pipe(gulp.dest(paths.dist.fonts));
});

gulp.task('vendor', function () {
    return gulp.src(paths.src.vendor + '/**/*',{ allowEmpty: true })
				.pipe(gulp.dest(paths.dist.vendor));
});

gulp.task('copy', ['images', 'js', 'fonts', 'vendor']);


//Develop

gulp.task('bs', function (cb) {
	browserSync.init({
			server: {
				baseDir: paths.dist.base,
				index: 'index.html'
			},
			port  : 3000,
			open  : 'external',
			host  : 'localhost',
			notify: {
				styles: [
					'display: none;',
					'padding: 7px 15px;',
					'border-radius: 0 0 3px 3px;',
					'position: fixed;',
					'font-family: Arial, sans-serif',
					'font-size: 14px;',
					'font-weight: normal;',
					'z-index: 9999;',
					'right: 0px;',
					'top: 0px;',
					'background-color: rgba(30, 30, 30, .7);',
					'color: #fff',
					'pointer-events: none;'
				]
			},
			ghostMode: {
				clicks: true,
				scroll: true,
				forms: {
				submit: true,
				inputs: true,
				toggles: true
				}
			}
		}, function(err, bs) {
		cb()
	});
});

gulp.task('reload', function (cb) {
	reload();
	cb();
});

gulp.task('watch', function (cb) {
	gulp.watch([paths.src.sass + '/**/*'], ['styles']);
	gulp.watch([paths.src.js + '/**/*'], ['js']);
	gulp.watch([paths.src.images + '/**/*'], ['images']);
	gulp.watch([paths.src.vendor + '/**/*'], ['vendor']);
	gulp.watch([paths.src.base + '/**/*.html'], ['html']);
	cb();
});

gulp.task('build', ['styles', 'copy', 'html', 'md']);

gulp.task('serve', ['bs', 'build']);


//Deploy

//Deploy
gulp.task('deploy-qc', ['build'], function () {
	console.log('Not configured');
	return 0;
	return gulp.src(paths.dist.base + '/**')
		.pipe(aws_s3({
			Bucket:	environments.qc,
			ACL:	'public-read'
		}))
		.pipe(slack('Deployed to QC environment by ' + user + '.'));
});

//TODO: Implement Staging Deploy
gulp.task('deploy-uat', ['build'], function () {
	console.log('Not configured');
	return 0;
	return gulp.src(paths.dist.base + '/**')
		.pipe(aws_s3({
			Bucket:	environments.uat,
			ACL:	'public-read'
		}))
		.pipe(slack('Deployed to UAT environment by ' + user + '.'));
});

//TODO: Implement Production Deploy
gulp.task('deploy-prod', ['build'], function () {
	console.log('Not configured');
	return 0;
	return gulp.src(paths.dist.base + '/**')
		.pipe(aws_s3({
			Bucket:	environments.prod,
			ACL:	'public-read'
		}))
		.pipe(slack('Deployed to PRODUCTION environment by ' + user + '.'));
});


gulp.task('default', ['serve', 'watch']);
