/**
 * Created by tdiprima on 6/1/16.
 */
abcUtil = {

    selectBox: function (trace, globalObject) {
        // Dropdown menu
        var selectTumorHTML = '<h3 style="color:' + trace.font_color + '">';
        selectTumorHTML += trace.text + ': <select onchange="' + trace.onchange + '" style="font-color:' + trace.font_color + ';background-color:' + trace.bg_color + ';font-size:' + trace.font_size + '" id="' + trace.id + '">';

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

                    selectTumorHTML += '<option value="' + value + '" ' + attr + '>' + tm.toUpperCase() + ' - ' + item.name + '</option>';

                });
            }
        });

        selectTumorHTML += "</select>";
        selectTumorHTML += "</h3>";
        return selectTumorHTML;
    }

};
