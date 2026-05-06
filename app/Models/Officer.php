<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Officer extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'nip',
        'name',
        'email',
        'phone',
        'password',
        'status',
        'role',
        'counter_id',
        'last_login',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'last_login' => 'datetime',
    ];

    public function counter(): BelongsTo
    {
        return $this->belongsTo(Counter::class);
    }
    public function activities(): HasMany
    {
        return $this->hasMany(OfficerActivity::class);
    }
    public function isLoggedIn(): bool
    {
        return $this->last_login !== null && $this->last_login->gt(now()->subHours(8));
    }

    public function currentTicket(): ?QueueNumber
    {
        if (! $this->counter_id) {
            return null;
        }

        return QueueNumber::where('counter_id', $this->counter_id)
            ->forOperationalDate()
            ->current()
            ->latest('called_at')
            ->latest('updated_at')
            ->first();
    }
}
