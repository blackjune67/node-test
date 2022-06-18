const Sequelize = require('sequelize');

// * 설정파일, NODE_ENV 없으면 development 기본값으로 되게끔.
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];

const User = require('./user');
const Post = require('./hashtag');
const Hashtag = require('./hashtag');

// const basename = path.basename(__filename);
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

/*if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}*/

db.sequelize = sequelize;
db.User = User;
db.Post = Post;
db.Hashtag = Hashtag;

User.init(sequelize);
Post.init(sequelize);
Hashtag.init(sequelize);

User.association(db);
Post.association(db);
Hashtag.association(db);

/*fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });*/

/*Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;*/

module.exports = db;
