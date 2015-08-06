
var gulp = require('gulp');
var watch = require('gulp-watch');
var del = require('del');
var rename = require("gulp-rename");
var replace = require('gulp-replace');
var concat = require('gulp-concat');

var less = require('gulp-less');
var prefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');

var coffeelint = require('gulp-coffeelint');
var coffee = require('gulp-coffee');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');

var imagemin = require('gulp-imagemin');
var usemin = require('gulp-usemin');

var browserSync = require('browser-sync').create();


// Less

gulp.task('clean-styles', function(){
  return del('app/styles/**');
});

gulp.task('less', ['clean-styles'], function(){
  return gulp.src('app/less/*.less')
    .pipe(less())
    .on('error', function(err){ console.log(err.message); })
		.pipe(prefix("last 1 version"))
    .pipe(gulp.dest('app/styles'))
    .pipe(browserSync.stream());
});


// Coffee

gulp.task('clean-scripts', function(){
  return del('app/scripts/**');
});

gulp.task('coffee', ['clean-scripts'], function(){
  return gulp.src('app/coffee/*.coffee')
    .pipe(coffeelint())
    .pipe(coffeelint.reporter())
    .pipe(coffee()).on('error', function(err){ console.log(err.message); })
    .pipe(replace(/\.(jpg|jpeg|gif|png|svg)$/g, '.$1?' + (new Date()).getTime()))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('app/scripts'))
    .pipe(browserSync.stream());
});


// Images

gulp.task('clean-images', function(){
  return del('public/images/**');
});

gulp.task('images', ['clean-images'], function () {
  return gulp.src('./app/images/**/*')
    .pipe(imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('./public/images'));

});


// Fonts

gulp.task('clean-fonts', function(){
  return del('public/fonts/**');
});

gulp.task('fonts', ['clean-fonts'], function () {
  return gulp.src('./app/fonts/**/*')
    .pipe(gulp.dest('./public/fonts'));
});


// Static

gulp.task('clean-static', function(){
  return del(['public/*.ico', 'public/*.png', 'public/*.txt']);
});

gulp.task('static', ['clean-static'], function () {
  return gulp.src(['./app/*.ico', './app/*.png', './app/*.txt'])
    .pipe(gulp.dest('./public'));
});


// Watch

gulp.task('watch', ['less', 'coffee'], function() {

  browserSync.init({
    proxy: "dev.mosarcommercial.com"
  });

  gulp.watch('app/less/**/*.less', ['less']);
  gulp.watch('app/coffee/**/*.coffee', ['coffee']);
  gulp.watch(['app/images/**', 'app/fonts/**', 'app/templates/*.html']).on('change', browserSync.reload);

});


// Build

gulp.task('usemin', ['less', 'coffee'], function() {
	return gulp.src('app/templates/**')
  	.pipe(usemin({
  		thirdPartyStyles: [minifyCSS({ removeEmpty: true }), 'concat'],
  		styles: [minifyCSS({ removeEmpty: true }), 'concat'],
  		thirdPartyScripts: [uglify()],
  		scripts: [uglify()]
  	}))
  	.pipe(gulp.dest('./public'));
});

gulp.task('templates', ['usemin'], function() {
  return gulp.src('./public/**/*.html')
    .pipe(gulp.dest('./craft/templates'));
});

gulp.task('build', ['templates', 'images', 'fonts', 'static'], function() {
  del('./public/**/*.html');
});


// Default

gulp.task('default', ['build']);
