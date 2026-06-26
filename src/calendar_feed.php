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
    
    // Parse the date (Y-m-d H:i:s)
    $ts = strtotime($apt['appointment_date']);
    // For all-day events, the DTSTART is YYYYMMDD
    $dtstart = date('Ymd', $ts);
    
    // According to RFC 5545, all-day events should have a DTEND which is the day *after* DTSTART
    $dtend = date('Ymd', strtotime('+1 day', $ts));
    
    $dtstamp = date('Ymd\THis\Z', strtotime($apt['updated_at']));
    
    echo "BEGIN:VEVENT\r\n";
    echo "UID:" . $uid . "\r\n";
    echo "DTSTAMP:" . $dtstamp . "\r\n";
    echo "DTSTART;VALUE=DATE:" . $dtstart . "\r\n";
    echo "DTEND;VALUE=DATE:" . $dtend . "\r\n";
    
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
