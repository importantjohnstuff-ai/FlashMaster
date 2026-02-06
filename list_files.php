<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$files = glob('*.json');
$result = [];

foreach ($files as $file) {
    if ($file === 'package.json' || $file === 'package-lock.json') continue; // Skip non-data jsons
    
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    $count = is_array($data) ? count($data) : 0;
    
    $result[] = [
        'name' => $file,
        'count' => $count
    ];
}

echo json_encode($result);
?>
