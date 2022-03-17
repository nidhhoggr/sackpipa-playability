const debug = console.log;

window.onload = () => {

  function hoverActiveItemWithPointer(e, activeEl, chart) {
    if(activeEl[0]) {
      e.native.target.style.cursor = "pointer";
    }
    else {
      e.native.target.style.cursor = "default";
    }
  }

  const kmc_ctx = document.getElementById('key_mode_chart').getContext('2d');
  const kmc_chart = new Chart(kmc_ctx, {
      type: 'bar',
      data: {
          labels: ['Both', 'Major', 'Minor'],
          datasets: [
            {
              label: 'Compatible',
              data: [6, 33, 117],
              backgroundColor: 'rgba(136, 191, 77, 0.4)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1
          },
          {
              label: 'Compatible After Transposition',
              data: [56, 334, 373],
              backgroundColor: 'rgba(249, 212, 92, 0.4)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1
          },
          {
              label: 'Incompatible But In Range',
              data: [0, 26, 20],
              backgroundColor: 'rgba(239, 140, 140, 0.4)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1
          }
        ]
      },
      options: {
          onClick: (e, activeEl, chart) => {
            if (activeEl[0]) {
              const {datasetIndex, index} = activeEl[0];
              const func = (datasetIndex == 2) ? incompatible : compatible;
              document.querySelector(".compatible-filter-item").setAttribute("style","display: block"); 
              func({el:"#compatible-filter-table", options: {paginationSize: 10}, filter: (data) => {
                const filtered = [];
                const key_modes = ["BOTH","MAJOR","MINOR"];
                return new Promise(r => {
                  for (i in data) {
                    const obj = data[i];
                    switch(datasetIndex) {
                      case 0:
                        if(obj.key_mode == key_modes[index] && obj.transposed_by == 0) {
                          filtered.push(obj);
                        }
                        break;
                      case 1:
                        if(obj.key_mode == key_modes[index] && obj.transposed_by != 0) {
                          filtered.push(obj);
                        }
                        break;
                      case 2:
                        if(obj.key_mode == key_modes[index] && obj.state == "incompatible_but_in_range") {
                          filtered.push(obj);
                        }
                        break;
                    }
                  }
                  r(filtered);
                });
              }});
            }
          },
          onHover: hoverActiveItemWithPointer,
          scales: {
              y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Songs"
                  }
              }
          }
      }
  });
  
  const inc_ctx = document.getElementById('incompatible_notes_chart').getContext('2d');
  const inc_chart = new Chart(inc_ctx, {
      type: 'bar',
      data: {
          labels: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14'],
          datasets: [
            {
              label: '',
              data: [107, 434, 871, 1363, 1493, 1166, 724, 399, 245, 109, 56, 36, 23, 10],
              backgroundColor: 'rgba(239, 140, 140, 0.4)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1
          },
        ]
      },
      options: {
          plugins: {
            legend: {display: false}
          },
          onHover: hoverActiveItemWithPointer,
          onClick: (e, activeEl) => {
            if(activeEl[0]) {
              const {index} = activeEl[0];
              document.querySelector(".incompatible-filter-item").setAttribute("style","display: block");
              incompatible({el:"#incompatible-filter-table", options: {paginationSize: 10, hide_inc_pitch_length: true}, filter: (data) => {
                const filtered = [];
                return new Promise(r => {
                  for (i in data) {
                    const obj = data[i];
                    if (obj.inc_pitch_length == (index + 1)) {
                      filtered.push(obj);
                    }
                  }
                  r(filtered);
                });
              }});
            }
          },
          scales: {
              x: {
                   title: {
                    display: true,
                    text: "Distinct Incompatible Notes"
                  }
              },
              y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: "Songs"
                  }
              }
          }
      }
  });

  compatible({el:"#compatible-table"});
  incompatible({el: "#incompatible-table"});

  function openFolkWikiFromId(e, cell) {
    const fw_link_id = cell._cell.value;
    if (fw_link_id) {
      window.open(`http://www.folkwiki.se/Musik/${fw_link_id}`);
    }
  }
 
  function openFolktabsFromCompatibilityId(e, cell) {
    const composite_key = cell._cell.value;
    const id = composite_key.split("-")[0]; 
    window.open(`https://sackpipa.folktabs.com/?fn=sp-${id}`);
  }

  function openTransposedAbcFile(e, cell) {
    const composite_key = cell._cell.row.cells[0].value;
    const id = composite_key.split("-")[0];
    window.open(`https://compatibility.folktabs.com/abc/folkwiki/sp-${id}.abc`);
  }

  const headerTooltips = {
    "id": "The composite key of the compatibility record to the song by the keymode. Click this cell to open the song in the FolkTabs Säckpipa player.",
    "fw_link_id": "The FolkWiki.se page of the song. Click this cell to open the in FolkWiki.se",
    "key_mode": "Whether or not the scallop needs to be plugged. Minor requires plugging the middle finger scallop whereas Major requires unplugging. If the song is Both, then the scallop must be unplugged but requires covering the top hole of the scallop for the required notes.",
    "inc_pitch_length": "How many disctict incompatible notes occur in the song.",
    "incompatible_pitches": "The particular pitches that are incompatible which occur in the song. Hover over the cell to get the note names.",
    "transposed_by": "How many steps the song had to be transposed in order to become compatible with the chanter. Click this cell to view the modified transposed ABC file."
  }

  function headerTooltip(column) {
    const field = column.getDefinition().field;
    const desc = headerTooltips[field];
    debug(field, desc);
    return desc;
  }

  const defaultTabulatorOpts = {
    layout:"fitColumns",      //fit columns to width of table
    responsiveLayout:"hide",  //hide columns that dont fit on the table
    addRowPos:"top",          //when adding a new row, add it to the top of the table
    history:false,             //allow undo and redo actions on the table
    selectable: false,
    pagination:"local",       //paginate the data
    paginationSize:20,         //allow 7 rows per page of data
    paginationCounter:"rows", //display count of paginated rows in footer
    movableColumns:true,      //allow column order to be changed
    resizableRows:true,       //allow row order to be changed 
    columnDefaults:{
      tooltip:function(cell){
        const field = cell.getColumn().getField();
        switch(field) {
          case "id": 
            return "Open In Sackpipa Player";
          case "fw_link_id":
            return "Open In FolkWiki.se";
          case "transposed_by":
            return "Open Transposed ABC File";
          case "abc_name":
            return cell.getValue();
          case "incompatible_pitches":
            return getNotesFromPitches(cell.getValue());
        }
      },
    }
  }

  function getNotesFromPitches(p) {
    const pitches = p.split(",");
    const mapping = pitches.map((p) => pitchToNoteName[parseInt(p)]);
    if (mapping.length) {
      return mapping.join(",");
    }
  }

  function setCellCursor(e, f) {
    const {field} = f._cell.column;
    if (["fw_link_id","id","transposed_by","incompatible_pitches"].includes(field)) {
      e.target.style.cursor = "pointer";
    }
  }

  function loadTooltips() {
    setTimeout(() => {
      const tcs = document.querySelectorAll(".tabulator-cell, [role=columnheader]");
      let i;
      for (i in tcs) {
        const el = tcs[i];
        if(!el.getAttribute) continue;
        const title = el.getAttribute('title');
        if (!title) continue;
        if (title.trim() !== "" && title.trim() !== "null") {
          el.setAttribute("data-tippy-content",title);
        }
        tcs[i].removeAttribute("title");
      }
      tippy("[data-tippy-content]");
    });
  }

  function registerTabulatorEvents(table) {
    table.on("cellMouseEnter", setCellCursor);
    table.on("cellMouseMove", setCellCursor);
    table.on("renderStarted", loadTooltips);
    table.on("renderComplete", loadTooltips);
    table.on("dataFiltered", loadTooltips);
    table.on("dataSorted", loadTooltips);
  };
    
  function compatible({el, filter, options}) {
    fetch("./../datasets/compatible.json")
    .then(async (response) => {
      const _response = await response.json();
      for (i in _response) {
        const obj = _response[i];
        _response[i].id = `${obj.id}-${obj.song_id}`;
      }
      if(filter) {
        return await filter(_response);
      }
      else {
        return _response;
      }
    })
    .then(data => {
      const table1 = new Tabulator(el, {
        data,           //load row data from array
        ...defaultTabulatorOpts,
        initialSort:[             //set the initial sort order of the data
            {column:"abc_name", dir:"asc"},
        ],
        columns:[                 //define the table columns
            {title:"ID", field:"id", cellClick: openFolktabsFromCompatibilityId, headerTooltip},
            {title:"Name", field:"abc_name", headerFilter: true},
            //{title:"State", field:"state"},
            {title:"FolkWiki", field:"fw_link_id", cellClick: openFolkWikiFromId, headerTooltip},
            {title:"Key Mode", field:"key_mode", headerFilter: true, headerTooltip},
            {title:"Transposed By", field:"transposed_by", cellClick: openTransposedAbcFile, headerTooltip},
            //{title:"Task Progress", field:"progress", hozAlign:"left", formatter:"progress", editor:true},
            //{title:"Gender", field:"gender", width:95, editor:"select", editorParams:{values:["male", "female"]}},
            //{title:"Rating", field:"rating", formatter:"star", hozAlign:"center", width:100, editor:true},
            //{title:"Color", field:"col", width:130, editor:"input"},
            //{title:"Date Of Birth", field:"dob", width:130, sorter:"date", hozAlign:"center"},
            //{title:"Driver", field:"car", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
        ],
        ...options
      });
      registerTabulatorEvents(table1);
    });
  }

  function incompatible({el, filter, options = {}}) {
    fetch("./../datasets/incompatible.json")
    .then(async(response) => {
       const _response = await response.json();
       for (i in _response) {
         const obj = _response[i];
         _response[i].id = `${obj.id}-${obj.song_id}`;
         _response[i].incompatible_pitches = obj.incompatible_pitches.replace("{","").replace("}","");
       }
       if(filter) {
         return await filter(_response);
       }
       else {
         return _response;
       }
    })
    .then(data => {
      const table2 = new Tabulator(el, {
        data,           //load row data from array
        ...defaultTabulatorOpts,
        initialSort:[             //set the initial sort order of the data
            {column:"inc_pitch_length", dir:"asc"},
        ],
        columns:[                 //define the table columns
            {title:"ID", field:"id", openFolktabsFromCompatibilityId, headerTooltip},
            {title:"Name", field:"abc_name", headerFilter: true},
            //{title:"State", field:"state"},
            {title:"FolkWiki", field:"fw_link_id", cellClick: openFolkWikiFromId, headerTooltip},
            //{title:"Note Length", field:"note_sequence_count"},
            {title:"Incompatible/Distinct Note Count", field: "inc_pitch_length", headerFilter: true, visible: !options.hide_inc_pitch_length, headerTooltip},
            {title:"Incompatible/Distinct Pitches", field: "incompatible_pitches", headerFilter: true, headerTooltip}
            //{title:"Task Progress", field:"progress", hozAlign:"left", formatter:"progress", editor:true},
            //{title:"Gender", field:"gender", width:95, editor:"select", editorParams:{values:["male", "female"]}},
            //{title:"Rating", field:"rating", formatter:"star", hozAlign:"center", width:100, editor:true},
            //{title:"Color", field:"col", width:130, editor:"input"},
            //{title:"Date Of Birth", field:"dob", width:130, sorter:"date", hozAlign:"center"},
            //{title:"Driver", field:"car", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
        ],
        ...options
      });
      registerTabulatorEvents(table2);
    });
  }
};

const pitchToNoteName = {21:"A0",22:"Bb0",23:"B0",24:"C1",25:"Db1",26:"D1",27:"Eb1",28:"E1",29:"F1",30:"Gb1",31:"G1",32:"Ab1",33:"A1",34:"Bb1",35:"B1",36:"C2",37:"Db2",38:"D2",39:"Eb2",40:"E2",41:"F2",42:"Gb2",43:"G2",44:"Ab2",45:"A2",46:"Bb2",47:"B2",48:"C3",49:"Db3",50:"D3",51:"Eb3",52:"E3",53:"F3",54:"Gb3",55:"G3",56:"Ab3",57:"A3",58:"Bb3",59:"B3",60:"C4",61:"Db4",62:"D4",63:"Eb4",64:"E4",65:"F4",66:"Gb4",67:"G4",68:"Ab4",69:"A4",70:"Bb4",71:"B4",72:"C5",73:"Db5",74:"D5",75:"Eb5",76:"E5",77:"F5",78:"Gb5",79:"G5",80:"Ab5",81:"A5",82:"Bb5",83:"B5",84:"C6",85:"Db6",86:"D6",87:"Eb6",88:"E6",89:"F6",90:"Gb6",91:"G6",92:"Ab6",93:"A6",94:"Bb6",95:"B6",96:"C7",97:"Db7",98:"D7",99:"Eb7",100:"E7",101:"F7",102:"Gb7",103:"G7",104:"Ab7",105:"A7",106:"Bb7",107:"B7",108:"C8",109:"Db8",110:"D8",111:"Eb8",112:"E8",113:"F8",114:"Gb8",115:"G8",116:"Ab8",117:"A8",118:"Bb8",119:"B8",120:"C9",121:"Db9"};
