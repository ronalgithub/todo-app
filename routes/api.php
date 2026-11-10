<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../src/controllers/TaskController.php';

$controller = new TaskController();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));
$id = isset($_GET['id']) ? $_GET['id'] : null;

switch ($method) {
 

    case 'GET':
            $page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) && is_numeric($_GET['limit']) ? (int)$_GET['limit'] : 3;
            
            // Tangkap parameter search dari URL dan amankan dari XSS
            $search = isset($_GET['search']) ? htmlspecialchars($_GET['search'], ENT_QUOTES, 'UTF-8') : "";
            
            http_response_code(200);
            echo json_encode($controller->getAll($page, $limit, $search));
            break;
            
    case 'POST':
        if (!empty($data->title)) {
            // Validasi batas maksimal 255 karakter
            if (mb_strlen($data->title, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["message" => "Judul tugas maksimal 255 karakter."]);
                break;
            }
            
            $controller->create($data) ? http_response_code(201) : http_response_code(503);
            echo json_encode(["message" => "Tugas ditambahkan."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Judul tugas wajib diisi."]);
        }
        break;
        
    case 'PUT':
        if ($id !== null) {
            // Validasi saat mengedit judul
            if (isset($data->title) && mb_strlen($data->title, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["message" => "Judul tugas maksimal 255 karakter."]);
                break;
            }

            if ($controller->update($id, $data)) {
                http_response_code(200);
                echo json_encode(["message" => "Tugas berhasil diperbarui."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Gagal memperbarui tugas."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "ID tugas wajib disertakan."]);
        }
        break;

        case 'DELETE':
            // 1. Logika Sapu Bersih (Clear All)
            if (isset($_GET['action']) && $_GET['action'] === 'clear_completed') {
                http_response_code(200);
                echo json_encode(["success" => $controller->clearCompleted()]);
                exit; // Hentikan eksekusi segera setelah selesai
            } 
            
            // 2. Logika Hapus Satuan (Hapus by ID)
            if (isset($_GET['id']) && is_numeric($_GET['id'])) {
                $id = (int)$_GET['id'];
                http_response_code(200);
                echo json_encode(["success" => $controller->delete($id)]);
                exit;
            }
            
            // Jika bukan keduanya
            http_response_code(400);
            echo json_encode(["error" => "Parameter tidak valid"]);
            exit;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Metode HTTP tidak diizinkan."]);
        break;
}
?>