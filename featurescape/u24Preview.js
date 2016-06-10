$(function () {

    selected = {};
    select = document.getElementById('select');
    select.innerHTML = abcUtil.selectBox({}, selected);
    getData();

    tumorChanged = function (evt) {
        var opt = evt.selectedOptions[0].value;
        var partsOfStr = opt.split(',');

        selected.cancer_type = partsOfStr[0];
        selected.db = partsOfStr[1];
        selected.execution_id = partsOfStr[2];

        getData();
    };

});

function getData() {
    var url = config.findAPI + ':' + config.port
        + '/?limit=50&collection=metadata&find={"provenance.analysis_execution_id":"'
        + selected.execution_id + '"}&db='
        + selected.db;
    console.log('selected', selected);
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
    dataDiv.innerHTML = '<h4>' + data.length + ' ' + (selected.cancer_type).toUpperCase() + ' Diagnostic Images:</h4>';

    var tbl = document.createElement('table');
    tbl.cellPadding = "10";
    dataDiv.appendChild(tbl);

    data.forEach(function (c) {

        tissueId = c.image.case_id;

        var row = document.createElement('tr');
        tbl.appendChild(row);

        // caMicro
        var link = document.createElement('a');
        link.setAttribute("href",
            abcUtil.caMicroLink(tissueId, selected.cancer_type));
        link.setAttribute("target", "_blank");
        link.innerHTML = tissueId + "&nbsp;&nbsp;";

        var col = document.createElement('td');
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
        link.innerHTML = 'cbio&nbsp;&nbsp;';

        col = document.createElement('td');
        col.appendChild(link);
        row.appendChild(col);

        // FeatureScape
        var btFeature = document.createElement('button');
        col = document.createElement('td');
        col.appendChild(btFeature);
        btFeature.textContent = "FeatureScape of sampled features";
        btFeature.style.color = "blue";

        btFeature.onclick = function () {
            var sz = 1000;
            var v = abcUtil.randval();
            var url = config.domain + '/featurescape/?' +
                config.findAPI + ':' + config.port + '?limit=' + sz + '&find={"randval":{"$gte":' + v
                + '},"provenance.analysis.execution_id":"' + selected.execution_id
                + '","provenance.image.case_id":"' + tissueId
                + '"}&db=' + selected.db + '&c=' + selected.cancer_type;
            window.open(url);

        };
        row.appendChild(col);
    })

}
