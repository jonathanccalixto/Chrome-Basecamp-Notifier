define([
  "models/user",
  "models/user_token",
  "services/auth",
  "views/config/accounts",
  "collections/accounts",
  "text!templates/configs.html",
  "services/configs_listened_events",
  "backbone",
  "easytab"
], function(
  User,
  UserToken,
  Auth,
  AccountsView,
  Accounts,
  ConfigTpl,
  ConfigListenedEvents
) {

  return Backbone.View.extend({
    el: $(".content"),

    loadingTemplate: _.template("<div class=\"load-view\"><h1>Loading...</h1></div>"),

    events: {
      "click #save" : "closeWindow",
      "click #logout" : function() {
        localStorage.clear();
        this.closeWindow();
      }
    },

    configsTemplate: _.template(ConfigTpl),

    render: function() {
      this.resolveAction();
    },

    renderLoadingPage: function() {
      this.$el.html(this.loadingTemplate({}));
    },

    closeWindow: function() {
      chrome.extension.getBackgroundPage().location.reload();
      window.open('', '_self', '');
      window.close();
    },

    resolveAction: function() {
      var that = this;

      this.renderLoadingPage();

      if (this.returningFromPermissionScreen()) {
        var auth = Auth.authorize(this.authCode);
        auth.done(function(){
          that.renderUserConfigs();
        });

        auth.fail(function(){
          alert("Erro, não foi possível salvar o usuário.");
        });
      } else if (UserToken.current() == undefined) {
        Auth.getPermission();
      } else {
        this.renderUserConfigs();
      }
    },

    renderUserConfigs: function() {
      var that = this;
      User.fetchCurrentUser().done(function(user){
        that.renderConfigsContent();
        that.renderAccountsToSelect(user.get("accounts"));
      });
    },

    renderConfigsContent: function() {
      this.$el.html(this.configsTemplate({}));
      this.$el.find(".tab-container").easytabs();
    },

    renderAccountsToSelect: function(accounts) {
      var accounts = new Accounts(accounts);
      return new AccountsView({ collection: accounts }).render();
    },

    returningFromPermissionScreen: function() {
      var authCode = location.search.match(/\?code\=([^\&]+)/);

      if (authCode != undefined) {
        this.authCode = authCode[1];
        return true;
      } else {
        return false;
      }
    }
  });
});