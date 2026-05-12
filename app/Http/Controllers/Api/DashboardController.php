<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use App\Models\Officer;
use App\Models\OfficerActivity;
use App\Models\QueueNumber;
use App\Models\ServiceCategory;
use App\Services\QueueDayService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly QueueDayService $queueDayService,
    ) {
    }

    private function averageMinutes($queues, string $column): ?float
    {
        $values = $queues
            ->map(function (QueueNumber $queue) use ($column) {
                return match ($column) {
                    'wait_time_minutes' => $queue->resolvedWaitTimeMinutes(),
                    'service_time_minutes' => $queue->resolvedServiceTimeMinutes(),
                    default => $queue->{$column} === null ? null : max(0, (float) $queue->{$column}),
                };
            })
            ->filter(fn ($value) => $value !== null);

        return $values->isEmpty() ? null : round((float) $values->avg(), 2);
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

    /**
     * Get admin dashboard statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function admin()
    {
        $this->queueDayService->prepareOperationalDay();

        $todayQueues = QueueNumber::forOperationalDate()->get();
        $activeOfficers = Officer::whereHas('activities', function ($query) {
            $query->where('action', 'LOGIN')
                ->where('timestamp', '>=', now()->subHours(8));
        })->count();

        $stats = [
            'today' => [
                'total_queues' => $todayQueues->count(),
                'completed' => $todayQueues->where('status', 'SERVED')->count(),
                'in_progress' => $todayQueues->whereIn('status', ['CALLING', 'SERVING'])->count(),
                'skipped' => $todayQueues->where('status', 'SKIPPED')->count(),
                'avg_wait_time' => $this->averageMinutes($todayQueues, 'wait_time_minutes'),
                'avg_service_time' => $this->averageMinutes($todayQueues, 'service_time_minutes'),
            ],
            'counters' => [
                'total' => Counter::count(),
                'active' => Counter::where('status', 'ACTIVE')->count(),
                'inactive' => Counter::where('status', 'INACTIVE')->count(),
                'maintenance' => Counter::where('status', 'MAINTENANCE')->count(),
            ],
            'officers' => [
                'total' => Officer::count(),
                'active_today' => $activeOfficers,
                'on_break' => Officer::where('status', 'ON_BREAK')->count(),
            ],
            'services' => ServiceCategory::withCount('counters')
                ->get()
                ->map(function ($service) {
                    return [
                        'id' => $service->id,
                        'code' => $service->code,
                        'name' => $service->name,
                        'counters_count' => $service->counters_count,
                        'today_queues' => QueueNumber::where('service_category_id', $service->id)
                            ->forOperationalDate()
                            ->count(),
                    ];
                }),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }

    /**
     * Get officer dashboard info
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function officer(Request $request)
    {
        $this->queueDayService->prepareOperationalDay();

        $officer = $request->user('sanctum');
        $counter = $officer->counter;
        $currentTicket = $officer->currentTicket();
        $currentTicket?->loadMissing('serviceCategory');

        // Get today's statistics for this officer/counter
        $todayQueues = $counter
            ? QueueNumber::where('counter_id', $counter->id)
                ->forOperationalDate()
                ->get()
            : collect();

        $callableServices = collect();

        if ($counter) {
            $priorityServices = ServiceCategory::where('is_priority', true)
                ->orderBy('code')
                ->get();

            $callableServices = $priorityServices
                ->push($counter->serviceCategory)
                ->unique('id')
                ->values();
        }

        $waitingCounts = $callableServices->isNotEmpty()
            ? QueueNumber::query()
                ->selectRaw('service_category_id, COUNT(*) as total')
                ->whereIn('service_category_id', $callableServices->pluck('id'))
                ->forOperationalDate()
                ->where('status', 'WAITING')
                ->groupBy('service_category_id')
                ->pluck('total', 'service_category_id')
            : collect();

        $callableServiceData = $callableServices
            ->map(function (ServiceCategory $service) use ($waitingCounts) {
                return [
                    'id' => $service->id,
                    'code' => $service->code,
                    'name' => $service->name,
                    'is_priority' => $service->is_priority,
                    'waiting_count' => (int) ($waitingCounts[$service->id] ?? 0),
                ];
            })
            ->values();

        $nextService = $callableServiceData->first(fn ($service) => $service['is_priority'] && $service['waiting_count'] > 0)
            ?? $callableServiceData->firstWhere('id', $counter?->service_category_id)
            ?? $callableServiceData->first();

        $stats = [
            'counter' => $counter ? [
                'code' => $counter->full_code,
                'number' => $counter->counter_number,
                'service' => [
                    'id' => $counter->serviceCategory->id,
                    'code' => $counter->serviceCategory->code,
                    'name' => $counter->serviceCategory->name,
                    'is_priority' => $counter->serviceCategory->is_priority,
                ],
            ] : null,
            'today' => [
                'total_served' => $todayQueues->where('status', 'SERVED')->count(),
                'total_skipped' => $todayQueues->where('status', 'SKIPPED')->count(),
                'avg_service_time' => $this->averageMinutes($todayQueues, 'service_time_minutes'),
            ],
            'current_ticket' => $currentTicket ? [
                'id' => $currentTicket->id,
                'ticket_number' => $currentTicket->ticket_number,
                'status' => $currentTicket->status,
                'customer_name' => $currentTicket->customer_name,
                'identity_number' => $currentTicket->identity_number,
                'service' => [
                    'id' => $currentTicket->serviceCategory->id,
                    'code' => $currentTicket->serviceCategory->code,
                    'name' => $currentTicket->serviceCategory->name,
                    'is_priority' => $currentTicket->serviceCategory->is_priority,
                ],
            ] : null,
            'queue_in_waiting' => $callableServiceData->sum('waiting_count'),
            'callable_services' => $callableServiceData,
            'next_service' => $nextService,
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }

    /**
     * Get public display dashboard
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function public()
    {
        $this->queueDayService->prepareOperationalDay();

        $activeQueues = ServiceCategory::with(['queueNumbers' => function ($query) {
                $query->with('counter')
                    ->forOperationalDate()
                    ->open()
                    ->orderBy('sequence_number');
            }])
            ->orderBy('code')
            ->get()
            ->map(function ($service) {
                $currentTicket = $service->queueNumbers
                    ->whereIn('status', ['CALLING', 'SERVING'])
                    ->sortByDesc(fn ($queue) => $queue->called_at ?? $queue->updated_at)
                    ->first();

                return [
                    'service' => [
                        'id' => $service->id,
                        'code' => $service->code,
                        'name' => $service->name,
                        'description' => $service->description,
                        'is_priority' => $service->is_priority,
                        'max_counters' => $service->max_counters,
                    ],
                    'current_ticket' => $currentTicket ? [
                        'id' => $currentTicket->id,
                        'ticket_number' => $currentTicket->ticket_number,
                        'customer_name' => $currentTicket->customer_name,
                        'status' => $currentTicket->status,
                        'called_at' => $currentTicket->called_at?->toIso8601String(),
                        'counter' => $currentTicket->counter?->full_code,
                        'counter_number' => $currentTicket->counter?->counter_number,
                    ] : null,
                    'waiting_count' => $service->queueNumbers->where('status', 'WAITING')->count(),
                    'waiting_tickets' => $service->queueNumbers
                        ->where('status', 'WAITING')
                        ->sortBy('sequence_number')
                        ->values()
                        ->map(fn ($queue) => [
                            'id' => $queue->id,
                            'ticket_number' => $queue->ticket_number,
                        ]),
                ];
            });

        $callAnnouncements = OfficerActivity::with(['queueNumber.serviceCategory', 'queueNumber.counter'])
            ->where('action', 'CALL_TICKET')
            ->whereHas('queueNumber', fn ($query) => $query->forOperationalDate())
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->sortBy('id')
            ->values()
            ->map(function (OfficerActivity $activity) {
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
            })
            ->filter(fn ($announcement) => $announcement['ticket_number'] && $announcement['announced_at'])
            ->values();

        $recentHistory = QueueNumber::with(['serviceCategory', 'counter'])
            ->forOperationalDate()
            ->whereIn('status', ['SERVED', 'SKIPPED'])
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(function ($queue) {
                $time = $queue->completed_at ?? $queue->updated_at;

                return [
                    'ticket_number' => $queue->ticket_number,
                    'service' => $queue->serviceCategory->name,
                    'counter' => $queue->counter?->full_code,
                    'status' => $queue->status,
                    'time_ago' => $time?->diffForHumans(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'active_queues' => $activeQueues->values(),
                'call_announcements' => $callAnnouncements,
                'recent_history' => $recentHistory,
                'timestamp' => now(),
            ],
        ], 200);
    }
}
