<?php
require_once 'auth_helper.php';

if (check_remember_me()) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;
?>
