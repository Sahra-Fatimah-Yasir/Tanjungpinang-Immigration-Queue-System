<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class QueueNumber extends Model
{
    public const OPEN_STATUSES = ['WAITING', 'CALLING', 'SERVING'];

    protected $fillable = [
        'service_category_id',
        'counter_id',
        'ticket_number',
        'sequence_number',
        'tracking_code',
        'customer_name',
        'identity_number',
        'status',
        'called_at',
        'served_at',
        'completed_at',
        'wait_time_minutes',
        'service_time_minutes',
        'date',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'called_at' => 'datetime',
        'served_at' => 'datetime',
        'completed_at' => 'datetime',
        'date' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (QueueNumber $queue): void {
            $queue->date = $queue->date ?? static::operationalDate();
            $queue->sequence_number = $queue->sequence_number
                ?? static::resolveSequenceNumber(
                    serviceCategoryId: (int) $queue->service_category_id,
                    date: $queue->date,
                    ticketNumber: $queue->ticket_number
                );
            $queue->tracking_code = $queue->tracking_code ?? (string) Str::ulid();

            if (blank($queue->ticket_number) && $queue->service_category_id) {
                $serviceCode = $queue->serviceCategory()->value('code') ?? 'Q';
                $queue->ticket_number = static::formatTicketNumber($serviceCode, $queue->sequence_number);
            }
        });
    }

    public function scopeForOperationalDate(Builder $query, CarbonInterface|string|null $date = null): Builder
    {
        return $query->whereDate('date', static::normalizeDate($date));
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', self::OPEN_STATUSES);
    }

    public function scopeCurrent(Builder $query): Builder
    {
        return $query->whereIn('status', ['CALLING', 'SERVING']);
    }

    public function serviceCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    public function counter(): BelongsTo
    {
        return $this->belongsTo(Counter::class);
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(Officer::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(OfficerActivity::class);
    }

    private static function durationInMinutes(
        ?CarbonInterface $start,
        ?CarbonInterface $end,
    ): int {
        if (! $start || ! $end) {
            return 0;
        }

        return max(0, (int) $start->diffInMinutes($end));
    }

    // Calculate wait time in minutes
    public function calculateWaitTime(): int
    {
        return self::durationInMinutes($this->created_at, $this->called_at);
    }

    // Calculate service time in minutes
    public function calculateServiceTime(): int
    {
        return self::durationInMinutes($this->served_at, $this->completed_at);
    }

    public function calculateTotalTime(): ?int
    {
        if (! $this->created_at || ! $this->completed_at) {
            return null;
        }

        return self::durationInMinutes($this->created_at, $this->completed_at);
    }

    public function resolvedWaitTimeMinutes(): ?int
    {
        if ($this->created_at && $this->called_at) {
            return $this->calculateWaitTime();
        }

        return $this->wait_time_minutes === null
            ? null
            : max(0, (int) $this->wait_time_minutes);
    }

    public function resolvedServiceTimeMinutes(): ?int
    {
        if ($this->served_at && $this->completed_at) {
            return $this->calculateServiceTime();
        }

        return $this->service_time_minutes === null
            ? null
            : max(0, (int) $this->service_time_minutes);
    }

    // Get current status label in Indonesian
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'WAITING' => 'Menunggu',
            'CALLING' => 'Sedang Dipanggil',
            'SERVING' => 'Sedang Dilayani',
            'SERVED' => 'Selesai Dilayani',
            'SKIPPED' => 'Dilewati',
            default => 'Unknown',
        };
    }

    public static function operationalDate(): CarbonImmutable
    {
        return now()->toImmutable()->startOfDay();
    }

    public static function formatTicketNumber(string $serviceCode, int $sequenceNumber): string
    {
        return sprintf('%s-%03d', strtoupper($serviceCode), $sequenceNumber);
    }

    public static function parseSequenceNumber(?string $ticketNumber): ?int
    {
        if (! $ticketNumber) {
            return null;
        }

        return preg_match('/(\d+)$/', $ticketNumber, $matches) === 1
            ? (int) $matches[1]
            : null;
    }

    public static function resolveSequenceNumber(
        int $serviceCategoryId,
        CarbonInterface|string|null $date = null,
        ?string $ticketNumber = null,
    ): int {
        $parsedSequence = static::parseSequenceNumber($ticketNumber);
        if ($parsedSequence !== null) {
            return $parsedSequence;
        }

        $maxSequence = static::query()
            ->where('service_category_id', $serviceCategoryId)
            ->whereDate('date', static::normalizeDate($date))
            ->max('sequence_number');

        return ((int) $maxSequence) + 1;
    }

    public static function normalizeDate(CarbonInterface|string|null $date = null): string
    {
        if ($date instanceof CarbonInterface) {
            return $date->toDateString();
        }

        if (is_string($date) && $date !== '') {
            return CarbonImmutable::parse($date)->toDateString();
        }

        return static::operationalDate()->toDateString();
    }
}
