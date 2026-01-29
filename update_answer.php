<?php
// update_answer.php
header('Content-Type: application/json');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['filename']) || !isset($input['card_id']) || !isset($input['new_answer'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$filename = basename($input['filename']); // Security: prevent directory traversal
$cardId = $input['card_id'];
$newAnswerKey = strtolower($input['new_answer']);

// Validate filename
if (!file_exists($filename) || pathinfo($filename, PATHINFO_EXTENSION) !== 'json') {
    http_response_code(404);
    echo json_encode(['error' => 'File not found or invalid']);
    exit;
}

// Read file
$jsonContent = file_get_contents($filename);
$data = json_decode($jsonContent, true);

if ($data === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse JSON file']);
    exit;
}

$updated = false;
$newAnswerText = '';

// Find and update the card
foreach ($data as &$card) {
    // Loose comparison for ID in case of string/int mismatch
    if (isset($card['id']) && $card['id'] == $cardId) {
        if (isset($card['options'][$newAnswerKey])) {
            $card['answer'] = $newAnswerKey;
            $card['correct_answer_text'] = $card['options'][$newAnswerKey];
            $newAnswerText = $card['correct_answer_text'];
            $updated = true;
        } else {
            http_response_code(400);
            echo json_encode(['error' => "Option '$newAnswerKey' not found in card options"]);
            exit;
        }
        break;
    }
}

if ($updated) {
    // Write back to file
    if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
        echo json_encode([
            'success' => true, 
            'message' => 'Answer updated successfully',
            'new_answer_key' => $newAnswerKey,
            'new_answer_text' => $newAnswerText
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write to file']);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Card ID not found']);
}
?>
