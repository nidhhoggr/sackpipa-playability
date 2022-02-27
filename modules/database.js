const { Sequelize } = require('sequelize');
const config = require("./config");
const {
  database,
  username,
  password,
  host,
  dialect,
} = config.datasource;
const sequelize = new Sequelize('database', 'username', 'password', {
  host,
  dialect,"postgres",
});

const config = {
  datasource: {
    database: "sackpipa_playability",
    username: "",
    password: "",
    dialect: "postgres"
  }
}
