const _ = require("lodash");
const { possibleTunings } = require("./instrument");
const debug = require("debug")("sp:song");
const fs = require("fs");
const abcTransposer = require("abc-transposer");

function loadFromFile(filename, cb) {
  fs.readFile(filename, (error, data) => {
    if(error) {
      throw error;
    }
    cb(data.toString());
  });
}

function ABCSong({
  abcjs,//the abcjs library dependency (required)
  name,//the name of the song (optional, gets parsed from abc file when left blank)
  abc,//the abc string (optional if file is provided instead)
  file,//the abc file (optional if the abc string is provided)
  rendered,//the result of calling abcjs.renderABCHeadless on an abc string (optional, gets supplied when blank)
  transposition,//the transposition of the song (optional)
  tuning,//the tuning of the instrument (optional)
  onFinish,//the callback (useful when loading a file)
}) {
  this.abcjs = abcjs;
  this.name = name;
  this.transposition = transposition || 0;
  this.tuning = tuning || 0;//the chnater key index
  this.entireNoteSequence = [];
  
  this.options = {
    "infoFieldMapping": getInfoFieldMapping(),
    "infoFieldKeyMapping": swap(getInfoFieldMapping())
  };

  if (file) {
    loadFromFile(file, (abc) => {
      this.abc = abc;
      this.abc_orig = abc;
      this.load({onFinish});
    });
  }
  else if(rendered || abc) {
    this.abc = abc;
    this.abc_orig = abc;
    this.rendered = rendered;
    this.load({onFinish});
  }
}

function getInfoFieldMapping({key} = {}) {
  const mapping = {
    "X": "Reference Number",
    "T": "Tune Title",
    "C": "Composer",
    "O": "Origin",
    "A": "Area",
    "M": "Meter",
    "L": "Unit Note Length",
    "Q": "Tempo",
    "P": "Parts",
    "Z": "Transcription",
    "N": "Notes",
    "G": "Group",
    "H": "History",
    "K": "Key",
    "R": "Rhythm",
    "F": "Media",
  };
  if (key) {
    return mapping[key];
  }
  else {
    return mapping;
  }
}


function swap(json){
  var ret = {};
  var field;
  for(var key in json){
    field = json[key];
    field = field.replace(/\s/g, '_');
    field = field.toLowerCase();
    ret[field] = key;
  }
  return ret;
}

ABCSong.prototype.lineIterator = function(perform) {
  const newLineDelimited = this.abc.split("\n");
  return newLineDelimited.map((line, key) => {
    perform(line, {
      key,
      isLastLine: (key == newLineDelimited.length - 1)
    });
  });
}

ABCSong.prototype.load = function({onFinish} = {}) {
  let _tmpAbc = [];
  this.lineIterator( (line, {key, isLastLine}) => {
    const infoFieldKey = line.isInfoField();
    switch (infoFieldKey) {
      case "Media": 
        this.media = this.media || line.substring(2);
        break;
      case "Tune Title":
        if (this.name) {
          this.name = this.name + " " + line.substring(2);
        }
        else {
          this.name = line.substring(2);
        }
        break;
    }
    if(isLastLine) {
      if(!this.rendered) this.renderHeadless();
      onFinish?.({abcSong: this});
    }
  });
}

ABCSong.prototype.renderHeadless = function() {
  this.rendered = this.abcjs.renderAbcHeadless("*", this.abc)[0];
  this.rendered.setUpAudio();
}

String.prototype.isCharsetHeader = function() {
  return this.toString().includes("abc-charset");
}

String.prototype.isInfoField = function() {
  const infoFieldPrefix = this.toString().substr(0, 2);
  const fieldMapping = getInfoFieldMapping();
  return ((infoFieldPrefix && infoFieldPrefix[1] == ":") && fieldMapping[infoFieldPrefix[0]]);
}

String.prototype.containsPrefix = function(prefix) {
  return this.toString().indexOf(`${prefix}:`) == 0;
}

String.prototype.withoutPrefix = function(prefix) {
  return this.toString().replace(`${prefix}:`, "");
}

String.prototype.isEmpty = function() {
  return _.isEmpty(_.trim(this.toString()));
}

ABCSong.prototype.insertInformationField = function({line}) {
  if (!line.isInfoField()) {
    return false;
    debugErr(`prefix is malformed and requires a : delimiter: ${line}`);
  }
  
  const key = line[0];
  const mappingValue = getInfoFieldMapping({key});

  if (!mappingValue) {
    debugErr(`Could not get mapping from prefix: ${key}`); 
  }
  const newLineDelimited = this.abc.toString().split("\n");
  const newLineDelimitedLength = newLineDelimited.length; 
  let i, _line, infoFields, songLines;
  for (i in newLineDelimited) {
    _line = newLineDelimited[i];
    if (!_line.isInfoField() && !_line.isCharsetHeader() && !_line.isEmpty()) {
      infoFields = newLineDelimited.slice(0, i);
      songLines = newLineDelimited.slice(i);
      break;
    }
  }
  infoFields.push(line);
  debug({infoFields, songLines});
  this.abc = [
    ...infoFields,
    ...songLines
  ].join("\n");
  return this.abc.includes(line);
}

//@TODO MEmoize as an instance of currentSong
ABCSong.prototype.getDistinctNotes = function() {
  if (!this.entireNoteSequence) return;
  return _.reject(_.uniq(this.entireNoteSequence.map(({noteName}) => {
    if (!noteName) return;
    const strippedPitchNote = noteName.match(/^[A-Za-z]+/);
    return strippedPitchNote[0];
  })), _.isUndefined);
}

//@TODO MEmoize as an instance of currentSong
ABCSong.prototype.getDistinctPitches = function() {
  if (!this.entireNoteSequence) return;
  return _.reject(_.uniq(this.entireNoteSequence.map(({pitchIndex}) => {
    if (!pitchIndex) return;
    return pitchIndex
  })), _.isUndefined);
}

ABCSong.prototype.getInformationByFieldName = function({fieldName, flatten = true}) {
  const fieldKey = this.options.infoFieldKeyMapping[fieldName];
  const found = [];
  this.lineIterator((line, {isLastLine}) => {
    if (line.containsPrefix(fieldKey)){
      found.push(line.withoutPrefix(fieldKey));
    }
    else if (isLastLine) {
      
    }
  });
  if (flatten) {
    return found.join(" ");
  }
  else {
    return found;
  }
}

ABCSong.prototype.findIdealTransposition = function({compatibility, instrument}) {
  if (!compatibility) compatibility = abcSong.getCompatibility({instrument});
  const topPadding = instrument.pitchRange.max - compatibility.pitchRange.max;
  const bottomPadding = compatibility.pitchRange.min - instrument.pitchRange.min;
  debug({topPadding, bottomPadding});
  if (topPadding < 0) {
    const by = Math.floor(topPadding / 2);
    return (by == 0) ? -1 : by;
  }
  else if(bottomPadding < 0) {
    const by = Math.floor(Math.abs(bottomPadding) / 2);
    return (by == 0) ? 1 : by;
  }
}

ABCSong.prototype.setTransposition = function(semitones, cb) {
  if (semitones < 0) {
    this.abc = abcTransposer.transposeDown({toProcess: this.abc});
    debug(this.abc);
    //were done
    if ((semitones + 1) == 0) {
      cb({abc: this.abc});
    }
    else {
      this.setTransposition(semitones + 1, cb);
    }
  }
  else if (semitones > 0) {
    this.abc = abcTransposer.transposeUp({toProcess: this.abc});
    debug(this.abc);
    //were done
    if ((semitones - 1) == 0) {
      cb({abc: this.abc});
    }
    else {
      this.setTransposition(semitones - 1, cb);
    }
  }
}


//this method has frequent bugs
ABCSong.prototype.setTranspositionUsingAbcjs = function(semitones, cb) {
  const fieldKey = this.options.infoFieldKeyMapping["key"];
  const stringReplacement = `transpose=${semitones}`;
  let isSet = false;
  this.lineIterator((line, {isLastLine}) => {
    if (line.containsPrefix(fieldKey)){
      const transpoisitionMatched = line.match(/transpose=(?:-?\d+)?$/);
      if (transpoisitionMatched) {//transposition already exists
        debug(`Replacing existing transposition ${line}`);
        this.abc = this.abc.replace(transpoisitionMatched[0], stringReplacement);
        isSet = true;
      }
      else {//transpoisition doesnt exist so we simply add it
        debug(`Transposition doesnt exist so well add it to ${line}`);
        const stripped  = line.replace(/(\r\n|\n|\r)/gm, "");
        this.abc = this.abc.replace(line, `${stripped} ${stringReplacement}`);
        isSet = true;
      }
    }
    else if (isLastLine && !isSet) {//last line and doesnt contain prefix
      debug(`Transposition nor Key exists so well insert a line`);
      this.insertInformationField({line: `${fieldKey}: ${stringReplacement}`});
    }

    if (isLastLine && cb) {
      cb({isSet, abc: this.abc});
    }
  });
}

const shouldDebugLines = false;
ABCSong.prototype.setNoteSequence = function({onFinish, onError}) {
  this.entireNoteSequence = [];
  this.voiceCount = 0;
  const lines = this.rendered.lines;
  if (!lines.length) return onError(new Error("this song is lineless"))
  lines.map((l, k) => {
    shouldDebugLines && debug({l, k});
    if (!l.staff) {
      if (lines.length == k + 1) onFinish();
      return;
    }
    try {
      if(!this.voiceCount) this.voiceCount = l.staff.length;
      shouldDebugLines && debug(l.staff[0].voices[0].length);
      const voiceLength = l.staff[0].voices[0].length;
      if (!voiceLength) {
        //in one scenario a tab had no voices and failed to iterate on the 5th when it had 6
        //folkwiki/abc/Allegretto_ma_non_Troppo_635369.abc
        onFinish();
      }
      l.staff[0].voices[0].map((line, j) => {
        const notes = l.staff[0].voices[0];
        if (line.midiPitches) {
          if(!line.midiPitches[0]) {
            debug("found an empty midipitch");
          }
          else {
            const pitchIndex = line.midiPitches[0].pitch;
            const noteName = this.abcjs.synth.pitchToNoteName[pitchIndex];
            const ensIndex = this.entireNoteSequence.push({
              noteName,
              pitchIndex,
            });
          }
        }
        shouldDebugLines && debug(lines.length, k, j);
        if(lines.length == k + 1 && notes.length == j + 1) {
          onFinish();
        }
      });
    } catch(err) {
      debug(err.message, err.stack);
      onError(err);
    }
  });
}


ABCSong.prototype.getCompatibility = function({instrument}) {

  const compatiblePitches = instrument.getCompatiblePitches({abcSong: this});
  const playablePitches = this.getDistinctPitches();
  const pitchRange = {
    min: _.min(playablePitches),
    max: _.max(playablePitches),
  }
  pitchRange.total = pitchRange.max - pitchRange.min;
  return {
    playableNotes: this.getDistinctNotes(),
    playablePitches,
    compatibleNotes: instrument.getCompatibleNotes({abcSong: this}),
    compatiblePitches,
    pitchRange,
    canSongBeInRange: () => (pitchRange.total <= instrument.pitchRange.total),
    isSongInRange: () => (pitchRange.min >= instrument.pitchRange.min && pitchRange.max <= instrument.pitchRange.max),
    isCompatible: (compatiblePitches.incompatible.length == 0)
  };
}

module.exports = ABCSong;
