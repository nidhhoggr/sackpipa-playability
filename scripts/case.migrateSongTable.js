const {readdir,readFile} = require("fs/promises");
const assert = require("assert");
const _ = require("lodash");
const debug = require("debug")("sp:case");
const abcjs = require("./../modules/abcjs");
const ABCSong = require("./../modules/song");
const database = require("./../modules/database");

const records = [];
(async () => {
  const db = await new database();
  const songs = await db.models.Song.findAll();
  const sp_songs = await db.models.SpSong.findAll();
  const filenameMapping = {};
  for (i in sp_songs) {
    sp_song = sp_songs[i];
    filenameMapping[sp_song.filename] = sp_song.id;
  }
  for (i in songs) {
    const { id, filename, state, key_mode, compatibility_json, abc_modf, pitches, incompatible_pitches, explored_json } = songs[i];
    const sp_compatibility = {
      song_id: filenameMapping[filename],
      state, 
      key_mode,
      compatibility_json,
      abc_modified: abc_modf,
      pitches,
      incompatible_pitches,
      explored_json
    };
    if (!sp_compatibility.song_id) {
      debug("EMPTY SONG_ID", id);
      process.exit(1);
    }
    else {
      debug(sp_compatibility);
      await db.models.SpCompatibility.create(sp_compatibility);
    }
    /*
    await db.models.SpSong.create({ : "Doe" }, {
      where: {
        lastName: null
      }
    });
    */
  }
})();
