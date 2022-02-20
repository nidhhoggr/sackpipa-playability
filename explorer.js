const _ = require("lodash");
const debug = require("debug")("sp:explorer");
const assert = require("assert");

module.exports = {
  findCompatibility,
  findIdealTransposition,
}

function findIdealTransposition({compatibility, instrument, findDirection}) {
  const topPadding = instrument.pitchRange.max - compatibility.pitchRange.max;
  const bottomPadding = compatibility.pitchRange.min - instrument.pitchRange.min;
  debug("findIdeal()", {topPadding, bottomPadding, findDirection});
  if (topPadding > 0 && findDirection !== "down") {
    return 1;
  }
  else if(bottomPadding > 0 && findDirection !== "up") {
    const by = Math.floor(bottomPadding / 2) * -1;
    return -1;
  }
}

function findCompatibility({
  instrument, 
  abcSong, 
  file, 
  cb, 
  transposed = 0, 
  isFromFindingTransposition = false,
  findDirection = null, 
  findDownAttempted = false, 
  findUpAttempted = false,
  findCount = 0
}) {
  abcSong.setNoteSequence({
    onFinish: () => {
      const compatibility = abcSong.getCompatibility({instrument});
      if(compatibility.isCompatible) {
        let msg = "the song is compatible";
        if (Math.abs(transposed) > 0) {
          msg += ` after transposing by (${transposed}) steps`;
        }
        debug(`${msg}: ${file}`); 
        cb({state: "compatible", transposed, isFromFindingTransposition, findDownAttempted, findUpAttempted, findCount});
      }
      else if(!compatibility.isSongInRange()) {
        if(isFromFindingTransposition) {
          debug("finder went out of range");
          debug({transposed, isFromFindingTransposition, findDownAttempted, findUpAttempted, findCount});
          //this means we went too far up or down
          //now we need to switch directions
          if(findDirection == "down") {
            findDownAttempted = true;
            if (findUpAttempted) {
              //weve already attempted to find upwards
              //were done
              debug("nothing found looking up or down");
              cb({state: "incompatible", isFromFindingTransposition, findDownAttempted, findUpAttempted, findCount});
            }
            else {
              findDirection = "up";
              const idealTransposition = findIdealTransposition({compatibility, instrument, findDirection});
              if (idealTransposition) {
                const switchedTransposition = Math.abs(transposed) + idealTransposition;
                debug({switchedTransposition});
                abcSong.setTransposition(switchedTransposition, () => {
                  abcSong.renderHeadless();
                  findCompatibility({
                    instrument, 
                    abcSong, 
                    file, 
                    cb, 
                    transposed: idealTransposition,
                    isFromFindingTransposition: true,
                    findDirection,
                    findUpAttempted,
                    findDownAttempted,
                    findCount: ++findCount
                  });
                });
              }
            }
          }
          else if(findDirection == "up") {
            findUpAttempted = true;
            if (findDownAttempted) {
              //weve already attempted to find downwards
              //were done
              debug("nothing found looking up or down");
              cb({state: "incompatible", isFromFindingTransposition, findDownAttempted, findUpAttempted, findCount});
            }
            else {
              findDirection = "down";
              const idealTransposition = findIdealTransposition({compatibility, instrument, findDirection});
              if (idealTransposition) {
                const switchedTransposition = (transposed * -1) + idealTransposition;
                debug({switchedTransposition});
                abcSong.setTransposition(switchedTransposition, () => {
                  abcSong.renderHeadless();
                  findCompatibility({
                    instrument, 
                    abcSong, 
                    file, 
                    cb, 
                    transposed: idealTransposition,
                    isFromFindingTransposition: true,
                    findDirection,
                    findUpAttempted,
                    findDownAttempted,
                    findCount: ++findCount
                  });
                });
              }
            }
          }
        }
        else if(compatibility.canSongBeInRange()) {
          debug("the song can be transpose to be in range: " + file);
          debug(compatibility);
          const idealTransposition = abcSong.findIdealTransposition({compatibility, instrument});
          debug(idealTransposition);
          if (idealTransposition) {
            abcSong.setTransposition(idealTransposition, () => {
              abcSong.renderHeadless();
              findCompatibility({instrument, abcSong, file, cb, transposed: transposed + idealTransposition})
            });
          }
        }
        else {
          debug("the song is not compatible, and not in range: " + file);
          cb({state: "incompatible_and_out_of_range"});
        }
      }
      else if (!compatibility.isCompatible) {
        debug("song is in range but is not compatible, can we traspose it to compatibility?: " + file, {
          isFromFindingTransposition,
          findDirection,
          findUpAttempted,
          findDownAttempted,
          findCount,
          transposed
        });
        debug(compatibility);
        const idealTransposition = findIdealTransposition({compatibility, instrument, findDirection});
        debug({idealTransposition});
        if (idealTransposition) {
          abcSong.setTransposition(idealTransposition, () => {
            abcSong.renderHeadless();
            findCompatibility({
              instrument, 
              abcSong, 
              file, 
              cb, 
              transposed: transposed + idealTransposition,
              isFromFindingTransposition: true,
              findDirection: (idealTransposition > 0) ?  "up" : "down",
              findUpAttempted,
              findDownAttempted,
              findCount: ++findCount
            });
          });
        }
      }
    }, 
    onError: (err) => {
      debug(`Encountered issue with ${file}`, err.message);
      cb({"state": "error"});
    }
  });
}
