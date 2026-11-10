<?php
require_once __DIR__ . '/../config/database.php';

class TaskController {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getAll($page = 1, $limit = 3, $search = "") {
        $offset = ($page - 1) * $limit;
        $searchQuery = "";
        
        if (!empty($search)) {
            $searchQuery = " AND title LIKE :search";
        }
        
        // 1. Ambil tugas Sedang Berjalan dengan filter pencarian
        $stmtActive = $this->conn->prepare("SELECT * FROM tasks WHERE is_completed = 0" . $searchQuery . " ORDER BY (due_date < NOW() AND due_date IS NOT NULL) DESC, created_at DESC");
        if (!empty($search)) {
            $stmtActive->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }
        $stmtActive->execute();
        $activeTasks = $stmtActive->fetchAll();
        
        // 2. Hitung total tugas Selesai dengan filter pencarian untuk Paginasi
        $countStmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tasks WHERE is_completed = 1" . $searchQuery);
        if (!empty($search)) {
            $countStmt->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total_completed = $countStmt->fetch()['total'];
        
        // 3. Ambil tugas Selesai DENGAN Paginasi dan filter pencarian
        $stmtCompleted = $this->conn->prepare("SELECT * FROM tasks WHERE is_completed = 1" . $searchQuery . " ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        if (!empty($search)) {
            $stmtCompleted->bindValue(':search', '%' . $search . '%', PDO::PARAM_STR);
        }
        $stmtCompleted->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmtCompleted->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmtCompleted->execute();
        $completedTasks = $stmtCompleted->fetchAll();
        
        return [
            "active_data" => $activeTasks,
            "completed_data" => $completedTasks,
            "pagination" => [
                "current_page" => (int)$page,
                "per_page" => (int)$limit,
                "total_pages" => ceil($total_completed / $limit) > 0 ? ceil($total_completed / $limit) : 1,
                "total_records" => (int)$total_completed
            ]
        ];
    }

    public function create($data) {
        // Bersihkan tag dan spasi kosong di awal/akhir
        $clean_title = trim(htmlspecialchars(strip_tags($data->title), ENT_QUOTES, 'UTF-8'));
        
        // Validasi: Batalkan eksekusi jika judul kosong
        if (empty($clean_title)) {
            return false;
        }

        $stmt = $this->conn->prepare("INSERT INTO tasks (title, due_date) VALUES (:title, :due_date)");
        $stmt->bindParam(":title", $clean_title);
        
        $due_date = isset($data->due_date) && !empty($data->due_date) ? $data->due_date : null;
        $stmt->bindParam(":due_date", $due_date);
        
        return $stmt->execute();
    }

    public function update($id, $data) {
        // Mode 1: Jika request hanya mengubah status selesai (Checkbox)
        if (isset($data->is_completed) && !isset($data->title)) {
            $stmt = $this->conn->prepare("UPDATE tasks SET is_completed = :is_completed WHERE id = :id");
            $stmt->bindParam(":is_completed", $data->is_completed);
            $stmt->bindParam(":id", $id);
            return $stmt->execute();
        }

      // Mode 2: Jika request mengubah isi tugas (Edit Judul & Tanggal)
        if (isset($data->title)) {
        $clean_title = trim(htmlspecialchars(strip_tags($data->title), ENT_QUOTES, 'UTF-8'));
        
        // Validasi: Batalkan eksekusi jika judul kosong
        if (empty($clean_title)) {
            return false;
        }

        $stmt = $this->conn->prepare("UPDATE tasks SET title = :title, due_date = :due_date WHERE id = :id");
        $stmt->bindParam(":title", $clean_title);
        
        $due_date = isset($data->due_date) && !empty($data->due_date) ? $data->due_date : null;
        $stmt->bindParam(":due_date", $due_date);
        $stmt->bindParam(":id", $id);
        
        return $stmt->execute();
        }
        
        return false;
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM tasks WHERE id = :id");
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }


    // Pastikan fungsi ini ditambahkan DI SINI
    public function clearCompleted() {
        $stmt = $this->conn->prepare("DELETE FROM tasks WHERE is_completed = 1");
        return $stmt->execute();
    }
}
?>