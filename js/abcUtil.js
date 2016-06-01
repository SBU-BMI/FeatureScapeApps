/**
 * Created by tdiprima on 6/1/16.
 */
abcUtil = {

    selectBox: function (url) {
        // Dropdown menu
        var selectTumorHTML = '<h3 style="color:navy">';
        selectTumorHTML += 'Tumor Type: <select onchange="tumorChanged(this)" style="font-color:navy;background-color:silver;font-size:large" id="selectTumor">';

        $.ajax({
            url: url,
            async: false,
            dataType: 'json',
            success: function (arr) {
                arr.forEach(function (item) {
                    var tm = item.cancer_type;
                    var value = tm + ',' + item.db + ',' + item.execution_id;
                    var attr = '';

                    if (!openHealth.cancer_type) {
                        if (tm === 'luad') {
                            openHealth.db = item.db;
                            openHealth.execution_id = item.execution_id;
                            openHealth.cancer_type = item.cancer_type;
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
