
// Anomalies JavaScript file
$(document).ready(function() {
    // Load anomaly metrics for each method
    $.getJSON('/api/anomaly-summary', function(data) {
        // Isolation Forest
        if (data.isolation_forest) {
            let ifHtml = '<table class="table table-striped">';
            ifHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            ifHtml += '<tr><td>Anomaly Count</td><td>' + data.isolation_forest.anomaly_count + '</td></tr>';
            ifHtml += '<tr><td>Total Samples</td><td>' + data.isolation_forest.total_samples + '</td></tr>';
            ifHtml += '<tr><td>Anomaly Percentage</td><td>' + data.isolation_forest.anomaly_percentage + '%</td></tr>';
            
            if (data.isolation_forest.precision !== 'N/A') {
                ifHtml += '<tr><td>Precision</td><td>' + data.isolation_forest.precision.toFixed(4) + '</td></tr>';
                ifHtml += '<tr><td>Recall</td><td>' + data.isolation_forest.recall.toFixed(4) + '</td></tr>';
                ifHtml += '<tr><td>F1 Score</td><td>' + data.isolation_forest.f1.toFixed(4) + '</td></tr>';
            }
            
            ifHtml += '</table>';
            $('#if-metrics').html(ifHtml);
        }
        
        // Local Outlier Factor
        if (data.local_outlier_factor) {
            let lofHtml = '<table class="table table-striped">';
            lofHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            lofHtml += '<tr><td>Anomaly Count</td><td>' + data.local_outlier_factor.anomaly_count + '</td></tr>';
            lofHtml += '<tr><td>Total Samples</td><td>' + data.local_outlier_factor.total_samples + '</td></tr>';
            lofHtml += '<tr><td>Anomaly Percentage</td><td>' + data.local_outlier_factor.anomaly_percentage + '%</td></tr>';
            
            if (data.local_outlier_factor.precision !== 'N/A') {
                lofHtml += '<tr><td>Precision</td><td>' + data.local_outlier_factor.precision.toFixed(4) + '</td></tr>';
                lofHtml += '<tr><td>Recall</td><td>' + data.local_outlier_factor.recall.toFixed(4) + '</td></tr>';
                lofHtml += '<tr><td>F1 Score</td><td>' + data.local_outlier_factor.f1.toFixed(4) + '</td></tr>';
            }
            
            lofHtml += '</table>';
            $('#lof-metrics').html(lofHtml);
        }
        
        // One-Class SVM
        if (data['one-class_svm']) {
            let ocsvmHtml = '<table class="table table-striped">';
            ocsvmHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            ocsvmHtml += '<tr><td>Anomaly Count</td><td>' + data['one-class_svm'].anomaly_count + '</td></tr>';
            ocsvmHtml += '<tr><td>Total Samples</td><td>' + data['one-class_svm'].total_samples + '</td></tr>';
            ocsvmHtml += '<tr><td>Anomaly Percentage</td><td>' + data['one-class_svm'].anomaly_percentage + '%</td></tr>';
            
            if (data['one-class_svm'].precision !== 'N/A') {
                ocsvmHtml += '<tr><td>Precision</td><td>' + data['one-class_svm'].precision.toFixed(4) + '</td></tr>';
                ocsvmHtml += '<tr><td>Recall</td><td>' + data['one-class_svm'].recall.toFixed(4) + '</td></tr>';
                ocsvmHtml += '<tr><td>F1 Score</td><td>' + data['one-class_svm'].f1.toFixed(4) + '</td></tr>';
            }
            
            ocsvmHtml += '</table>';
            $('#ocsvm-metrics').html(ocsvmHtml);
        }
        
        // Elliptic Envelope
        if (data.elliptic_envelope) {
            let ellipticHtml = '<table class="table table-striped">';
            ellipticHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            ellipticHtml += '<tr><td>Anomaly Count</td><td>' + data.elliptic_envelope.anomaly_count + '</td></tr>';
            ellipticHtml += '<tr><td>Total Samples</td><td>' + data.elliptic_envelope.total_samples + '</td></tr>';
            ellipticHtml += '<tr><td>Anomaly Percentage</td><td>' + data.elliptic_envelope.anomaly_percentage + '%</td></tr>';
            
            if (data.elliptic_envelope.precision !== 'N/A') {
                ellipticHtml += '<tr><td>Precision</td><td>' + data.elliptic_envelope.precision.toFixed(4) + '</td></tr>';
                ellipticHtml += '<tr><td>Recall</td><td>' + data.elliptic_envelope.recall.toFixed(4) + '</td></tr>';
                ellipticHtml += '<tr><td>F1 Score</td><td>' + data.elliptic_envelope.f1.toFixed(4) + '</td></tr>';
            }
            
            ellipticHtml += '</table>';
            $('#elliptic-metrics').html(ellipticHtml);
        }
    });
});
            