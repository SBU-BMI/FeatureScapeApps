console.log('u24Preview.js loaded');


u24p = function () {
    // ini
    u24p.buildUI('u24PreviewDiv')

};


u24p.buildUI = function (id) { // build User Interface
    var div = document.getElementById(id);
    div.innerHTML = '<h3> preview Case IDs</h3>';
    var ol = document.createElement('ol');
    div.appendChild(ol);
    u24p.cases.forEach(function (c) {
        c = c.image.caseid;
        var li = document.createElement('li');
        ol.appendChild(li);
        li.innerHTML = '<a href="' + config.quipUrl + '?tissueId=' + c + '" target="_blank">' + c + '</a>, (<a href="http://www.cbioportal.org/case.do?cancer_study_id=luad_tcga&case_id=' + c.slice(0, 12) + '" target="_blank" style="color:red">cbio</a>) random seed:';
        var sp = document.createElement('span');
        li.appendChild(sp);
        //http://www.cbioportal.org/case.do?cancer_study_id=luad_tcga&case_id=TCGA-05-4395
        var v = 0.95 * Math.random();
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
            var v = 0.95 * Math.random();
            sp.textContent = v.toString().slice(0, 5);
            sp.style.color = 'rgb(' + Math.round(255 * v) + ',' + Math.round(255 * (1 - v)) + ',0)'
        }, (1000 + Math.random() * 1000));
        btFeature.onclick = function () {
            var caseId = c;

            var sz = $('input', spSize)[0].value;

            var _static = '"provenance.analysis.execution_id":"' + u24p.anexid + '"';
            // Yes, we really do need absolute path for this url:
            var url = config.domain + '/featurescape/?' + u24p.findApi + '?limit=' + sz + '&find={"randval":{"$gte":' + sp.textContent + '},' + _static + ',"provenance.image.case_id":"' + caseId + '"}&db=' + u24p.db;
            window.open(url);

        }
    })

};


// ini
$(document).ready(function () {
    u24p.cases = [];
    u24p.findApi = config.findAPI + ':' + config.port + '/';
    u24p.anexid = config.default_execution_id;
    u24p.db = config.default_db;

    var url = u24p.findApi + '?limit=38&collection=metadata&find={"provenance.analysis_execution_id":"' + u24p.anexid + '"}&db=' + u24p.db;
    console.log(url);

    $.ajax({
        url: url,
        async: false,
        dataType: 'json',
        success: function (json) {
            u24p.cases = json;
            u24p();
        }
    });
});
