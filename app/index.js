'use strict';
var util = require('util');
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var rereddit = require('rereddit');
var links = [];

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the kickass ' + chalk.red('Janus Reddit') + ' room generator!'
    ));

    // Prompt user for the subreddit, default to 'vrsites'.
    var prompts = [{
      type: 'input',
      name: 'subreddit',
      message: 'From which subreddit would you like to harvest links? (ex: funny)',
      default: 'vrsites'
    },{
      type: 'input',
      name: 'limit',
      message: 'How many links would you like to retrieve?',
      default: 10
    }, {
      type: 'input',
      name: 'docTitle',
      message: 'HTML title for this page:',
      default: 'JanusReddit'
    }, {
      type: 'input',
      name: 'docHTML',
      message: 'HTML or text description for this page:',
      default: '<p>Generated with <a href="https://github.com/sirkitree/generator-janus-reddit">Janus Reddit room generator</a>.'
    }];

    // Actual work done here.
    this.prompt(prompts, function (props) {
      this.subreddit = props.subreddit;
      this.limit = props.limit;
      this.docTitle = props.docTitle;
      this.docHTML = props.docHTML;
      var linkPopulation = {
        callRedditAPI: function (subreddit, limit, cb) {
          // Use rereddit to grab the posts
          rereddit
            .read(subreddit)
            .limit(limit)
            .end(function(err, posts) {
              if (err) {
                return cb(err);
              }
              linkPopulation.constructLinkProperties(posts, cb);
            });
        },

        constructLinkProperties: function (posts, cb) {
          var assetLinks = [];
          var portalWidth = 2, // really 1.8 but rounding up
            portalHeight = 2.5,
            c = 5,
            x = c * (portalWidth) * (-1), // since our portals are 1.8 in width, let's multiply by that
            y = 1,
            z = 1;

          // pass assetLinks as the context which becomes 'this' inside the forEach();
          posts.data.children.forEach(function (val, idx, arr) {

            // make sure current post is a link. links don't have selftext_html
            if (val.data.selftext_html == null) {

              // construct assetLink objects
              this.push({
                'id': val.data.id,
                'url': val.data.url,
                'title': val.data.title.replace(/["']/g, ""), // remove quotes
                'pos': {'x' : x, 'y' : y, 'z' : z},
                'xdir': 'xdir',
                'ydir': 'ydir',
                'zdir': 'zdir'
              });

              // change xyz
              x = x + portalWidth + 1; // again, our portals are 1.8 in width so add that to our next pos.x

              if (x > c * (portalWidth)) {
                // reset x to c
                x = c * (portalWidth) * (-1);
                // increment y to start new row above the last
                y = y + portalHeight;
                // decrement z to give the stadium effect
                z--;
              }

            }
          }, assetLinks);

          links = assetLinks;
          cb(null); // shoud be done();
        }
      }

      linkPopulation.callRedditAPI(props.subreddit, props.limit, done);
    }.bind(this));
  },

  writing: {
    app: function () {
      this.fs.copyTpl(
        this.templatePath('_index.html'),
        this.destinationPath('public/index.html'),
        {
          title: this.docTitle,
          description: this.docHTML,
          assetLinks: links,
          subreddit: this.subreddit
        }
      );
    }
  }
});
