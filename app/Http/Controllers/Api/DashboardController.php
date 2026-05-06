<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use App\Models\Officer;
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
                'avg_wait_time' => round($todayQueues->whereNotNull('wait_time_minutes')->avg('wait_time_minutes'), 2),
                'avg_service_time' => round($todayQueues->whereNotNull('service_time_minutes')->avg('service_time_minutes'), 2),
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

        // Get today's statistics for this officer/counter
        $todayQueues = $counter
            ? QueueNumber::where('counter_id', $counter->id)
                ->forOperationalDate()
                ->get()
            : collect();

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
                'avg_service_time' => round($todayQueues->whereNotNull('service_time_minutes')->avg('service_time_minutes'), 2),
            ],
            'current_ticket' => $currentTicket ? [
                'id' => $currentTicket->id,
                'ticket_number' => $currentTicket->ticket_number,
                'status' => $currentTicket->status,
                'customer_name' => $currentTicket->customer_name,
                'identity_number' => $currentTicket->identity_number,
            ] : null,
            'queue_in_waiting' => $counter ? QueueNumber::where('service_category_id', $counter->service_category_id)
                ->forOperationalDate()
                ->where('status', 'WAITING')
                ->count() : 0,
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
                        'status' => $currentTicket->status,
                        'customer_name' => $currentTicket->customer_name,
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
                            'customer_name' => $queue->customer_name,
                        ]),
                ];
            });

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
                'recent_history' => $recentHistory,
                'timestamp' => now(),
            ],
        ], 200);
    }
}
