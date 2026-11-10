<?php
require_once '../src/config/database.php';
$database = new Database();
$db = $database->getConnection();

if($db) {
    echo "Fase 1 Tervalidasi: Aplikasi berhasil terhubung ke MariaDB!";
}