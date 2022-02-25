const _ = require("lodash");
const debug = require("debug")("sp:explorer");
const assert = require("assert");

module.exports = {
  findCompatibility,
  findIdealTransposition,
}

function findIdealTransposition({padding, findDirection}) {
  debug("findIdeal()", {padding, findDirection});
  if (padding.top > 0 && findDirection !== "down") {
    return 1;
  }
  else if(padding.bottom > 0 && findDirection !== "up") {
    return -1;
  }
}

function changeTranspositionDirection({
  compatibility,
  instrument,
  abcSong,
  file,
  cb,
  transposed,
  isFromFindingTransposition,
  findDirection,
  findDownAttempted,
  findUpAttempted,
  findCount,
  findingExhaustedCb
}) {
  if(findDirection == "down") {
    findDownAttempted = true;
    if (findUpAttempted) {
      //weve already attempted to find upwards
      //were done
      findingExhaustedCb({
        isFromFindingTransposition,
        findDirection,
        findUpAttempted,
        findDownAttempted,
        findCount,
        transposed
      });
    }
    else {
      debug("switching to find upward");
      findDirection = "up";
      const padding = instrument.getSongPadding({compatibility});
      const idealTransposition = findIdealTransposition({padding, findDirection});
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
      else {
        findingExhaustedCb({
          isFromFindingTransposition,
          findDirection,
          findUpAttempted,
          findDownAttempted,
          findCount,
          transposed
        });
      }
    }
  }
  else if(findDirection == "up") {
    findUpAttempted = true;
    if (findDownAttempted) {
      //weve already attempted to find downwards
      //were done
      findingExhaustedCb({
        isFromFindingTransposition,
        findDirection,
        findUpAttempted,
        findDownAttempted,
        findCount,
        transposed
      });
    }
    else {
      debug("switching to find downward");
      findDirection = "down";
      const padding = instrument.getSongPadding({compatibility});
      const idealTransposition = findIdealTransposition({padding, findDirection});
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
      else {
        findingExhaustedCb({
          isFromFindingTransposition,
          findDirection,
          findUpAttempted,
          findDownAttempted,
          findCount,
          transposed
        });
      }
    }
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
        let state = "compatible";
        const wasTransposed = Math.abs(transposed) > 0;
        if (wasTransposed) {
          msg += ` after transposing by (${transposed}) steps`;
          state += "_after_transposition";
        }
        debug(`${msg}: ${file}`); 
        cb({state, compatibility, transposed, isFromFindingTransposition, findDownAttempted, findUpAttempted, findCount});
      }
      else if(!compatibility.isSongInRange()) {
        if(isFromFindingTransposition) {
          debug("finder went out of range"); 
          debug({
            compatibility,
            transposed,
            isFromFindingTransposition,
            findDirection,
            findDownAttempted,
            findUpAttempted,
            findCount
          });
          //this means we went too far up or down
          //now we need to switch directions
          changeTranspositionDirection({
            compatibility,
            instrument,
            abcSong,
            file,
            cb,
            transposed,
            isFromFindingTransposition,
            findDirection,
            findDownAttempted,
            findUpAttempted,
            findCount,
            findingExhaustedCb: ({
              isFromFindingTransposition,
              findDirection,
              findUpAttempted,
              findDownAttempted,
              findCount,
              transposed
            }) => {
              debug("song is out of range and not compatible (up or down): " + file);
              cb({
                state: "incompatible_and_out_of_range",
                compatibility,
                isFromFindingTransposition,
                findDirection,
                findUpAttempted,
                findDownAttempted,
                findCount,
                transposed
              });
            }
          });
        }
        else if(compatibility.canSongBeInRange()) {
          debug("the song can be transpose to be in range: " + file);
          //debug(compatibility, instrument);
          const idealTransposition = abcSong.findIdealTransposition({compatibility, instrument});
          debug({idealTransposition});
          //detect if direction changed
          if ((findDirection == "down" && idealTransposition > 0) || (findDirection == "up" && idealTransposition < 0)) {
            //this is a wierd edge case where the song is reported to be in range but truly isn't by at most a half step 
            debug("the song is incompatible: " + file);
            debug(compatibility, instrument);
            return cb({
              state: "incompatible_and_out_of_range",
              compatibility,
              isFromFindingTransposition,
              findDirection,
              findUpAttempted,
              findDownAttempted,
              findCount,
              transposed
            });
          }
          else if (idealTransposition) {
            abcSong.setTransposition(idealTransposition, () => {
              abcSong.renderHeadless();
              //findCompatibility({instrument, abcSong, file, cb, transposed: transposed + idealTransposition})
              findCompatibility({
                instrument, 
                abcSong, 
                file, 
                cb, 
                transposed: transposed + idealTransposition,
                //isFromFindingTransposition: true,
                findDirection: (idealTransposition > 0) ?  "up" : "down",
                findUpAttempted,
                findDownAttempted,
                findCount: ++findCount
              });
            });
          }
          else {
            debug("the song is not compatible, and not in range: " + file);
            return cb({
              state: "incompatible_but_in_range",
              compatibility,
              isFromFindingTransposition,
              findDirection,
              findUpAttempted,
              findDownAttempted,
              findCount,
              transposed
            });
          }
        }
        else {
          debug("the song is not compatible, and not in range: " + file);
          cb({state: "incompatible_and_out_of_range", compatibility});
        }
      }
      else if (!compatibility.isCompatible) {
        debug("song is in range but is not compatible, can we traspose it to compatibility?: " + file, {compatibility});
        const padding = instrument.getSongPadding({compatibility});
        if (!padding.has()) {
          debug("song is in range but is not compatible (no padding): " + file);
          return cb({
            state: "incompatible_but_in_range",
            compatibility,
            isFromFindingTransposition,
            findDirection,
            findUpAttempted,
            findDownAttempted,
            findCount,
            transposed
          });
        }
        const idealTransposition = findIdealTransposition({padding, findDirection});
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
        else {
          changeTranspositionDirection({
            compatibility,
            instrument,
            abcSong,
            file,
            cb,
            transposed,
            isFromFindingTransposition,
            findDirection,
            findDownAttempted,
            findUpAttempted,
            findCount,
            findingExhaustedCb: ({
              isFromFindingTransposition,
              findDirection,
              findUpAttempted,
              findDownAttempted,
              findCount,
              transposed
            }) => {
              debug("song is in range but is not compatible (up or down): " + file);
              cb({
                state: "incompatible_but_in_range",
                isFromFindingTransposition,
                findDirection,
                findUpAttempted,
                findDownAttempted,
                findCount,
                transposed
              });
            }
          }); 
        }
      }
    }, 
    onError: (err) => {
      debug(`Encountered issue with ${file}`, err.message, err.stack);
      cb({"state": "error"});
    }
  });
}
