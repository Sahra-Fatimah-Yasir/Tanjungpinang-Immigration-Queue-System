<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfficerActivity extends Model
{
    protected $table = 'officer_activities';

    protected $fillable = [
        'officer_id',
        'queue_number_id',
        'action',
        'notes',
        'timestamp',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function officer(): BelongsTo
    {
        return $this->belongsTo(Officer::class);
    }

    public function queueNumber(): BelongsTo
    {
        return $this->belongsTo(QueueNumber::class);
    }
}
