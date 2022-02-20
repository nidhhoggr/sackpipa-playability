const {readdir} = require("fs/promises");
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
      "F": [77],
      "Db": [61, 73]
    },
  }
});

const scanDir = process.env.SCANDIR;

const casesReached = {
  "one": 0,
  "two": 0,
  "three": 0,
  "four": 0
}

function allCasesReached() {
  for (i in casesReached) {
    if (casesReached[i] == 0) {
      return false;
    }
  }
  return true;
}

function processFile({file, instrumnet}) {
  return new Promise((resolve) => {
    new ABCSong({
      file,
      abcjs,
      onFinish: ({abcSong}) => {
        abcSong.setNoteSequence({
          onFinish: () => {
            const compatibility = abcSong.getCompatibility({instrument});
            if(compatibility.isCompatible) {
              debug("the song is compatible: " + file);
              casesReached["one"]++;
            }
            else if(!compatibility.isSongInRange()) {
              if(compatibility.canSongBeInRange()) {
                debug("the song can be transposed to be in range: " + file, compatibility.pitchRange);
                casesReached["two"]++;
              }
              else {
                debug("the song is not compatible, and not in range: " + file);
                casesReached["three"]++;
              }
            }
            else if (!compatibility.isCompatible) {
              debug("song is in range but is not compatible, can we traspose it to compatibility?: " + file);
              casesReached["four"]++;
            }
            resolve({casesReached});
          }, 
          onError: (err) => {
            debug(`Encountered issue with ${file}`, err.message);
            resolve({casesReached});
          }
        });
      }
    });
  });
}

(async() => {
  const files = await readdir(scanDir);
  for (const file of files) {
    if (allCasesReached()) return debug({casesReached});
    try {
      debug(scanDir + file);
      debug(await processFile({
        file: scanDir + file,
        instrument
      }));
    } catch(err) {
      debug(err.message);
    }
  }
})();
