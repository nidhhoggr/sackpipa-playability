const {readdir,readFile} = require("fs/promises");
const assert = require("assert");
const _ = require("lodash");
const debug = require("debug")("sp:case");
const abcjs = require("./../modules/abcjs");
const ABCSong = require("./../modules/song");
const database = require("./../modules/database");
const hash = require('object-hash');
const records = [];
(async () => {
  const db = await new database();
  const records = await db.query("select sc.id, sc.song_id, s.fw_link_id, sc.key_mode, sc.transposed_by, sc.state from sp_compatibility sc left join sp_song s on sc.song_id = s.id order by fw_link_id, song_id asc;");
  const sc_both = {};
  const sc_either = {};
  const id_record = {};
  //first we build the both array
  for (i in records[0]) {
    const { id, song_id, fw_link_id, key_mode, transposed_by, state } = records[0][i];
    //if (song_id > 3) continue;
    id_record[id] = records[0][i];
    const union_key = hash({song_id, fw_link_id, transposed_by, state});
    if (key_mode != "BOTH") {
      sc_either[union_key] = {key_mode, id};
    }
    else {
      sc_both[union_key] = {key_mode, id};
    }
    //debug({ fw_link_id, count});/
    //await db.models.SpSong.update({ fw_page_count: parseInt(count) }, {where: {fw_link_id}});
  }

  const to_elim = [];
  const to_keep = [];
  for(union_key in sc_both) {
    const record = id_record[sc_both[union_key].id];
    if (sc_either[union_key]) {
      //debug(id_record);
      to_elim.push(record.id);
      await db.models.SpCompatibility.update({soft_delete: true}, {where: {id: record.id}});
    }
    else {
      to_keep.push(record.id);
      //debug(record);
    }
  }
  //debug(sc_both, sc_either);
  debug(to_elim.length, to_keep.length);
  debug(to_keep);
})();
