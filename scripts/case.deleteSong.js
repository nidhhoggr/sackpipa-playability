const assert = require("assert");
const _ = require("lodash");
const debug = require("debug")("sp:case");
const database = require("./../modules/database");

const records = [];
(async () => {
  const db = await new database();
  const song_id = process.env.SONG_ID;
  assert(song_id);
  await db.query(`delete from sp_song where id = ${song_id};`);
  await db.query(`delete from sp_compatibility where song_id = ${song_id};`);
  process.exit(0);
})();
