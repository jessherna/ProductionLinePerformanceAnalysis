
// Dashboard JavaScript file
$(document).ready(function() {
    // Load anomaly summary
    $.getJSON('/api/anomaly-summary', function(data) {
        let html = '<table class="table table-striped">';
        html += '<thead><tr><th>Method</th><th>Anomalies</th><th>Samples</th><th>Percentage</th></tr></thead>';
        html += '<tbody>';
        
        for (let key in data) {
            let method = data[key];
            html += '<tr>';
            html += '<td>' + method.method + '</td>';
            html += '<td>' + method.anomaly_count + '</td>';
            html += '<td>' + method.total_samples + '</td>';
            html += '<td>' + method.anomaly_percentage + '%</td>';
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        $('#anomaly-summary').html(html);
    });
    
    // Load available plots
    $.getJSON('/api/plots', function(data) {
        let html = '';
        
        data.forEach(function(plot) {
            html += '<div class="col-md-6">';
            html += '<div class="card">';
            html += '<div class="card-header">' + plot.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + '</div>';
            html += '<div class="card-body">';
            html += '<a href="' + plot.url + '" target="_blank">';
            html += '<img src="' + plot.url + '" class="img-fluid" alt="' + plot.name + '">';
            html += '</a>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        
        $('#plot-gallery').html(html);
    });
});
            