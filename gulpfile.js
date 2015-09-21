
var gulp        = require('gulp');
var watch       = require('gulp-watch');
var del         = require('del');
var rename      = require("gulp-rename");
var replace     = require('gulp-replace');
var concat      = require('gulp-concat');

var less        = require('gulp-less');
var prefix      = require('gulp-autoprefixer');
var minifyCSS   = require('gulp-minify-css');

var coffeelint  = require('gulp-coffeelint');
var coffee      = require('gulp-coffee');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');

var imagemin    = require('gulp-imagemin');

var browserSync = require('browser-sync').create();
var packageJSON = require('./package.json')

// Less

gulp.task('clean-app-styles', function(){
  return del('./app/styles/**');
});

gulp.task('less', ['clean-app-styles'], function(){
  return gulp.src('./app/less/*.less')
    .pipe(less())
    .on('error', function(err){ console.log(err.message); })
		.pipe(prefix("last 1 version"))
    .pipe(gulp.dest('./app/styles'))
    .pipe(browserSync.stream());
});


// Coffee

gulp.task('clean-app-scripts', function(){
  return del('app/scripts/**');
});

gulp.task('coffee', ['clean-app-scripts'], function(){
  return gulp.src('./app/coffee/*.coffee')
    .pipe(coffeelint())
    .pipe(coffeelint.reporter())
    .pipe(coffee()).on('error', function(err){ console.log(err.message); })
    .pipe(replace(/\.(jpg|jpeg|gif|png|svg)$/g, '.$1?' + (new Date()).getTime()))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./app/scripts'))
    .pipe(browserSync.stream());
});


// Templates

gulp.task('clean-craft-templates', function(){
  return del('./craft/templates/**');
});

gulp.task('clean-public-styles', function() {
  return del(['./public/styles/**']);
});

gulp.task('clean-public-scripts', function() {
  return del(['./public/scripts/**']);
});

gulp.task('third-party-styles', function() {
  return gulp.src(packageJSON.thirdPartyStyles)
    .pipe(minifyCSS({ removeEmpty: true }))
    .pipe(concat('third-party.min.css'))
    .pipe(gulp.dest('./public/styles'));
});

gulp.task('styles', ['clean-public-styles', 'third-party-styles', 'less'], function() {
  return gulp.src('./app/styles/**/*.css', { base: './app/styles' })
    .pipe(minifyCSS({ removeEmpty: true }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./public/styles'));
});

gulp.task('third-party-scripts', function() {
  return gulp.src(packageJSON.thirdPartyScripts)
    .pipe(uglify())
    .pipe(concat('third-party.min.js'))
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('scripts', ['clean-public-scripts', 'third-party-scripts', 'coffee'], function() {
  return gulp.src('./app/scripts/**/*.js', { base: './app/scripts' })
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('templates', ['clean-craft-templates', 'styles', 'scripts'], function() {
	return gulp.src('./app/templates/**/*.html', { base: './app/templates' })
	  .pipe(replace(/<\!-- replaceWith: <([^>]+)>(<\/script>)? -->[^\!]+\!-- endReplace -->/g, '<$1>$2'))
	  .pipe(replace(/<\!-- replaceWith: \{([^\}]+)\} -->[^\!]+\!-- endReplace -->/g, '{{$1}}'))
  	.pipe(gulp.dest('./craft/templates'));
});


// Images

gulp.task('clean-images', function(){
  return del('./public/images/**');
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
  return del('./public/fonts/**');
});

gulp.task('fonts', ['clean-fonts'], function () {
  return gulp.src('./app/fonts/**/*')
    .pipe(gulp.dest('./public/fonts'));
});


// Static

gulp.task('clean-static', function(){
  return del(['./public/*.ico', './public/*.png', './public/*.txt']);
});

gulp.task('static', ['clean-static'], function () {
  return gulp.src(['./app/*.ico', './app/*.png', './app/*.txt'])
    .pipe(gulp.dest('./public'));
});


// Watch

gulp.task('watch', ['less', 'coffee'], function() {

  browserSync.init({
    proxy: packageJSON.devProxy
  });

  gulp.watch('./app/less/**/*.less', ['less']);
  gulp.watch('./app/coffee/**/*.coffee', ['coffee']);
  gulp.watch(['./app/images/**', './app/fonts/**', './app/templates/*.html']).on('change', browserSync.reload);

});


// Build

gulp.task('build', ['templates', 'images', 'fonts', 'static']);


// Default

gulp.task('default', ['build']);
