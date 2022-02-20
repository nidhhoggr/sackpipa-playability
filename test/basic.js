const fs = require("fs");
const abcjs = require("./../abcjs");
const _ = require("lodash");
const debug = require("debug")("sp:test");
const { Instrument } = require("./../instrument");
const ABCSong = require("./../song");
const assert = require("assert");

const instrumentOptions = {
  tuningKey: "E/A",
  dronesEnabled: ["E4","A3"],
  isFirstGroupPlugged: true,//on all chnaters the high d note on the E/A tuning
  isSecondGroupPlugged: false,//only on D/G and C/F tunings
  dronesSynth: null,//should be an instance of the instrumentDroneSynth above,
  playableExtraNotes: {
    0: {//for the E/A tuning
      //"Eb": [63, 75],
      "F": [77],
      //"Bb": [70]
    },
  },
  pitchToNoteName: abcjs.synth.pitchToNoteName
}

let instrument;
debug("Testing functional instrument options");
instrument = new Instrument(instrumentOptions);
assert.deepEqual(instrument.getPlayableNotes({pitchesOnly: true}), [62, 74, 64, 76, 66, 67, 68, 69, 71, 72, 77]);

debug("Testing functional instrument options without extra playable notes");
instrument = new Instrument({...instrumentOptions, playableExtraNotes: {}});
assert.deepEqual(instrument.getPlayableNotes({pitchesOnly: true}), [62, 74, 64, 76, 66, 67, 68, 69, 71, 72]);

debug("Testing functional instrument options without first group plugged");
instrument = new Instrument({...instrumentOptions, playableExtraNotes: {}, isFirstGroupPlugged: false});
assert.deepEqual(instrument.getPlayableNotes({pitchesOnly: true}), [62, 74, 64, 76, 66, 67, 68, 69, 71, 73]);

new ABCSong({
  file: __dirname + "/../abc/KlovsjoBrudmarsch.abc",
  abcjs,
  onFinish: ({abcSong}) => { 
    abcSong.setNoteSequence({onFinish: () => {
      const instrument = new Instrument(instrumentOptions);
      const compatibility = abcSong.getCompatibility({instrument});
      assert.deepEqual(compatibility.compatiblePitches.compatible, [71, 72, 74, 76, 67, 69, 66, 64, 62]);
      assert.deepEqual(compatibility.pitchRange,{ min: 62, max: 76, total: 14 });
      debug("Test 1 success: the abc was compatible without any modifications");
    }});
  }
});

new ABCSong({
  file: __dirname + "/../abc/karolinermarschen.abc",
  abcjs,
  onFinish: ({abcSong}) => { 
    abcSong.setNoteSequence({onFinish: () => {
      const instrument = new Instrument(instrumentOptions);
      const compatibility = abcSong.getCompatibility({instrument});
      assert.deepEqual(compatibility.compatiblePitches.compatible, [62, 64, 66, 67, 69, 71, 74, 72, 76]);
      assert.deepEqual(compatibility.pitchRange,{ min: 62, max: 76, total: 14});
      assert.deepEqual(compatibility.compatiblePitches.incompatible, [73, 75]);
      debug("Test 2 success: the abc was partially incompatible without any modifications");
    }});

    abcSong.setNoteSequence({onFinish: () => {
      const opts = {...instrumentOptions, playableExtraNotes: {}, isFirstGroupPlugged: false};
      const instrument = new Instrument(opts);
      const compatibility = abcSong.getCompatibility({instrument});
      assert.deepEqual(compatibility.compatiblePitches.compatible, [62, 64, 66, 67, 69, 71, 73, 74, 76]);
      assert.deepEqual(compatibility.pitchRange,{ min: 62, max: 76, total: 14});
      assert.deepEqual(compatibility.compatiblePitches.incompatible, [72, 75]);
      debug("Test 3 success: the abc was partially incompatible without the first group plugged");
    }});

    abcSong.setNoteSequence({onFinish: () => {
      const opts = {...instrumentOptions, canPlayUnpluggedGroupsIndividually: true, isFirstGroupPlugged: false, playableExtraNotes: {0: [{"E": 75}]}};
      const instrument = new Instrument(opts);
      const compatibility = abcSong.getCompatibility({instrument});
      assert.deepEqual(compatibility.compatiblePitches.compatible, [62, 64, 66, 67, 69, 71, 73, 74, 72, 76]);
      assert.deepEqual(compatibility.pitchRange,{ min: 62, max: 76, total: 14});
      assert.deepEqual(compatibility.compatiblePitches.incompatible, [75]);
      debug("Test 4 success: the abc was partially compatible when canPlayUnpluggedGroupsIndividually enabled and ability to squeeze high E");
    }});
  }
});
