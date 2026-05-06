<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyStatistic extends Model
{
    protected $table = 'daily_statistics';

    protected $fillable = [
        'date',
        'service_category_id',
        'total_tickets',
        'completed_tickets',
        'skipped_tickets',
        'avg_wait_time',
        'avg_service_time',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }
}
