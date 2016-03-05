
var fs          = require('fs');
var assign      = require('object-assign');

var gulp        = require('gulp');
var watch       = require('gulp-watch');
var del         = require('del');
var rename      = require("gulp-rename");
var replace     = require('gulp-replace');
var concat      = require('gulp-concat');

var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var minifyCSS   = require('gulp-minify-css');

var coffeelint  = require('gulp-coffeelint');
var coffee      = require('gulp-coffee');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');

var imagemin    = require('gulp-imagemin');

var exec        = require('child_process').exec;
var gulpSSH     = require('gulp-ssh');
var rsync       = require('rsync-slim');

var browserSync = require('browser-sync').create();
var vendor      = require('./vendor.json');
var moveFile    = require('./movefile.json');


// Sass

gulp.task('clean-app-styles', function(){
  return del('./app/styles/**');
});

gulp.task('sass', ['clean-app-styles'], function(){
  return gulp.src('./app/sass/*.scss')
    .pipe(sass({
      includePaths: [
        './app/sass/**',
        './node_modules/bootstrap-sass/assets/stylesheets',
        './app/third-party/slick-carousel/slick'
        ]
      }).on('error', sass.logError))
    .on('error', function(err){ console.log(err.message); })
    .pipe(prefix("last 2 versions"))
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
  return gulp.src(vendor.styles)
    .pipe(minifyCSS({ removeEmpty: true }))
    .pipe(concat('third-party.min.css'))
    .pipe(gulp.dest('./public/styles'));
});

gulp.task('styles', ['clean-public-styles', 'third-party-styles', 'sass'], function() {
  return gulp.src('./app/styles/**/*.css', { base: './app/styles' })
    .pipe(gulp.dest('./public/styles'));
});

gulp.task('third-party-scripts', function() {
  return gulp.src(vendor.scripts)
    .pipe(concat('third-party.js'))
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('scripts', ['clean-public-scripts', 'third-party-scripts', 'coffee'], function() {
  return gulp.src('./app/scripts/**/*.js', { base: './app/scripts' })
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./public/scripts'));
});

gulp.task('templates', ['clean-craft-templates', 'styles', 'scripts'], function() {
	return gulp.src('./app/templates/**/*.{html,css}', { base: './app/templates' })
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

gulp.task('watch', ['sass', 'coffee'], function() {

  browserSync.init({
    proxy: moveFile.development.devhost
  });

  gulp.watch('./app/sass/**/*.scss', { readDelay: 1000 }, ['sass']);
  gulp.watch('./app/coffee/**/*.coffee', ['coffee']);
  gulp.watch(['./app/images/**', './app/fonts/**', './app/templates/**']).on('change', browserSync.reload);

});


// Build

gulp.task('build', ['templates', 'images', 'fonts', 'static']);


// Rsync

var rsyncFlags = '-azvP --delete --checksum';
var rsyncRemote = moveFile.production.username + '@' + moveFile.production.host + ':' + moveFile.production.docroot + '/';
var rsyncExclusions = [
  'storage'
];

gulp.task('pull-public', function() {
  if ( moveFile.software.useRsync ) {
    return rsync({
      src: rsyncRemote + 'public',
      dest: '.',
      options: rsyncFlags
    });
  }
});

gulp.task('pull-craft', function() {
  if ( moveFile.software.useRsync ) {
    return rsync({
      src: rsyncRemote + 'craft',
      dest: '.',
      options: rsyncFlags + ' --exclude=' + rsyncExclusions.join(' --exclude=')
    });
  }
});

gulp.task('push-public', function() {
  if ( moveFile.software.useRsync ) {
    return rsync({
      src: 'public',
      dest: rsyncRemote,
      options: rsyncFlags
    });
  }
  if ( moveFile.software.useSFTP ) {
    return gulp.src('public/**/*.*')
      .pipe(sshProduction.dest(moveFile.production.docroot + '/public/'))
  }
});

gulp.task('push-craft', function() {
  if ( moveFile.software.useRsync ) {
    return rsync({
      src: 'craft',
      dest: rsyncRemote,
      options: rsyncFlags + ' --exclude=' + rsyncExclusions.join(' --exclude=')
    });
  }
  if ( moveFile.software.useSFTP ) {
    return gulp.src('craft/templates/**/*.*')
      .pipe(sshProduction.dest(moveFile.production.docroot + '/craft/templates/'))
  }
});

gulp.task('pull-production-database', ['dump-production-database'], function() {
  if ( moveFile.software.useRsync ) {
    return rsync({
      src: rsyncRemote + moveFile.database.name + '-production.sql',
      dest: '.',
      options: rsyncFlags
    });
  }
  if ( moveFile.software.useSFTP ) {
    return sshProduction.sftp(
        'read',
        moveFile.production.docroot + '/' + moveFile.database.name + '-production.sql',
        { filePath: moveFile.database.name + '-production.sql' }
      )
      .pipe(gulp.dest('.'))
  }
});

gulp.task('push-development-database', ['dump-development-database'], function() {
  if ( moveFile.software.useRsync ) {
    return rsync({
      src: moveFile.database.name + '-development.sql',
      dest: rsyncRemote,
      options: rsyncFlags
    });
  }
  if ( moveFile.software.useSFTP ) {
    return gulp.src(moveFile.database.name + '-development.sql')
      .pipe(sshProduction.dest(moveFile.production.docroot + '/'))
  }
});


// SFTP

gulp.task('pull-production-database-sftp', ['dump-production-database'], function() {
  return sshProduction.sftp(
      'read',
      moveFile.production.docroot + '/' + moveFile.database.name + '-production.sql',
      { filePath: moveFile.database.name + '-production.sql' }
    )
    .pipe(gulp.dest('.'))
});

gulp.task('pull-production-database-sftp', ['dump-production-database'], function() {
  return sshProduction.sftp(
      'read',
      moveFile.production.docroot + '/' + moveFile.database.name + '-production.sql',
      { filePath: moveFile.database.name + '-production.sql' }
    )
    .pipe(gulp.dest('.'))
});


// Database

var sshProduction = new gulpSSH({
  ignoreErrors: false,
  sshConfig: {
    host: moveFile.production.host,
    username: moveFile.production.username,
    password: moveFile.production.password
  }
});

var sshDevelopment = new gulpSSH({
  ignoreErrors: false,
  sshConfig: {
    host: moveFile.development.host,
    username: moveFile.development.username,
    password: moveFile.development.password
  }
});

gulp.task('dump-production-database', function() {
  return sshProduction
    .shell([
      'cd ' + moveFile.production.docroot,
      'mysqldump -u ' + moveFile.database.username + ' -p' + moveFile.database.password + ' ' + moveFile.database.name + ' > ' + moveFile.database.name + '-production.sql',
    ], {
      filePath: 'dump-production-database.log'
    })
    .pipe(gulp.dest('logs'))
});

gulp.task('dump-development-database', function() {
  if ( moveFile.software.useVagrant ) {
    return sshDevelopment
      .shell([
        'cd /home/vagrant/php-local',
        'mysqldump -u ' + moveFile.database.username + ' -pvagrant ' + moveFile.database.name + ' > ' + moveFile.database.name + '-development.sql'
      ], {
        filePath: 'dump-development-database.log'
      })
      .pipe(gulp.dest('logs'))
  }
  if ( moveFile.software.useLocal ) {
    return exec(
      'mysqldump -u ' + moveFile.database.username + ' -pvagrant ' + moveFile.database.name + ' > ' + moveFile.database.name + '-development.sql',
      function(error, stdout, stderr){
        if (error) {
          console.log(stderr);
          console.log(error.message);
        } else {
          console.log(stdout);
          console.log("");
        }
      }
    );
  }
});

gulp.task('insert-production-database', ['pull-production-database', 'dump-development-database'], function() {
  if ( moveFile.software.useVagrant ) {
    return sshDevelopment
      .shell([
        'cd /home/vagrant/php-local',
        'mysql -u ' + moveFile.database.username + ' -pvagrant ' + moveFile.database.name + ' < ' + moveFile.database.name + '-production.sql'
      ], {
        filePath: 'insert-production-database.log'
      })
      .pipe(gulp.dest('logs'))
  }
  if ( moveFile.software.useLocal ) {
    return exec(
      'mysql -u ' + moveFile.database.username + ' -pvagrant ' + moveFile.database.name + ' < ' + moveFile.database.name + '-production.sql',
      function(error, stdout, stderr){
        if (error) {
          console.log(stderr);
          console.log(error.message);
        } else {
          console.log(stdout);
          console.log("");
        }
      }
    );
  }
});

gulp.task('insert-development-database-only', function() {
  return sshProduction
    .shell([
      'cd ' + moveFile.production.docroot,
      'mysql -u ' + moveFile.database.username + ' -p' + moveFile.database.password + ' ' + moveFile.database.name + ' < ' + moveFile.database.name + '-development.sql',
    ], {
      filePath: 'insert-development-database.log'
    })
    .pipe(gulp.dest('logs'))
});

gulp.task('insert-development-database', ['push-development-database', 'dump-production-database'], function() {
  return sshProduction
    .shell([
      'cd ' + moveFile.production.docroot,
      'mysql -u ' + moveFile.database.username + ' -p' + moveFile.database.password + ' ' + moveFile.database.name + ' < ' + moveFile.database.name + '-development.sql',
    ], {
      filePath: 'insert-development-database.log'
    })
    .pipe(gulp.dest('logs'))
});


// Pull/Push

gulp.task('pull-database', [
  'dump-development-database',
  'insert-production-database'
]);

gulp.task('push-database', [
  'dump-production-database',
  'insert-development-database'
]);

gulp.task('pull-files', [
  'pull-public',
  'pull-craft'
]);

gulp.task('push-files', [
  'push-public',
  'push-craft'
]);

gulp.task('pull', [
  'pull-files',
  'pull-database'
]);

gulp.task('push', [
  'push-files',
  'push-database'
]);


// Default

gulp.task('default', ['build']);
