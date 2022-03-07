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
  const dupes = await db.query("select fw_link_id, count(*) from sp_song group by fw_link_id HAVING count(*) > 1;");
  debug(dupes[0]);
  for (i in dupes[0]) {
    const { fw_link_id, count} = dupes[0][i];
    debug({ fw_link_id, count});
    await db.models.SpSong.update({ fw_page_count: parseInt(count) }, {where: {fw_link_id}});
  }
})();
