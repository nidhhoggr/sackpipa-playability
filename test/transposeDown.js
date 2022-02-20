const {readdir} = require("fs/promises");
const abcjs = require("./../abcjs");
const _ = require("lodash");
const debug = require("debug")("sp:test");
const { Instrument } = require("./../instrument");
const ABCSong = require("./../song");
const assert = require("assert");

const instrument = new Instrument({
  tuningKey: "E/A",
  dronesEnabled: ["E4","A3"],
  isFirstGroupPlugged: true,//on all chnaters the high d note on the E/A tuning
  isSecondGroupPlugged: false,//only on D/G and C/F tunings
  dronesSynth: null,//should be an instance of the instrumentDroneSynth above,
  playableExtraNotes: {
    0: {//for the E/A tuning
      "F": [77],
      "Db": [61, 73]
    },
  }
});

const scanDir = __dirname + "/abc/";

function _process({instrument, abcSong, file, cb, transposed = 0}) {
  abcSong.setNoteSequence({
    onFinish: () => {
      const compatibility = abcSong.getCompatibility({instrument});
      if(compatibility.isCompatible) {
        //the song is compatible!!
        let msg = "the song is compatible";
        if (Math.abs(transposed) > 0) {
          msg += ` after transposing by (${transposed}) steps`;
        }
        debug(`${msg}: ${file}`);  
      }
      else if(!compatibility.isSongInRange()) {
        if(compatibility.canSongBeInRange()) {
          debug("the song can be transpose to be in range: " + file);
          debug(compatibility);
          const idealTransposition = abcSong.findIdealTransposition({compatibility, instrument});
          debug(idealTransposition);
          if (idealTransposition) {
            abcSong.setTransposition(idealTransposition, () => {
              abcSong.renderHeadless();
              _process({instrument, abcSong, file, cb, transposed: transposed + idealTransposition})
            });
          }
        }
        else {
          debug("the song is not compatible, and not in range: " + file);
        }
      }
      else if (!compatibility.isCompatible) {
        debug("song is in range but is not compatible, can we traspose it to compatibility?: " + file);
        debug(compatibility);
      }
      cb(transposed);
    }, 
    onError: (err) => {
      debug(`Encountered issue with ${file}`, err.message);
      cb();
    }
  });
}

function process({file, instrument}) {
  return new Promise((resolve) => {
    new ABCSong({
      file,
      abcjs,
      onFinish: ({abcSong}) => {
        _process({instrument, abcSong, file, cb: resolve});
      }
    });
  });
}

(async() => {
  const transposed = await process({
    file: scanDir + "%C4lvdalspolska_efter_Isak_Anders_506c88.abc",
    instrument
  });
  assert.equal(transposed, -3);
})();
