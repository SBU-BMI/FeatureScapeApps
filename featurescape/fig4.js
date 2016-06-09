console.log('fig4.js loaded');

$(function () {
    selectObject = {};

    url = '';
    docs = [];
    if (location.hash.length > 1) {

        url = location.hash.slice(1);

        var f = abcUtil.getQueryVariable('db', url);
        selectObject.db = f;
        selectObject.cancer_type = f.substring(4);
        // TODO: PTF.
        if (selectObject.db == 'u24_radpath') {
            selectObject.cancer_type = "gbm"
        }
        selectObject.selected = selectObject.cancer_type;

    }
    else {

        if (location.search.length > 1) {
            var q = location.search.slice(1);
            selectObject.db = abcUtil.getQueryVariable("db", q);

            url = config.findAPI + ':' + config.port + '?collection=patients&limit=1000&find={}&db=' + selectObject.db;

            selectObject.cancer_type = abcUtil.getQueryVariable("c", q);
            selectObject.selected = selectObject.cancer_type;

        }
        else {
            // Default
            selectObject.db = config.default_db;
            url = config.findAPI + ':' + config.port + '?collection=patients&limit=1000&find={}&db=' + selectObject.db;
            // This is OK. Def db matches c type.
            selectObject.cancer_type = (selectObject.db).substring(4);
            selectObject.selected = selectObject.cancer_type;
        }
    }

    select = document.getElementById('select');
    select.innerHTML = abcUtil.selectBox({}, selectObject);
    /**
     * SELECT ONCLICK.
     * @param evt
     */
    tumorChanged = function (evt) {
        var opt = evt.selectedOptions[0].value;
        var partsOfStr = opt.split(',');

        selectObject.cancer_type = partsOfStr[0];
        selectObject.db = partsOfStr[1];
        selectObject.execution_id = partsOfStr[2];
        url = config.findAPI + ':' + config.port + '?collection=patients&limit=1000&find={}&db=' + selectObject.db;
        selectObject.selected = opt;

        if (location.search.length > 1) {
            var currentState = history.state;
            console.log('currentState', currentState);
            var stateObj = {foo: "bar"}; // just clear it without reloading
            history.pushState(stateObj, "FeatureExplorer", "fig4.html");
        }

        if (location.hash.length > 1) {
            location.hash = '';
        }

        console.log('tumor changed', selectObject.selected);
        getData(url);
    };
    getData(url);
});

function getData(url) {

    document.getElementById('msg').textContent = '';

    $.getJSON(url).then(function (data) {

        if (data.length == 0) {
            abcUtil.noDataJoy(url);
        }
        else {
            doFigure4(data);
            abcUtil.doPatients(data, 'bcr_patient_barcode', url);
        }
        survivalPlot();

    })
}

function doFigure4(data) {
    /*
     var msg1 = function (txt, clr) {
     if (!clr) {
     clr = "blue"
     }
     msg.textContent = '> ' + txt;
     msg.style.color = clr;
     setTimeout(function () {
     msg.textContent = ""
     }, 5000)
     };
     msg1('loaded ' + data.length + ' records');
     */

    data = flatten(data);

    data = wrangle(data);

    showInfo(data);

    //unpack data into table, tab
    tab = {};
    var parms = Object.getOwnPropertyNames(data[0]);
    parms.forEach(function (p) {
        tab[p] = []
    });
    data.forEach(function (xi, i) {
        data[i].i = i;
        parms.forEach(function (p) {
            tab[p][i] = xi[p]
        })
    });

    docs = data;

    var genomic = checkNames(parms, this.genomic);
    var features = checkNames(parms, this.features);

    // build table
    var h = '<table>';
    h += '<tr><td id="fig4_1" style="vertical-align:top">';
    h += '<h3 style="color:maroon">Gene Mutation</h3>';
    h += '<p style="color:maroon">Click on bars to select molecular cohorts,<br>Xaxis: # patients; Yaxis: mutation status<br>[<b style="color:blue">blue</b><b style="color:YellowGreen">-</b><b style="color:red">red</b>] color range indicates fraction of total.</p>';

    genomic.forEach(function (gen) {
        h += '<h4 style="color:navy" id="fig4_1_' + gen + '">' + gen + '</h4>';
    });

    h += '</td>';
    h += '<td id="fig4_2" style="vertical-align:top">';
    //h += '<h3 style="color:maroon">Morphology, Epi, etc</h3>';
    h += '<h3 style="color:maroon" data-toggle="tooltip" title="eg. nuclear morphology, features, patient demographics"><span class="lightup">Cohort character</span></h3>';
    h += '<p style="color:maroon">';
    h += 'Var 1: <select id="morphParm1"></select><br>';
    h += 'Var 2: <select id="morphParm2"></select><br>';
    h += 'Slide mouse click to select ranges<br>Xaxis: parameter value<br>Yaxis: #patients';
    h += '</p>';
    h += '<div id="fig4_2_1"><span style="color:blue">Var 1: </span></div>';
    h += '<div id="fig4_2_2"><span style="color:blue">Var 2: </span></div>';
    //h += '<div id="fig4_2_3"><span style="color:blue">Var 2: </span></div>';
    h += '</td>';
    h += '<td id="fig4_3" style="vertical-align:top">';
    h += '<h3 style="color:maroon">Survival<h3>';
    //h +='...'
    h += '<div id="survival"></div>';
    h += '<p style="font-size:small">Zoomable KM estimator (i.e. select ranges, each dot is a patient)</p>';
    h += '<div id="dcSurvival"></div>';
    h += '<div id="dcStatus"></div>';

    h += '</td>';
    h += '</tr></table>';
    section.innerHTML = h;

    // Parameterization
    features.sort(function (a, b) {
        var val = (a.toUpperCase() > b.toUpperCase());
        if (val) {
            return 1
        } else {
            return -1
        }
    });

    searchParms = {};

    location.search.slice(1).split('&').forEach(function (pp) {
        pp = pp.split('=');
        searchParms[pp[0]] = pp[1]
    });

    /*
     if (url.indexOf("morph1") > -1) {

     searchParms["morph1"] = abcUtil.getQueryVariable("morph1", url);
     searchParms["morph2"] = abcUtil.getQueryVariable("morph2", url);

     }
     */
    // add search parms to list if they are not there
    if (searchParms.morph1) {
        if (features.indexOf(searchParms.morph1) == -1) {
            features.push(searchParms.morph1)
        }
    }
    if (searchParms.morph2) {
        if (features.indexOf(searchParms.morph2) == -1) {
            features.push(searchParms.morph2)
        }
    }

    features.forEach(function (p) {
        var op1 = document.createElement('option');
        op1.value = op1.textContent = p;
        morphParm1.appendChild(op1);
        var op2 = document.createElement('option');
        op2.value = op2.textContent = p;
        morphParm2.appendChild(op2)
    });
    morphParm1.style.width = morphParm2.style.width = 200;

    // harvest search parameters if any
    if (searchParms.morph1) {
        morphParm1.value = searchParms.morph1
    } else {
        morphParm1.value = "Roundness_median"
    }
    if (searchParms.morph2) {
        morphParm2.value = searchParms.morph2
    } else {
        morphParm2.value = "stdR_median"
    }

    /**
     * morphParm.onchange
     */
    morphParm1.onchange = morphParm2.onchange = function () {

        location.search = '?morph1=' + morphParm1.value + '&morph2=' + morphParm2.value + '&db=' + selectObject.db + '&c=' + selectObject.cancer_type;

    };

    // Add survival information
    survivalPlot = function () {
        trace0 = {
            x: tab.months_followup,
            y: tab.status,
            mode: 'lines'
        };

        // convert status into survival
        var x = [], y = [], ind = [];
        trace0.x.forEach(function (v, i) {
            var xi = trace0.x[i];
            var yi = trace0.y[i];
            if ((typeof(xi) == 'number') && (typeof(yi) == 'number')) {
                x.push(xi);
                y.push(yi);
                ind.push(i)
            }
        });

        var jj = jmat.sort(x)[1];
        surv0 = { // calculating survival here
            tt: [],
            status: [], // survival, we'll have to calculate it
            ind: []
        };

        jj.map(function (j, i) {
            surv0.tt[i] = x[j];
            surv0.status[i] = y[j]; // note this is the former y value (status)
            surv0.ind[i] = ind[j]
        });

        // calculating survival for unique times
        survCalc = function (x) { // x is the status, ordered chronologically
            var y = [x[0]];
            var n = x.length;
            var s = [1];
            for (var i = 1; i < n; i++) {
                y[i] = y[i - 1] + x[i];
                s[i] = s[i - 1] * (1 - x[i] / (n - i))
            }
            return s
        };

        surv0.yy = survCalc(surv0.status);
        trace0.x = surv0.tt;
        trace0.y = surv0.yy;

        surv0.yy.forEach(function (yi, i) {
            data[surv0.ind[i]].KM = yi; // recording Kaplan Meier in the original docs
        });

        // now only for the selected patients
        if (typeof(dcSurv) != "undefined") {
            trace1 = (function () {
                var xy = dcStatus.G.all().filter(function (xyi) {
                    return xyi.value
                });
                var x = [], y = [];
                xy.map(function (xyi, i) {
                    x[i] = xyi.key[0];
                    y[i] = xyi.key[1]
                });
                var ind = jmat.sort(x)[1];
                x = [];
                y = [];
                ind.forEach(function (i, j) {
                    if (xy[i].key[0] !== "") {
                        x.push(xy[i].key[0]);
                        y.push(xy[i].key[1])
                    }
                });

                var n = x.length;
                var s = [1];
                for (var i = 1; i < n; i++) {
                    s[i] = s[i - 1] * (1 - y[i] / (n - i))
                }

                return {
                    x: x,
                    y: s
                }
            })()
        }

        var layout = {
            title: 'Blue - whole population; Orange - selected cohort',
            showlegend: false,
            xaxis: {
                range: [0, 250],
                type: "linear",
                title: "months followup"
            },
            yaxis: {
                range: [0, 1],
                type: "linear",
                title: "Survival (Kaplan Meier estimator)"
            }
        };

        survival.style.width = '600px';
        survival.style.height = '500px';


        var plotData = [];
        if (typeof(trace1) !== 'undefined') {
            plotData = [trace0, trace1]
        } else {
            plotData = [trace0]
        }

        Plotly.newPlot('survival', plotData, layout);
        //var plotDiv = document.getElementById('survival');
        //console.log('plotly', plotDiv.data);

    };
    survivalPlot();

    docs = data;

    // time for cross filter
    var onFiltered = function (parm) {
        survivalPlot(parm);
        var ind = [];
        var bcr = [];
        dcStatus.G.all().forEach(function (d, i) {
            if (d.value > 0) {
                ind.push(i)
            }
        });
        ind.forEach(function (i) {
            bcr.push(docs[i])
        });
        abcUtil.doPatients(bcr, 'bcr_patient_barcode');
    };

    var cf = crossfilter(data);

    gene = {};

    genePlot = function (gn) { // gene name
        gene[gn] = {};
        gene[gn].R = {
            low: 0,
            high: 0,
            NA: 0
        };

        gene[gn].C = dc.rowChart("#fig4_1_" + gn);
        gene[gn].D = cf.dimension(function (d) {
            if (d[gn] === 0) {
                return 'no mutation'
            } else if (d[gn] === 1) {
                return 'mutation present'
            } else {
                return 'NA'
            }
        });

        gene[gn].G = gene[gn].D.group().reduce(
            // reduce in
            function (p, v) {
                if (v[gn] === 0) {
                    gene[gn].R.low += 1;
                    return gene[gn].R.low
                } else if (v[gn] === 1) {
                    gene[gn].R.high += 1;
                    return gene[gn].R.high
                } else {
                    gene[gn].R.NA += 1;
                    return gene[gn].R.NA
                }
            },
            // reduce out
            function (p, v) {
                if (v[gn] === 0) {
                    gene[gn].R.low -= 1;
                    return gene[gn].R.low
                } else if (v[gn] === 1) {
                    gene[gn].R.high -= 1;
                    return gene[gn].R.high
                } else {
                    gene[gn].R.NA -= 1;
                    return gene[gn].R.NA
                }
            },
            //ini
            function () {
                return 0
            }
        );

        try {
            gene[gn].C
                .width(500)
                .height(100)
                .margins({top: 10, right: 50, bottom: 30, left: 40})
                .dimension(gene[gn].D)
                .group(gene[gn].G)
                .elasticX(true)
                .colors(d3.scale.linear().domain([0, 0.5, 1]).range(["blue", "yellow", "red"]))
                .colorAccessor(function (d, i) {
                    if (typeof gene[gn] != 'undefined') {
                        var na = gene[gn].R.NA;
                        var high = gene[gn].R.high;
                        var low = gene[gn].R.low;
                        return d.value / (na + high + low)
                    }
                })
                .on('filtered', function () {
                    onFiltered(gn)
                });

        }
        catch (err) {
            console.log('gn', gn);
            console.log(err.message);
        }

        return gene
    };


    genomic.forEach(function (gen) {
        genePlot(gen);
    });

    // morphPlot
    morph = {};

    morphPlot = function (divId, p) {
        var div = document.getElementById(divId);
        //div.innerHTML += p + '<br>';
        div.innerHTML = p + '<br>';
        div.style.color = 'navy';
        div.style.fontWeight = 'bold';
        morph[p] = {};
        morph[p].R = {};
        morph[p].C = dc.barChart('#' + divId);
        morph[p].D = cf.dimension(function (d) {
            var v = d[p];
            if (v !== "") {
                return v
            } else {
                4
            }

        });

        morph[p].G = morph[p].D.group();
        /*.reduce(
         // reduce in
         function(p,v){
         return p+1
         },
         // reduce out
         function(p,v){
         return p-1
         },
         // ini
         function(p,v){
         return 0
         }
         )*/

        var xx = tab[p].filter(function (v) {
            return typeof(v) == 'number'
        });

        var Xmin = xx.reduce(function (a, b) {
            return Math.min(a, b)
        });

        var Xmax = xx.reduce(function (a, b) {
            return Math.max(a, b)
        });

        var Xn = xx.length;

        morph[p].C
            .width(300)
            .height(280)
            //.x(d3.scale.linear())
            //.xUnitCount(function(){return 10})
            .xUnits(function () {
                return 50
            })
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            //.y(d3.scale.log().domain([1,100]).range([0,280]))
            .x(d3.scale.linear().domain([Xmin, Xmax]).range([0, 300]))
            .y(d3.scale.linear())
            //.y(d3.scale.log().domain([1,100]).range([1,100]))
            .elasticY(true)
            //.elasticX(true)
            .dimension(morph[p].D)
            .group(morph[p].G)
            .on('filtered', function () {
                onFiltered(p)
            });

        return morph

    };

    morphPlot("fig4_2_1", morphParm1.value);
    morphPlot("fig4_2_2", morphParm2.value);
    //morphPlot("fig4_2_3", morphParm2.value);

    // DC Survival
    dcSurv = {
        R: []
    };

    dcSurv.C = dc.scatterPlot('#' + 'dcSurvival');
    dcSurv.D = cf.dimension(function (d) {
        return [d.months_followup, d.KM]
    });

    dcSurv.G = dcSurv.D.group();
    dcSurv.C
        .width(500)
        .height(300)
        .x(d3.scale.linear().domain([0, 250])) //.domain([0, 20])
        .y(d3.scale.linear().domain([0, 1]))
        //.yAxisLabel("Survival (KM estimator)")
        //.xAxisLabel("months followup")
        //.symbolSize(8)
        //.clipPadding(10)
        .dimension(dcSurv.D)
        .group(dcSurv.G);

    dcStatus = {
        R: []
    };

    dcStatus.C = dc.scatterPlot('#' + 'dcStatus');
    dcStatus.D = cf.dimension(function (d) {
        return [d.months_followup, d.status]
    });

    dcStatus.G = dcStatus.D.group();
    dcStatus.C
        .width(500)
        .height(100)
        .x(d3.scale.linear().domain([0, 250])) //.domain([0, 20])
        .y(d3.scale.linear().domain([-1, 2]))
        //.yAxisLabel("Survival (KM estimator)")
        //.xAxisLabel("months followup")
        //.symbolSize(8)
        //.clipPadding(10)
        .dimension(dcStatus.D)
        .group(dcStatus.G);

    // ready to render
    dc.renderAll();
    $('.dc-chart g.row text').css('fill', 'black');

}

function flatten(data) {

    var newArray = [];
    data.forEach(function (item) {
        var newObject = {};

        //clinical_features
        var feat = item.clinical_features;
        feat.forEach(function (f) {
            newObject[f.name] = f.value;
        });

        //genomic_features
        feat = item.genomic_features;
        feat.forEach(function (f) {
            newObject[f.name] = f.value;
        });

        //imaging_features
        feat = item.imaging_features;
        feat.forEach(function (f) {
            newObject[f.name] = f.value;
        });

        newArray.push(newObject);

    });

    return newArray;

}

function wrangle(oldArr) {
    return oldArr.map(function (item) {

        // Alive = 0
        // Dead = 1
        if ((item.vital_status != undefined) && isNaN(item.vital_status)) {

            if (item.vital_status === 'Alive') {
                item.vital_status = 0;
            }
            else {
                item.vital_status = 1;
            }

        }

        if (item.status == undefined) {
            item.status = item.vital_status;
        }

        // Convert days to last followup => months followup
        if (item.months_followup == undefined) {

            if (item.days_to_last_followup != undefined) {
                if (!isNaN(item.days_to_last_followup)) {
                    item.months_followup = (item.days_to_last_followup / 30);
                }
                else {
                    //NotAvailable
                    item.months_followup = 0;
                }

            }

            if ((item.months_followup == 0) && (item.days_to_death != undefined && !isNaN(item.days_to_death))) {
                item.months_followup = item.days_to_death / 30
            }

        }

        // Female = 1
        // Male = 0
        if ((item.gender != undefined) && isNaN(item.gender)) {
            if (item.gender === "FEMALE") {
                item.gender = 0;
            }
            else {
                item.gender = 1;
            }
        }

        return item;
    });

}

function showInfo(data) {

    var tt = '', tumor = '', tumor1 = '';
    if (data[0].Study) {
        tt = data[0].Study;
    }
    else {
        if (data[0].tumor) {
            tt = data[0].tumor;
        }
    }

    if (tt === '') {
        console.log('Unknown tumor');
    }
    else {
        if (isNaN(tt)) {
            tumor = tt;
            tumor1 = tt.toLowerCase();
        }
        else {

            if (tt == 2) {
                tumor = 'Lung Adenocarcinoma';
                tumor1 = 'luad';
            }
            else {
                console.log('Unknown tumor type ', tt);
            }
        }
    }

    var infoDiv;
    var name = 'info2';
    if (!document.getElementById(name)) {
        // Element does not exist. Let's create it.
        infoDiv = document.createElement("div");
        infoDiv.id = name;
        document.body.appendChild(infoDiv);
    } else {
        // Element exists. Lets get it by ID.
        infoDiv = document.getElementById(name);
    }
    infoDiv.innerHTML = 'Morphology features extracted from image analysis of histology whole slide images for '
        + '<strong>' + data.length + ' ' + tumor + '</strong> Patients of The Cancer Genome Atlas.<br>'
        + 'Genomic data compiled with <a href="http://www.cbioportal.org/" target="_blank">MSKCC cBioPortal</a> tool, demographic and clinical data from '
        + 'the <a href="https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/' + tumor1 + '/bcr/biotab/clin/" target="_blank">TCGA repository</a>.';

    /*
     // TODO:
     document.getElementById('patientInfo').innerHTML = 'Morphology features extracted from image analysis of histology whole slide images for '
     + data.length + ' ' + tumor + ' Patients of The Cancer Genome Atlas.';

     document.getElementById('repositoryInfo').innerHTML = 'Genomic data compiled with <a href="http://www.cbioportal.org/" target="_blank">MSKCC cBioPortal</a> tool, demographic and clinical data from '
     + 'the <a href="https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/' + tumor1 + '/bcr/biotab/clin/" target="_blank">TCGA repository</a>.';
     */

}

function checkNames(propertyNames, thingToCheckAgainst) {
    // We would like to show these parameters
    var newArr = [];

    // Check to see if they exist in our data
    thingToCheckAgainst.forEach(function (mpp) {
        if (propertyNames.indexOf(mpp) > -1) {
            newArr.push(mpp);
        }

    });

    return newArr;

}

var features = ["PrincipalMoments0_median",
    "PrincipalMoments1_median",
    "Elongation_median",
    "Perimeter_median",
    "Roundness_median",
    "EquivalentSphericalRadius_median",
    "EquivalentSphericalPerimeter_median",
    "EquivalentEllipsoidDiameter0_median",
    "EquivalentEllipsoidDiameter1_median",
    "Flatness_median",
    "meanR_median",
    "meanG_median",
    "meanB_median",
    "stdR_median",
    "stdG_median",
    "stdB_median",
    "SizeInPixels_median",
    "age_at_initial_pathologic_diagnosis",

    "LLH_Min_Intensity_0_T1c",
    "LHL_Kurtosis_0_T1c",
    "LLH_Range_0_T1c",
    "Skewness_1_T1",
    "Kurtosis_1_T1",
    "LLL_Kurtosis_1_T1",
    "LLL_Skewness_1_T1",
    "Skewness_1_T1c",
    "Kurtosis_1_T1c",
    "LLL_Kurtosis_1_T1c",
    "LLL_Skewness_1_T1c",
    "LHL_Kurtosis_1_T1c",
    "LHL_Min_Intensity_3_T1",
    "LHL_Variance_3_T1",
    "LHL_Range_3_T1",
    "LLH_Min_Intensity_4_T1c",
    "Variance_4_T1c",
    "LLL_Variance_4_T1c",
    "LLL_Std_Deviation_4_T1c",
    "edemaRatio_4_T2",

    //"gender", // remove gender for now per M. Saltz 2016-06-06
    "days_to_last_followup"];

var genomic = ["EGFR",
    "KRAS",
    "STK11",
    "TP53",
    "NF1",
    "BRAF",
    "SETD2"];
