<?php

namespace App\Events;

use App\Models\QueueNumber;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QueueDashboardUpdated implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly string $reason,
        public readonly ?QueueNumber $queue = null,
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('queue-display');
    }

    public function broadcastAs(): string
    {
        return 'queue.updated';
    }

    public function broadcastWith(): array
    {
        $queue = $this->queue?->loadMissing([
            'serviceCategory',
            'counter',
        ]);

        return [
            'reason' => $this->reason,
            'queue_id' => $queue?->id,
            'ticket_number' => $queue?->ticket_number,
            'status' => $queue?->status,
            'service' => [
                'id' => $queue?->serviceCategory?->id,
                'code' => $queue?->serviceCategory?->code,
                'name' => $queue?->serviceCategory?->name,
            ],
            'counter' => [
                'id' => $queue?->counter?->id,
                'code' => $queue?->counter?->full_code,
                'number' => $queue?->counter?->counter_number,
            ],
            'updated_at' => now()->toIso8601String(),
        ];
    }
}
