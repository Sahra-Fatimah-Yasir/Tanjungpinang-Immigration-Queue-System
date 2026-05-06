<?php

namespace App\Services;

use App\Models\QueueNumber;

class QueueDayService
{
    public function prepareOperationalDay(): int
    {
        return QueueNumber::query()
            ->whereDate('date', '<', QueueNumber::operationalDate()->toDateString())
            ->open()
            ->update([
                'status' => 'SKIPPED',
                'completed_at' => now(),
                'updated_at' => now(),
            ]);
    }
}
