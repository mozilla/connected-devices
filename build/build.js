'use strict';

const path = require('path');
const fs = require('fs');
const ff = require('ff');
const showdown = require('showdown');

const SCRIPT_PATH = __dirname;
const BASE_PATH = path.join(__dirname, '..');
const CONTENT_PATH = path.join(BASE_PATH, 'content');
const SITE_PATH = path.join(BASE_PATH, 'site');
const BUILD_PATH = path.join(BASE_PATH, 'build');

const HEADER_FILE = path.join(BUILD_PATH, 'header.inc');
const FOOTER_FILE = path.join(BUILD_PATH, 'footer.inc');

/**
* Entry point for the site builder.
* Turns each of the content MD files into static HTML pages.
*
* @cb - Function, the callback when the build is finished
*/
function buildSite(cb) {
  var f = ff(() => {
    // Get all the content files.
    fs.readdir(CONTENT_PATH, f());
  }, filenames => {
    f.pass(filenames);

    // Read the content of all the content files.
    var g = f.group();
    filenames = filenames.map(filename => {
      var fullpath = path.join(CONTENT_PATH, filename);
      fs.readFile(fullpath, g());
      return fullpath;
    });

    // Read the header and footer to append to the content.
    fs.readFile(HEADER_FILE, f());
    fs.readFile(FOOTER_FILE, f());
  }, (filenames, buffers, header, footer) => {

    // Convert markdown to html, and append header and footer.
    var converter = new showdown.Converter();
    buffers.forEach((buf, i) => {
      var markdown = buf.toString('utf8');
      var html = converter.makeHtml(markdown);
      var fullpage = Buffer.concat([header, Buffer.from(html), footer]);

      // Here we let ff do the error handling.
      var newFilename = filenames[i].replace('.md', '.html');
      var staticPath = path.join(SITE_PATH, newFilename);
      fs.writeFile(staticPath, fullpage, f());
    });
  });

  f.onComplete(cb);
}

exports.build = buildSite;

// If this script is being run directly, then immediately invoke build.
if (!module.parent) {
  buildSite(function(err) {
    if (err) {
      console.log('Error building site', err);
    } else {
      console.log('Site built successfully');
    }
  });
}
