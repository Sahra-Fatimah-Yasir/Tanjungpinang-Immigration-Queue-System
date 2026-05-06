<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_priority',
        'max_counters',
    ];

    protected $casts = [
        'is_priority' => 'boolean',
    ];

    public function counters(): HasMany
    {
        return $this->hasMany(Counter::class);
    }

    public function queueNumbers(): HasMany
    {
        return $this->hasMany(QueueNumber::class);
    }

    public function statistics(): HasMany
    {
        return $this->hasMany(DailyStatistic::class);
    }
}
