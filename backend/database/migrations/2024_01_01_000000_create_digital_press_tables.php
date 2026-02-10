<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username')->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'operator'])->default('operator');
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('publications', function (Blueprint $table) {
            $table->id();
            $table->string('title_ru');
            $table->string('title_kz')->nullable();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        Schema::create('issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publication_id')->constrained()->onDelete('cascade');
            $table->date('issue_date');
            $table->string('issue_number');
            $table->enum('language', ['ru', 'kz', 'other'])->default('ru');
            $table->string('file_path'); // Path relative to storage/app/
            $table->bigInteger('file_size');
            $table->string('mime_type')->default('application/pdf');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Indexes for faster filtering
            $table->index(['issue_date', 'publication_id']);
            $table->index('issue_number');
        });

        Schema::create('ocr_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['queued', 'processing', 'done', 'failed'])->default('queued');
            $table->longText('full_text')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });
        
        // Add full text search vector for Postgres
        // We use raw SQL for specific PGSQL features
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE ocr_results ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (to_tsvector('russian', coalesce(full_text, ''))) STORED");
            DB::statement("CREATE INDEX ocr_search_idx ON ocr_results USING GIN (search_vector)");
        }

        Schema::create('issue_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('issue_id')->unique()->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('downloads_count')->default(0);
            $table->timestamp('last_viewed_at')->nullable();
            $table->timestamp('last_downloaded_at')->nullable();
            $table->timestamps();
            
            $table->index('views_count'); // For popularity sorting
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issue_stats');
        Schema::dropIfExists('ocr_results');
        Schema::dropIfExists('issues');
        Schema::dropIfExists('publications');
        Schema::dropIfExists('users');
    }
};
