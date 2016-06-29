var should = require('should');
var helper = require('../helper');
var validate = require('bateeq-models').validator.article;
var manager;

function getData() {
    var Article = require('bateeq-models').article.Article;
    var article = new Article();

    var now = new Date();
    var stamp = now / 1000 | 0;
    var code = stamp.toString(36);

    article.code = code;
    article.name = `name[${code}]`;
    article.description = `description for ${code}`;

    return article;
}

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var ArticleManager = require('../../src/managers/article/article-manager');
            manager = new ArticleManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#01. should success when create new data', function(done) {
    var data = getData();
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdData;
it(`#02. should success when get created data with id`, function(done) {
    manager.getById(createdId)
        .then(data => {
            validate.article(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#03. should success when update created data`, function(done) {

    createdData.code += '[updated]';
    createdData.name += '[updated]'; 

    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#04. should success when get updated data with id`, function(done) {
    manager.getById(createdId)
        .then(data => {
            validate.article(data);
            data.code.should.equal(createdData.code);
            data.name.should.equal(createdData.name); 
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#05. should success when delete data`, function(done) { 
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#06. should _deleted=true`, function(done) {
    manager.getById(createdId)
        .then(data => {
            validate.article(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});