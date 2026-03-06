<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$allowedModules = ['rooms', 'reservations', 'guests', 'tasks', 'messages', 'inventory'];
$module = $_GET['module'] ?? '';

if (!in_array($module, $allowedModules, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Módulo inválido']);
    exit;
}

function read_payload() {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    return is_array($payload) ? $payload : [];
}

function db_connection() {
    $host = getenv('DB_HOST') ?: '';
    $db = getenv('DB_NAME') ?: '';
    $user = getenv('DB_USER') ?: '';
    $pass = getenv('DB_PASS') ?: '';

    if ($host === '' || $db === '' || $user === '') {
        return null;
    }

    $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function load_items_file($module) {
    $dataFile = __DIR__ . '/../data/' . $module . '.json';

    if (!file_exists($dataFile)) {
        file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT));
    }

    $items = json_decode(file_get_contents($dataFile), true);
    return is_array($items) ? $items : [];
}

function persist_items_file($module, $items) {
    $dataFile = __DIR__ . '/../data/' . $module . '.json';
    file_put_contents($dataFile, json_encode(array_values($items), JSON_PRETTY_PRINT));
}

function load_items_db($pdo, $module) {
    $stmt = $pdo->prepare('SELECT id, payload FROM hotel_records WHERE module = :module ORDER BY created_at DESC');
    $stmt->execute(['module' => $module]);
    $rows = $stmt->fetchAll();

    $result = [];
    foreach ($rows as $row) {
        $payload = json_decode($row['payload'], true);
        if (!is_array($payload)) {
            $payload = [];
        }
        $payload['id'] = $row['id'];
        $result[] = $payload;
    }

    return $result;
}

function insert_item_db($pdo, $module, $payload) {
    $id = uniqid($module . '_', true);
    $payload['id'] = $id;
    $stmt = $pdo->prepare('INSERT INTO hotel_records (id, module, payload, created_at, updated_at) VALUES (:id, :module, :payload, NOW(), NOW())');
    $stmt->execute([
        'id' => $id,
        'module' => $module,
        'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
    ]);

    return $payload;
}

function update_item_db($pdo, $module, $payload) {
    $id = $payload['id'] ?? null;
    if ($id === null) {
        return ['status' => 422, 'data' => ['error' => 'ID requerido']];
    }

    $stmt = $pdo->prepare('SELECT payload FROM hotel_records WHERE id = :id AND module = :module LIMIT 1');
    $stmt->execute(['id' => $id, 'module' => $module]);
    $found = $stmt->fetch();

    if (!$found) {
        return ['status' => 404, 'data' => ['error' => 'Registro no encontrado']];
    }

    $current = json_decode($found['payload'], true);
    if (!is_array($current)) {
        $current = [];
    }

    $updated = array_merge($current, $payload);
    $updated['id'] = $id;

    $updateStmt = $pdo->prepare('UPDATE hotel_records SET payload = :payload, updated_at = NOW() WHERE id = :id AND module = :module');
    $updateStmt->execute([
        'payload' => json_encode($updated, JSON_UNESCAPED_UNICODE),
        'id' => $id,
        'module' => $module,
    ]);

    return ['status' => 200, 'data' => ['message' => 'Registro actualizado']];
}

$method = $_SERVER['REQUEST_METHOD'];
$payload = read_payload();
$pdo = null;

try {
    $pdo = db_connection();
} catch (Throwable $error) {
    $pdo = null;
}

if ($method === 'GET') {
    $items = $pdo ? load_items_db($pdo, $module) : load_items_file($module);
    echo json_encode(['data' => $items]);
    exit;
}

if ($method === 'POST') {
    if ($pdo) {
        $created = insert_item_db($pdo, $module, $payload);
    } else {
        $items = load_items_file($module);
        $payload['id'] = uniqid($module . '_', true);
        $items[] = $payload;
        persist_items_file($module, $items);
        $created = $payload;
    }

    http_response_code(201);
    echo json_encode(['message' => 'Registro creado', 'data' => $created]);
    exit;
}

if ($method === 'PUT') {
    if ($pdo) {
        $updated = update_item_db($pdo, $module, $payload);
        http_response_code($updated['status']);
        echo json_encode($updated['data']);
        exit;
    }

    $id = $payload['id'] ?? null;
    if ($id === null) {
        http_response_code(422);
        echo json_encode(['error' => 'ID requerido']);
        exit;
    }

    $items = load_items_file($module);
    $found = false;

    foreach ($items as $index => $item) {
        if (($item['id'] ?? null) === $id) {
            $items[$index] = array_merge($item, $payload);
            $found = true;
            break;
        }
    }

    if (!$found) {
        http_response_code(404);
        echo json_encode(['error' => 'Registro no encontrado']);
        exit;
    }

    persist_items_file($module, $items);
    echo json_encode(['message' => 'Registro actualizado']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
