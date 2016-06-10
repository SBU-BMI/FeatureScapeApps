/**
 * Display a tabular list of tissue slides for a given cancer type ("project").
 * Table will include:
 * 1) Link to caMicroscope where user can view whole slide image
 * 2) Link to cBioPortal
 * 3) Button to view features of that slide in FeatureScape
 * User may select different projects from dropdown selection.
 */
$(function () {

    selection = {};
    select = document.getElementById('select');
    select.innerHTML = abcUtil.selectBox({}, selection);
    getData();

    tumorChanged = function (evt) {
        var opt = evt.selectedOptions[0].value;
        var partsOfStr = opt.split(',');

        selection.cancer_type = partsOfStr[0];
        selection.db = partsOfStr[1];
        selection.execution_id = partsOfStr[2];

        getData();
    };

});

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

function buildUI(dataDivId, data) { // build User Interface

    var dataDiv = document.getElementById(dataDivId);
    dataDiv.innerHTML = '<h4>' + data.length + ' ' + (selection.cancer_type).toUpperCase() + ' Diagnostic Images:</h4>';

    var tbl = document.createElement('table');
    tbl.className = "table table-striped";
    tbl.style = "width: auto;";
    dataDiv.appendChild(tbl);
    var tbody = document.createElement('tbody');
    tbl.appendChild(tbody);
    var row = document.createElement('tr');
    tbody.appendChild(row);
    var col = document.createElement('td');
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


    data.forEach(function (c) {

        tissueId = c.image.case_id;

        row = document.createElement('tr');
        tbody.appendChild(row);

        // caMicro
        var link = document.createElement('a');
        link.setAttribute("href",
            abcUtil.caMicroLink(tissueId, selection.cancer_type));
        link.setAttribute("target", "_blank");
        link.innerHTML = tissueId + "";

        col = document.createElement('td');
        col.appendChild(link);
        row.appendChild(col);

        // cBio
        // eg. http://www.cbioportal.org/case.do?cancer_study_id=luad_tcga&case_id=TCGA-05-4395
        link = document.createElement('a');
        link.setAttribute("href",
            'http://www.cbioportal.org/case.do?cancer_study_id='
            + c.provenance.study_id
            + '_tcga&case_id=' + c.image.subject_id);
        link.setAttribute("target", "_blank");
        link.style.color = 'red';
        link.innerHTML = 'cbio';

        col = document.createElement('td');
        col.appendChild(link);
        row.appendChild(col);

        // FeatureScape
        var btFeature = document.createElement('button');
        col = document.createElement('td');
        col.appendChild(btFeature);
        btFeature.textContent = "FeatureScape";
        btFeature.style.color = "blue";

        btFeature.onclick = function () {
            var sz = 1000;
            var v = abcUtil.randval();
            var url = config.domain + '/featurescape/?' +
                config.findAPI + ':' + config.port + '?limit=' + sz + '&find={"randval":{"$gte":' + v
                + '},"provenance.analysis.execution_id":"' + selection.execution_id
                + '","provenance.image.case_id":"' + tissueId
                + '"}&db=' + selection.db + '&c=' + selection.cancer_type;
            window.open(url);

        };
        row.appendChild(col);
    })

}
