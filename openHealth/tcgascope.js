console.log('tcgascope.js loaded');


openHealth.require(config.domain + '/openHealth/tcga.js', function () {

    selectObject = trace = {};

    openHealthJob.innerHTML = abcUtil.selectBox(trace, selectObject)
        + '<div id="openHealthJobMsg" style="color:red">processing ...</div><div id="openHealthJobDC"></div>';

    tumorChanged = function (evt) {
        var opt = evt.selectedOptions[0].value;

        console.log('*** tumorChanged ***');
        console.log(opt);
        window.location.hash = '';

        var partsOfStr = opt.split(',');
        selectObject.cancer_type = partsOfStr[0];
        selectObject.db = partsOfStr[1];
        selectObject.execution_id = partsOfStr[2];

        getTcgaData(selectObject.cancer_type);
    };


    function get_biospecimen_slide(filename, cancer_type) {

        console.log('*** get_biospecimen_slide ***');

        localforage.getItem(filename, function (x) {
            var clinical_patient = '',
                biospecimen_slide = '',
                docs = '',
                tab = '',
                dx = '';
            clinical_patient = 'clinical_patient_' + cancer_type;
            biospecimen_slide = 'biospecimen_slide_' + cancer_type;
            docs = cancer_type + 'Docs';
            tab = cancer_type + 'Tab';
            dx = cancer_type + 'Dx';

            if (!x) {
                var str = openHealth.biosFile = cancer_type + "/bcr/biotab/clin/nationwidechildrens.org_" + filename + ".txt";
                openHealth.tcga.getTable(str,
                    function (x) {
                        openHealth.tcga.dt[filename] = x;
                        localforage.setItem(filename, x);
                        console.log(filename + ' loaded from TCGA and cached for this machine');
                        drawGraphs(cancer_type, clinical_patient, biospecimen_slide, docs, tab, dx);
                    },
                    0,
                    2
                )
            } else {
                console.log(filename + ' retrieved from cache');
                openHealth.tcga.dt[filename] = x;
                drawGraphs(cancer_type, clinical_patient, biospecimen_slide, docs, tab, dx);
            }

        })
    }


    //https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/luad/bcr/biotab/clin
    function getTcgaData(cancer_type) {

        console.log('*** getTcgaData ***');
        console.log(cancer_type);

        selectObject.cancer_type = cancer_type;
        var clinicalFile = 'clinical_patient_' + cancer_type;
        var biosFile = 'biospecimen_slide_' + cancer_type;

        localforage.getItem(clinicalFile, function (x) {

            if (!x) {
                var str = openHealth.clinicalFile = cancer_type + "/bcr/biotab/clin/nationwidechildrens.org_" + clinicalFile + ".txt";

                openHealth.tcga.getTable(str,
                    function (x) {
                        openHealth.tcga.dt[clinicalFile] = x;
                        localforage.setItem(clinicalFile, x);
                        console.log(clinicalFile + ' loaded from TCGA and cached for this machine');
                        get_biospecimen_slide(biosFile, cancer_type)
                    }
                )
            } else {
                console.log(clinicalFile + ' retrieved from cache');
                openHealth.tcga.dt[clinicalFile] = x;

                get_biospecimen_slide(biosFile, cancer_type)
            }

        })

    }

    getTcgaData(selectObject.cancer_type);


    // clinical_patient_xxx, biospecimen_slide_xxx, xxxDocs, xxxTab, xxxDx
    function drawGraphs(cancer_type, clinical_patient, biospecimen_slide, xxxDocs, xxxTab, xxxDx) {

        // Extract AGE
        if (openHealth.tcga.dt[clinical_patient].age_at_initial_pathologic_diagnosis != null) {
            openHealth.tcga.dt[clinical_patient].age = openHealth.tcga.dt[clinical_patient].age_at_initial_pathologic_diagnosis.map(function (xi) {
                return parseInt(xi)
            });

        }

        if (openHealth.tcga.dt[clinical_patient].age_at_diagnosis != null) {
            openHealth.tcga.dt[clinical_patient].age = openHealth.tcga.dt[clinical_patient].age_at_diagnosis.map(function (xi) {
                return parseInt(xi)
            });

        }

        // Extract SURVIVAL
        // "death_days_to":["days_to_death","CDE_ID: ...
        openHealth.tcga.dt[clinical_patient].survival = openHealth.tcga.dt[clinical_patient].death_days_to.map(function (xi, i) {
            if (xi == "[Not Applicable]") {
                // "last_contact_days_to":["days_to_last_followup","CDE_ID: ...
                xi = openHealth.tcga.dt[clinical_patient].last_contact_days_to[i]; // this is not ideal so we'll need to flag the vital status in teh analysis
            }
            return parseInt(xi)
        });

        openHealth.tcga.dt[clinical_patient].dead = openHealth.tcga.dt[clinical_patient].vital_status.map(function (xi) {
            return xi == "Dead"
        });

        //"karnofsky_score":["karnofsky_performance_score","CDE_ID: ...
        if (openHealth.tcga.dt[clinical_patient].karnofsky_score != null) {
            openHealth.tcga.dt[clinical_patient].score = openHealth.tcga.dt[clinical_patient].karnofsky_score.map(function (xi, i) {
                if (!parseFloat(xi)) {
                    return NaN
                }
                else {
                    return parseInt(xi)
                }
            });

        }
        else {
            //return "[Not Applicable]";
        }

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
                xi.karnofsky_score = p.karnofsky_score
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
        openHealthJobMsg.textContent = '--> processing ...';
        openHealthJobDC.innerHTML = '';

        // ---- UI Dimensional scaling ---
        openHealth.getScript(["https://cdnjs.cloudflare.com/ajax/libs/d3/3.4.11/d3.min.js", "https://www.google.com/jsapi", "https://square.github.io/crossfilter/crossfilter.v1.min.js", "https://dc-js.github.io/dc.js/js/dc.js", "https://dc-js.github.io/dc.js/css/dc.css"], function () { // after satisfying d3 dependency
            openHealthJobMsg.textContent = "Assembling charts ...";

            openHealthJobDC.innerHTML = abcUtil.setupDimensionalChart(openHealth.tcga.dt[clinical_patient].karnofsky_score);

            var docs = openHealth.tcga.dt[xxxDocs];

            var tab = openHealth.tcga.dt[xxxTab];

            var C = {}, D = {}, G = {}, U = {}, R = {};
            var P = {}, S = {};  // list patients and slides

            var cf = crossfilter(docs);

            var addRowChart = function (parm, Uparm, fun) {
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
            var addRowChart2 = function (parm, Uparm, fun) {
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

            addRowChart('percent_necrosis');
            addRowChart('percent_tumor_cells');
            addRowChart('percent_stromal_cells');
            addRowChart('percent_tumor_nuclei');
            addRowChart('percent_lymphocyte_infiltration');
            addRowChart('percent_monocyte_infiltration');
            addRowChart('percent_neutrophil_infiltration');
            addRowChart2('section_location', openHealth.unique(openHealth.tcga.dt[xxxTab].section_location));
            addRowChart2('gender', openHealth.unique(openHealth.tcga.dt[xxxTab].gender));
            addRowChart('race', openHealth.unique(openHealth.tcga.dt[xxxTab].race));


            if (openHealth.tcga.dt[clinical_patient].karnofsky_score != null) {
                addRowChart(
                    'karnofsky_score',
                    openHealth.unique(openHealth.tcga.dt[xxxTab].karnofsky_score),
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

            }

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

                    return v.value / 2
                })
                .x(d3.scale.linear())
                .y(d3.scale.linear())
                .elasticY(true)
                .elasticX(true)
                .xAxisLabel('Survival (days)')
                .yAxisLabel(function (d) {
                    setTimeout(function () {
                        abcUtil.listSlides(R, S, P, openHealth.tcga.dt[xxxDx], patient, selectObject);
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

            if (selectObject.cancer_type !== 'paad') {
                AddXAxis(C.karnofsky_score, '# images found');
            }

            // clear bootstrap to make room
            document.getElementById('openHealth').className = "";
            openHealthJobMsg.textContent = ""

        });

    }

});
