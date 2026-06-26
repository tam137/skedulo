<?php
/**
 * secure_existing_files.php
 * Script to retroactively secure uploaded files by adding a random hash prefix
 * to the physical file names and updating the database.
 * Run this from the command line: php src/secure_existing_files.php
 */

if (php_sapi_name() !== 'cli') {
    die("Dieses Skript kann nur über die Befehlszeile (CLI) ausgeführt werden.\n");
}

require_once __DIR__ . '/auth_helper.php';

$uploadDir = __DIR__ . '/uploads/';

try {
    $pdo = get_db_connection();
    
    // Fetch all files
    $stmt = $pdo->query("
        SELECT f.id, f.storage_filename, f.original_filename, a.username 
        FROM files f 
        JOIN accounts a ON f.uploaded_by = a.id
        ORDER BY f.id ASC
    ");
    $files = $stmt->fetchAll();
    
    echo "Starte Sicherheits-Update von " . count($files) . " Dateien...\n";
    
    $securedCount = 0;
    
    foreach ($files as $f) {
        $fileId = $f['id'];
        $username = $f['username'];
        $currentStorage = $f['storage_filename'];
        $originalFilename = $f['original_filename'];
        
        $safeUsername = preg_replace('/[^a-zA-Z0-9_-]/', '_', $username);
        $safeOriginalName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalFilename);
        
        $currentPath = $uploadDir . $currentStorage;
        
        // Check if the file is missing a random hash prefix.
        // Files uploaded during the buggy commit have a storage name like "username/safe_filename.pdf"
        // Their basename matches exactly the safeOriginalName.
        $baseStorageName = basename($currentStorage);
        
        if ($baseStorageName === $safeOriginalName) {
            // Needs securing
            $newStorageName = $safeUsername . '/' . uniqid() . '_' . bin2hex(random_bytes(4)) . '_' . $safeOriginalName;
            $destPath = $uploadDir . $newStorageName;
            
            $userDir = $uploadDir . $safeUsername . '/';
            if (!is_dir($userDir)) {
                mkdir($userDir, 0755, true);
            }
            
            $moved = false;
            // Rename without a DB transaction to avoid the rollback bug. 
            // If rename fails, we skip and don't touch the DB.
            if (file_exists($currentPath) && is_file($currentPath)) {
                if (rename($currentPath, $destPath)) {
                    $moved = true;
                } else {
                    echo "FEHLER: Konnte Datei '$currentPath' nicht umbenennen. Überspringe.\n";
                    continue;
                }
            } else {
                echo "WARNUNG: Physische Datei '$currentPath' nicht gefunden. Datenbank wird dennoch korrigiert.\n";
                // Even if the file is missing physically, we still update the DB to the new format 
                // so the entry conforms to the security rules.
            }
            
            $stmtUpdate = $pdo->prepare("
                UPDATE files 
                SET storage_filename = :storage 
                WHERE id = :id
            ");
            $stmtUpdate->execute([
                'storage' => $newStorageName,
                'id' => $fileId
            ]);
            
            if ($moved) {
                echo "Gesichert: $currentStorage -> $newStorageName\n";
                $securedCount++;
            }
        }
    }
    
    echo "\n=== Sicherheits-Update erfolgreich abgeschlossen ===\n";
    echo "Dateien erfolgreich mit Hash versehen: $securedCount\n";
    
} catch (Exception $e) {
    echo "Kritischer Fehler: " . $e->getMessage() . "\n";
    exit(1);
}
