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

$dataFile = __DIR__ . '/../data/' . $module . '.json';

if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([], JSON_PRETTY_PRINT));
}

$items = json_decode(file_get_contents($dataFile), true);
if (!is_array($items)) {
    $items = [];
}

$method = $_SERVER['REQUEST_METHOD'];
$payload = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'GET') {
    echo json_encode(['data' => $items]);
    exit;
}

if ($method === 'POST') {
    $payload['id'] = uniqid($module . '_', true);
    $items[] = $payload;
    file_put_contents($dataFile, json_encode(array_values($items), JSON_PRETTY_PRINT));
    http_response_code(201);
    echo json_encode(['message' => 'Registro creado', 'data' => $payload]);
    exit;
}

if ($method === 'PUT') {
    $id = $payload['id'] ?? null;
    if ($id === null) {
        http_response_code(422);
        echo json_encode(['error' => 'ID requerido']);
        exit;
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
        exit;
    }

    file_put_contents($dataFile, json_encode(array_values($items), JSON_PRETTY_PRINT));
    echo json_encode(['message' => 'Registro actualizado']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
