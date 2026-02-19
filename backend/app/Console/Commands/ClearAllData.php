<?php

namespace App\Console\Commands;

use App\Models\File;
use App\Models\Issue;
use App\Models\OcrResult;
use App\Models\Publication;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ClearAllData extends Command
{
    protected $signature = 'press:clear-all
                            {--publications : Также удалить все издания (Publications)}
                            {--force : Не запрашивать подтверждение}';

    protected $description = 'Удаляет все выпуски газет, файлы из хранилища и записи из БД';

    public function handle(): int
    {
        if (! $this->option('force')) {
            $issueCount       = Issue::count();
            $fileCount        = File::count();
            $publicationCount = Publication::count();

            $this->warn('====================================================');
            $this->warn('  ВНИМАНИЕ: НЕОБРАТИМАЯ ОПЕРАЦИЯ УДАЛЕНИЯ ДАННЫХ');
            $this->warn('====================================================');
            $this->table(
                ['Сущность', 'Кол-во записей'],
                [
                    ['Выпуски (issues)',       $issueCount],
                    ['Файлы (files)',          $fileCount],
                    ['Издания (publications)', $publicationCount],
                ]
            );

            if (! $this->confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
                $this->info('Операция отменена.');
                return self::SUCCESS;
            }

            if (! $this->confirm('Последнее предупреждение: удалить все файлы из хранилища и все записи из БД?')) {
                $this->info('Операция отменена.');
                return self::SUCCESS;
            }
        }

        $this->info('Начинаем очистку...');
        $this->newLine();

        // 1. Физические файлы — private disk (storage/app/private/)
        $this->info('[1/6] Очищаем storage/app/private/...');
        foreach (['pdfs', 'issues', 'uploads'] as $dir) {
            $this->deleteStorageDir('local', $dir);
        }

        // 2. Физические файлы — public disk (storage/app/public/)
        $this->info('[2/6] Очищаем storage/app/public/...');
        foreach (['pdf', 'issues', 'thumbnails', 'uploads'] as $dir) {
            $this->deleteStorageDir('public', $dir);
        }

        // 3. Temp-файлы
        $this->info('[3/6] Очищаем storage/app/temp/...');
        $tempPath = storage_path('app/temp');
        if (is_dir($tempPath)) {
            $files = glob($tempPath . '/*');
            $count = count($files);
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            $this->line("      temp: удалено файлов — {$count}");
        } else {
            $this->line('      temp: папка не найдена, пропускаем.');
        }

        // 4. OCR результаты
        $this->info('[4/6] Очищаем таблицу ocr_results...');
        $deleted = DB::table('ocr_results')->delete();
        $this->line("      Удалено записей: {$deleted}");

        // 5. issue_stats, files, issues (порядок важен из-за внешних ключей)
        $this->info('[5/6] Очищаем таблицы issue_stats, files, issues...');
        $statsDeleted  = DB::table('issue_stats')->delete();
        $filesDeleted  = DB::table('files')->delete();
        $issuesDeleted = DB::table('issues')->delete();
        $this->line("      issue_stats: {$statsDeleted}, files: {$filesDeleted}, issues: {$issuesDeleted}");

        // 6. Publications (опционально)
        if ($this->option('publications')) {
            $this->info('[6/6] Очищаем таблицу publications...');
            $pubDeleted = DB::table('publications')->delete();
            $this->line("      Удалено изданий: {$pubDeleted}");
        } else {
            $this->line('[6/6] Таблица publications сохранена (используйте --publications для удаления).');
        }

        $this->newLine();
        $this->info('====================================================');
        $this->info('  Очистка завершена успешно!');
        $this->info('====================================================');

        return self::SUCCESS;
    }

    private function deleteStorageDir(string $disk, string $path): void
    {
        $absolutePath = Storage::disk($disk)->path($path);

        if (!is_dir($absolutePath)) {
            $this->line("      [{$disk}] {$path}: не существует, пропускаем.");
            return;
        }

        // Use native PHP recursive delete to avoid Flysystem crashes on broken symlinks
        $fileCount = 0;
        $dirCount  = 0;
        $this->nativeDeleteDir($absolutePath, $fileCount, $dirCount);

        // Recreate empty directory
        @mkdir($absolutePath, 0755, true);

        $this->line("      [{$disk}] {$path}: удалено файлов — {$fileCount}, директорий — {$dirCount}");
    }

    private function nativeDeleteDir(string $dir, int &$fileCount, int &$dirCount): void
    {
        $items = @scandir($dir);
        if ($items === false) {
            return;
        }
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $fullPath = $dir . DIRECTORY_SEPARATOR . $item;
            // Use lstat to safely check even broken symlinks
            $stat = @lstat($fullPath);
            if ($stat === false) {
                // Inaccessible — try to unlink anyway
                @unlink($fullPath);
                continue;
            }
            if (is_link($fullPath) || is_file($fullPath)) {
                @unlink($fullPath);
                $fileCount++;
            } elseif (is_dir($fullPath)) {
                $this->nativeDeleteDir($fullPath, $fileCount, $dirCount);
                @rmdir($fullPath);
                $dirCount++;
            }
        }
    }
}
