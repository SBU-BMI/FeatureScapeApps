/**
 * Display a tabular list of tissue slides for a given cancer type ("project").
 * Table will include:
 * 1) Link to caMicroscope where user can view whole slide image
 * 2) Link to cBioPortal
 * 3) Button to view features of that slide in FeatureScape
 * User may select different projects from dropdown selection.
 */
var selection, tumorChanged;

function buildUI(dataDivId, data) { // build User Interface

    var dataDiv, tbl, tbody, row, col;

    dataDiv = document.getElementById(dataDivId);
    dataDiv.innerHTML = '<h4>' + data.length + ' ' + (selection.cancer_type).toUpperCase() + ' Diagnostic Images:</h4>';

    tbl = document.createElement('table');
    tbl.className = "table table-striped";
    tbl.style = "width: auto;";
    dataDiv.appendChild(tbl);

    tbody = document.createElement('tbody');
    tbl.appendChild(tbody);

    row = document.createElement('tr');
    tbody.appendChild(row);

    col = document.createElement('td');
    col.innerHTML = 'caMicroscope';
    col.style.fontWeight = "bold";
    row.appendChild(col);

    col = document.createElement('td');
    col.innerHTML = 'cBioPortal';
    col.style.fontWeight = "bold";
    row.appendChild(col);

    col = document.createElement('td');
    col.innerHTML = 'FeatureScape of sampled features';
    col.style.fontWeight = "bold";
    row.appendChild(col);

    data.forEach(function (d) {

        var tissueId, btFeature, size, randval, fscapeUrl, link, dRow, dCol;
        tissueId = d.image.case_id;

        dRow = document.createElement('tr');
        tbody.appendChild(dRow);

        // caMicro
        link = document.createElement('a');
        link.setAttribute("href",
            abcUtil.caMicroLink(tissueId, selection.cancer_type));
        link.setAttribute("target", "_blank");
        link.innerHTML = tissueId;

        dCol = document.createElement('td');
        dCol.appendChild(link);
        dRow.appendChild(dCol);

        // cBio
        // eg. http://www.cbioportal.org/case.do?cancer_study_id=luad_tcga&case_id=TCGA-05-4395
        link = document.createElement('a');
        link.setAttribute("href",
            'http://www.cbioportal.org/case.do?cancer_study_id='
            + d.provenance.study_id
            + '_tcga&case_id=' + d.image.subject_id);
        link.setAttribute("target", "_blank");
        link.style.color = 'red';
        link.innerHTML = 'cbio';

        dCol = document.createElement('td');
        dCol.appendChild(link);
        dRow.appendChild(dCol);

        // FeatureScape
        btFeature = document.createElement('button');
        dCol = document.createElement('td');
        dCol.appendChild(btFeature);
        btFeature.textContent = "FeatureScape";
        btFeature.style.color = "blue";

        btFeature.onclick = function () {
            size = 1000;
            randval = abcUtil.randval();
            fscapeUrl = config.domain + '/featurescape/?' +
                config.findAPI + ':' + config.port + '?limit=' + size + '&find={"randval":{"$gte":' + randval
                + '},"provenance.analysis.execution_id":"' + selection.execution_id
                + '","provenance.image.case_id":"' + tissueId
                + '"}&db=' + selection.db + '&c=' + selection.cancer_type;
            window.open(fscapeUrl);

        };
        dRow.appendChild(dCol);
    });

}

function getData() {
    var url = config.findAPI + ':' + config.port
        + '/?limit=50&collection=metadata&find={"provenance.analysis_execution_id":"'
        + selection.execution_id + '"}&db='
        + selection.db;
    console.log('selection', selection);
    console.log('url', url);

    $.ajax({
        url: url,
        async: false,
        dataType: 'json',
        success: function (json) {
            buildUI('section', json);
        }
    });

}

$(function () {

    selection = {};
    document.getElementById('select').innerHTML = abcUtil.selectBox({}, selection);
    getData();

    tumorChanged = function (evt) {
        var opt = evt.selectedOptions[0].value,
            partsOfStr = opt.split(',');

        selection.cancer_type = partsOfStr[0];
        selection.db = partsOfStr[1];
        selection.execution_id = partsOfStr[2];

        getData();
    };

});


