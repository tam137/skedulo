<?php
require_once 'auth_helper.php';

$token = $_GET['token'] ?? '';
if (empty($token)) {
    http_response_code(400);
    die('Bad Request: Token missing');
}

$pdo = get_db_connection();

// Verify token
$stmt = $pdo->prepare("SELECT id, username FROM accounts WHERE ics_token = :token AND is_active = true");
$stmt->execute(['token' => $token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    die('Unauthorized: Invalid token');
}

$userId = $user['id'];
$oneYearAgo = date('Y-m-d', strtotime('-1 year'));

// Fetch appointments
$stmt = $pdo->prepare("
    SELECT a.*
    FROM appointments a
    WHERE a.appointment_date >= :date_limit
      AND (
          a.created_by = :userId
          OR EXISTS (
              SELECT 1 FROM appointment_permissions ap
              WHERE ap.appointment_id = a.id AND ap.account_id = :userId
          )
      )
    ORDER BY a.appointment_date ASC
");
$stmt->execute(['date_limit' => $oneYearAgo, 'userId' => $userId]);
$appointments = $stmt->fetchAll();

// Generate ICS output
header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename="kalender.ics"');

echo "BEGIN:VCALENDAR\r\n";
echo "VERSION:2.0\r\n";
echo "PRODID:-//Skedulo//DE\r\n";
echo "CALSCALE:GREGORIAN\r\n";
echo "METHOD:PUBLISH\r\n";

$calname = str_replace(array('\\', ',', ';'), array('\\\\', '\,', '\;'), $user['username']);
echo "X-WR-CALNAME:Skedulo - " . $calname . "\r\n";

foreach ($appointments as $apt) {
    $uid = $apt['id'] . "@skedulo";
    $dtstamp = date('Ymd\THis\Z', strtotime($apt['updated_at']));
    
    $allDay = filter_var($apt['all_day'], FILTER_VALIDATE_BOOLEAN);
    
    echo "BEGIN:VEVENT\r\n";
    echo "UID:" . $uid . "\r\n";
    echo "DTSTAMP:" . $dtstamp . "\r\n";
    
    if ($allDay) {
        $ts = strtotime($apt['appointment_date']);
        $dtstart = date('Ymd', $ts);
        
        $durationDays = $apt['duration_days'] !== null ? intval($apt['duration_days']) : 1;
        if ($durationDays < 1) {
            $durationDays = 1;
        }
        $dtend = date('Ymd', strtotime("+$durationDays days", $ts));
        
        echo "DTSTART;VALUE=DATE:" . $dtstart . "\r\n";
        echo "DTEND;VALUE=DATE:" . $dtend . "\r\n";
    } else {
        // Time based: convert Europe/Berlin to UTC
        $tz_berlin = new DateTimeZone('Europe/Berlin');
        $dt_start = new DateTime($apt['appointment_date'], $tz_berlin);
        
        $durationHours = $apt['duration_hours'] !== null ? floatval($apt['duration_hours']) : 1.0;
        if ($durationHours <= 0) {
            $durationHours = 1.0;
        }
        $duration_seconds = intval($durationHours * 3600);
        $dt_end = clone $dt_start;
        $dt_end->modify("+$duration_seconds seconds");
        
        $dt_start->setTimezone(new DateTimeZone('UTC'));
        $dt_end->setTimezone(new DateTimeZone('UTC'));
        
        $dtstart_val = $dt_start->format('Ymd\THis\Z');
        $dtend_val = $dt_end->format('Ymd\THis\Z');
        
        echo "DTSTART:" . $dtstart_val . "\r\n";
        echo "DTEND:" . $dtend_val . "\r\n";
    }
    
    // Escape special characters in text fields
    $summary = str_replace(array('\\', ',', ';'), array('\\\\', '\,', '\;'), $apt['title']);
    if (!empty($apt['icon'])) {
        $summary = $apt['icon'] . ' ' . $summary;
    }
    echo "SUMMARY:" . $summary . "\r\n";
    
    if (!empty($apt['location'])) {
        $location = str_replace(array('\\', ',', ';'), array('\\\\', '\,', '\;'), $apt['location']);
        echo "LOCATION:" . $location . "\r\n";
    }
    
    if (!empty($apt['notes'])) {
        // Replace newlines with literal \n
        $notes = str_replace(array('\\', ',', ';', "\r\n", "\n"), array('\\\\', '\,', '\;', "\\n", "\\n"), $apt['notes']);
        echo "DESCRIPTION:" . $notes . "\r\n";
    }
    
    echo "END:VEVENT\r\n";
}

echo "END:VCALENDAR\r\n";
