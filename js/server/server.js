/**
 * A RESTful API for fetching data from MongoDB.
 *
 * Parameters:
 *   collection
 *   db
 *   find
 *   limit
 *   mongoUrl
 *   project
 *
 * Find and project must be valid mongo syntax, contained inside {}
 *
 */
var mongoClient = require("mongodb").MongoClient,
    url = require("url"),
    fs = require("fs"),
    path = require("path"),
    port = 4000,
    http = require("http"),
    db = "u24_luad",
    mongoUrl = "mongodb://localhost:27017/",
    collection = "objects";

function recode(enc, parms) {
    var json = "",
        dec = "";
    try {
        // recode operators
        dec = decodeURI(enc);
        if (dec.indexOf("'") > -1) {
            dec = dec.replace(/'/g, '"');
        }
        json = JSON.parse(dec);
    } catch (err) {
        parms.err = {
            error: err
        };
        console.log(err, enc);
    }

    return json;
}

function handleRequest(request, response) {
    var urlString = request.url,
        parms = {}, // search parms
        urlObject,
        max = 10000, // maximum number of records at a time
        med = 0; // default number of records at a time

    if (urlString.endsWith(";")) {
        urlString = urlString.slice(0, -1);
    }

    urlObject = url.parse(urlString);
    //console.log("urlObject", urlObject);

    if (urlString.indexOf("favicon.ico") !== -1) {
        response.end(""); //<-- favicon being requested
    }
    else {
        console.log("");
        console.log("Client IP: " + request.ip);
        console.log("Client Address: " + request.connection.remoteAddress);
        console.log("urlString:", urlString);

        if (urlObject.search) { // parse request parameters
            urlObject.search.slice(1).split("&").forEach(function (pp) {
                pp = pp.split("=");
                if (parseFloat(pp[1])) {
                    pp[1] = parseFloat(pp[1]);
                }
                parms[pp[0]] = pp[1];
            });
        }

        // default parameter values
        if (!parms.limit) {
            parms.limit = med;
            response.end("");
            console.log("Request with no limit parameter!");
            return;
        }

        if (parms.limit === 0) {
            response.end("");
            console.log("Request with limit===0!");
            return;
        }

        if (parms.limit > max) {
            parms.limit = max;
        }

        if (!parms.db) {
            parms.db = db;
        } // <-- default db

        if (!parms.mongoUrl) {
            parms.mongoUrl = mongoUrl + parms.db;
        } // <-- default mongo

        if (!parms.collection) {
            parms.collection = collection;
        } // <-- default collection

        if (!parms.find) { // find
            parms.find = {};
        } else {
            parms.find = recode(parms.find, parms);
        }

        if (!parms.project) { // project
            parms.project = {};
        } else {
            parms.project = recode(parms.project, parms);
        }

        response.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });

        if (!parms.err) {

            console.log("parms:", JSON.stringify(parms));
            console.log("connecting ...");

            setTimeout(function () { // count down to quitting
                response.end('{error: "this is taking too long, please email jonas.almeida@stonybrook.edu to find out what is the holdup :-("}');
            }, 25000);

            mongoClient.connect(parms.mongoUrl, function (err, db) {

                if (err) {
                    console.log("Unable to connect to the MongoDB server. Error: ", err);
                } else {
                    console.log("connected ... retrieving documents ...");

                    db.collection(parms.collection).find(parms.find, parms.project, {
                        limit: parms.limit
                    }).toArray(function (err1, docs) {
                        if (err1) {
                            console.log("toArray() error: ", err1);
                        } else {
                            if (docs !== null) {
                                console.log(new Date(), docs.length + " docs");
                                db.close();
                                response.end(JSON.stringify(docs));
                            } else {
                                console.log(new Date(), "No results.");
                                db.close();
                                response.end(JSON.stringify({}));
                            }
                        }
                    });
                }

            });
        } else {
            response.end("{error: " + parms.err.error.message + "}");
            console.log(parms.err);
        }
    }
}

var server = http.createServer(handleRequest);
server.listen(port, function () {
    console.log("Listening on port:", port);
});
