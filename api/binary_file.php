<?php
// Pure binary file serving script - minimal code, maximum compatibility
error_reporting(0);

// Get parameters
$ins = isset($_GET['ins']) ? strtoupper($_GET['ins']) : '';
$file = isset($_GET['file']) ? $_GET['file'] : '';
$mode = isset($_GET['mode']) ? $_GET['mode'] : 'inline';

// Log request
$log = date('Y-m-d H:i:s') . " - Binary file request: ins=$ins, file=$file, mode=$mode\n";
file_put_contents(__DIR__ . '/binary_file.log', $log, FILE_APPEND);

// Sanitize inputs
$ins = preg_replace('/[^A-Z0-9]/', '', $ins);
$file = basename($file);

// Get file path
$filePath = __DIR__ . '/files/' . $ins . '/' . $file;

// Check if file exists
if (!file_exists($filePath)) {
    header('HTTP/1.1 404 Not Found');
    echo "File not found";
    exit;
}

// Get file info
$fileSize = filesize($filePath);
$extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

// Basic MIME type mapping
switch ($extension) {
    case 'jpg': case 'jpeg': $mime = 'image/jpeg'; break;
    case 'png': $mime = 'image/png'; break;
    case 'gif': $mime = 'image/gif'; break;
    case 'pdf': $mime = 'application/pdf'; break;
    default: $mime = 'application/octet-stream';
}

// Clean all output buffers
while (ob_get_level()) ob_end_clean();

// Turn off compression
if (function_exists('apache_setenv')) apache_setenv('no-gzip', '1');
ini_set('zlib.output_compression', 'Off');

// Headers for binary file
header('Content-Type: ' . $mime);
header('Content-Length: ' . $fileSize);
header('Content-Disposition: ' . ($mode === 'inline' ? 'inline' : 'attachment') . '; filename="' . $file . '"');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Output file in binary mode
readfile($filePath);
exit;
?>