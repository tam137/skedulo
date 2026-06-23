<?php
// Example database configuration for the web application.
// Copy this file to `/var/www/config.php` (or the location required by auth_helper.php)
// and replace the placeholder values with your actual database credentials.

$db_config = [
    'host' => '127.0.0.1',     // Database host (usually 127.0.0.1 for local connection)
    'port' => '5433',          // Database port (default PostgreSQL port is 5432, this project uses 5433)
    'dbname' => 'your_dbname',  // Name of the database
    'user' => 'your_dbuser',    // Username for database access
    'password' => 'your_secure_password' // Password for the database user
];
?>
