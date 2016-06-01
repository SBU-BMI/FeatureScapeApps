/**
 * Created by tdiprima.
 */

mugshots = function () {
    log('location: ' + location);
    var url = '';
    var hash = '';
    if (location.hash.length > 1) {
        hash = location.hash.slice(1);

        mugshots.n = getQueryVariable('n', hash);
        mugshots.m = getQueryVariable('m', hash);

        thisisrandom = false;

        url = buildQueryString(hash);

    }
    else {
        // Default data url
        var rand = Math.random();
        var _static = '"provenance.analysis.execution_id":"' + config.default_execution_id + '"';
        mugshots.db = config.default_db;
        url = mugshots.findApi + '?collection=objects&limit=12&find={' + _static + ',"randval":{"$gte":' + rand + '}}&db=' + mugshots.db;
        log('*** Random nuclei were selected for you. ***');
        thisisrandom = true;
    }

    mugshotLog.textContent = 'loading, please wait ...';
    mugshotLog.style.color = 'red';

    log('url: ' + url);
    mugshots.loadData(url);
};

function buildQueryString(q) {

    var caseid = getQueryVariable('caseid', q);
    var subjectid = getQueryVariable('subjectid', q);
    var fx = getQueryVariable('fx', q);
    var xmin = getQueryVariable('xmin', q);
    var xmax = getQueryVariable('xmax', q);
    var fy = getQueryVariable('fy', q);
    var ymin = getQueryVariable('ymin', q);
    var ymax = getQueryVariable('ymax', q);
    var db = getQueryVariable('db', q);

    mugshots.db = db;

    // Remember it stops at '='
    // https://falcon.bmi.stonybrook.edu:4500/?limit
    var base = getQueryVariable('url', q);
    // Resample 50 (performance reasons); we're only rendering 12.
    base = base + '=50';

    // "find1: {"randval":{"$gte":0.399},"provenance.analysis.execution_id":"luad:20160215","provenance.image.case_id":"TCGA-05-4244-01Z-00-DX1"}"
    var find = getQueryVariable('find', q);
    // remove the last '}'
    find = find.substring(0, find.length - 1);

    // Build our "find"
    var range_a = '"$and":[{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fx + '",' + '"value":{' + '"$gte":' + xmin + '}}}}}},{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fx + '",' + '"value":{' + '"$lte":' + xmax + '}}}}}}]';
    var range_b = '"$and":[{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fy + '",' + '"value":{' + '"$gte":' + ymin + '}}}}}},{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fy + '",' + '"value":{' + '"$lte":' + ymax + '}}}}}}]';

    var myUrl = base + '&find=' + find + ',"$and":[{' + range_a + '},{' + range_b + '}]}';

    if (db) {
        myUrl = myUrl + '&db=' + db;
    }

    return myUrl;

}

function getQueryVariable(variable, queryString) {
    var vars = queryString.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

mugshots.loadData = function (url) {
    /*
     $.getJSON(url)
     .done(function (data) {
     //log("Got JSON Data");
     //document.write(JSON.stringify(data));
     mugshots.draw('mugshotDiv', data);

     })
     .error(function (jqXHR, textStatus, error) {
     //log('jqXHR.responseText: ' + jqXHR.responseText);
     var err = textStatus + ", " + error;
     //log("Request Failed: " + err);
     });
     // .fail in jQuery 1.8
     */
    $.ajax({
        url: url,
        async: true,
        dataType: 'json',
        success: function (json) {
            mugshots.draw('mugshotDiv', json);
        }
    });
};

function getRandomSubarrayPartialShuffle(arr, size) {
    var shuffled = arr.slice(0),
        i = arr.length,
        min = i - size,
        temp,
        index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

mugshots.fun = function (data, size) {
    var newData = [];

    var randomMembers = getRandomSubarrayPartialShuffle(data, size);
    //log(randomMembers);

    var sameCaseId = true;
    var prevCaseId = '';
    randomMembers.forEach(function (doc) {

        if (prevCaseId != '' && prevCaseId != doc.provenance.image.case_id) {
            sameCaseId = false;
        }
        prevCaseId = doc.provenance.image.case_id;
    });

    var identifier = '';
    var slideWidth = 0;
    var slideHeight = 0;

    if (sameCaseId) {
        var url = mugshots.findApi + '?collection=' + config.imgcoll + '&limit=1&find={"case_id":"' + prevCaseId + '"}&db=' + mugshots.db;

        $.ajax({
            url: url,
            async: false,
            dataType: 'json',
            success: function (json) {
                identifier = json[0].filename;
                slideWidth = json[0].width;
                slideHeight = json[0].height;
            }
        });

    }

    var h = '';
    randomMembers.forEach(function (doc) {
        var url = mugshots.findApi + '?collection=' + config.imgcoll + '&limit=1&find={"case_id":"' + doc.provenance.image.case_id + '"}&db=' + mugshots.db;
        h += doc.provenance.image.case_id + '<br>';
        //log(' *** ' + url);

        if (!sameCaseId) {
            $.ajax({
                url: url,
                async: false,
                dataType: 'json',
                success: function (json) {
                    identifier = json[0].filename;
                    slideWidth = json[0].width;
                    slideHeight = json[0].height;
                }
            });

        }

        newData.push({
            markup: doc.bbox,
            normalized: doc.normalized,
            caseid: doc.provenance.image.case_id,
            identifier: identifier,
            slideWidth: slideWidth,
            slideHeight: slideHeight
        })
    });

    var div = document.getElementById('patientInfo');
    if (thisisrandom) {
        div.innerHTML = 'Displaying ' + newData.length + ' nuclear images from random caseIDs:<br>' + h;
    }
    else {
        var fx = getQueryVariable('fx', location.hash);
        var xmin = getQueryVariable('xmin', location.hash);
        var xmax = getQueryVariable('xmax', location.hash);
        var fy = getQueryVariable('fy', location.hash);
        var ymin = getQueryVariable('ymin', location.hash);
        var ymax = getQueryVariable('ymax', location.hash);
        div.innerHTML = 'Displaying ' + newData.length + ' nuclear images having morphologic ranges selected from caseID <strong>' + prevCaseId + '</strong>:<br>'
            + fx + ' between ' + xmin + ' and ' + xmax + '<br>'
            + fy + ' between ' + ymin + ' and ' + ymax;

    }

    return newData;

};

mugshots.draw = function (targetDiv, data, layout) {

    if (!layout) {
        layout = {
            title: 'Nuclei Mugshots',
            rows: 3,
            columns: 4
        };
    }

    //m rows and n columns
    if (!mugshots.m) {
        mugshots.m = layout.rows;
    }
    if (!mugshots.n) {
        mugshots.n = layout.columns;
    }
    size = mugshots.m * mugshots.n;


    if (!document.getElementById(targetDiv)) {
        $('<hr><div id="' + targetDiv + '"></div>').appendTo(document.body);
    }


    if (!data) {
        document.getElementById(targetDiv).innerHTML = 'Alright now... you need to give me some data in order to get some nuclei!';
        return false;
    }
    else {
        data = mugshots.fun(data, size);

    }

    var div = document.getElementById(targetDiv);

    var k = 0, tableRows = mugshots.m,
        tds = mugshots.n,
        fragment = document.createDocumentFragment();

    var tbl = document.createElement('table');
    fragment.appendChild(tbl);

    var ind = 0;
    for (var i = 0; i < tableRows; i++) {
        //str += '<tr>';
        var row = document.createElement('tr');
        tbl.appendChild(row);

        for (var j = 0; j < tds; j++) {
            //log(ind + ': ' + JSON.stringify(data[ind]));

            var obj = {
                x: data[ind].markup[0],
                y: data[ind].markup[1],
                w: (data[ind].markup[2] - data[ind].markup[0]),
                h: (data[ind].markup[3] - data[ind].markup[1])
            };

            var normalized = data[ind].normalized;
            if (normalized === 'true') {
                obj.x = obj.x * data[ind].slideWidth;
                obj.y = obj.y * data[ind].slideHeight;
                obj.w = obj.w * data[ind].slideWidth;
                obj.h = obj.h * data[ind].slideHeight;
            }

            // IIIF wants whole numbers.
            obj.x = Math.round(obj.x);
            obj.y = Math.round(obj.y);
            obj.w = Math.round(obj.w);
            obj.h = Math.round(obj.h);

            // IIIF Image Request URI Syntax
            // TODO: server = 'quip1.uhmc.sunysb.edu'
            var scheme = 'http',
                server = 'quip.bmi.stonybrook.edu',
                prefix = 'fastcgi-bin/iipsrv.fcgi?iiif=',
                region = '',
                size = 'full',
                rotation = '0',
                quality = 'default',
                format = 'jpg';

            var quipUrl = config.quipUrl + '?tissueId=';

            var canvas = document.createElement('canvas');
            canvas.width = 150;
            canvas.height = 150;

            // Expand bounding box, with nucleus in center
            var w = (canvas.width / 2),
                h = (canvas.height / 2);

            var new_x = ((obj.x + (obj.w / 2)) - w),
                new_y = ((obj.y + (obj.h / 2)) - h);

            region = new_x + "," + new_y + "," + canvas.width + "," + canvas.height;

            var uri = scheme + "://" + server + "/" + prefix + data[ind].identifier + "/" + region + "/" + size + "/" + rotation + "/" + quality + "." + format;

            var link = document.createElement('a');
            link.setAttribute("href", quipUrl + data[ind].caseid + "&x=" + obj.x + "&y=" + obj.y);
            link.setAttribute("target", "_blank");
            var col = document.createElement('td');

            canvas.setAttribute('id', 'canvas' + j);
            link.appendChild(canvas);
            col.appendChild(link);
            var context = canvas.getContext("2d");

            var imgSrc = uri;

            context.clearRect(0, 0, canvas.width, canvas.height);
            drawBackground(canvas, context, imgSrc, obj);
            row.appendChild(col);

            ind = ind + 1;
        }
    }


    // Write the table to the html div.
    div.appendChild(fragment);

    // Clear hash.
    location.hash = '';

    // And finally...
    mugshotLog.textContent = 'Click on any patch to go to the location in caMicroscope, to view it in the context of the whole slide image.';
    mugshotLog.style.color = 'blue';

};

function drawBackground(canvas, context, imgSrc, obj) {

    var imagePaper = new Image();

    imagePaper.onload = function () {
        context.drawImage(imagePaper, 0, 0);
        drawLines(canvas, context, obj);
    };
    imagePaper.src = imgSrc;
}

function drawLines(canvas, context, obj) {
    var x = (canvas.width / 2),
        y = (canvas.height / 2);

    var new_x = (x - (obj.w / 2)),
        new_y = (y - (obj.h / 2));

    // yellow rectangle
    context.beginPath();
    context.lineWidth = "2";
    context.strokeStyle = "yellow";
    context.rect(new_x, new_y, obj.w, obj.h);
    context.stroke();
}

// ini
$(document).ready(function () {
    mugshots.findApi = config.findAPI + ':' + config.port + '/';
    mugshots();
});
