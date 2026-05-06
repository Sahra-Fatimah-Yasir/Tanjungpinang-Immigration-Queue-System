<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Service Categories (Jenis Layanan)
        Schema::create('service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // A, B, R, C
            $table->string('name'); // Paspor, Customer Service, dll
            $table->string('description')->nullable();
            $table->boolean('is_priority')->default(false); // Ramah HAM
            $table->integer('max_counters')->default(1);
            $table->timestamps();
        });

        // Counters (Loket)
        Schema::create('counters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_category_id')->constrained();
            $table->string('code'); // A-001, B-002, dll
            $table->integer('counter_number'); // 1, 2, 3, 4, 5, 6
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'MAINTENANCE'])->default('ACTIVE');
            $table->timestamps();
            $table->unique(['service_category_id', 'counter_number']);
        });

        // Officers (Petugas dengan NIP)
        Schema::create('officers', function (Blueprint $table) {
            $table->id();
            $table->string('nip')->unique(); // 18 digit
            $table->string('name');
            $table->string('email')->unique()->nullable();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->foreignId('counter_id')->nullable()->constrained();
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'ON_BREAK'])->default('ACTIVE');
            $table->timestamp('last_login')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Admins
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['SUPER_ADMIN', 'ADMIN'])->default('ADMIN');
            $table->timestamp('last_login')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Queue Numbers (Nomor Antrian Hari Ini)
        Schema::create('queue_numbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_category_id')->constrained();
            $table->foreignId('counter_id')->nullable()->constrained();
            $table->string('ticket_number'); // A-001, B-002, dll
            $table->enum('status', ['WAITING', 'CALLING', 'SERVING', 'SERVED', 'SKIPPED'])->default('WAITING');
            $table->timestamp('called_at')->nullable();
            $table->timestamp('served_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('wait_time_minutes')->nullable();
            $table->integer('service_time_minutes')->nullable();
            $table->date('date');
            $table->timestamps();
        });

        // Officer Activity Log
        Schema::create('officer_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('officer_id')->constrained();
            $table->foreignId('queue_number_id')->nullable()->constrained();
            $table->enum('action', ['LOGIN', 'LOGOUT', 'CALL_TICKET', 'COMPLETE_TICKET', 'SKIP_TICKET', 'BREAK'])->default('LOGIN');
            $table->string('notes')->nullable();
            $table->timestamp('timestamp');
            $table->timestamps();
        });

        // Daily Statistics
        Schema::create('daily_statistics', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('service_category_id')->nullable()->constrained();
            $table->integer('total_tickets')->default(0);
            $table->integer('completed_tickets')->default(0);
            $table->integer('skipped_tickets')->default(0);
            $table->integer('avg_wait_time')->nullable();
            $table->integer('avg_service_time')->nullable();
            $table->timestamps();
            $table->unique(['date', 'service_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_statistics');
        Schema::dropIfExists('officer_activities');
        Schema::dropIfExists('queue_numbers');
        Schema::dropIfExists('admins');
        Schema::dropIfExists('officers');
        Schema::dropIfExists('counters');
        Schema::dropIfExists('service_categories');
    }
};
