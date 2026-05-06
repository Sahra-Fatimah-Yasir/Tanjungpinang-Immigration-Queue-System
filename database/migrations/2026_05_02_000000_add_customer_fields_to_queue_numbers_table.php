<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('queue_numbers', function (Blueprint $table) {
            $table->string('customer_name')->nullable()->after('ticket_number');
            $table->string('identity_number', 50)->nullable()->after('customer_name');
        });
    }

    public function down(): void
    {
        Schema::table('queue_numbers', function (Blueprint $table) {
            $table->dropColumn(['customer_name', 'identity_number']);
        });
    }
};
