var routes = require(__dirname + '/../controllers')
, article = require(__dirname + '/../controllers/article')
, category = require(__dirname + '/../controllers/category')
, tags = require(__dirname + '/../controllers/tags')
, css = require(__dirname + '/../controllers/css')
, template = require(__dirname + '/../controllers/template')
, edit = require(__dirname + '/../controllers/edit')
, users = require(__dirname + '/../controllers/user')
, auth = require('./middlewares/authorization')
, resources = require('./middlewares/resources');

// middlewares
var articleAuth = auth.article.auth;
var userAuth = auth.user.auth;
var menuFileList = resources.getMenuFileList;

module.exports = function (app, passport) {

  var passportMiddleware = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  });

  // params
  app.param('userId',         users.load);
  app.param('article_name',   article.loadByName);
  app.param('article_id',     article.loadById)
  app.param('category_name',  category.load);


  // defines routes for readers
  app.get('/',                        routes.index);

  // articles - rendered templates
  app.get('/article',                   article.list);
  app.get('/article/:article_name',     article.single);
  
  // articles - json
  app.get('/api/article/content',                                   article.listJson);
  app.get('/api/article/raw',                   auth.requiresLogin, article.listJsonRaw);
  app.get('/api/article/content/:article_id',                       article.singleJson);
  app.get('/api/article/raw/:article_id',       auth.requiresLogin, article.singleJsonRaw);
  
  // category
  app.get('/category/:category_name',   category.getByName);
  app.get('/api/category',              category.list);

  // tags 
  app.get('/tags/', tags.list);

  // login/create session
  app.get('/logout',         auth.requiresLogin, users.logout);
  app.post('/users/session', passportMiddleware, users.session);

  // user routes
  app.post('/users',                                userAuth, users.create);
  app.post('/users/createRoot',                               users.createRoot);
  app.get( '/users',            auth.requiresLogin,           users.list);
  app.del( '/users/:userId',    auth.requiresLogin, userAuth, users.destroy);
  app.put( '/users/:userId',    auth.requiresLogin, userAuth, users.update);

  // defines routes for author tools pages
  app.get( '/login',         edit.login); // shows login
  app.get( '/edit/article',  auth.requiresLogin, menuFileList, edit.article);
  app.get( '/edit/all',      auth.requiresLogin, menuFileList, edit.all);
  app.get( '/edit/css',      auth.requiresLogin, menuFileList, edit.css);
  app.get( '/edit/template', auth.requiresLogin, menuFileList, edit.template);
  app.get( '/edit/users',    auth.requiresLogin, menuFileList, edit.users);

  // defines routes for get/posting/putting/deleting resources
  app.post('/article',                 auth.requiresLogin, article.create);
  app.post('/preview/article',         auth.requiresLogin, article.postPreview);
  app.get( '/preview/article',         auth.requiresLogin, article.getPreview);
  app.put( '/article/:article_id',     auth.requiresLogin, article.update);
  app.del( '/article/:article_id',     auth.requiresLogin, articleAuth, article.del);
  app.get( '/css',                     auth.requiresLogin, css.list);
  app.post('/css',                     auth.requiresLogin, css.post);
  app.post('/template',                auth.requiresLogin, template.post);
  app.get( '/template/',               auth.requiresLogin, template.list);
  app.post('/template/preview',        auth.requiresLogin, template.postPreview);
  app.get( '/template/preview',        auth.requiresLogin, template.getPreview);

  // Error handling
  app.use(function (err, req, res, next) {

    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }

    console.error(err.stack);
    // error page
    res.status(err.code || 500)
      .set({
        'error-message' : err.message
      })
      .render(res.locals.viewsPath + '/503', { 
        error: err 
      });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).render(res.locals.viewsPath + '/404', {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
}