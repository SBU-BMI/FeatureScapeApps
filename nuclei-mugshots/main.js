/**
 * Nuclei Mugshots.
 */
$(function () {

    mugshots = {};
    mugshots.findApi = config.findAPI + ':' + config.port + '/';
    selectObject = trace = {};
    select = document.getElementById('select');
    select.innerHTML = abcUtil.selectBox(trace, selectObject);

    tumorChanged = function (evt) {
        thisisrandom = true;
        var opt = evt.selectedOptions[0].value;
        var partsOfStr = opt.split(',');

        selectObject.cancer_type = partsOfStr[0];
        selectObject.db = partsOfStr[1];
        selectObject.execution_id = partsOfStr[2];

        url = buildQueryStr(selectObject.db, selectObject.execution_id);

        getData(url);
    };

    url = '';
    docs = [];
    if (location.hash.length > 1) {
        hash = location.hash.slice(1);
        thisisrandom = false;
        mugshots.n = abcUtil.getQueryVariable('n', hash);
        mugshots.m = abcUtil.getQueryVariable('m', hash);
        url = buildQueryString(hash);
    }
    else {
        // Default
        thisisrandom = true;
        url = buildQueryStr(config.default_db, config.default_execution_id);
    }
    getData(url);

});

function buildQueryStr(db, exec) {
    var rand = abcUtil.randval();
    mugshots.db = db;
    url = mugshots.findApi + '?collection=objects&limit=12&find={"provenance.analysis.execution_id":"' + exec + '","randval":{"$gte":' + rand + '}}&db=' + mugshots.db;

    return url;
}

function buildQueryString(q) {

    var case_id = abcUtil.getQueryVariable('case_id', q);
    var subject_id = abcUtil.getQueryVariable('subject_id', q);
    var fx = abcUtil.getQueryVariable('fx', q);
    var xmin = abcUtil.getQueryVariable('xmin', q);
    var xmax = abcUtil.getQueryVariable('xmax', q);
    var fy = abcUtil.getQueryVariable('fy', q);
    var ymin = abcUtil.getQueryVariable('ymin', q);
    var ymax = abcUtil.getQueryVariable('ymax', q);
    var db = abcUtil.getQueryVariable('db', q);

    mugshots.db = db;

    // Remember it stops at '='
    // https://falcon.bmi.stonybrook.edu:4500/?limit
    var base = abcUtil.getQueryVariable('url', q);
    // Resample 50 (performance reasons); we're only rendering 12.
    base = base + '=50';

    // "find1: {"randval":{"$gte":0.399},"provenance.analysis.execution_id":"luad:20160215","provenance.image.case_id":"TCGA-05-4244-01Z-00-DX1"}"
    var find = abcUtil.getQueryVariable('find', q);

    // TODO:
    var myUrl = '';
    /*
     if (!fx && !fy) {
     myUrl = base + '&find=' + find;

     if (db) {
     myUrl = myUrl + '&db=' + db;
     }
     }
     else {
     */
    // remove the last '}'
    find = find.substring(0, find.length - 1);

    // Build our "find"
    var range_a = '"$and":[{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fx + '",' + '"value":{' + '"$gte":' + xmin + '}}}}}},{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fx + '",' + '"value":{' + '"$lte":' + xmax + '}}}}}}]';
    var range_b = '"$and":[{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fy + '",' + '"value":{' + '"$gte":' + ymin + '}}}}}},{' + '"properties.scalar_features":{' + '"$elemMatch":{' + '"nv":{' + '"$elemMatch":{' + '"name":"' + fy + '",' + '"value":{' + '"$lte":' + ymax + '}}}}}}]';

    myUrl = base + '&find=' + find + ',"$and":[{' + range_a + '},{' + range_b + '}]}';

    if (db) {
        myUrl = myUrl + '&db=' + db;
    }

    //}

    return myUrl;

}

function getData(url) {

    doMessage('msg', document.body, 'loading, please wait ...', 'red');
    abcUtil.clrMsg('');
    slides_not_found = false;

    try {
        $.getJSON(url).then(function (data) {

            // Object (nuclei) data
            if (data.length == 0) {
                abcUtil.noDataJoy(url);
            }
            else {
                draw('section', data, url);
            }

        })
    }
    catch (err) {
        slides_not_found = true;
        document.getElementById("info1").innerHTML = err.message;
    }


}

function doMessage(name, location, text, color) {
    var div;
    if (!document.getElementById(name)) {
        // Element does not exist. Let's create it.
        div = document.createElement("div");
        div.id = name;
        location.appendChild(div);
    } else {
        // Element exists. Lets get it by ID.
        div = document.getElementById(name);
    }

    div.textContent = text;
    div.style.color = color;
}

function parseData(data, size, query) {
    var newData = [];

    var randomMembers = abcUtil.getRandomSubarrayPartialShuffle(data, size);
    //console.log(randomMembers);

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

    try {
        if (sameCaseId) {
            // Get info about the slide.
            var url = mugshots.findApi + '?collection=' + config.imgcoll + '&limit=1&find={"case_id":"' + prevCaseId + '"}&db=' + mugshots.db;

            $.ajax({
                url: url,
                async: false,
                dataType: 'json',
                success: function (json) {
                    if (json.length > 0) {
                        identifier = json[0].filename;
                        slideWidth = json[0].width;
                        slideHeight = json[0].height;

                    }
                    else {
                        slides_not_found = true;
                        return;
                    }
                }
            });

        }
    }
    catch (err) {
        slides_not_found = true;
        document.getElementById("info1").innerHTML = err.message;
    }

    var h = '';
    try {
        randomMembers.forEach(function (doc) {
            var url = mugshots.findApi + '?collection=' + config.imgcoll + '&limit=1&find={"case_id":"' + doc.provenance.image.case_id + '"}&db=' + mugshots.db;
            h += '<tr><td>' + doc.provenance.image.case_id + '</td></tr>';
            //console.log(' *** ' + url);

            if (!sameCaseId) {
                // Get info about the slide.
                $.ajax({
                    url: url,
                    async: false,
                    dataType: 'json',
                    success: function (json) {
                        if (json.length > 0) {
                            identifier = json[0].filename;
                            slideWidth = json[0].width;
                            slideHeight = json[0].height;

                        }
                        else {
                            slides_not_found = true;
                            return;
                        }
                    }
                });

            }

            newData.push({
                markup: doc.bbox,
                normalized: doc.normalized,
                case_id: doc.provenance.image.case_id,
                identifier: identifier,
                slideWidth: slideWidth,
                slideHeight: slideHeight
            })
        });
    } catch (err) {
        slides_not_found = true;
        document.getElementById("info1").innerHTML = err.message;
    }

    if (slides_not_found) {
        newData = null;
    }
    else {
        var div = document.getElementById('info1');
        if (thisisrandom) {

            div.innerHTML = 'Displaying ' + newData.length
                + ' nuclear images from random '
                + ((mugshots.db).substring(4)).toUpperCase()
                + ' <strong><a href="#anchor">Diagnostic Images</a></strong>.'
                + ' May represent either either a single or multiple cases.';

            //document.getElementById('ptslides').innerHTML = '<a name="anchor"></a><p><span style="color:maroon;font-weight:bold">Tissue slides:</span><table id="patientSlideTable" border="1">' + h + '</table></p>';
            abcUtil.doPatients(newData, 'case_id', query);

        }
        else {
            var l = location.hash.slice(1);
            var fx = abcUtil.getQueryVariable('fx', l);
            var xmin = abcUtil.getQueryVariable('xmin', l);
            var xmax = abcUtil.getQueryVariable('xmax', l);
            var fy = abcUtil.getQueryVariable('fy', l);
            var ymin = abcUtil.getQueryVariable('ymin', l);
            var ymax = abcUtil.getQueryVariable('ymax', l);

            var id = abcUtil.getQueryVariable('case_id', l);

            var parm = 'case_id';
            if (!id) {
                id = abcUtil.getQueryVariable('subject_id', l);
                parm = 'subject_id';
            }
            div.textContent = 'Displaying ' + newData.length + ' nuclear images having morphologic ranges selected from '
                + (parm == 'case_id' ? 'diagnostic image' : 'patient') + ' ' + id + ':';
            document.getElementById('info2').innerHTML =
                fx + ' between ' + xmin + ' and ' + xmax + '<br>' +
                fy + ' between ' + ymin + ' and ' + ymax;

        }
    }


    return newData;

}

function draw(targetDiv, data, query, layout) {


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
        data = parseData(data, size, query);

    }


    if (slides_not_found) {
        abcUtil.clrMsg('');
        doMessage('msg', document.body, 'We have no slides for ' + selectObject.cancer_type + ' now. Please check back later. Thank you! :)', 'red');
        //document.write('not found for ', JSON.stringify(selectObject));
    }
    else {
        var div = document.getElementById(targetDiv);
        doMessage('info', div, 'Click on any tile to go to the location in caMicroscope, to view the mugshot of interest in the context of the whole slide image.', 'blue');

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
                //console.log(ind + ': ' + JSON.stringify(data[ind]));

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
                    server = config.iiifServer,
                    prefix = config.iiifPrefix,
                    region = '',
                    size = 'full',
                    rotation = '0',
                    quality = 'default',
                    format = 'jpg';

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
                link.setAttribute("href",
                    abcUtil.caMicroLink(data[ind].case_id, (mugshots.db).substring(4), obj.x, obj.y));
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
        //location.hash = '';

        // And finally...
        doMessage('msg', document.body, '', 'red');

    }
}

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

