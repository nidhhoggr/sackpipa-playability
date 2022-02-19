const fs = require("fs");
const abcjs = require("./abcjs");
const _ = require("lodash");
const debug = require("debug")("sp");
const { Instrument } = require("./instrument");
const ABCSong = require("./song");

const instrument = new Instrument({
  tuningKey: "E/A",
  dronesEnabled: ["E4","A3"],
  isFirstGroupPlugged: true,//on all chnaters the high d note on the E/A tuning
  isSecondGroupPlugged: false,//only on D/G and C/F tunings
  dronesSynth: null,//should be an instance of the instrumentDroneSynth above,
  playableExtraNotes: {
    0: {//for the E/A tuning
      "F": [77]
    },
  },
  pitchToNoteName: abcjs.synth.pitchToNoteName
});

new ABCSong({
  file: __dirname + "/abc/KlovsjoBrudmarsch.abc",
  abcjs,
  onFinish: ({abcSong}) => { 
    abcSong.setNoteSequence({onFinish: () => {
      const compatibility = abcSong.getCompatibility({instrument});
      debug(compatibility);
    }});
  }
});
