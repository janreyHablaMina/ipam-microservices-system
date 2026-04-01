<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->enum('action', ['create', 'update', 'delete', 'login'])->index();
            $table->string('entity_type', 100)->index();
            $table->unsignedBigInteger('entity_id')->nullable()->index();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        DB::unprepared("
            CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
            RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'audit_logs are immutable and cannot be deleted';
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::unprepared("
            CREATE TRIGGER trg_prevent_audit_log_delete
            BEFORE DELETE ON audit_logs
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_log_delete();
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_prevent_audit_log_delete ON audit_logs;');
        DB::unprepared('DROP FUNCTION IF EXISTS prevent_audit_log_delete();');

        Schema::dropIfExists('audit_logs');
    }
};
