<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$moduleConfig = [
    'hotel' => ['table' => 'hotels', 'json' => 'hotel.json'],
    'floors' => ['table' => 'floors', 'json' => 'floors.json'],
    'rooms' => ['table' => 'rooms', 'json' => 'rooms.json'],
    'reservations' => ['table' => 'reservations', 'json' => 'reservations.json'],
    'guests' => ['table' => 'guests', 'json' => 'guests.json'],
    'tasks' => ['table' => 'tasks', 'json' => 'tasks.json'],
    'messages' => ['table' => 'messages', 'json' => 'messages.json'],
    'inventory' => ['table' => 'inventory', 'json' => 'inventory.json']
];

$module = $_GET['module'] ?? '';
if (!array_key_exists($module, $moduleConfig)) {
    http_response_code(400);
    echo json_encode(['error' => 'Módulo inválido']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$payload = json_decode(file_get_contents('php://input'), true) ?? [];
$storageDriver = getenv('DB_DRIVER') ?: 'json';

if ($storageDriver === 'mysql') {
    handleMysql($method, $module, $moduleConfig[$module]['table'], $payload);
    exit;
}

handleJson($method, $module, $moduleConfig[$module]['json'], $payload);

function handleJson(string $method, string $module, string $jsonFile, array $payload): void
{
    $dataFile = __DIR__ . '/../data/' . $jsonFile;
    if (!file_exists($dataFile)) {
        file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    $items = json_decode(file_get_contents($dataFile), true);
    if (!is_array($items)) {
        $items = [];
    }

    if ($method === 'GET') {
        echo json_encode(['data' => $items]);
        return;
    }

    if ($method === 'POST') {
        $payload['id'] = uniqid($module . '_', true);
        $items[] = $payload;
        file_put_contents($dataFile, json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        http_response_code(201);
        echo json_encode(['message' => 'Registro creado', 'data' => $payload]);
        return;
    }

    if ($method === 'PUT') {
        $id = $payload['id'] ?? null;
        if ($id === null) {
            http_response_code(422);
            echo json_encode(['error' => 'ID requerido']);
            return;
        }

        $updated = false;
        foreach ($items as $index => $item) {
            if (($item['id'] ?? null) === $id) {
                $items[$index] = array_merge($item, $payload);
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            http_response_code(404);
            echo json_encode(['error' => 'Registro no encontrado']);
            return;
        }

        file_put_contents($dataFile, json_encode(array_values($items), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['message' => 'Registro actualizado']);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}

function handleMysql(string $method, string $module, string $table, array $payload): void
{
    $host = getenv('DB_HOST') ?: 'localhost';
    $port = getenv('DB_PORT') ?: '3306';
    $database = getenv('DB_NAME') ?: '';
    $username = getenv('DB_USER') ?: '';
    $password = getenv('DB_PASS') ?: '';

    if ($database === '' || $username === '') {
        http_response_code(500);
        echo json_encode(['error' => 'Configura DB_NAME y DB_USER para usar MySQL']);
        return;
    }

    try {
        $pdo = new PDO(
            "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    } catch (PDOException $exception) {
        http_response_code(500);
        echo json_encode(['error' => 'Conexión MySQL fallida', 'details' => $exception->getMessage()]);
        return;
    }

    if ($method === 'GET') {
        $statement = $pdo->query("SELECT * FROM {$table} ORDER BY created_at DESC");
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['data' => $rows]);
        return;
    }

    if ($method === 'POST') {
        $payload['id'] = uniqid($module . '_', true);
        $columns = array_keys($payload);
        $placeholders = array_map(static fn($column) => ':' . $column, $columns);
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(',', $columns),
            implode(',', $placeholders)
        );
        $statement = $pdo->prepare($sql);
        $statement->execute($payload);
        http_response_code(201);
        echo json_encode(['message' => 'Registro creado', 'data' => $payload]);
        return;
    }

    if ($method === 'PUT') {
        $id = $payload['id'] ?? null;
        if ($id === null) {
            http_response_code(422);
            echo json_encode(['error' => 'ID requerido']);
            return;
        }

        unset($payload['id']);
        if (count($payload) === 0) {
            http_response_code(422);
            echo json_encode(['error' => 'No hay campos para actualizar']);
            return;
        }

        $sets = array_map(static fn($column) => $column . '=:' . $column, array_keys($payload));
        $sql = sprintf('UPDATE %s SET %s WHERE id=:id', $table, implode(',', $sets));
        $statement = $pdo->prepare($sql);
        $payload['id'] = $id;
        $statement->execute($payload);

        if ($statement->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Registro no encontrado']);
            return;
        }

        echo json_encode(['message' => 'Registro actualizado']);
        return;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
