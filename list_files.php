<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$files = glob('*.json');
echo json_encode($files);
?>
