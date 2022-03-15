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
              backgroundColor: 'rgba(249, 212, 92, 0.4)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1
          },
          {
              label: 'Compatible After Transposition',
              data: [56, 334, 373],
              backgroundColor: 'rgba(239, 140, 140, 0.4)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1
          },
          {
              label: 'Incompatible But In Range',
              data: [0, 26, 20],
              backgroundColor: 'rgba(136, 191, 77, 0.4)',
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
              debug(activeEl[0]);
              const {index} = activeEl[0];
              incompatible({el:"#incompatible-filter-table", options: {paginationSize: 10}, filter: (data) => {
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
        layout:"fitColumns",      //fit columns to width of table
        responsiveLayout:"hide",  //hide columns that dont fit on the table
        tooltips:true,            //show tool tips on cells
        addRowPos:"top",          //when adding a new row, add it to the top of the table
        history:true,             //allow undo and redo actions on the table
        pagination:"local",       //paginate the data
        paginationSize:20,         //allow 7 rows per page of data
        paginationCounter:"rows", //display count of paginated rows in footer
        movableColumns:true,      //allow column order to be changed
        resizableRows:true,       //allow row order to be changed
        initialSort:[             //set the initial sort order of the data
            {column:"abc_name", dir:"asc"},
        ],
        columns:[                 //define the table columns
            {title:"ID", field:"id"},
            {title:"Name", field:"abc_name"},
            //{title:"State", field:"state"},
            {title:"FolkWiki", field:"fw_link_id", cellClick: openFolkWikiFromId},
            {title:"Key Mode", field:"key_mode"},
            {title:"Transposed By", field:"transposed_by"}
            //{title:"Task Progress", field:"progress", hozAlign:"left", formatter:"progress", editor:true},
            //{title:"Gender", field:"gender", width:95, editor:"select", editorParams:{values:["male", "female"]}},
            //{title:"Rating", field:"rating", formatter:"star", hozAlign:"center", width:100, editor:true},
            //{title:"Color", field:"col", width:130, editor:"input"},
            //{title:"Date Of Birth", field:"dob", width:130, sorter:"date", hozAlign:"center"},
            //{title:"Driver", field:"car", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
        ],
        ...options
      });
    });
  }

  function incompatible({el, filter, options}) {
    debug("incompatible()", el, options);
    fetch("./../datasets/incompatible.json")
    .then(async(response) => {
       const _response = await response.json();
       for (i in _response) {
         const obj = _response[i];
         debug(obj);
         _response[i].id = `${obj.id}-${obj.song_id}`
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
        layout:"fitColumns",      //fit columns to width of table
        responsiveLayout:"hide",  //hide columns that dont fit on the table
        tooltips:true,            //show tool tips on cells
        addRowPos:"top",          //when adding a new row, add it to the top of the table
        history:true,             //allow undo and redo actions on the table
        pagination:"local",       //paginate the data
        paginationSize:20,         //allow 7 rows per page of data
        paginationCounter:"rows", //display count of paginated rows in footer
        movableColumns:true,      //allow column order to be changed
        resizableRows:true,       //allow row order to be changed
        initialSort:[             //set the initial sort order of the data
            {column:"inc_pitch_length", dir:"asc"},
        ],
        columns:[                 //define the table columns
            {title:"ID", field:"id"},
            {title:"Name", field:"abc_name"},
            //{title:"State", field:"state"},
            {title:"FolkWiki", field:"fw_link_id", cellClick: openFolkWikiFromId},
            //{title:"Note Length", field:"note_sequence_count"},
            {title:"Incompatible/Distinct Note Count", field: "inc_pitch_length"},
            {title:"Incompatible/Distinct Pitches", field: "incompatible_pitches"}
            //{title:"Task Progress", field:"progress", hozAlign:"left", formatter:"progress", editor:true},
            //{title:"Gender", field:"gender", width:95, editor:"select", editorParams:{values:["male", "female"]}},
            //{title:"Rating", field:"rating", formatter:"star", hozAlign:"center", width:100, editor:true},
            //{title:"Color", field:"col", width:130, editor:"input"},
            //{title:"Date Of Birth", field:"dob", width:130, sorter:"date", hozAlign:"center"},
            //{title:"Driver", field:"car", width:90,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
        ],
        ...options
      });
    });
  }
};
