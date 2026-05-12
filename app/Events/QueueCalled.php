<?php

namespace App\Events;

use App\Models\OfficerActivity;
use App\Models\QueueNumber;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QueueCalled implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly OfficerActivity $activity,
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new Channel('queue-display');
    }

    public function broadcastAs(): string
    {
        return 'queue.called';
    }

    public function broadcastWith(): array
    {
        $activity = $this->activity->loadMissing([
            'queueNumber.serviceCategory',
            'queueNumber.counter',
        ]);
        $queue = $activity->queueNumber;

        return [
            'id' => $activity->id,
            'announced_at' => $activity->timestamp?->toIso8601String(),
            'ticket_number' => $queue?->ticket_number,
            'customer_name' => filled($queue?->customer_name) ? (string) $queue->customer_name : null,
            'speech_text' => $this->callSpeechText($queue),
            'status' => $queue?->status,
            'service' => [
                'id' => $queue?->serviceCategory?->id,
                'code' => $queue?->serviceCategory?->code,
                'name' => $queue?->serviceCategory?->name,
            ],
            'counter' => $queue?->counter?->full_code,
            'counter_number' => $queue?->counter?->counter_number,
        ];
    }

    private function ticketForSpeech(?string $ticketNumber): string
    {
        $digits = [
            '0' => 'nol',
            '1' => 'satu',
            '2' => 'dua',
            '3' => 'tiga',
            '4' => 'empat',
            '5' => 'lima',
            '6' => 'enam',
            '7' => 'tujuh',
            '8' => 'delapan',
            '9' => 'sembilan',
        ];

        return collect(str_split(str_replace('-', ' ', (string) $ticketNumber)))
            ->map(fn (string $character) => $digits[$character] ?? $character)
            ->implode(' ');
    }

    private function callSpeechText(?QueueNumber $queue): ?string
    {
        if (! $queue) {
            return null;
        }

        $ticket = $this->ticketForSpeech($queue->ticket_number);
        $customerName = filled($queue->customer_name)
            ? ' atas nama ' . trim((string) $queue->customer_name)
            : '';
        $counter = $queue->counter?->counter_number
            ? 'Loket ' . $queue->counter->counter_number
            : ($queue->counter?->full_code ?? 'loket pelayanan');

        return "Nomor antrian {$ticket}{$customerName}. Silakan menuju {$counter}.";
    }
}
