<?php
// src/config/database.php

date_default_timezone_set('Asia/Jakarta');

class Database {
    private $host = "127.0.0.1";
    private $db_name = "todolist_db";
    private $username = "todo_user";
    private $password = "password_654321";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            
            // Mode error PDO untuk debugging yang lebih baik
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Dukungan karakter emoji dan simbol
            $this->conn->exec("SET NAMES utf8mb4");
            
            // 2. Atur Zona Waktu spesifik untuk setiap sesi MariaDB ke WIB (+07:00)
            $this->conn->exec("SET time_zone = '+07:00'");
            
        } catch(PDOException $exception) {
            echo "Koneksi database gagal: " . $exception->getMessage();
        }
        return $this->conn;
    }
}