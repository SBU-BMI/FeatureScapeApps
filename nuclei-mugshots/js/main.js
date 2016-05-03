/**
 * Created by tdiprima.
 */
log('Hello from mugshots.js');

mugshots = function () {
    log('location: ' + location);
    var url = '';
    var hash = '';
    if (location.hash.length > 1) {
        hash = location.hash.slice(1);

        mugshots.n = getQueryVariable('n', hash);
        mugshots.m = getQueryVariable('m', hash);

        url = buildQueryString(hash);

    }
    else {
        // Default data url
        var rand = Math.random();

        var _static = config.quot + 'provenance.analysis.execution_id' + config.quot + ':' + config.quot + config.analysis_execution_id + config.quot;
        url = mugshots.findApi + "?collection=objects&limit=12&find={" + _static + ',' + config.quot + "randval" + config.quot + ":{" + config.quot + "$gte" + config.quot + ":" + rand + "}}";
        if (config.mongoUrl) {
            url = url + '&mongoUrl=' + config.mongoUrl;

        }
        log('*** Random nuclei were selected for you. ***');

    }

    log('url: ' + url);

    mugshots.loadData(url);
};

function buildQueryString(q) {

    var caseid = getQueryVariable('caseid', q);
    var fx = getQueryVariable('fx', q);
    var xmin = getQueryVariable('xmin', q);
    var xmax = getQueryVariable('xmax', q);
    var fy = getQueryVariable('fy', q);
    var ymin = getQueryVariable('ymin', q);
    var ymax = getQueryVariable('ymax', q);

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

    var range_a = config.quot + '$and' + config.quot + ':[{'
        + config.quot + 'properties.scalar_features' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'nv' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'name' + config.quot + ':' + config.quot + fx + config.quot + ','
        + config.quot + 'value' + config.quot + ':{'
        + config.quot + '$gte' + config.quot + ':' + xmin +
        '}}}}}},{'
        + config.quot + 'properties.scalar_features' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'nv' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'name' + config.quot + ':' + config.quot + fx + config.quot + ','
        + config.quot + 'value' + config.quot + ':{'
        + config.quot + '$lte' + config.quot + ':' + xmax +
        '}}}}}}]';

    var range_b = config.quot + '$and' + config.quot + ':[{'
        + config.quot + 'properties.scalar_features' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'nv' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'name' + config.quot + ':' + config.quot + fy + config.quot + ','
        + config.quot + 'value' + config.quot + ':{'
        + config.quot + '$gte' + config.quot + ':' + ymin +
        '}}}}}},{'
        + config.quot + 'properties.scalar_features' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'nv' + config.quot + ':{'
        + config.quot + '$elemMatch' + config.quot + ':{'
        + config.quot + 'name' + config.quot + ':' + config.quot + fy + config.quot + ','
        + config.quot + 'value' + config.quot + ':{'
        + config.quot + '$lte' + config.quot + ':' + ymax +
        '}}}}}}]';

    var myUrl = base + '&find=' + find + ',' + config.quot + '$and' + config.quot + ':[{' + range_a + '},{' + range_b + '}]}';
    if (config.mongoUrl) {
        myUrl = myUrl + '&mongoUrl=' + config.mongoUrl;

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
     log("Got JSON Data");
     //document.write(JSON.stringify(data));
     mugshots.draw('mugshotDiv', data);

     })
     .error(function (jqXHR, textStatus, error) {
     log('jqXHR.responseText: ' + jqXHR.responseText);
     var err = textStatus + ", " + error;
     log("Request Failed: " + err);
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
    log(randomMembers);

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
        var url = mugshots.findApi + '?collection=' + config.imgcoll + '&limit=1&find={' + config.quot + 'case_id' + config.quot + ':' + config.quot + prevCaseId + config.quot + '}';
        log(url);

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

    randomMembers.forEach(function (doc) {
        var url = mugshots.findApi + '?collection=' + config.imgcoll + '&limit=1&find={' + config.quot + 'case_id' + config.quot + ':' + config.quot + doc.provenance.image.case_id + config.quot + '}';

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

    // Clean hash.
    location.hash = '';

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
