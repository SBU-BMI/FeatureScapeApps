/**
 * Created by tdiprima on 6/1/16.
 * abcUtil.js: A container for utility stuff.
 */
abcUtil = {

    selectBox: function (trace, globalObject) {

        if (jQuery.isEmptyObject(trace))
        {
            trace = {
                url: config.findAPI + ':' + config.port + '/?limit=12&collection=metadata&find={}&db=u24_meta',
                id: 'selectTumor',
                onchange: 'tumorChanged(this)',
                font_color: 'navy',
                bg_color: 'silver',
                font_size: 'large',
                text: 'Select',
                selected: 'luad'
            };
        }

        // Dropdown menu
        var selectTumorHTML = '<h3 style="color:' + trace.font_color + '">';
        selectTumorHTML += trace.text
            + ': <select onchange="' + trace.onchange
            + '" style="font-color:' + trace.font_color
            + ';background-color:' + trace.bg_color
            + ';font-size:' + trace.font_size + '" id="' + trace.id + '">';

        $.ajax({
            url: trace.url,
            async: false,
            dataType: 'json',
            success: function (arr) {
                arr.forEach(function (item) {
                    var tm = item.cancer_type;
                    var value = tm + ',' + item.db + ',' + item.execution_id;
                    var attr = '';

                    if (!globalObject.cancer_type) {
                        if (tm === trace.selected) {
                            globalObject.db = item.db;
                            globalObject.execution_id = item.execution_id;
                            globalObject.cancer_type = item.cancer_type;
                            attr = 'selected';
                        }
                    }

                    /*
                    selectTumorHTML += '<option disabled>execution_id ' + item.execution_id + '</option>';
                    selectTumorHTML += '<option value="' + value + '" ' + attr + '>&nbsp;&nbsp;'
                        + tm.toUpperCase() + ' - ' + item.name + '</option>';
                    */

                    selectTumorHTML += '<option value="' + value + '" ' + attr + '>'
                        + tm.toUpperCase() + ' - ' + item.name + ' - ' + item.execution_id + '</option>';

                });
            }
        });

        selectTumorHTML += "</select>";
        selectTumorHTML += "</h3>";
        return selectTumorHTML;
    }

};
