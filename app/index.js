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
    }];

    // Actual work done here.
    this.prompt(prompts, function (props) {
      this.subreddit = props.subreddit;
      this.limit = props.limit;
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
        var c = 5,
          x = c * (-1),
          y = 1,
          z = 1;

          // pass assetLinks as the context which becomes 'this' inside the forEach();
          posts.data.children.forEach(function (val, idx, arr) {
            console.log(val);
            // make sure current post is a link. links don't have selftext_html
            if (val.data.selftext_html == null) {

              // construct assetLink objects
              this.push({
                'id': val.data.id,
                'url': val.data.url,
                'pos': {'x' : x, 'y' : y, 'z' : z},
                'xdir': 'xdir',
                'ydir': 'ydir',
                'zdir': 'zdir'
              });

              // change xyz
              x++;

              if (x === c+1) {
                // reset x to c
                x = c * (-1);
                // increment y to start new row above the last
                y++;
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
          title: 'Reddit Janus',
          description: 'test description',
          assetLinks: links,
          subreddit: this.subreddit
        }
      );
    }
  }
});
