//https://mathbiol.github.io/openHealth/jobs/tcgascope.js
console.log('tcgascope.js loaded');

openHealth.tm = 'gbm';

openHealth.require(config.domain + '/openHealth/js/tcga.js', function () {
    var selectTumorHTML = '<h3 style="color:navy">Tumor Type: <select onchange="tumorChanged(this)" style="font-color:navy;background-color:silver;font-size:large" id="selectTumor"><option>GBM - Glioblastoma Multiforme</option><option>LGG - Lower Grade Glioma</option></select></h3>';
    openHealthJob.innerHTML = selectTumorHTML + '<div id="openHealthJobMsg" style="color:red">processing ...</div><div id="openHealthJobDC"></div>';
    tumorChanged = function (evt) {
        var tm = evt.selectedOptions[0].value.slice(0, 3);
        var str = tm.toLowerCase();

        console.log('str ' + str);
        doType(str);
    };

    function meta(cancer_type) {
        // TODO:
        if (cancer_type === 'lgg')
            cancer_type = 'luad';

        var url = config.findAPI + ':' + config.port + '/?limit=1&collection=metadata&find={"cancer_type":"' + cancer_type + '"}&db=u24_meta';
        console.log(url);

        $.getJSON(url).then(function (arr) {
            console.log(JSON.stringify(arr));

            arr.forEach(function (item) {
                openHealth.db = item.db;
                openHealth.execId = item.execution_id;

            });

        })
    }


    function get_biospecimen_slide(filename, cancer_type) {
        //localforage.removeItem(filename)
        localforage.getItem(filename, function (x) {
            var clinical_patient = '',
             biospecimen_slide = '',
             docs = '',
             tab = '',
             dx = '';
            if (cancer_type === 'gbm')
            {
                 clinical_patient = 'clinical_patient_gbm';
                 biospecimen_slide = 'biospecimen_slide_gbm';
                 docs = 'gbmDocs';
                 tab = 'gbmTab';
                 dx = 'gbmDx';

            }

            if (cancer_type === 'lgg')
            {
                 clinical_patient = 'clinical_patient_lgg';
                 biospecimen_slide = 'biospecimen_slide_lgg';
                 docs = 'lggDocs';
                 tab = 'lggTab';
                 dx = 'lggDx';
            }

            if (!x) {
                openHealth.tcga.getTable(cancer_type + "/bcr/biotab/clin/nationwidechildrens.org_" + filename + ".txt",
                    function (x) {
                        openHealth.tcga.dt[filename] = x;
                        localforage.setItem(filename, x);
                        console.log(filename + ' loaded from TCGA and cached for this machine');
                        //fun()
                        testFun(cancer_type, clinical_patient, biospecimen_slide, docs, tab, dx);
                    },
                    0,
                    2
                )
            } else {
                console.log(filename + ' retrieved from cache');
                openHealth.tcga.dt[filename] = x;
                //fun()
                testFun(cancer_type, clinical_patient, biospecimen_slide, docs, tab, dx);
            }

        })
    }


    function doType(cancer_type) {

        openHealth.tm = cancer_type;
        meta(openHealth.tm);
        var clinicalFile = 'clinical_patient_' + cancer_type;
        var biosFile = 'biospecimen_slide_' + cancer_type;
        var fun;

        if (cancer_type === 'gbm') {
            //fun = GBMfun;

        }

        if (cancer_type === 'lgg') {
            //fun = LGGfun;
        }


        localforage.getItem(clinicalFile, function (x) {
            //localforage.removeItem(clinicalFile)
            if (!x) {
                openHealth.tcga.getTable(cancer_type + "/bcr/biotab/clin/nationwidechildrens.org_" + clinicalFile + ".txt",
                    function (x) {
                        openHealth.tcga.dt[clinicalFile] = x;
                        localforage.setfilename(clinicalFile, x);
                        console.log(clinicalFile + ' loaded from TCGA and cached for this machine');
                        //get_biospecimen_slide(biosFile, cancer_type, fun)
                        get_biospecimen_slide(biosFile, cancer_type)
                    }
                )
            } else {
                console.log(clinicalFile + ' retrieved from cache');
                openHealth.tcga.dt[clinicalFile] = x;

                //get_biospecimen_slide(biosFile, cancer_type, fun)
                get_biospecimen_slide(biosFile, cancer_type)
            }

        })

    }
    doType(openHealth.tm);


// clinical_patient_xxx, biospecimen_slide_xxx, xxxDocs, xxxTab, xxxDx
    function testFun(cancer_type, clinical_patient, biospecimen_slide, xxxDocs, xxxTab, xxxDx) {
        // Extract AGE
        openHealth.tcga.dt[clinical_patient].age = openHealth.tcga.dt[clinical_patient].age_at_initial_pathologic_diagnosis.map(function (xi) {
            return parseInt(xi)
        });
        // Extract SURVIVAL
        openHealth.tcga.dt[clinical_patient].survival = openHealth.tcga.dt[clinical_patient].days_to_death.map(function (xi, i) {
            if (xi == "[Not Applicable]") {
                xi = openHealth.tcga.dt[clinical_patient].days_to_last_followup[i]; // this is not ideal so we'll need to flag the vital status in teh analysis
            }
            return parseInt(xi)
        });
        openHealth.tcga.dt[clinical_patient].dead = openHealth.tcga.dt[clinical_patient].vital_status.map(function (xi) {
            return xi == "Dead"
        });
        openHealth.tcga.dt[clinical_patient].score = openHealth.tcga.dt[clinical_patient].karnofsky_performance_score.map(function (xi, i) {
            if (!parseFloat(xi)) {
                return NaN
            }
            else {
                return parseInt(xi)
            }	// karnofsky_performance_score
        });


        // Create Docs
        var docs = openHealth.tab2docs(openHealth.tcga.dt[biospecimen_slide]); // one doc per image
        // index patients by bcr code
        var patient = {};
        openHealth.tab2docs(openHealth.tcga.dt[clinical_patient]).forEach(function (xi) {
            patient[xi.bcr_patient_barcode] = xi
        });
        // add patient info to slide docs
        docs = docs.map(function (xi, i) {
            var bcr = xi.bcr_sample_barcode.match(/[^-]+-[^-]+-[^-]+/)[0];
            var p = patient[bcr];
            if (p) {
                xi.patient = bcr;
                xi.age = p.age;
                xi.dead = p.dead;
                xi.survival = p.survival;
                xi.gender = p.gender;
                xi.race = p.race;
                xi.score = p.score;
                xi.karnofsky_performance_score = p.karnofsky_performance_score
            } else {
                console.log('patient ' + bcr + ' not found for slide ' + i)
            }
            return xi
        });
        // remove docs with no patient info
        var d = [];
        docs.forEach(function (xi) {
            if (xi.patient) {
                d.push(xi)
            }
        });
        docs = d;
        openHealth.tcga.dt[xxxDocs] = docs;
        openHealth.tcga.dt[xxxTab] = openHealth.docs2tab(openHealth.tcga.dt[xxxDocs]);
        //openHealthJob.innerHTML='<div id="openHealthJobMsg" style="color:red">TCGA Data retrieved, processing it ...</div>'+selectTumorHTML+'<div id="openHealthJobDC"></div>'
        openHealthJobMsg.textContent = '--> processing ...';
        openHealthJobDC.innerHTML = '';

        // ---- UI Dimensional scalling ---
        openHealth.getScript(["https://cdnjs.cloudflare.com/ajax/libs/d3/3.4.11/d3.min.js", "https://www.google.com/jsapi", "https://square.github.io/crossfilter/crossfilter.v1.min.js", "https://dc-js.github.io/dc.js/js/dc.js", "https://dc-js.github.io/dc.js/css/dc.css"], function () { // after satisfying d3 dependency
            openHealthJobMsg.textContent = "Assembling charts ...";
            //openHealthJobDC.innerHTML='<table cellpadding="10px"><tr><td style="vertical-align:top"><table><tr><td style="vertical-align:top"><div>% Necrotic Cells:</div><div id="percent_necrosis"></div><div>% Tumor Nuclei:</div><div id="percent_tumor_nuclei"></div><div>Location:</div><div id="section_location"></div></td><td style="vertical-align:top"><div>% Tumor Cells:</div><div id="percent_tumor_cells"></div><div>% Lymphocyte Infiltration:</div><div id="percent_lymphocyte_infiltration"></div><div>Race:</div><div id="race"></div><div>Gender:</div><div id="gender"></div></td><td style="vertical-align:top"><div>% Stromal Cells:</div><div id="percent_stromal_cells"></div><div style="color:blue">Karnofsky Score:</div><div id="karnofsky_performance_score" style="border:solid;border-color:blue;box-shadow:10px 10px 5px #888888"></div><div>% Monocyte Infiltration:</div><div id="percent_monocyte_infiltration"></div><div>% Neutrophil Infiltration:</div><div id="percent_neutrophil_infiltration"></div></td></tr></table></td><td style="vertical-align:top"><h3>' + cancer_type + ' Tumor progression</h3><div id="tumorProgression"></div><b>Legend</b>: color indicates Karnofsky performance score (see framed bar chart); diameter indicates number of images</td></tr></table><table><tr><td style="vertical-align:top"><div id="tcgaPatientsHeader">TCGA patients:</div><div id="tcgaPatients"></div></td><td style="vertical-align:top"><div id="slideImagesHeader">Slide Images:</div><div id="slideImages"></div></td><td style="vertical-align:top"><div id="diagnosticImagesHeader">Diagnostic Images:</div><div id="diagnosticImages"></div></td><td style="vertical-align:top"><div id="buttonResults"></div></td></tr></table>'
            //openHealthJobDC.innerHTML='<table cellpadding="10px"><tr><td style="vertical-align:top"><table><tr><td style="vertical-align:top"><div>% Necrotic Cells:</div><div id="percent_necrosis"></div><div>% Tumor Nuclei:</div><div id="percent_tumor_nuclei"></div><div>Location:</div><div id="section_location"></div></td><td style="vertical-align:top"><div>% Tumor Cells:</div><div id="percent_tumor_cells"></div><div>% Lymphocyte Infiltration:</div><div id="percent_lymphocyte_infiltration"></div><div>Race:</div><div id="race"></div><div>Gender:</div><div id="gender"></div></td><td style="vertical-align:top"><div>% Stromal Cells:</div><div id="percent_stromal_cells"></div><div style="color:blue">Karnofsky Score:</div><div id="karnofsky_performance_score" style="border:solid;border-color:blue;box-shadow:10px 10px 5px #888888"></div><div>% Monocyte Infiltration:</div><div id="percent_monocyte_infiltration"></div><div>% Neutrophil Infiltration:</div><div id="percent_neutrophil_infiltration"></div></td></tr></table></td><td style="vertical-align:top"><h3>' + cancer_type + ' Tumor progression</h3><div id="tumorProgression"></div><b>Legend</b>: color indicates Karnofsky performance score (see framed bar chart); diameter indicates number of images</td></tr></table><table id="patientSlideTable"><thead><tr><td id="tcgaPatientsHeader">TCGA patients:</td><td id="diagnosticImagesHeader">Diagnostic Images:</td></tr></thead><tr><td style="vertical-align:top"><div id="tcgaPatientsHeader_">TCGA patients:</div><div id="tcgaPatients"></div></td><td style="vertical-align:top"><div id="slideImagesHeader">Slide Images:</div><div id="slideImages"></div></td><td style="vertical-align:top"><div id="diagnosticImagesHeader_">Diagnostic Images:</div><div id="diagnosticImages"></div></td><td style="vertical-align:top"><div id="buttonResults"></div></td></tr></table>'
            //openHealthJobDC.innerHTML='<table cellpadding="10px"><tr><td style="vertical-align:top"><table><tr><td style="vertical-align:top"><div>% Necrotic Cells:</div><div id="percent_necrosis"></div><div>% Tumor Nuclei:</div><div id="percent_tumor_nuclei"></div><div>Location:</div><div id="section_location"></div></td><td style="vertical-align:top"><div>% Tumor Cells:</div><div id="percent_tumor_cells"></div><div>% Lymphocyte Infiltration:</div><div id="percent_lymphocyte_infiltration"></div><div>Race:</div><div id="race"></div><div>Gender:</div><div id="gender"></div></td><td style="vertical-align:top"><div>% Stromal Cells:</div><div id="percent_stromal_cells"></div><div style="color:blue">Karnofsky Score:</div><div id="karnofsky_performance_score" style="border:solid;border-color:blue;box-shadow:10px 10px 5px #888888"></div><div>% Monocyte Infiltration:</div><div id="percent_monocyte_infiltration"></div><div>% Neutrophil Infiltration:</div><div id="percent_neutrophil_infiltration"></div></td></tr></table></td><td style="vertical-align:top"><h3>' + cancer_type + ' Tumor progression</h3><div id="tumorProgression"></div><b>Legend</b>: color indicates Karnofsky performance score (see framed bar chart); diameter indicates number of images</td></tr></table><table id="patientSlideTable"><thead><tr><td id="tcgaPatientsHeader" style="color:maroon;font-weight:bold">TCGA patients:</td><td id="diagnosticImagesHeader" style="color:maroon;font-weight:bold">Diagnostic Images:</td></tr></thead><tbody id="patientSlideTableBody"></tbody></table><table id="hiddenTable" hidden=true><tr><td style="vertical-align:top"><div id="tcgaPatientsHeader_">TCGA patients:</div><div id="tcgaPatients"></div></td><td style="vertical-align:top"><div id="slideImagesHeader">Slide Images:</div><div id="slideImages"></div></td><td style="vertical-align:top"><div id="diagnosticImagesHeader_">Diagnostic Images:</div><div id="diagnosticImages"></div></td><td style="vertical-align:top"><div id="buttonResults"></div></td></tr></table>'
            openHealthJobDC.innerHTML = '<table cellpadding="10px"><tr><td style="vertical-align:top"><table><tr><td style="vertical-align:top"><div>% Necrotic Cells:</div><div id="percent_necrosis"></div><div>% Tumor Nuclei:</div><div id="percent_tumor_nuclei"></div><div>Location:</div><div id="section_location"></div></td><td style="vertical-align:top"><div>% Tumor Cells:</div><div id="percent_tumor_cells"></div><div>% Lymphocyte Infiltration:</div><div id="percent_lymphocyte_infiltration"></div><div>Race:</div><div id="race"></div><div>Gender:</div><div id="gender"></div></td><td style="vertical-align:top"><div>% Stromal Cells:</div><div id="percent_stromal_cells"></div><div style="color:blue">Karnofsky Score:</div><div id="karnofsky_performance_score" style="border:solid;border-color:blue;box-shadow:10px 10px 5px #888888"></div><div>% Monocyte Infiltration:</div><div id="percent_monocyte_infiltration"></div><div>% Neutrophil Infiltration:</div><div id="percent_neutrophil_infiltration"></div></td></tr></table></td><td style="vertical-align:top"><h3>GBM Tumor progression</h3><div id="tumorProgression"></div><b>Legend</b>: color indicates Karnofsky performance score (see framed bar chart); diameter indicates number of images</td></tr></table><table><tr><td style="vertical-align:top"><table id="patientSlideTable"><thead><tr><td id="tcgaPatientsHeader" style="color:maroon;font-weight:bold">TCGA patients:</td><td id="diagnosticImagesHeader" style="color:maroon;font-weight:bold">Diagnostic Images:</td></tr></thead><tbody id="patientSlideTableBody"></tbody></table></td><td id="moreInfo" style="vertical-align:top"></td></tr></table><table id="hiddenTable" hidden=true><tr><td style="vertical-align:top"><div id="tcgaPatientsHeader_">TCGA patients:</div><div id="tcgaPatients"></div></td><td style="vertical-align:top"><div id="slideImagesHeader">Slide Images:</div><div id="slideImages"></div></td><td style="vertical-align:top"><div id="diagnosticImagesHeader_">Diagnostic Images:</div><div id="diagnosticImages"></div></td><td style="vertical-align:top"><div id="buttonResults"></div></td></tr></table>';

            var docs = openHealth.tcga.dt[xxxDocs];
            console.log('docs: ' + docs);

            var tab = openHealth.tcga.dt[xxxTab];


            var C = {}, D = {}, G = {}, U = {}, R = {};
            var P = {}, S = {};  // list patients and slides
            var listDxSlides = function (pp) {
                // check DxImages available already
                if (!openHealth.tcga.dt[xxxDx]) {
                    openHealth.getText(config.domain + '/openHealth/data/' + cancer_type + '_patientids.json', function (x) {
                        //x = x.replace(/}/g, '},');
                        //x = '[' + x.slice(0, -2) + ']';

                        x = JSON.parse(x.replace(/\'/g, '"'));
                        var y = {}; // index of diagnostic images per patient
                        x.map(function (xi) {
                            if (!y[xi.patientid]) {
                                y[xi.patientid] = [xi.caseid]
                            } else {
                                y[xi.patientid].push(xi.caseid)
                            }

                        });
                        openHealth.tcga.dt[xxxDx] = y;
                        listDxSlides(pp)
                    })
                } else {
                    var pp0 = pp.filter(function (pi) {
                        return openHealth.tcga.dt[xxxDx][pi]
                    });
                    pp = [];
                    pp0.map(function (pi) {
                        pp = pp.concat(openHealth.tcga.dt[xxxDx][pi])
                    });
                    diagnosticImagesHeader.textContent = ' Diagnostic Images (' + pp.length + '):';
                    diagnosticImages.innerHTML = ""; // clear
                    /*pp.map(function(pi){
                     //var di = openHealth.tcga.dt[xxxDx][pi]
                     var a = document.createElement('a')
                     a.href=config.quipUrl + "?tissueId="+pi
                     a.textContent=pi
                     a.target="_blank"
                     var pa = document.createElement('p')
                     pa.appendChild(a)
                     diagnosticImages.appendChild(pa)
                     })
                     */
                    pp.map(function (p) {
                        if (!document.getElementById("link_" + p)) {
                            var pt = p.match(/TCGA-\w+-\w+/)[0];
                            var tp = document.getElementById('dxSlide_' + pt); // target patient element
                            var dx = document.createElement('p');
                            dx.id = "link_" + p;
                            dx.innerHTML = '<a href="' + config.quipUrl + '?tissueId=' + p + '" target=_blank>' + p + '</a>';
                            tp.appendChild(dx)
                        }

                    })

                }


            };
            var listSlides = function () {
                slideImages.parentNode.hidden = "true";
                if (R.gender.FEMALE.c + R.gender.MALE.c > R.section_location.BOTTOM.c + R.section_location.TOP.c) {
                    var parm = 'section_location'
                } else {
                    var parm = 'gender'
                }
                var ss = []; // list of slides
                var pp = []; // list of patients
                Object.getOwnPropertyNames(S[parm]).forEach(function (s) {
                    if (S[parm][s].c > 0) {
                        ss.push(s)
                    }
                });
                Object.getOwnPropertyNames(P[parm]).forEach(function (p) {
                    if (P[parm][p].c > 0) {
                        pp.push(p)
                    }
                });
                slideImagesHeader.textContent = ' Slide Images (' + ss.length + '):';
                tcgaPatientsHeader.textContent = ' TCGA patients (' + pp.length + '):';
                diagnosticImagesHeader.textContent = ' Diagnostic Images (...):';
                tcgaPatients.innerHTML = "";
                slideImages.innerHTML = "";
                openHealth.tcga.resultsPatient = function (x) {
                    //var key = x.textContent
                    //buttonResults.innerHTML='<pre>'+JSON.stringify(patient[x.textContent],null,3)+'</pre>'

                    buttonResults.innerHTML = '<pre>' + JSON.stringify(patient[x.textContent], null, 3) + '</pre>';
                    //var fscape = 'http://sbu-bmi.github.io/featurescape/?https://fscape-132294.nitrousapp.com/?find={"provenance.analysis_execution_id":"yi-algo-v2","image.subjectid":"' + patient[x.textContent]["bcr_patient_barcode"] + '"};fun/u24demo.js';

                    var v = 0.95 * Math.random();
                    var textContent = v.toString().slice(0, 5);

                    var _static = config.quot + 'provenance.analysis.execution_id' + config.quot + ':' + config.quot + openHealth.execId + config.quot;
                    // Yes, we really do need absolute path for this url:
                    var fscape = config.domain + '/featurescape/?' + config.findAPI + ':' + config.port + '/?limit=' + 500 + '&find={' + config.quot + 'randval' + config.quot + ':{' + config.quot + '$gte' + config.quot + ':' + textContent + '},' + _static + ',' + config.quot + 'provenance.image.subject_id' + config.quot + ':' + config.quot + patient[x.textContent]["bcr_patient_barcode"] + config.quot + '}&db=' + openHealth.db;
                    if (config.mongoUrl)
                    {
                        fscape = fscape + '&mongoUrl=' + config.mongoUrl;
                    }
                    fscape = fscape + ';fun/u24demo.js';

                    moreInfo.innerHTML = ' <input id="fscapeButton" style="color:blue" type="button" value="feature landscape (if available) for ' + patient[x.textContent]["bcr_patient_barcode"] + '"><pre>' + JSON.stringify(patient[x.textContent], null, 3) + '</pre>';
                    fscapeButton.onclick = function () {
                        window.open(fscape)
                    };

                    //moreInfo.innerHTML='<pre>'+JSON.stringify(patient[x.textContent],null,3)+'</pre>'

                    //console.log(x)
                };
                openHealth.tcga.resultsSlide = function (x) {
                    var d = openHealth.findOne(openHealth.tcga.dt[xxxDocs], 'bcr_slide_barcode', x.textContent);
                    buttonResults.innerHTML = '<pre>' + JSON.stringify(d, null, 3) + '</pre>'
                };
                patientSlideTableBody.innerHTML = ""; // clear tbody
                pp.sort().forEach(function (p, i) {
                    var pr = document.createElement('p');
                    pr.innerHTML = ' ' + i + ') <button onclick="openHealth.tcga.resultsPatient(this)">' + p + '</button> <a href="http://www.cbioportal.org/case.do?case_id=' + p + '&cancer_study_id=' + cancer_type + '_tcga" target=_blank>cBio</a>... ';
                    pr.id = "patient" + p;
                    tcgaPatients.appendChild(pr);
                    var tr = document.createElement('tr');
                    tr.id = 'tr_' + p;
                    tr.innerHTML = '<td id="tdPatient_' + p + '" style="vertical-align:top">' + i + ') <button onclick="openHealth.tcga.resultsPatient(this)">' + p + '</button>(<a href="http://www.cbioportal.org/case.do?case_id=' + p + '&cancer_study_id=' + cancer_type + '_tcga" target=_blank>cBio</a>)</td><td id="dxSlide_' + p + '" style="vertical-align:top;font-size:12"></td>';
                    patientSlideTableBody.appendChild(tr);
                    /*if(openHealth.tcga.dt[xxxDx][p]){
                     openHealth.tcga.dt[xxxDx][p].map(function(dxi){
                     var c=document.createElement('span')
                     c.textContent=dxi
                     pr.appendChild(c)
                     })
                     }*/

                });
                ss.sort().forEach(function (s, i) {
                    var pr = document.createElement('p');
                    pr.innerHTML = ' ' + i + ') <button onclick="openHealth.tcga.resultsSlide(this)">' + s + '</button> <a href="http://quip.bmi.stonybrook.edu/camicroscope-qin/osdCamicroscope.php?tissueId=' + s + '" target=_blank> caMicroscope </a>.';
                    slideImages.appendChild(pr)
                });
                listDxSlides(pp)
            };

            var cf = crossfilter(docs);


            var addRowChard = function (parm, Uparm, fun) {
                D[parm] = cf.dimension(function (d) {
                    return d[parm]
                });
                R[parm] = {};
                if (!Uparm) {
                    U[parm] = openHealth.tcga.sortPercent(openHealth.unique(tab[parm]))
                } else {
                    U[parm] = Uparm
                }
                U[parm].forEach(function (u) {
                    R[parm][u] = {c: 0}
                });
                G[parm] = D[parm].group().reduce(
                    // reduce in
                    function (p, v) {
                        return R[parm][v[parm]].c += 1
                    },
                    // reduce out
                    function (p, v) {
                        return R[parm][v[parm]].c -= 1
                    },
                    // ini
                    function () {
                        return 0
                    }
                );
                C[parm] = dc.rowChart("#" + parm)
                    .width(300)
                    .height(40 + U[parm].length * 15)
                    .dimension(D[parm])
                    .elasticX(true)
                    .group(G[parm])
                    .ordering(function (d) {
                        if (d.key == "[Not Available]") {
                            return -1
                        }
                        else {
                            return parseInt(d.key)
                        }
                    });

                if (fun) {
                    fun(C[parm])
                }

            };
            // - - - - version that tracks slides and images - - - -
            var addRowChard2 = function (parm, Uparm, fun) {
                D[parm] = cf.dimension(function (d) {
                    return d[parm]
                });
                R[parm] = {};
                P[parm] = {};
                openHealth.unique(openHealth.tcga.dt[xxxTab].patient).map(function (p) {
                    P[parm][p] = {c: 0}
                });
                S[parm] = {};
                openHealth.tcga.dt[xxxTab].bcr_slide_barcode.map(function (s) {
                    S[parm][s] = {c: 0}
                });

                if (!Uparm) {
                    U[parm] = openHealth.tcga.sortPercent(openHealth.unique(tab[parm]))
                } else {
                    U[parm] = Uparm
                }
                U[parm].forEach(function (u) {
                    R[parm][u] = {c: 0}
                });

                G[parm] = D[parm].group().reduce(
                    // reduce in
                    function (p, v) {
                        P[parm][v.patient].c = P[parm][v.patient].c + 1;
                        S[parm][v.bcr_slide_barcode].c = S[parm][v.bcr_slide_barcode].c + 1;
                        return R[parm][v[parm]].c += 1
                    },
                    // reduce out
                    function (p, v) {
                        P[parm][v.patient].c = P[parm][v.patient].c - 1;
                        S[parm][v.bcr_slide_barcode].c = S[parm][v.bcr_slide_barcode].c - 1;
                        return R[parm][v[parm]].c -= 1
                    },
                    // ini
                    function () {
                        return 0
                    }
                );
                C[parm] = dc.rowChart("#" + parm)
                    .width(300)
                    .height(40 + U[parm].length * 15)
                    .dimension(D[parm])
                    .elasticX(true)
                    .group(G[parm])
                    .ordering(function (d) {
                        if (d.key == "[Not Available]") {
                            return -1
                        }
                        else {
                            return parseInt(d.key)
                        }
                    });

                if (fun) {
                    fun(C[parm])
                }

            };

            // - - - - - - - - - - - - -


            addRowChard('percent_necrosis');
            addRowChard('percent_tumor_cells');
            addRowChard('percent_stromal_cells');
            addRowChard('percent_tumor_nuclei');
            addRowChard('percent_lymphocyte_infiltration');
            addRowChard('percent_monocyte_infiltration');
            addRowChard('percent_neutrophil_infiltration');
            addRowChard2('section_location', openHealth.unique(openHealth.tcga.dt[xxxTab].section_location));
            addRowChard2('gender', openHealth.unique(openHealth.tcga.dt[xxxTab].gender));
            addRowChard('race', openHealth.unique(openHealth.tcga.dt[xxxTab].race));
            addRowChard(
                'karnofsky_performance_score',
                openHealth.unique(openHealth.tcga.dt[xxxTab].karnofsky_performance_score),
                function (CRT) {
                    CRT
                        .colors(d3.scale.linear().domain([-1, 0, 40, 80, 90, 100]).range(["silver", "red", "red", "yellow", "green", "green"]))
                        .colorAccessor(function (d, i) {
                            var v = parseFloat(d.key);
                            if (isNaN(v)) {
                                return -1
                            }
                            else {
                                return v
                            }
                        })
                }
            );

            C.tumorProgression = dc.bubbleChart("#tumorProgression");
            D.tumorProgression = cf.dimension(function (d) {
                return d.patient
            });
            R.tumorProgression = {};
            openHealth.unique(openHealth.tcga.dt[xxxTab].patient).map(function (u) {
                R.tumorProgression[u] = {c: 0}
            });
            G.tumorProgression = D.tumorProgression.group().reduce(
                // reduce in
                function (p, v) {
                    return R.tumorProgression[v.patient].c += 1
                },
                // reduce out
                function (p, v) {
                    return R.tumorProgression[v.patient].c -= 1
                },
                // ini
                function () {
                    return 0
                }
            );

            C.tumorProgression
                .width(1000)
                .height(800)
                .dimension(D.tumorProgression)
                .group(G.tumorProgression)
                .keyAccessor(function (v) { // <-- X values
                    return patient[v.key].survival
                })
                .valueAccessor(function (v) { // <-- Y values
                    return patient[v.key].age
                })
                .radiusValueAccessor(function (v) {
                    /*
                     if(i==0){ // things done a single time
                     tcgaPatients.innerHTML=""
                     }
                     if(v.value>0){
                     var p = document.createElement('p')
                     p.innerHTML=tcgaPatients.children.length+1+') <a href="http://www.cbioportal.org/case.do?case_id='+v.key+'&cancer_study_id=' + cancer_type + '_tcga" target=_blank>'+v.key+'</a>'
                     tcgaPatients.appendChild(p)
                     }
                     */


                    return v.value / 2
                })
                .x(d3.scale.linear())
                .y(d3.scale.linear())
                .elasticY(true)
                .elasticX(true)
                .xAxisLabel('Survival (days)')
                .yAxisLabel(function (d) {
                    setTimeout(function () {
                        listSlides()
                    }, 1000);
                    return 'Age (years)'
                })
                .colors(d3.scale.linear().domain([-1, 0, 40, 80, 90, 100]).range(["silver", "red", "red", "yellow", "green", "green"]))
                .colorAccessor(function (d, i) {
                    var v = patient[d.key].score;
                    if (isNaN(v)) {
                        return -1
                    }
                    else {
                        return v
                    }
                });

            dc.renderAll();

            $('.dc-chart g.row text').css('fill', 'black');
            var AddXAxis = function (chartToUpdate, displayText) {
                chartToUpdate.svg()
                    .append("text")
                    .attr("class", "x-axis-label")
                    .attr("text-anchor", "right")
                    .attr("x", chartToUpdate.width() * 0.5)
                    .attr("y", chartToUpdate.height() - 0)
                    .text(displayText);
            };
            AddXAxis(C.percent_necrosis, '# images found');
            AddXAxis(C.percent_tumor_cells, '# images found');
            AddXAxis(C.percent_stromal_cells, '# images found');
            AddXAxis(C.percent_tumor_nuclei, '# images found');
            AddXAxis(C.percent_lymphocyte_infiltration, '# images found');
            AddXAxis(C.percent_monocyte_infiltration, '# images found');
            AddXAxis(C.percent_neutrophil_infiltration, '# images found');
            AddXAxis(C.section_location, '# images found');
            AddXAxis(C.gender, '# images found');
            AddXAxis(C.race, '# images found');
            AddXAxis(C.karnofsky_performance_score, '# images found');

            karnofsky_performance_score;
            // clear bootstrap to make room
            document.getElementById('openHealth').className = "";
            openHealthJobMsg.textContent = ""


        })


    }


});