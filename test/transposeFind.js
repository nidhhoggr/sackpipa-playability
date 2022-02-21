const {readdir} = require("fs/promises");
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

function processFile({file, instrument}) {
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
  let transposed = await processFile({
    file: scanDir + "%C4lvrospolska_efter_Anders_Eriksson_Moberg_c01628.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    state: 'incompatible_and_out_of_range',
    isFromFindingTransposition: false,
    findDirection: 'down',
    findUpAttempted: false,
    findDownAttempted: false,
    findCount: 2,
    transposed: -4
  });
  transposed = await processFile({
    file: scanDir + "Pigan_gick_i_f%E5rahus_974194.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    findCount: 2,
    findDirection: 'down',
    findDownAttempted: true,
    findUpAttempted: true,
    isFromFindingTransposition: true,
    state: 'incompatible_and_out_of_range',
    transposed: -1
  });
  transposed = await processFile({
    file: scanDir + "Olas_och_Annas_polska_beaf14.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    state: 'compatible_after_transposition',
    transposed: -2,
    isFromFindingTransposition: true,
    findDownAttempted: false,
    findUpAttempted: false,
    findCount: 2
  });
  transposed = await processFile({
    file: scanDir + "5013a5fa5776cb48020fc6fcecb08c29.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    state: 'compatible_after_transposition',
    transposed: 1,
    isFromFindingTransposition: true,
    findDownAttempted: false,
    findUpAttempted: false,
    findCount: 1
  });
  instrument.isFirstGroupPlugged = false;
  transposed = await processFile({
    file: scanDir + "Olas_och_Annas_polska_beaf14.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    findCount: 4,
    findDirection: 'up',
    findDownAttempted: true,
    findUpAttempted: true,
    isFromFindingTransposition: true,
    state: 'incompatible_and_out_of_range',
    transposed: 1
  });
  instrument.canPlayUnpluggedGroupsIndividually = true;
  transposed = await processFile({
    file: scanDir + "Olas_och_Annas_polska_beaf14.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    state: 'compatible_after_transposition',
    transposed: -2,
    isFromFindingTransposition: true,
    findDownAttempted: false,
    findUpAttempted: false,
    findCount: 2
  });
  transposed = await processFile({
    file: scanDir + "5013a5fa5776cb48020fc6fcecb08c29.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    state: 'compatible_after_transposition',
    transposed: 1,
    isFromFindingTransposition: true,
    findDownAttempted: false,
    findUpAttempted: false,
    findCount: 1
  });
  instrument.canPlayUnpluggedGroupsIndividually = false;
  transposed = await processFile({
    file: scanDir + "5013a5fa5776cb48020fc6fcecb08c29.abc",
    instrument
  });
  debug(transposed);
  assert.deepEqual(transposed,  {
    state: 'compatible_after_transposition',
    transposed: -2,
    isFromFindingTransposition: true,
    findDownAttempted: false,
    findUpAttempted: true,
    findCount: 4
  });
})();
