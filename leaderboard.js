// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");
LocalCache = new Meteor.Collection(null);

if (Meteor.isClient) { 

  Template.leaderboard.players = function () {
    var selector = {},
        searchResults = LocalCache.findOne('search_ids');

    if (_.isObject(searchResults)) {
        searchResults = searchResults.ids;
    }

    if ("undefined" !== typeof searchResults && searchResults.length > 0) {
      selector = { '_id' : { '$in' : searchResults } };
    }

    return Players.find(selector, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.leaderboard.events({
    'click input.inc': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: 5}});
    },
    'keyup #search' : function (e) {
        EasySearch.search('players', $(e.target).val(), function (error, data) {
            data = _(data).map(function (doc) {
                return doc._id;
            });

            LocalCache.upsert({ _id : 'search_ids' }, { _id : 'search_ids', ids: data });
        });
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var first_names = ["Ada",
           "Grace",
           "Marie",
           "Carl",
           "Nikola",
           "Claude",
           "Peter",
           "Stefan",
           "Stephen",
           "Lisa"],
           last_names = ["Lovelace",
           "Hopper",
           "Curie",
           "Tesla",
           "Shannon",
           "Müller",
           "Meier",
           "Miller",
           "Gaga",
           "Franklin"];
      for (var i = 0; i < 30; i++)
        Players.insert({
            name: (first_names[Math.floor(Math.random() * 10)] + ' ' + last_names[Math.floor(Math.random() * 10)]), 
            score: Math.floor(Random.fraction()*10)*5});
    }
  });
}

// Searching
Meteor.startup(function () {
    // on Client and Server
    EasySearch.createSearchIndex('players', {
      'collection'    : Players,              // instanceof Meteor.Collection
      'field'         : ['name', 'score'],    // can also be an array of fields
      'limit'         : 20                   // default: 10
    });
});
