const {readdir,readFile} = require("fs/promises");
const assert = require("assert");
const _ = require("lodash");
const debug = require("debug")("sp:case");
const abcjs = require("./../modules/abcjs");
const ABCSong = require("./../modules/song");
const database = require("./../modules/database");

(async () => {
  const db = await new database();
  const fw_link_id = parseInt(process.env.FW_LINK_ID);
  const fw_link = process.env.FW_LINK;
  const filename = fw_link.replace("http://www.folkwiki.se/pub/cache/", "");
  debug({
    fw_link_id,
    fw_link,
    filename
  });
  try {
    const { abcSong } = await run({
      file: `./../scrapers/folkwiki/abc/${filename}`
    })
    abcSong.setNoteSequence({onFinish: async () => { 
      const song = {
        filename,
        abc: abcSong.abc_orig,
        fw_link_id,
        note_sequence_count: abcSong.entireNoteSequence.length,
        abc_name: abcSong.name,
      };
      try {
        const inserted = await db.models.SpSong.create(song);
        debug(abcSong);
      } catch(err) {
        debug(err.stack, song);
        process.exit(1);
        throw err;
      }
    }, onError: (err) => {
      throw err;
    }});
  } catch(err) {
    debug(err.stack);
    process.exit(1);
  }
})();

function run({file}) {
  return new Promise((resolve) => {
    new ABCSong({
      file,
      abcjs,
      onFinish: resolve,
    });
  });
}
