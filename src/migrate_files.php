<?php
/**
 * migrate_files.php
 * Database and File System migration script to move uploads from the root uploads/ folder
 * into user-specific subfolders: uploads/[username]/
 * Run this from the command line: php migrate_files.php
 */

if (php_sapi_name() !== 'cli') {
    die("Dieses Skript kann nur über die Befehlszeile (CLI) ausgeführt werden.\n");
}

require_once __DIR__ . '/auth_helper.php';

$uploadDir = __DIR__ . '/uploads/';

try {
    $pdo = get_db_connection();
    
    // Fetch all files with uploader username
    $stmt = $pdo->query("
        SELECT f.id, f.storage_filename, f.original_filename, a.username 
        FROM files f 
        JOIN accounts a ON f.uploaded_by = a.id
        ORDER BY f.id ASC
    ");
    $files = $stmt->fetchAll();
    
    echo "Starte Migration von " . count($files) . " Dateien...\n";
    
    $pdo->beginTransaction();
    
    $usedNames = [];
    $movedCount = 0;
    $dbUpdatedCount = 0;
    
    foreach ($files as $f) {
        $username = $f['username'];
        $storageFilename = $f['storage_filename'];
        $originalFilename = $f['original_filename'];
        $fileId = $f['id'];
        
        // Sanitize username and filename
        $safeUsername = preg_replace('/[^a-zA-Z0-9_-]/', '_', $username);
        $safeOriginalName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $originalFilename);
        
        // Target directory for the user
        $userDir = $uploadDir . $safeUsername . '/';
        if (!is_dir($userDir)) {
            if (!mkdir($userDir, 0755, true)) {
                throw new Exception("Konnte das Verzeichnis '$userDir' nicht erstellen.");
            }
        }
        
        // Current location on disk
        $currentPath = $uploadDir . $storageFilename;
        
        // Resolve filename conflicts in the target directory
        $baseName = pathinfo($safeOriginalName, PATHINFO_FILENAME);
        $extension = pathinfo($safeOriginalName, PATHINFO_EXTENSION);
        $extensionSuffix = $extension ? '.' . $extension : '';
        
        $finalName = $safeOriginalName;
        $counter = 1;
        
        if (!isset($usedNames[$safeUsername])) {
            $usedNames[$safeUsername] = [];
        }
        
        // Find a unique filename in the user's subfolder
        while (file_exists($userDir . $finalName) || isset($usedNames[$safeUsername][$finalName])) {
            $finalName = $baseName . '_' . $counter . $extensionSuffix;
            $counter++;
        }
        $usedNames[$safeUsername][$finalName] = true;
        
        $destPath = $userDir . $finalName;
        $newStorageFilename = $safeUsername . '/' . $finalName;
        
        // Move the file physically if it exists at the old location
        if (file_exists($currentPath) && is_file($currentPath)) {
            // Check if we are moving from root to subfolder (if it's not already migrated)
            if ($currentPath !== $destPath) {
                if (rename($currentPath, $destPath)) {
                    echo "Datei verschoben: $storageFilename -> $newStorageFilename\n";
                    $movedCount++;
                } else {
                    throw new Exception("Fehler beim Verschieben der Datei von '$currentPath' nach '$destPath'.");
                }
            }
        } else {
            // If the file is already in the user's subdirectory (e.g. script rerun or partial migration)
            $expectedSubdirPath = $userDir . $storageFilename;
            if (file_exists($destPath) && is_file($destPath)) {
                echo "Physische Datei bereits am Zielort: $newStorageFilename\n";
            } else {
                echo "WARNUNG: Physische Datei fehlt auf dem Server: $currentPath\n";
            }
        }
        
        // Update database metadata
        $stmtUpdate = $pdo->prepare("
            UPDATE files 
            SET storage_filename = :storage, original_filename = :original 
            WHERE id = :id
        ");
        $stmtUpdate->execute([
            'storage' => $newStorageFilename,
            'original' => $finalName,
            'id' => $fileId
        ]);
        $dbUpdatedCount++;
    }
    
    $pdo->commit();
    echo "\n=== Migration erfolgreich abgeschlossen ===\n";
    echo "Physisch verschobene Dateien: $movedCount\n";
    echo "Aktualisierte Datenbankeinträge: $dbUpdatedCount\n";
    
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "FEHLER BEI DER MIGRATION: " . $e->getMessage() . "\n";
    exit(1);
}
