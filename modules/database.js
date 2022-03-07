const { Sequelize, DataTypes } = require('sequelize');
const config = require("./config");
const _ = require("lodash");
const debug = require("debug")("sp:database");
const {
  database,
  username,
  password,
  host,
  dialect,
} = config.datasource;

function defineModel({sequelize, name, definition, options = {}}) {
  if (!options.tableName) {
    options.tableName = _.snakeCase(name);
  }
  return sequelize.define(name, definition, options);
}

const modelDefinitions = {
  "Song": {
    definition: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      filename: {
        type: DataTypes.STRING(1024),
      },
      state: {
        type: DataTypes.STRING(1024),
      },
      key_mode: {
        type: DataTypes.STRING(1024),
      },
      abc_orig: {
        type: DataTypes.TEXT,
      },
      abc_modf: {
        type: DataTypes.TEXT,
      },
      compatibility_json: {
        type: DataTypes.JSON,
      },
      explored_json: {
        type: DataTypes.JSON,
      },
      pitches: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
      incompatible_pitches: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
    },
    options: {
      timestamps: false
    }
  },
  "SpSong": {
    definition: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      filename: {
        type: DataTypes.STRING(1024),
      },
      abc_name: {
        type: DataTypes.STRING(1024),
      },
      abc: {
        type: DataTypes.TEXT,
      },
      fw_link_id: {
        type: DataTypes.INTEGER,
      },
      note_sequence_count: {
        type: DataTypes.INTEGER,
      },
      fw_page_count: {
        type: DataTypes.INTEGER,
      },
      exclusively_incompatible: {
        type: DataTypes.BOOLEAN
      }
    },
    options: {
      timestamps: false
    }
  },
  "SpCompatibility": {
    definition: {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      song_id: {
        type: DataTypes.INTEGER,
      },
      state: {
        type: DataTypes.STRING(1024),
      },
      key_mode: {
        type: DataTypes.STRING(1024),
      },
      abc_modified: {
        type: DataTypes.TEXT,
      },
      compatibility_json: {
        type: DataTypes.JSON,
      },
      explored_json: {
        type: DataTypes.JSON,
      },
      pitches: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
      incompatible_pitches: {
        type: DataTypes.ARRAY(DataTypes.INTEGER)
      },
    },
    options: {
      timestamps: false
    }
  },
};

module.exports = function Database() {
  return new Promise(async (resolve, reject) => {
    debug(username, password);
    const sequelize = new Sequelize(database, username, password, {
      host,
      dialect,
    });
    try {
      const authed = await sequelize.authenticate();
      this.models = {};
      for (name in modelDefinitions) {
        const definition = modelDefinitions[name].definition;
        const options = modelDefinitions[name].options;
        this.models[name] = defineModel({sequelize, name, definition, options});
      }
      this.query = sequelize.query.bind(sequelize);
      resolve(this) 
      debug('Connection has been established successfully.', this.models);
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      reject(error);
    }
  });
}
