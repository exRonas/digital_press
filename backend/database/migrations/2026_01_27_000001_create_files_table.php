<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('original_name');
            $table->string('stored_path'); // e.g. "private/pdfs/uuid.pdf"
            $table->string('mime_type')->default('application/pdf');
            $table->unsignedBigInteger('size'); // bytes
            $table->string('sha256', 64)->nullable();
            
            // Polymorphic relation - file can belong to Issue, Course, etc.
            $table->nullableMorphs('fileable');
            
            // Direct relation to Issue (for backward compatibility)
            $table->foreignId('issue_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index('stored_path');
            $table->index('sha256');
        });

        // Add file_id to issues table for new system
        Schema::table('issues', function (Blueprint $table) {
            $table->foreignId('file_id')->nullable()->after('file_path')->constrained('files')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->dropForeign(['file_id']);
            $table->dropColumn('file_id');
        });
        
        Schema::dropIfExists('files');
    }
};
