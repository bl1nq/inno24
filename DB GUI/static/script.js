$(document).ready(function() {
    var socket = io();

    socket.on('connect', function() {
        console.log('Verbunden mit dem Server.');
    });

    socket.on('update_data', function(data) {
        // Aktualisieren Sie die Daten auf der Webseite
        $('#distance').text(data.distance.toFixed(2));
        $('#distance_std_dev').text(data.distance_std_dev.toFixed(2));
        $('#esc_speed_display').text(data.esc_speed);
        $('#stepper_angle_display').text(data.stepper_angle.toFixed(2));
        $('#stepper_angular_speed').text(data.stepper_angular_speed.toFixed(2));

        // Prediction aktualisieren
        updatePrediction();
    });

    socket.on('system_status', function(data) {
        if (data.armed) {
            $('#system_status').text('System ARMED').css('color', 'green');
            $('#arm_button').text('Disarm');
        } else {
            $('#system_status').text('System DISARMED').css('color', 'red');
            $('#arm_button').text('Arm');
        }
    });

    socket.on('debug_message', function(data) {
        var currentText = $('#debug_messages').val();
        $('#debug_messages').val(currentText + data.message + '\n');
    });

    // Arm/Disarm Button
    $('#arm_button').click(function() {
        var statusText = $('#arm_button').text();
        if (statusText === 'Arm') {
            socket.emit('arm_system');
        } else {
            socket.emit('disarm_system');
        }
    });

    // ESC Geschwindigkeit setzen
    $('#set_esc_speed').click(function() {
        var value = parseInt($('#esc_speed').val());
        socket.emit('set_esc_speed', value);
    });

    // Stepper Winkel setzen
    $('#set_stepper_angle').click(function() {
        var value = parseFloat($('#stepper_angle').val());
        socket.emit('set_stepper_angle', value);
    });

    // Laser Einstellungen setzen
    $('#set_laser_measurements').click(function() {
        var value = parseInt($('#laser_measurements').val());
        socket.emit('set_laser_measurements', value);
    });

    $('#set_timing_budget').click(function() {
        var value = parseInt($('#timing_budget').val());
        socket.emit('set_timing_budget', value);
    });

    // Stepper Einstellungen setzen
    $('#reset_stepper_zero').click(function() {
        socket.emit('reset_stepper_zero');
    });

    $('#set_stepper_max_speed').click(function() {
        var value = parseFloat($('#stepper_max_speed').val());
        socket.emit('set_stepper_max_speed', value);
    });

    $('#set_stepper_accel').click(function() {
        var value = parseFloat($('#stepper_accel').val());
        socket.emit('set_stepper_accel', value);
    });

    // Daten speichern
    $('#save_data').click(function() {
        var filename = $('#filename').val();
        var actual_distance = parseFloat($('#actual_distance').val());
        socket.emit('save_data', {'filename': filename, 'actual_distance': actual_distance});
    });

    // Prediction aktualisieren
    function updatePrediction() {
        var a = parseFloat($('#param_a').val());
        var b = parseFloat($('#param_b').val());
        var c = parseFloat($('#param_c').val());
        var distance = parseFloat($('#distance').text());

        // Beispielhafte Vorhersagefunktion (anpassen an Ihre Bedürfnisse)
        var predicted_angle = a * distance + b;
        var predicted_speed = c * distance + b;

        $('#predicted_angle').text(predicted_angle.toFixed(2));
        $('#predicted_speed').text(predicted_speed.toFixed(2));
    }

    $('#param_a, #param_b, #param_c').on('input', function() {
        updatePrediction();
    });
});
