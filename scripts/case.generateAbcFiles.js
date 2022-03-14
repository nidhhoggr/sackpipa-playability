const {readdir,readFile,writeFile} = require("fs/promises");
const assert = require("assert");
const _ = require("lodash");
const debug = require("debug")("sp:case");
const abcjs = require("./../modules/abcjs");
const ABCSong = require("./../modules/song");
const database = require("./../modules/database");

const records = [];
(async () => {
  const inc_pitch_length = process.env.INC_PITCH_LENGTH || 0;
  const db = await new database();
  const records = await db.query(`select sc.id, ss.abc, ss.filename, sc.abc_modified, ss.abc_name from sp_song ss left join sp_compatibility sc on sc.song_id = ss.id where sc.inc_pitch_length <= ${inc_pitch_length} order by id asc;`);
  for (i in records[0]) {
    const { id, abc, filename, abc_modified, abc_name } = records[0][i];
    if (abc_modified) {
      await writeFile(`./generated/sp-${id}.abc`, abc_modified);
    }
    else {
      await writeFile(`./generated/sp-${id}.abc`, abc);
    }
  }
})();
