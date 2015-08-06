## Build Workflow for Craft CMS with Gulp

### Getting started

__Install__ this workflow via `git clone` or download the zip of this repository to the root of your future website. If you already have Craft installed, add all _but_ the .gitignore and README.md to your Craft root, e.g. the same folder that /public and /craft are in, assuming a traditional Craft install.

__Run__ `npm install` to add the needed build software.

__Set__ the devProxy attribute in the package.json file to your development domain for this website. (Yes, you need a separate domain for development; more to follow.)

[Download](http://buildwithcraft.com/) the latest version of craft and move the craft folder to the root if not already there. (And, you should complete the Craft install process at your production domain before using this workflow for the first time.)

__Configure__ your web server software with an additional vhost (or equivalent) that uses the /app folder as a document root rather than the production standard of /public.

__Update__ the bower dependencies for your website in bower.json, run `bower install`, and finally update the default Craft app/templates/_layout.html (and any other layouts) to utilize those Third-party resources.

### Tasks

Perform all editing on files within the /app folder, including the templates. All files and folders in the /craft/templates folder will be deleted and/or overwritten.

* `gulp watch` to start the watch task, which monitors coffee, less, templates, images and fonts for changes and recompiles as needed prior to having BrowserSync refresh your views. The development host and port will be shown when in your terminal when BrowserSync starts. (Remember to open the ports if you use a firewall.)

* `gulp` or `gulp build` to build for production.

### Gulp Plugins


* __less__ -
_CSS compiler_


* __autoprefixer__ -
_So we don't have to write -moz-, -webkit-, -ms-, -o-, -all-, -the-, -time-_


* __minify-css__ -
_Compress CSS in the build process_


* __coffeelint__ -
_CoffeeScript linter_


* __coffee__ -
_CoffeeScript compiler, until ES6_


* __jshint__ -
_A tool that helps to detect errors and potential problems in your JavaScript code._


* __uglify__ -
_Javascript minification for the build process_


* __replace__ -
_Version image urls inside CSS and js_


* __concat__ -
_Merge CSS and js to single files_


* __watch__ -
_The thing that tells us when a file has changed_


* __browsersync__ -
_Updates our browsers when scripts, styles or static files change_


* __imagemin__ -
_Optimizes images for you._


* __usemin__ -
_Reads the html to convert assets from development to minified and concatted production files_


* __del__ -
_A clean house is a happy house_
