fscape = function (x) {
    // being used to ini UI
    if ((!x) && (document.getElementById("section"))) {
        fscape.UI()
    } else if (x) { //creating an fscape grid instance
        return new fscape.grid(x)
    } else {
        console.log('no fscape UI')
    }
};

fscape.UI = function () {
    fscape.div = document.getElementById("section");
    selection = {};

    //  check for data URL
    var q = '';
    if (location.search.length > 1) {
        var ss = location.search.slice(1).split(';');
        q = ss[0];
    }
    else {
        // Default
        q = createQuery(config.default_db, config.default_execution_id);
    }
    fscape.loadURL(q);
};

fscape.loadURL = function (url) {
    log(url);
    msg.textContent = "loading, please wait ...";

    /*
     var greetings = ["loading, please wait ...", "--> loading, please wait ..."];
     msg.textContent = greetings[0];
     setTimeout(function () {
     msg.textContent = greetings[1];
     }, 4000);
     */

    localforage.getItem(url)
        .then(function (x) {
            if (!x) {
                $.getJSON(url).then(function (x) {
                    if (!fscape.dt) {
                        fscape.fun(x, url);
                        localforage.setItem(url, x)
                    }
                })
            } else {
                fscape.fun(x, url)
            }

        })
        .catch(function () {
            $.getJSON(url).then(function (x) {
                if (!fscape.dt) {
                    fscape.fun(x, url);
                    localforage.setItem(url, x)
                }
            })
        });

};

fscape.log = function (divID, txt, color) {
    var d = document.getElementById(divID);
    d.innerHTML = txt;
    d.style.color = ((!color) ? 'navy' : color);
};

fscape.cleanUI = function () { // and create fscapeAnalysisDiv

    if (!document.getElementById('fscapeAnalysisDiv')) {
        $('<div id="fscapeAnalysisDiv"></div>').appendTo(fscape.div);
        fscapeAnalysisDiv.hidden = true;
        $(fscapeAnalysisDiv).show(1000)
    } else {
        fscapeAnalysisDiv.textContent = ''
    }
};

fscape.fun = function (data, url) {
    //msg.textContent = '--> processing ...';

    if (data.length == 0) {

        document.getElementById('section').innerHTML = '<span style="color:red">Data not available for patient:</span><br>'
            + getPatient(url);
        msg.textContent = '';

    }
    else {

        selection.cancer_type = data[0].provenance.analysis.study_id;

        if (selection.cancer_type == null) {

            if (location.search.length > 1) {
                var hash = location.search.slice(1);
                selection.db = abcUtil.getQueryVariable('db', hash);
                selection.cancer_type = abcUtil.getQueryVariable('c', hash);
            }
            else {
                selection.cancer_type = 'unknown';
            }
        }

        // "VERSION 3"
        data = data.map(function (xi) {
            return xi.properties.scalar_features;
            //return xi.features;
        });

        var nv = [];
        data.forEach(function (item) {
            var JSONArray = item[0]["nv"];

            var features = {};
            JSONArray.forEach(function (item) {
                features[item.name] = item.value;
            });

            nv.push(features);
        });

        var xx = nv;
        msg.textContent = '';
        var p = getPatient(url);

        var text = ' Displaying <strong>' + xx.length + '</strong> sets of features sampled from <strong>'
            + (selection.cancer_type == 'unknown' ? '' : (selection.cancer_type).toUpperCase())
            + '</strong> '
            + (p.length > 12 ? 'diagnostic image ' : 'patient ')
            + '<strong>' + p + '</strong>';

        console.log('selection', JSON.stringify(selection));
        fscape.log('info1', text, 'black');

        fscape.cleanUI();

        fscape.plot(xx)
    }

};

fscape.clust2html = function (cl) {
    var ind = cl[0];
    var T = cl[1];
    var cmap = jmat.colormap().map(function (ci) {
        return ci.map(function (cij) {
            return Math.round(cij * 255)
        })
    });
/*
    var h = '<h4 style="color:maroon">Cross-tabulated feature correlations</h4>'
        + '<table id="featurecrossTB"><tr><td colspan="' + T.length + '" align="right"><em>(click on symbols for densities)</em></td></tr>';
    ind.forEach(function (i, j) {
        h += '<tr><td>' + fscape.dt.parmNum[i] + '</td>';
        T.forEach(function (c, k) {
            var x = Math.pow(c[j], 2); // E[0,1]
            if (isNaN(x)) {
                x = 1
            }
            var v = Math.round((1 - x) * 50);
            v = Math.min(v, 50);
            v = Math.max(v, 0);
            var cm = 'rgb(' + cmap[v].toString() + ')';
            h += '<td id="' + i + ',' + ind[k] + '" style="color: ' + cm + '; font-size: ' + (14 - 4 * c[j]) + 'px">O</td>';

        });
        h += '</tr>'
    });
    h += '</table><p id="featuremoreTD"></p>';
    */
    
    var h = '<h4 style="color:maroon">Cross-tabulated feature correlations</h4>'
    h +='<table id="featurecrossTB">';
    //header
    h += '<thead>'
        h +='<tr style="height:100px;vertical-align:bottom">'
            h +='<td style="color:navy">Variable</td>'
            ind.forEach(function(i,j){
                h +='<td><span><div class="textColVertical" style="width:12px;transform:rotate(-90deg);font-size:12px">'+fscape.dt.parmNum[i]+'</div></span></td>'
                4
            })
        h +='</tr>'
    h += '</thead>'
    //class="textColVertical"
    //style = document.createElement("style");
    //style.appendChild(document.createTextNode("")) // WebKit hack :(
    //document.head.appendChild(style);
    //style.insertRule("textColVertical {color:red}", 1);
    // body
    h += '<tbody>'
    ind.forEach(function (i, j) {
        h += '<tr><td>' + fscape.dt.parmNum[i] + '</td>';
        T.forEach(function (c, k) {
            var x = Math.pow(c[j], 2); // E[0,1]
            if (isNaN(x)) {
                x = 1
            }
            var v = Math.round((1 - x) * 50);
            v = Math.min(v, 50);
            v = Math.max(v, 0);
            var cm = 'rgb(' + cmap[v].toString() + ')';
            h += '<td id="' + i + ',' + ind[k] + '" style="color:' + cm + ';font-size:' + (14 - 4 * c[j]) + '">O</td>';
            //h+='<td style="color:rgb(255,">X</td>'
        });
        h += '</tr>'
    });
    h += '</tbody>'
    h += '</table><p id="featuremoreTD" style="color:blue">(click on symbols for densities)</p>&nbsp;<div id="featureNet">Similar neighbor network</div><div id="featureNetSlider"></div>';

    return h
};

// do it
fscape.plot = function (x) { // when ready to do it
    fscapeAnalysisDiv.innerHTML = '<table id="fscapeAnalysisTab">'
        + '<tr><td id="featurecrossTD" style="vertical-align:top"></td>'
        + '<td id="featuremapTD" style="vertical-align:top"></td></tr>'
        + '<tr><td id="featureElseTD" style="vertical-align:top"></td>'
        + '<td id="featurecompTD" style="vertical-align:top"></td></tr></table>'
        + '<div id="featurecomputeDIV"></div>';
    //fscapeAnalysisDiv
    if (x) { // otherwise expect the data already packed in fscape.dt
        fscape.dt = {
            docs: x,
            tab: {}
        };

        Object.getOwnPropertyNames(x[0]).forEach(function (p) {
            fscape.dt.tab[p] = x.map(function (xi) {
                return xi[p]
            })
        })
    }

    // featurecrossTD

    // numeric parameters
    var parmNum = Object.getOwnPropertyNames(fscape.dt.tab).filter(function (p) {
        return typeof(fscape.dt.docs[0][p]) == "number"
    });

    // cluster numeric parameters
    var xx = parmNum.map(function (p) {
        return fscape.dt.tab[p]
    });

    // make sure they're all numbers
    ij2remove = [];
    xx.forEach(function (xi, i) {
        xi.forEach(function (xij, j) {
            if (typeof(xij) != 'number') {
                console.log('non-numeric value at (' + i + ',' + j + '), ' + xij); //+' - the whole row will be removed:',xi)
                ij2remove.push(j)
            }

        })
    });

    ij2remove = jmat.unique(ij2remove).sort().reverse();

    ij2remove.forEach(function (i) {
        xx = xx.map(function (xi) {
            xi.splice(i, 1);
            return xi; // remove row i
        })
    });

    var cc = jmat.arrayfun(jmat.crosstab(xx), function (cij) {
        return 1 - Math.abs(cij)
    });

    cc.forEach(function (ci, i) {
        ci[i] = 0; // diagonal by definition
    });

    var cl = jmat.cluster(cc);  // remember this has three output arguments
    fscape.dt.cl = cl; // this may be better kept as a structure
    fscape.dt.parmNum = parmNum;

    featurecrossTD.innerHTML = "<label>Click to choose a different cancer type &amp; tissue slide image:&nbsp;"
        + '<input type="button" class="btn btn-secondary" onclick="window.location.href=\'u24Preview.html\'" name="btnSelect" id="btnSelect" value="Go!" />'
        + "</label><br><br>" + fscape.clust2html(cl);

    setTimeout(function () {
        var tdfun = function () {
            var ij = JSON.parse('[' + this.id + ']');
            if (ij.length > 0) {
                var i = ij[1], j = ij[0];
                var fi = fscape.dt.parmNum[i];
                var fj = fscape.dt.parmNum[j];
                if ($('#featuremapTD > table').length == 0) {
                    featuremapTD.innerHTML = 'zooming into <br>'
                        + '<li style="color:blue">' + fi + '</li>'
                        + '<li style="color:blue">' + fj + '</li>'
                        + '<span style="color:red">processing ...</red>'
                }
                // place an X on selection td, after clearing it all to "O"
                for (var tri = 0; tri < this.parentElement.parentElement.children.length; tri++) {
                    for (var tdj = 0; tdj < this.parentElement.parentElement.children[tri].children.length; tdj++) {
                        var txtC = this.parentElement.parentElement.children[tri].children[tdj];
                        if (txtC.textContent.length == 1) {
                            txtC.textContent = 'O'
                        }
                    }
                }

                this.textContent = "X";
                setTimeout(function () {
                    fscape.scatterPlot("featuremapTD", i, j);
                    //fscape.featuremap(i,j) // not a mistake, the axis need to be switched to fulfill right hand rule
                }, 0)
            }
        };

        var tdover = function (cut) {
            var ij = JSON.parse('[' + this.id + ']');
            if (ij.length > 0) {
                var i = ij[1], j = ij[0];
                var ind = fscape.dt.cl[0];
                var ii = ind.indexOf(i), jj = ind.indexOf(j);
                var fi = fscape.dt.parmNum[i];
                var fj = fscape.dt.parmNum[j];
                var cBack = JSON.parse('[' + this.style.color.slice(4, -1).split(', ') + ']').map(function (c) {
                    return 255 - c
                }).toString();

                featuremoreTD.innerHTML = '<p style="background-color: ' + this.style.color + '; font-size: 3px">'
                    + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>'
                    + '<p style="color:navy">Pearson correlation between '
                    + '<li style="color:navy">' + fi + ' </li>'
                    + '<li style="color:navy">' + fj + '</li> '
                    + '|corr(' + ii + ',' + jj + ')|= '
                    + jmat.toPrecision(1 - fscape.dt.cl[1][ii][jj])
                    + '</p><p style="background-color: ' + this.style.color + '; font-size: 3px">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>';

                $(this).tooltip()[0].title = '< ' + fi + ' , ' + fj + ' >';
            }
        };

        $('td', featurecrossTB).click(tdfun);
        $('td', featurecrossTB).mouseover(tdover);

        //featureNet.innerHTML='featureNet :-)'
        //setTimeout(function () {...}

        msg.textContent = '';

    }, 0);

};

// fscape.featuremap
fscape.featuremap = function (i, j) {
    // cross filter from hereon
    //cf = crossfilter(fscape.dt.docs)
    var ind = fscape.dt.cl[0];
    var ii = ind.indexOf(i), jj = ind.indexOf(j);
    var fi = fscape.dt.parmNum[i];
    var fj = fscape.dt.parmNum[j];

    if (!fscape.dt.dtmemb) { // if the data was not normalized already
        fscape.dt.dtmemb = {}; // distributions
        fscape.dt.parmNum.forEach(function (p) {
            fscape.dt.dtmemb[p] = jmat.memb(fscape.dt.tab[p])
        })
    }

    if (!fscape.dt.tabmemb) {
        fscape.dt.tabmemb = {}
    }

    if (!fscape.dt.tabmemb[fi]) {
        fscape.dt.tabmemb[fi] = jmat.memb(fscape.dt.tab[fi], fscape.dt.dtmemb[fi])
    }

    if (!fscape.dt.tabmemb[fj]) {
        fscape.dt.tabmemb[fj] = jmat.memb(fscape.dt.tab[fj], fscape.dt.dtmemb[fj])
    }

    //
    if ($('#featuremapTD > table').length == 0) { // assemble map
        fscape.dt.n = 20; //fscape.dt.docs.length/100  // for a n x n table
        var h = '<div id="2DscatterPlot" style="color:red">processing 2D plot ...</div>';
        h += '<table id="quantileMap" style="visibility:hidden">'; // notice it starts hidden
        h += '<tr><td id="legendFj">fj</td><td></td></tr>';
        h += '<tr><td id="featuremapTableTD"></td><td id="legendFi">fi</td></tr>';
        //h+='<tr><td id="legendFj">fj</td><td></td><td id="featuremapTableTD"></td><td id="legendFi">fi</td></tr>'
        h += '</table><div id="featuremapMoreDiv"><div>';
        featuremapTD.innerHTML = h;
        // 2d scatter plot
        fscape.scatterPlot(document.getElementById("2DscatterPlot"), i, j);

        // featuremapTableTD
        var hh = '<table id="featureheatmapTable">';
        var tii = jmat.range(0, fscape.dt.n - 1);
        var tjj = jmat.range(0, fscape.dt.n - 1);
        tii.forEach(function (ti) {
            hh += '<tr>';
            tjj.forEach(function (tj) {
                hh += '<td id="fm_' + (fscape.dt.n - ti - 1) + '_' + (tj) + '">&nbsp;&nbsp;&nbsp;</td>'
            });
            hh += '</tr>'
        });
        hh += '</table>';
        featuremapTableTD.innerHTML = hh;

        var mapTDover = function () {
            featuremapMoreDiv.innerHTML = this.id;
            var qij = JSON.parse('[' + this.id.slice(3).replace('_', ',') + ']').map(function (q) {
                return q / fscape.dt.n
            });

            var vi = jmat.interp1(fscape.dt.dtmemb[fi][1], fscape.dt.dtmemb[fi][0], [qij[0], qij[0] + 1 / fscape.dt.n]);
            var vj = jmat.interp1(fscape.dt.dtmemb[fj][1], fscape.dt.dtmemb[fj][0], [qij[1], qij[1] + 1 / fscape.dt.n]);
            var c = this.style.backgroundColor;
            var h = '<p style="background-color: ' + c + '; font-size: 3px">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>';
            h += '<li>' + fj + ' = [' + jmat.toPrecision(vj) + ']</li>';
            h += 'Quantile = [' + jmat.toPrecision([qij[1], qij[1] + 1 / fscape.dt.n]) + ']';
            h += '<li>' + fi + ' = [' + jmat.toPrecision(vi) + ']</li>';
            h += 'Quantile = [' + jmat.toPrecision([qij[0], qij[0] + 1 / fscape.dt.n]) + ']';
            h += '<p style="color:blue">distribution density: ' + jmat.toPrecision(this.d) + '</p>';
            h += '<p style="background-color: ' + c + '; font-size: 3px">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>';
            featuremapMoreDiv.innerHTML = h
        };

        $('#featureheatmapTable >>> td').mouseover(mapTDover);
        legendFi.style.transform = "rotate(-90deg)";
        quantileMap.style.visibility = "visible";
        //legendFi.style.transformOrigin="center 100px"
        //<table id="featuremapTable">'
    } else {
        fscape.scatterPlot(document.getElementById("2DscatterPlot"), i, j)
    }

    // legends
    legendFi.textContent = fi;
    legendFj.textContent = fj;

    // calculate densities
    var M = jmat.zeros(fscape.dt.n, fscape.dt.n);
    var N = fscape.dt.n - 1 / fscape.dt.tab[fi].length; // to shave the ceiling

    //var tii=jmat.range(0,fscape.dt.n-1)
    //var tjj=jmat.range(0,fscape.dt.n-1)
    var s = fscape.dt.n / (fscape.dt.tabmemb[fi].length); // step increase
    jmat.transpose([fscape.dt.tabmemb[fi], fscape.dt.tabmemb[fj]]).forEach(function (xij) {
        M[Math.floor(xij[0] * N)][Math.floor(xij[1] * N)] += s
    });

    // prepare the colormap
    var cmap = jmat.colormap().map(function (ci) {
        return ci.map(function (cij) {
            return Math.round(cij * 255)
        })
    });

    var ij = jmat.range(0, fscape.dt.n - 1);
    ij.forEach(function (ti) {
        ij.forEach(function (tj) {
            var td = document.getElementById('fm_' + ti + '_' + tj);
            var d = M[ti][tj]; // density
            td.d = d;
            var v = Math.round(63 * d);
            v = Math.min(63, v);
            var c = 'rgb(' + cmap[v].toString() + ')';
            //td.textContent=Math.round(M[ti][tj]*100)
            td.style.backgroundColor = c
        })
    });

    // mouse over anywhere in the map refocuses correlation info
    featureheatmapTable.onmouseover = function () {
        var c = featurecrossTB.tBodies[0].children[ii].children[jj + 1].style.color;
        var cBack = JSON.parse('[' + this.style.color.slice(4, -1).split(', ') + ']').map(function (c) {
            return 255 - c
        }).toString();
        featuremoreTD.innerHTML = '<p style="background-color: ' + c + '; font-size: 3px">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p><p style="color:navy">Pearson correlation between <li style="color:navy">' + fi + ' </li><li style="color:navy">' + fj + '</li> corr(' + ii + ',' + jj + ')= ' + Math.round((1 - fscape.dt.cl[1][ii][jj]) * 1000) / 1000 + '</p><p style="background-color: ' + c + '; font-size: 3px">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>'
    };

};

fscape.scatterPlot = function (div0, i, j) {
    // feature names
    if (typeof(div0) == 'string') {
        div0 = document.getElementById(div0)
    }

    div0.innerHTML = '';
    var div = document.createElement('div');
    //div.id="lala"
    div0.appendChild(div);
    var fi = fscape.dt.parmNum[i];
    var fj = fscape.dt.parmNum[j];
    var x = fscape.dt.tab[fi];
    var y = fscape.dt.tab[fj];
    div.style.width = '600px';
    div.style.height = '500px';

    var trace0 = {
        mode: 'markers',
        type: 'scatter',
        symbol: 'cross-thin',
        marker: {
            size: 3
        },
        x: x,
        y: y
    };

    var layout = {
        //title: 'Quarter 1 Growth',
        xaxis: {
            title: fi,
            showline: false,
            showgrid: true
        },
        yaxis: {
            title: fj,
            showline: false,
            showgrid: true
        }
    };

    fscape.plt = Plotly.newPlot(div, [trace0], layout);
    window.scrollTo(window.innerWidth, window.scrollY);

    //console.log(fscape.plt._result._fullLayout.xaxis._tmin, fscape.plt._result._fullLayout.xaxis._tmax, fscape.plt._result._fullLayout.yaxis._tmin, fscape.plt._result._fullLayout.yaxis._tmax);
    console.log(div._fullLayout.xaxis._tmin, div._fullLayout.xaxis._tmax, div._fullLayout.yaxis._tmin, div._fullLayout.yaxis._tmax);

    //Click nuclear mugshots button to view the nuclei of interest.
    //Select region from scatterplot. Then click <abbr title="below the scatterplot">nuclear mugshots</abbr> button to view the nuclei of interest.
    document.getElementById('lalainfo').textContent = 'Select region from scatterplot. Then click nuclear mugshots button to view the nuclei of interest.';
    var divZ = document.createElement('div');
    divZ.setAttribute('align', 'center');
    divZ.innerHTML = '<p><button id="resampleBt" class="btn btn-secondary" style="color:red">Nuclear mugshots from selection region</button></p>'
        + '<p id="resampleMsg"></p>';
    div.appendChild(divZ);

    resampleBt.onclick = function () {

        // Plotly will attach the plot information to the div that you specify.
        var xmin = div._fullLayout.xaxis._tmin;
        var xmax = div._fullLayout.xaxis._tmax;
        var ymin = div._fullLayout.yaxis._tmin;
        var ymax = div._fullLayout.yaxis._tmax;

        var h = '<h4 style="color:maroon">resampling (x, y ranges)</h4>';
        h += '<p style="color:blue">' + fi + ': ' + xmin + ' , ' + xmax + '</p>';
        h += '<p style="color:blue">' + fj + ': ' + ymin + ' , ' + ymax + '</p>';
        resampleMsg.innerHTML = h;

        if (location.search.length > 1) {
            var f = abcUtil.getQueryVariable('find', location.search.slice(1));
            var str = decodeURI(f);
            str = JSON.parse(str);
            var s = 'provenance.image.subject_id';
            var patient = str[s];

            if (!patient) {
                s = 'provenance.image.case_id';
                patient = str[s];
            }

            var parm = (s.split('.'))[2];
            var m = location.search.match(config.findAPI + '[^\;]+')[0];
            window.open(config.domain + "/nuclei-mugshots/#" + parm + "=" + patient + "&fx=" + fi + '&xmin=' + xmin + '&xmax=' + xmax + "&fy=" + fj + '&ymin=' + ymin + '&ymax=' + ymax + '&url=' + m);

        }
        else {
            window.open(config.domain + "/nuclei-mugshots/#case_id=" + case_id + "&fx=" + fi + '&xmin=' + xmin + '&xmax=' + xmax + "&fy=" + fj + '&ymin=' + ymin + '&ymax=' + ymax + '&url=' + query + '&c=' + selection.cancer_type);
        }

    };

};

function createQuery(db, exec) {
    /*
     var r = getSubject(db, exec);
     r = JSON.parse(r);
     case_id = r[0].provenance.image.case_id;
     */
    //"provenance.image.subject_id":"TCGA-05-4244"}
    case_id = config.default_case_id;
    query = config.findAPI + ':' + config.port
        + '?limit=1000&find={"randval":{"$gte":' + abcUtil.randval() + '},'
        + '"provenance.analysis.execution_id":"' + exec + '",'
        + '"provenance.image.case_id":"' + case_id + '"}'
        + '&db=' + db;

    return query;
}

function getSubject(db, exec) {
    var q = config.findAPI + ':' + config.port
        + '?limit=1&find={"randval":{"$gte":' + abcUtil.randval() + '},'
        + '"provenance.analysis.execution_id":"' + exec + '"}'
        + '&db=' + db;
    var value = $.ajax({
        url: q,
        async: false
    }).responseText;
    return value;
}

function getPatient(q) {
    if (!q) {
        return '';
    }
    else {
        var f = abcUtil.getQueryVariable('find', q);

        var p = abcUtil.getFindParm('provenance.image.subject_id', f);

        if (!p) {
            // Look for case_id
            p = abcUtil.getFindParm('provenance.image.case_id', f);
        }

        if (typeof p == 'undefined')
            p = '';

        return p;

    }

}

$(function () {
    fscape();
});
