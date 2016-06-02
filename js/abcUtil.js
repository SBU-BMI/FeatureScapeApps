/**
 * Created by tdiprima on 6/1/16.
 * abcUtil.js: A container for utility stuff.
 */
abcUtil = {

    selectBox: function (trace, globalObject) {

        if (jQuery.isEmptyObject(trace)) {
            trace = {
                url: config.findAPI + ':' + config.port + '/?limit=12&collection=metadata&find={}&db=u24_meta',
                id: 'selectTumor',
                onchange: 'tumorChanged(this)',
                font_color: 'navy',
                bg_color: 'silver',
                font_size: 'large',
                text: 'Select',
                selected: 'luad'
            };
        }

        // Dropdown menu
        var selectTumorHTML = '<h3 style="color:' + trace.font_color + '">';
        selectTumorHTML += trace.text
            + ': <select onchange="' + trace.onchange
            + '" style="font-color:' + trace.font_color
            + ';background-color:' + trace.bg_color
            + ';font-size:' + trace.font_size + '" id="' + trace.id + '">';

        $.ajax({
            url: trace.url,
            async: false,
            dataType: 'json',
            success: function (arr) {
                arr.forEach(function (item) {
                    var tm = item.cancer_type;
                    var value = tm + ',' + item.db + ',' + item.execution_id;
                    var attr = '';

                    if (!globalObject.cancer_type) {
                        if (tm === trace.selected) {
                            globalObject.db = item.db;
                            globalObject.execution_id = item.execution_id;
                            globalObject.cancer_type = item.cancer_type;
                            attr = 'selected';
                        }
                    }

                    /*
                     selectTumorHTML += '<option disabled>execution_id ' + item.execution_id + '</option>';
                     selectTumorHTML += '<option value="' + value + '" ' + attr + '>&nbsp;&nbsp;'
                     + tm.toUpperCase() + ' - ' + item.name + '</option>';
                     */

                    selectTumorHTML += '<option value="' + value + '" ' + attr + '>'
                        + tm.toUpperCase() + ' - ' + item.name + ' - ' + item.execution_id + '</option>';

                });
            }
        });

        selectTumorHTML += "</select>";
        selectTumorHTML += "</h3>";
        return selectTumorHTML;
    },

    listDxSlides: function (pp, data) {
        // check DxImages available already
        //if (!openHealth.tcga.dt[xxxDx]) {
        if (!data) {

            var url = config.findAPI + ':' + config.port + '/?limit=1000&collection=metadata&find={"provenance.analysis_execution_id":"' + selectObject.execution_id + '"}&project={"_id":0,"image.subject_id":1,"image.case_id":1}&db=' + selectObject.db;
            console.log(url);

            $.ajax({
                url: url,
                async: false,
                dataType: 'json',
                success: function (arr) {

                    var a = [];
                    arr.forEach(function (item) {
                        var b = {};
                        b.patientid = item.image.subject_id;
                        b.caseid = item.image.case_id;
                        a.push(b);

                    });

                    var y = {}; // index of diagnostic images per patient
                    a.map(function (xi) {
                        if (!y[xi.patientid]) {
                            y[xi.patientid] = [xi.caseid]
                        } else {
                            y[xi.patientid].push(xi.caseid)
                        }

                    });

                    // SUBJECT ID: CASE IDs
                    data = y;
                    //openHealth.tcga.dt[xxxDx] = y;
                    abcUtil.listDxSlides(pp, data)
                }
            });

        } else {
            var pp0 = pp.filter(function (pi) {
                //return openHealth.tcga.dt[xxxDx][pi]
                return data[pi];
            });
            pp = [];
            pp0.map(function (pi) {
                //pp = pp.concat(openHealth.tcga.dt[xxxDx][pi])
                pp = pp.concat(data[pi])
            });
            diagnosticImagesHeader.textContent = ' Diagnostic Images (' + pp.length + '):';
            diagnosticImages.innerHTML = ""; // clear

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

    },

    listSlides: function (R, S, P, data, patient, selectObject) {
        slideImages.parentNode.hidden = "true";
        var parm = '';

        if (R.gender.FEMALE.c + R.gender.MALE.c > R.section_location.BOTTOM.c + R.section_location.TOP.c) {
            parm = 'section_location'
        } else {
            parm = 'gender'
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

        // DATA REFERENCE
        var tw = 'https://tcga-data.nci.nih.gov/tcgafiles/ftp_auth/distro_ftpusers/anonymous/tumor/';
        document.getElementById('patientinfo').innerHTML = '<strong>Charts display clinical information from TCGA:</strong><br>'
            + '<a href="' + tw + openHealth.clinicalFile + '" target="_blank">' + tw + openHealth.clinicalFile + '</a><br>'
            + '<a href="' + tw + openHealth.biosFile + '" target="_blank">' + tw + openHealth.biosFile + '</a><br><br>'
            + '<strong><a href="#anchor">Slides</a></strong> '
            + 'for ' + pp.length + ' TCGA patients with ' + (selectObject.cancer_type).toUpperCase();

        resultsPatient = function (x) {

            buttonResults.innerHTML = '<pre>' + JSON.stringify(patient[x.textContent], null, 3) + '</pre>';

            var v = 0.95 * Math.random();
            var textContent = v.toString().slice(0, 5);
            var exec = '"provenance.analysis.execution_id":"' + selectObject.execution_id + '"';
            var find = '{"randval":{"$gte":' + textContent + '},' + exec + ',"provenance.image.subject_id":"' + patient[x.textContent]["bcr_patient_barcode"] + '"}&db=' + selectObject.db;
            // FEATURESCAPE
            var fscape = config.domain + '/featurescape/?' + config.findAPI + ':' + config.port + '/?limit=1000&find=' + find;

            // FIGURE4
            //bcr_patient_barcode: { $in: [<value1>, <value2>, ... <valueN> ] }
            var ppp = '';
            pp.forEach(function (p) {
                ppp += '"' + p + '",';

            });
            ppp = ppp.slice(0, -1);

            var fig4 = config.domain + '/featurescape/fig4.html#' + config.findAPI + ':' + config.port + '?collection=patients&limit=' + pp.length + '&find={"bcr_patient_barcode":{"$in":[' + ppp + ']}}&db=' + selectObject.db;

            moreInfo.innerHTML = ' <input id="fscapeButton" style="color:blue" type="button" value="feature landscape (if available) for ' + patient[x.textContent]["bcr_patient_barcode"] + '">&nbsp;&nbsp; <input id="fig4Button" style="color:indigo" type="button" value="fig4 (if available) for ' + pp.length + ' patients"><pre>' + JSON.stringify(patient[x.textContent], null, 3) + '</pre>';

            fscapeButton.onclick = function () {
                window.open(fscape)
            };

            fig4Button.onclick = function () {
                window.open(fig4)
            };

        };

        resultsSlide = function (x) {
            var d = openHealth.findOne(openHealth.tcga.dt[xxxDocs], 'bcr_slide_barcode', x.textContent);
            buttonResults.innerHTML = '<pre>' + JSON.stringify(d, null, 3) + '</pre>'
        };

        patientSlideTableBody.innerHTML = ""; // clear tbody
        pp.sort().forEach(function (p, i) {
            var pr = document.createElement('p');
            pr.innerHTML = ' ' + i + ') <button onclick="resultsPatient(this)">' + p + '</button> <a href="http://www.cbioportal.org/case.do?case_id=' + p + '&cancer_study_id=' + selectObject.cancer_type + '_tcga" target=_blank>cBio</a>... ';
            pr.id = "patient" + p;
            tcgaPatients.appendChild(pr);
            var tr = document.createElement('tr');
            tr.id = 'tr_' + p;
            tr.innerHTML = '<td id="tdPatient_' + p + '" style="vertical-align:top">' + i + ') <button onclick="resultsPatient(this)">' + p + '</button>(<a href="http://www.cbioportal.org/case.do?case_id=' + p + '&cancer_study_id=' + selectObject.cancer_type + '_tcga" target=_blank>cBio</a>)</td><td id="dxSlide_' + p + '" style="vertical-align:top;font-size:12"></td>';
            patientSlideTableBody.appendChild(tr);

        });

        ss.sort().forEach(function (s, i) {
            var pr = document.createElement('p');
            pr.innerHTML = ' ' + i + ') <button onclick="resultsSlide(this)">' + s + '</button> <a href="' + config.quipUrl + '?tissueId=' + s + '" target=_blank> caMicroscope </a>.';
            slideImages.appendChild(pr)
        });

        abcUtil.listDxSlides(pp, data)
    }

};
