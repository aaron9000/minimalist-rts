Minimalist RTS
==================

About
===

My entry for the Ludum Dare #26 72hr submission. The prompt was "Minimalism". A runnable version of the game is in the example folder.

Build it yourself
===

You must have the following tools installed and in your path variable:
- NPM - https://npmjs.org/
- uglify-js - https://npmjs.org/package/uglify-js 
- jshint - https://npmjs.org/package/jshint

To build the game run either:
 - 'sh compile.sh develop'
 - 'sh compile.sh release'

These commands will build the game into the products/develop and products/release folders resepctivley.

Develop compile process:
 - lint all scripts
 - copy scripts/ folder
 - copy markup/ folder
 - copy styles/ folder
 - copy images/ folder
 - replace <!--scripts--> tag in default.html with script imports
 - replace /*images*/ tag with the files within the images/ folder
 - replace /*sounds*/ tag with the files within the sounds/ folder

Release compile process:
 - lint all scripts
 - combine scripts into one file
 - copy markup/ folder
 - copy styles/ folder
 - copy images/ folder
 - replace <!--scripts--> tag in default.html with import of compiled.js
 - replace /*images*/ tag with the files within the images/ folder
 - replace /*sounds*/ tag with the files within the sounds/ folder
 - remove /*strip*/ ... /*strip*/ sections of code
 - minify compiled.js
