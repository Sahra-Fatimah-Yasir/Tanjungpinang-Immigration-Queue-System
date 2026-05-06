<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Counter extends Model
{
    protected $fillable = [
        'service_category_id',
        'code',
        'counter_number',
        'status',
    ];

    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    public function officer(): HasOne
    {
        return $this->hasOne(Officer::class);
    }

    public function officers(): HasMany
    {
        return $this->hasMany(Officer::class);
    }

    public function queueNumbers(): HasMany
    {
        return $this->hasMany(QueueNumber::class);
    }

    public function getFullCodeAttribute(): string
    {
        return "{$this->code}-" . str_pad($this->counter_number, 3, '0', STR_PAD_LEFT);
    }
}
