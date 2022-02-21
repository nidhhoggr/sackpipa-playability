const abcjs = require("./../abcjs");
const _ = require("lodash");
const debug = require("debug")("sp:test");
const { Instrument } = require("./../instrument");
const ABCSong = require("./../song");
const assert = require("assert");
const { findCompatibility } = require("./../explorer");

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

function run({file, instrument}) {
  return new Promise((resolve) => {
    new ABCSong({
      file,
      abcjs,
      onFinish: ({abcSong}) => {
        findCompatibility({instrument, abcSong, file, cb: resolve});
      }
    });
  });
}

(async() => {
  const transposed = await run({
    file: scanDir + "%C4lvdalspolska_efter_Isak_Anders_506c88.abc",
    instrument
  });
  assert.deepEqual(transposed, {
      findCount: 2,
      findDownAttempted: false,
      findUpAttempted: false,
      isFromFindingTransposition: false,
      state: 'compatible_after_transposition',
      transposed: -3
  });
})();
