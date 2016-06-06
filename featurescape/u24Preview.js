console.log('u24Preview.js');

u24p = function () {
};

u24p.buildUI = function (dataOriginDivId, dataDivId, data) { // build User Interface

    //var dataOriginDiv = document.getElementById(dataOriginDivId);
    //dataOriginDiv.innerHTML = '<strong>' + data.length + ' ' + (selectObject.cancer_type).toUpperCase() + 'Diagnostic Images.</strong>';

    var dataDiv = document.getElementById(dataDivId);
    dataDiv.innerHTML = '<strong>' + data.length + ' ' + (selectObject.cancer_type).toUpperCase() + ' diagnostic images.</strong>';

    var ol = document.createElement('ol');
    dataDiv.appendChild(ol);

    data.forEach(function (c) {

        tissueId = c.image.case_id;
        
        var li = document.createElement('li');
        ol.appendChild(li);
        li.innerHTML = '<a href="' + abcUtil.caMicroLink(tissueId, selectObject.cancer_type) + '" target="_blank">' + tissueId + '</a>, '
            + '(<a href="http://www.cbioportal.org/case.do?cancer_study_id=' + c.provenance.study_id
            + '_tcga&case_id=' + c.image.subject_id + '" target="_blank" style="color:red">cbio</a>) random seed:';
        // Note: TCGA's case_id parm actually refers to the patient ("subject"); not the case_id.
        // eg. http://www.cbioportal.org/case.do?cancer_study_id=luad_tcga&case_id=TCGA-05-4395

        var sp = document.createElement('span');
        li.appendChild(sp);

        var v = abcUtil.randval();
        sp.textContent = v.toString().slice(0, 5);
        sp.style.fontWeight = 'bold';
        var spSize = document.createElement('span');
        spSize.innerHTML = ', feature sample size:<input value=1000 size=5> ';
        li.appendChild(spSize);
        var btFeature = document.createElement('button');
        li.appendChild(btFeature);
        btFeature.textContent = "featurescape of sampled features";
        btFeature.style.color = "blue";
        var spMsg = document.createElement('span');
        spMsg.style.color = 'red';
        li.appendChild(spMsg);
        spSize.onkeyup = function (evt) {
            var ip = $('input', this)[0];
            var v = parseInt(ip.value);
            var msg = this.parentElement.children[this.parentElement.children.length - 1];
            if ((v >= 100) && (v <= 10000)) {
                ip.value = v;
                msg.textContent = ''
            } else {
                msg.textContent = ' sample size needs to be an integer between 100 and 10000'
            }
        };

        setInterval(function () {
            var v = abcUtil.randval();
            sp.textContent = v.toString().slice(0, 5);
            sp.style.color = 'rgb(' + Math.round(255 * v) + ',' + Math.round(255 * (1 - v)) + ',0)';
        }, (1000 + Math.random() * 1000));

        btFeature.onclick = function () {
            var sz = $('input', spSize)[0].value;
            // Yes, we really do need absolute path for this url:
            var url = config.domain + '/featurescape/?' + config.findAPI + ':' + config.port + '?limit=' + sz + '&find={"randval":{"$gte":' + sp.textContent + '},"provenance.analysis.execution_id":"' + selectObject.execution_id + '","provenance.image.case_id":"' + tissueId + '"}&db=' + selectObject.db;
            window.open(url);

        }
    })

};

function getData()
{
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
