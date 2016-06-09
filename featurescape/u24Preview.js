console.log('u24Preview.js');

u24p = function () {
};

u24p.buildUI = function (dataOriginDivId, dataDivId, data) { // build User Interface

    //var dataOriginDiv = document.getElementById(dataOriginDivId);
    //dataOriginDiv.innerHTML = '<strong>' + data.length + ' ' + (selectObject.cancer_type).toUpperCase() + 'Diagnostic Images:</strong>';

    var dataDiv = document.getElementById(dataDivId);
    dataDiv.innerHTML = '<h4>' + data.length + ' ' + (selectObject.cancer_type).toUpperCase() + ' Diagnostic Images:</h4>';

    var ol = document.createElement('ol');
    dataDiv.appendChild(ol);

    data.forEach(function (c) {

        tissueId = c.image.case_id;

        var li = document.createElement('li');
        ol.appendChild(li);

        li.innerHTML = '<a href="' + abcUtil.caMicroLink(tissueId, selectObject.cancer_type) + '" target="_blank">' + tissueId + '</a>, '
            + '(<a href="http://www.cbioportal.org/case.do?cancer_study_id=' + c.provenance.study_id
            + '_tcga&case_id=' + c.image.subject_id + '" target="_blank" style="color:red">cbio</a>), ';

        // Note: TCGA's case_id parm actually refers to the patient ("subject"); not the case_id.
        // eg. http://www.cbioportal.org/case.do?cancer_study_id=luad_tcga&case_id=TCGA-05-4395

        var btFeature = document.createElement('button');
        li.appendChild(btFeature);
        btFeature.textContent = "FeatureScape of sampled features";
        btFeature.style.color = "blue";
        // TODO: class="btn btn-secondary"

        btFeature.onclick = function () {
            var sz = 1000;
            var v = abcUtil.randval();
            // Yes, we really do need absolute path for this url:
            var url = config.domain + '/featurescape/?' + config.findAPI + ':' + config.port + '?limit=' + sz + '&find={"randval":{"$gte":' + v + '},"provenance.analysis.execution_id":"' + selectObject.execution_id + '","provenance.image.case_id":"' + tissueId + '"}&db=' + selectObject.db;
            window.open(url);

        }
    })

};

function getData() {
    var url = config.findAPI + ':' + config.port + '/?limit=50&collection=metadata&find={"provenance.analysis_execution_id":"' + selectObject.execution_id + '"}&db=' + selectObject.db;
    console.log('selectObject', selectObject);
    console.log('url', url);

    $.ajax({
        url: url,
        async: false,
        dataType: 'json',
        success: function (json) {
            u24p.buildUI('info2', 'section', json);
        }
    });

}

$(function () {

    selectObject = trace = {};
    select = document.getElementById('select');
    select.innerHTML = abcUtil.selectBox(trace, selectObject);
    getData();

    tumorChanged = function (evt) {
        var opt = evt.selectedOptions[0].value;
        var partsOfStr = opt.split(',');

        selectObject.cancer_type = partsOfStr[0];
        selectObject.db = partsOfStr[1];
        selectObject.execution_id = partsOfStr[2];

        getData();
    };

});
