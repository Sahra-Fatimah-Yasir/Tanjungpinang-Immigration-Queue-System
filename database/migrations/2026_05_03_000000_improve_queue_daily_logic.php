<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('queue_numbers', function (Blueprint $table) {
            $table->unsignedInteger('sequence_number')->nullable()->after('ticket_number');
            $table->string('tracking_code', 26)->nullable()->after('sequence_number');
        });

        $sequenceMap = [];

        DB::table('queue_numbers')
            ->orderBy('service_category_id')
            ->orderBy('date')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->each(function ($queue) use (&$sequenceMap): void {
                $groupKey = "{$queue->service_category_id}|{$queue->date}";
                $sequenceMap[$groupKey] = ($sequenceMap[$groupKey] ?? 0) + 1;

                DB::table('queue_numbers')
                    ->where('id', $queue->id)
                    ->update([
                        'sequence_number' => $sequenceMap[$groupKey],
                        'tracking_code' => (string) Str::ulid(),
                    ]);
            });

        Schema::table('queue_numbers', function (Blueprint $table) {
            $table->unique(['service_category_id', 'date', 'sequence_number'], 'queue_numbers_daily_sequence_unique');
            $table->unique('tracking_code');
        });
    }

    public function down(): void
    {
        Schema::table('queue_numbers', function (Blueprint $table) {
            $table->dropUnique('queue_numbers_daily_sequence_unique');
            $table->dropUnique(['tracking_code']);
            $table->dropColumn(['sequence_number', 'tracking_code']);
        });
    }
};
